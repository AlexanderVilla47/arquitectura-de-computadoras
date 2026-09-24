#!/usr/bin/env node
// Escanea el material del curso y genera data/curso.json.
//
//   node scripts/scan.mjs          -> regenera el JSON desde cero
//   node scripts/scan.mjs --sync   -> preserva títulos editados a mano,
//                                     agrega lo nuevo y marca lo que faltó
//
// Node puro. Cero dependencias.

import fs from 'node:fs';
import path from 'node:path';

import { gruposDeVideos } from './lib/docx.mjs';
import { parsearCronograma } from './lib/cronograma.mjs';
import { leerCuestionario } from './lib/cuestionarios.mjs';
import {
  RAIZ,
  aPosix,
  comparaNatural,
  extDe,
  ordenDesdeNombre,
  slug,
  tipoDeArchivo,
  tituloDesdeArchivo,
} from './lib/util.mjs';

// ---------------------------------------------------------------------------
// Configuración: qué se escanea y cómo. Agregar material nuevo = tocar esto.
// ---------------------------------------------------------------------------

const CURSO = 'Arquitectura de Computadoras';
const SUBTITULO = 'UTN FRRE · Dictado Especial · Segundo Cuatrimestre 2026';

const SALIDA = path.join(RAIZ, 'data', 'curso.json');
const DIR_AULA = 'Aula Cursado Especial/Archivos';
const ARCHIVO_CRONOGRAMA = 'Aula Cursado Especial/cronograma';
const ARCHIVO_VIDEOS = 'Aula Cursado Especial/Videos Teoria.docx';
const DIR_CUESTIONARIOS = 'Recursos Extras/Cuestionarios';
const DIR_ENTRADA = '_Entrada';

/** Carpetas sueltas que también se publican, cada una como su propia sección. */
const EXTRAS = [
  {
    ruta: 'Recursos Extras/Teoria',
    id: '90-apuntes-teoria',
    titulo: 'Apuntes de Teoría',
    subtitulo: 'Apuntes y resúmenes',
    orden: 90,
  },
  {
    ruta: 'Recursos Extras/Finales',
    id: '91-finales-parciales',
    titulo: 'Finales y Parciales Resueltos',
    subtitulo: 'Exámenes resueltos',
    orden: 91,
  },
  {
    ruta: 'Recursos Extras',
    soloNivel1: true, // sólo los archivos sueltos, sin entrar a subcarpetas
    id: '92-practica-extra',
    titulo: 'Práctica Extra',
    subtitulo: 'Compilados y guías resueltas',
    orden: 92,
  },
];

/** Semanas de cada unidad, tal como figuran en el aula real. */
const SEMANAS = {
  1: 'Semanas 1 a 3',
  2: 'Semana 4',
  3: 'Semanas 5 y 6',
  4: 'Semanas 7 y 8',
  5: 'Semana 9',
  6: 'Semana 10',
  7: 'Semanas 11 a 13',
  8: 'Semanas 14 a 16',
};

/** Erratas del material original que no vale la pena arrastrar a la web. */
const CORRECCIONES = {
  'CoCIRCUITOS SECUENCIALES': 'CIRCUITOS SECUENCIALES',
};

/** Archivos que nunca son material de estudio. */
const IGNORADOS = new Set([
  'links.txt',
  'desktop.ini',
  'thumbs.db',
  '.ds_store',
]);

const LIMITE_GITHUB = 100 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Helpers de disco
// ---------------------------------------------------------------------------

const abs = (rel) => path.join(RAIZ, rel);
const existe = (rel) => fs.existsSync(abs(rel));

function listar(rel, { soloNivel1 = false } = {}) {
  const dir = abs(rel);
  if (!fs.existsSync(dir)) return [];

  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (IGNORADOS.has(e.name.toLowerCase())) continue;

    const hijoRel = `${rel}/${e.name}`;
    if (e.isDirectory()) {
      if (!soloNivel1) salida.push(...listar(hijoRel));
    } else {
      salida.push(hijoRel);
    }
  }
  return salida.sort(comparaNatural);
}

function itemDeArchivo(rutaRel) {
  const nombre = path.basename(rutaRel);
  const item = {
    tipo: tipoDeArchivo(nombre),
    titulo: tituloDesdeArchivo(nombre),
    archivo: aPosix(rutaRel),
  };
  const ext = extDe(nombre);
  if (ext) item.ext = ext;

  try {
    const { size } = fs.statSync(abs(rutaRel));
    item.bytes = size;
    if (size > LIMITE_GITHUB) item.excedeGitHub = true;
  } catch {
    /* si no se puede leer el tamaño, seguimos sin él */
  }
  return item;
}

/**
 * Dos archivos distintos pueden generar el mismo título: "04-IntroMC.pdf" y
 * "04-IntroMC (1).pdf" colapsan a "04-IntroMC" porque limpiamos el sufijo "(N)".
 * En la lista quedan dos filas idénticas y no hay forma de saber cuál es cuál.
 * Cuando pasa, devolvemos el sufijo a los que chocan.
 */
function desambiguar(items) {
  const cuenta = new Map();
  for (const i of items) cuenta.set(i.titulo, (cuenta.get(i.titulo) ?? 0) + 1);

  for (const item of items) {
    if (!item.archivo || cuenta.get(item.titulo) < 2) continue;
    const nombre = path.basename(item.archivo);
    item.titulo = nombre
      .slice(0, nombre.length - path.extname(nombre).length)
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return items;
}

/** links.txt: líneas de texto seguidas (o precedidas) de una URL. */
function enlacesDe(dirRel) {
  const archivo = `${dirRel}/links.txt`;
  if (!existe(archivo)) return [];

  const lineas = fs
    .readFileSync(abs(archivo), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const enlaces = [];
  let pendiente = null;

  for (const linea of lineas) {
    // Caso "Título -> https://..." o "Título https://..." en una sola línea
    const inline = /^(.*?)(?:\s*->\s*|\s+)(https?:\/\/\S+)$/.exec(linea);
    if (inline && inline[1].trim()) {
      enlaces.push({ titulo: limpiarTituloEnlace(inline[1]), url: inline[2] });
      pendiente = null;
      continue;
    }
    // Caso URL sola: el título quedó en la línea anterior
    if (/^https?:\/\/\S+$/.test(linea)) {
      enlaces.push({
        titulo: limpiarTituloEnlace(pendiente ?? linea),
        url: linea,
      });
      pendiente = null;
      continue;
    }
    pendiente = linea;
  }

  return enlaces.map((e) => ({ tipo: 'enlace', titulo: e.titulo, url: e.url }));
}

/** Moodle pega "URL" pegado al final del título; lo sacamos. */
function limpiarTituloEnlace(texto) {
  return texto
    .replace(/URL\s*$/, '')
    .replace(/\s*->\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** id corto y estable: "1. Sistemas de Numeración..." -> "01-sistemas-numeracion". */
const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'a', 'en']);

function idDeSeccion(nombreCarpeta) {
  const n = ordenDesdeNombre(nombreCarpeta);
  const palabras = slug(nombreCarpeta.replace(/^\s*\d+\s*[.-]?\s*/, ''))
    .split('-')
    .filter((p) => p && !VACIAS.has(p))
    .slice(0, 2)
    .join('-');
  const prefijo = Number.isFinite(n) ? String(n).padStart(2, '0') : 'xx';
  return `${prefijo}-${palabras}`;
}

// ---------------------------------------------------------------------------
// Construcción de secciones
// ---------------------------------------------------------------------------

function seccionCronograma() {
  if (!existe(ARCHIVO_CRONOGRAMA)) return null;
  return {
    id: '00-cronograma',
    orden: 1,
    grupo: 'inicio',
    tipo: 'cronograma',
    titulo: 'Cronograma',
    subtitulo: 'Planificación semana por semana',
    ruta: ARCHIVO_CRONOGRAMA,
    datos: parsearCronograma(abs(ARCHIVO_CRONOGRAMA)),
    items: [],
  };
}

function seccionVideos() {
  if (!existe(ARCHIVO_VIDEOS)) return null;

  const items = [];
  for (const { grupo, videos } of gruposDeVideos(abs(ARCHIVO_VIDEOS))) {
    const nombreGrupo = CORRECCIONES[grupo] ?? grupo;
    for (const v of videos) {
      items.push({
        tipo: 'video',
        titulo: v.titulo,
        url: v.url,
        grupo: nombreGrupo,
        n: v.n,
      });
    }
  }

  return {
    id: '00-videos-teoria',
    orden: 2,
    grupo: 'inicio',
    tipo: 'videos',
    titulo: 'Videos de Teoría y Práctica',
    subtitulo: `${items.length} clases en video`,
    ruta: ARCHIVO_VIDEOS,
    items,
  };
}

function seccionesDeUnidades() {
  const base = abs(DIR_AULA);
  if (!fs.existsSync(base)) return [];

  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    // Orden por el número inicial, NO alfabético: si no, "10" cae antes que "2".
    .sort((a, b) => {
      const d = ordenDesdeNombre(a.name) - ordenDesdeNombre(b.name);
      return d !== 0 ? d : comparaNatural(a.name, b.name);
    })
    .map((e) => {
      const rutaRel = `${DIR_AULA}/${e.name}`;
      const n = ordenDesdeNombre(e.name);
      return {
        id: idDeSeccion(e.name),
        orden: Number.isFinite(n) ? n : 99,
        grupo: 'unidades',
        tipo: 'archivos',
        titulo: e.name,
        subtitulo: SEMANAS[n] ?? '',
        ruta: rutaRel,
        items: [
          ...desambiguar(listar(rutaRel).map(itemDeArchivo)),
          ...enlacesDe(rutaRel),
        ],
      };
    });
}

function seccionesExtras() {
  return EXTRAS.filter((x) => existe(x.ruta)).map((x) => ({
    id: x.id,
    orden: x.orden,
    grupo: 'extras',
    tipo: 'archivos',
    titulo: x.titulo,
    subtitulo: x.subtitulo,
    ruta: x.ruta,
    items: [
      ...desambiguar(listar(x.ruta, { soloNivel1: x.soloNivel1 }).map(itemDeArchivo)),
      ...enlacesDe(x.ruta),
    ],
  }));
}

/**
 * Bancos de preguntas interactivos. No son material para bajar sino páginas
 * para usar, así que van con su propio tipo: en vez de "peso y extensión"
 * mostramos de qué unidad son y cuántas preguntas tienen.
 *
 * La fuente de verdad de cada banco es su propio HTML: el título sale del
 * <h1> y la cantidad de preguntas de contar el banco embebido. Si querés
 * cambiar cómo figura uno en el aula, editá el HTML, no el JSON.
 */
function seccionCuestionarios() {
  if (!existe(DIR_CUESTIONARIOS)) return null;

  const items = [];
  for (const rutaRel of listar(DIR_CUESTIONARIOS, { soloNivel1: true })) {
    if (extDe(path.basename(rutaRel)) !== 'html') continue;

    const c = leerCuestionario(abs(rutaRel));
    if (!c) continue; // HTML suelto que no es un banco de preguntas

    items.push({
      tipo: 'cuestionario',
      titulo: c.titulo || tituloDesdeArchivo(path.basename(rutaRel)),
      archivo: aPosix(rutaRel),
      ext: 'html',
      unidad: c.unidad,
      descripcion: c.descripcion,
      preguntas: c.preguntas,
      temas: c.temas.length,
    });
  }

  if (!items.length) return null;

  return {
    id: '93-cuestionarios',
    orden: 93,
    grupo: 'extras',
    tipo: 'cuestionarios',
    titulo: 'Cuestionarios',
    // Descriptivo y no numérico, como el resto de los extras: la cuenta de
    // preguntas ya la pone el build debajo del título.
    subtitulo: 'Preguntas para practicar el parcial',
    ruta: DIR_CUESTIONARIOS,
    items,
  };
}

function escanear() {
  return [
    seccionCronograma(),
    seccionVideos(),
    ...seccionesDeUnidades(),
    ...seccionesExtras(),
    seccionCuestionarios(),
  ].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Modo --sync: fusiona lo nuevo sin pisar lo editado a mano
// ---------------------------------------------------------------------------

/** Clave estable de un item: la ruta del archivo, o la URL si es un enlace. */
const clave = (item) => item.archivo ?? item.url ?? item.titulo;

/**
 * Secciones cuyo subtítulo es un conteo ("39 clases en video"). Conservar el
 * viejo sería publicar un número que ya no es: en estas manda el fresco.
 */
const SUBTITULO_DERIVADO = new Set(['videos']);

/**
 * Si el título guardado no coincide con el que generaría el scan, es porque
 * lo editaste vos. En ese caso manda el tuyo.
 *
 * Los cuestionarios quedan afuera: su título sale del <h1> del propio HTML,
 * no del nombre del archivo. Ahí la fuente de verdad es el banco, así que
 * siempre manda el título fresco.
 */
function conservarTitulo(viejo, nuevo) {
  if (nuevo.tipo === 'cuestionario') return nuevo.titulo;

  const auto = viejo.archivo
    ? tituloDesdeArchivo(path.basename(viejo.archivo))
    : null;
  const editado = auto !== null && viejo.titulo !== auto;
  return editado ? viejo.titulo : nuevo.titulo;
}

function fusionar(previo, fresco) {
  const reporte = { nuevos: [], faltantes: [], seccionesNuevas: [] };
  const porId = new Map((previo.secciones ?? []).map((s) => [s.id, s]));
  const idsFrescos = new Set(fresco.map((s) => s.id));

  const secciones = fresco.map((sNueva) => {
    const sVieja = porId.get(sNueva.id);
    if (!sVieja) {
      reporte.seccionesNuevas.push(sNueva.id);
      return sNueva;
    }

    const viejosPorClave = new Map(sVieja.items.map((i) => [clave(i), i]));
    const clavesFrescas = new Set(sNueva.items.map(clave));

    // 1) Items que siguen en disco: se actualizan pero respetan tu título.
    const items = sNueva.items.map((iNuevo) => {
      const iViejo = viejosPorClave.get(clave(iNuevo));
      if (!iViejo) {
        reporte.nuevos.push(`${sNueva.id} :: ${iNuevo.titulo}`);
        return iNuevo;
      }
      const fusionado = { ...iViejo, ...iNuevo };
      fusionado.titulo = conservarTitulo(iViejo, iNuevo);
      delete fusionado.faltante; // volvió a aparecer
      return fusionado;
    });

    // 2) Items que ya no están en disco: se marcan, no se borran.
    for (const iViejo of sVieja.items) {
      if (clavesFrescas.has(clave(iViejo))) continue;
      reporte.faltantes.push(`${sNueva.id} :: ${iViejo.titulo}`);
      items.push({ ...iViejo, faltante: true });
    }

    return {
      ...sNueva,
      // El título de sección también puede estar editado a mano.
      titulo: sVieja.titulo !== sNueva.titulo ? sVieja.titulo : sNueva.titulo,
      subtitulo: SUBTITULO_DERIVADO.has(sNueva.tipo)
        ? sNueva.subtitulo
        : sVieja.subtitulo || sNueva.subtitulo,
      items,
    };
  });

  // 3) Secciones enteras que desaparecieron del disco.
  for (const sVieja of previo.secciones ?? []) {
    if (idsFrescos.has(sVieja.id)) continue;
    reporte.faltantes.push(`${sVieja.id} :: (sección completa)`);
    secciones.push({
      ...sVieja,
      faltante: true,
      items: sVieja.items.map((i) => ({ ...i, faltante: true })),
    });
  }

  return { secciones, reporte };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function pendientesDeEntrada() {
  // El LEEME explica para qué sirve el buzón; no es material a clasificar.
  return listar(DIR_ENTRADA)
    .filter((r) => path.basename(r).toLowerCase() !== 'leeme.md')
    .map((r) => aPosix(r));
}

function main() {
  const sync = process.argv.includes('--sync');
  const fresco = escanear();

  let secciones = fresco;
  let reporte = null;

  if (sync) {
    if (!fs.existsSync(SALIDA)) {
      console.error('No existe data/curso.json todavía — corré "npm run scan" primero.');
      process.exit(1);
    }
    const previo = JSON.parse(fs.readFileSync(SALIDA, 'utf8'));
    ({ secciones, reporte } = fusionar(previo, fresco));
  }

  const pendientes = pendientesDeEntrada();
  const curso = {
    curso: CURSO,
    subtitulo: SUBTITULO,
    generado: new Date().toISOString(),
    pendientes,
    secciones,
  };

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(curso, null, 2) + '\n', 'utf8');

  // --- Reporte por consola ---
  const archivos = secciones.flatMap((s) => s.items.filter((i) => i.archivo));
  const enlaces = secciones.flatMap((s) => s.items.filter((i) => i.url));
  const pesados = archivos.filter((i) => i.excedeGitHub);

  console.log(`\n${sync ? 'Sincronizado' : 'Generado'}: data/curso.json`);
  console.log(`  Secciones : ${secciones.length}`);
  console.log(`  Archivos  : ${archivos.length}`);
  console.log(`  Enlaces   : ${enlaces.length}\n`);

  for (const s of secciones) {
    const f = s.items.filter((i) => i.archivo).length;
    const u = s.items.filter((i) => i.url).length;
    const falta = s.items.filter((i) => i.faltante).length;
    // En los bancos, "7 archivos" no dice nada: lo que importa es cuánto hay
    // para practicar.
    const preguntas = s.items.reduce((suma, i) => suma + (i.preguntas ?? 0), 0);
    const detalle = [
      preguntas
        ? `${f} banco${f === 1 ? '' : 's'}, ${preguntas} preguntas`
        : f
          ? `${f} archivo${f === 1 ? '' : 's'}`
          : null,
      u ? `${u} enlace${u === 1 ? '' : 's'}` : null,
      falta ? `${falta} FALTANTE${falta === 1 ? '' : 'S'}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    console.log(`  ${s.id.padEnd(26)} ${detalle || '(sin items)'}`);
  }

  if (reporte) {
    const linea = (t, xs) => {
      if (!xs.length) return;
      console.log(`\n  ${t} (${xs.length}):`);
      for (const x of xs) console.log(`    · ${x}`);
    };
    linea('Secciones nuevas', reporte.seccionesNuevas);
    linea('Items nuevos', reporte.nuevos);
    linea('Marcados como faltantes', reporte.faltantes);
    if (!reporte.nuevos.length && !reporte.faltantes.length && !reporte.seccionesNuevas.length) {
      console.log('\n  Sin cambios: el JSON ya estaba al día.');
    }
  }

  if (pesados.length) {
    console.log(`\n  ⚠ Superan los 100 MB de GitHub (${pesados.length}):`);
    for (const p of pesados) {
      console.log(`    · ${(p.bytes / 1048576).toFixed(1)} MB — ${p.archivo}`);
    }
  }

  if (pendientes.length) {
    console.log(`\n  📥 Sin clasificar en ${DIR_ENTRADA}/ (${pendientes.length}):`);
    for (const p of pendientes) console.log(`    · ${p}`);
  }

  console.log('');
}

main();
