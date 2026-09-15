// Lector mínimo de .docx sin dependencias.
//
// Un .docx es un ZIP. Node no trae lector de ZIP, pero SÍ trae inflateRawSync,
// que es el 99% del trabajo. Lo único que falta es leer el "central directory"
// del ZIP a mano — unas 40 líneas. Con eso sacamos word/document.xml y
// word/_rels/document.xml.rels, y de ahí la tabla con sus hipervínculos.

import fs from 'node:fs';
import zlib from 'node:zlib';

const FIRMA_EOCD = 0x06054b50; // End Of Central Directory
const FIRMA_CD = 0x02014b50; // Central Directory header
const FIRMA_LOCAL = 0x04034b50; // Local file header

/** Lee un ZIP y devuelve un Map<nombreArchivo, Buffer>. */
export function leerZip(rutaZip) {
  const buf = fs.readFileSync(rutaZip);

  // El EOCD está al final, pero puede tener un comentario detrás.
  // Lo buscamos hacia atrás en los últimos 64 KB.
  let eocd = -1;
  const desde = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= desde; i--) {
    if (buf.readUInt32LE(i) === FIRMA_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`No parece un ZIP válido: ${rutaZip}`);

  const cantidad = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);

  const entradas = new Map();
  for (let n = 0; n < cantidad; n++) {
    if (buf.readUInt32LE(off) !== FIRMA_CD) break;

    const metodo = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const largoNombre = buf.readUInt16LE(off + 28);
    const largoExtra = buf.readUInt16LE(off + 30);
    const largoComent = buf.readUInt16LE(off + 32);
    const offLocal = buf.readUInt32LE(off + 42);
    const nombre = buf.toString('utf8', off + 46, off + 46 + largoNombre);

    // El header local repite nombre/extra con largos propios: hay que releerlos.
    if (buf.readUInt32LE(offLocal) === FIRMA_LOCAL) {
      const lnLocal = buf.readUInt16LE(offLocal + 26);
      const leLocal = buf.readUInt16LE(offLocal + 28);
      const inicio = offLocal + 30 + lnLocal + leLocal;
      const datos = buf.subarray(inicio, inicio + compSize);
      entradas.set(
        nombre,
        metodo === 0 ? Buffer.from(datos) : zlib.inflateRawSync(datos),
      );
    }

    off += 46 + largoNombre + largoExtra + largoComent;
  }
  return entradas;
}

/** Deshace las entidades XML básicas. */
function desescapar(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&'); // siempre último, si no se doble-desescapa
}

/** Mapa de relationship id -> URL destino. */
function mapaRelaciones(xmlRels) {
  const mapa = {};
  for (const m of xmlRels.matchAll(/<Relationship\b[^>]*?\/>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1];
    const destino = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && destino) mapa[id] = desescapar(destino);
  }
  return mapa;
}

/**
 * Contenido de una celda: texto plano + los hipervínculos que aparezcan.
 * Recorre en orden hyperlinks y runs sueltos para no perder el orden del texto.
 */
function leerCelda(xmlCelda, rels) {
  let texto = '';
  const enlaces = [];
  const re =
    /<w:hyperlink\b[^>]*>[\s\S]*?<\/w:hyperlink>|<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;

  let m;
  while ((m = re.exec(xmlCelda))) {
    if (m[0].startsWith('<w:hyperlink')) {
      const rid = /r:id="([^"]+)"/.exec(m[0])?.[1];
      let t = '';
      for (const x of m[0].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)) {
        t += desescapar(x[1]);
      }
      texto += t;
      const url = rid ? rels[rid] : null;
      if (url) enlaces.push({ texto: t.trim(), url });
    } else {
      texto += desescapar(m[1]);
    }
  }
  return { texto: texto.replace(/\s+/g, ' ').trim(), enlaces };
}

/**
 * Devuelve las tablas del documento como matriz de celdas.
 * Cada celda es { texto, enlaces: [{texto, url}] }.
 */
export function tablasDeDocx(rutaDocx) {
  const zip = leerZip(rutaDocx);
  const doc = zip.get('word/document.xml');
  if (!doc) throw new Error(`Sin word/document.xml en ${rutaDocx}`);

  const xml = doc.toString('utf8');
  const relsBuf = zip.get('word/_rels/document.xml.rels');
  const rels = relsBuf ? mapaRelaciones(relsBuf.toString('utf8')) : {};

  const tablas = [];
  for (const t of xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)) {
    const filas = [];
    for (const f of t[0].matchAll(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g)) {
      filas.push(
        [...f[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((c) =>
          leerCelda(c[0], rels),
        ),
      );
    }
    if (filas.length) tablas.push(filas);
  }
  return tablas;
}

/**
 * Interpreta "Videos Teoria.docx": cada tabla de 3 columnas (N°, Título, Enlace)
 * es un grupo temático. La primera fila es el encabezado y da el nombre del grupo.
 * Devuelve [{ grupo, videos: [{ n, titulo, url }] }].
 */
export function gruposDeVideos(rutaDocx) {
  const grupos = [];

  for (const filas of tablasDeDocx(rutaDocx)) {
    const encabezado = filas[0];
    // Las tablas útiles tienen 3 columnas; la de la nota introductoria tiene 1.
    if (!encabezado || encabezado.length < 3) continue;

    const grupo = encabezado[1].texto.trim();
    const videos = [];

    for (const fila of filas.slice(1)) {
      if (fila.length < 3) continue;
      const url = fila[2].enlaces[0]?.url;
      const titulo = fila[1].texto.trim();
      if (!url || !titulo) continue;
      videos.push({ n: Number(fila[0].texto.trim()) || videos.length + 1, titulo, url });
    }

    if (videos.length) grupos.push({ grupo, videos });
  }

  return grupos;
}
