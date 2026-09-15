// Utilidades compartidas. Node puro, cero dependencias.

import path from 'node:path';

/** Raíz del repositorio (este archivo vive en scripts/lib/). */
export const RAIZ = path.resolve(import.meta.dirname, '..', '..');

/** Extensiones -> tipo lógico del item. */
const TIPOS = {
  pdf: ['.pdf'],
  docx: ['.docx', '.doc', '.odt', '.rtf', '.pptx', '.ppt'],
  xlsx: ['.xlsx', '.xls', '.csv', '.ods'],
  imagen: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif'],
  video: ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v'],
};

/** Clasifica un archivo por extensión: pdf | docx | xlsx | imagen | video | otro. */
export function tipoDeArchivo(nombre) {
  const ext = path.extname(nombre).toLowerCase();
  for (const [tipo, exts] of Object.entries(TIPOS)) {
    if (exts.includes(ext)) return tipo;
  }
  return 'otro';
}

/** Extensión sin el punto, en minúsculas. Sirve para elegir el ícono exacto. */
export function extDe(nombre) {
  return path.extname(nombre).toLowerCase().replace('.', '');
}

/** Título legible: nombre sin extensión, sin sufijos "(1)" y sin guiones bajos. */
export function tituloDesdeArchivo(nombre) {
  return path
    .basename(nombre, path.extname(nombre))
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Slug ASCII para ids y nombres de archivo HTML. */
export function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Normaliza separadores a "/" para que el JSON sea igual en Windows y Linux. */
export function aPosix(p) {
  return p.split(path.sep).join('/');
}

/**
 * Codifica una ruta relativa para usarla en un href.
 * Codifica CADA segmento por separado: si usáramos encodeURIComponent sobre
 * la ruta entera nos comería las barras y el link moriría.
 */
export function hrefDeRuta(rutaRelativa) {
  return rutaRelativa
    .split('/')
    .map((seg) => (seg === '..' || seg === '.' ? seg : encodeURIComponent(seg)))
    .join('/');
}

/** Escapa texto para insertarlo como contenido HTML. */
export function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Tamaño humano: 1455563 -> "1,4 MB". */
export function tamanoLegible(bytes) {
  if (bytes == null) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  const txt = i === 0 ? String(n) : n.toFixed(1).replace('.', ',');
  return `${txt} ${u[i]}`;
}

/**
 * Comparador "natural": "2. ALU" va antes que "10. Algo".
 * Un sort alfabético plano pondría "10" antes que "2" y nos rompería el orden.
 */
export function comparaNatural(a, b) {
  return String(a).localeCompare(String(b), 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

/** Extrae el número inicial de "3. Circuitos Secuenciales" -> 3. */
export function ordenDesdeNombre(nombre) {
  const m = /^\s*(\d+)/.exec(nombre);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}
