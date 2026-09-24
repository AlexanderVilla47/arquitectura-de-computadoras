// Lector de los bancos de preguntas (HTML autocontenidos e interactivos).
//
// Cada banco es una página que se abre sola: trae su CSS, su JS y el banco
// entero embebido en una línea `const DATA = {...};`. Acá no los tocamos,
// sólo les sacamos la metadata para armar la sección del aula: cuántas
// preguntas tienen, de qué unidad son y qué temas cubren.
//
// Leemos el HTML con expresiones regulares a propósito: meter un parser de
// DOM rompería la regla de "cero dependencias" del repo para sacarle cuatro
// datos a un archivo que generamos nosotros mismos.

import fs from 'node:fs';

const DATOS = /const DATA\s*=\s*(\{[\s\S]*?\});\s*$/m;
const TITULO = /<h1>([\s\S]*?)<\/h1>/;
const UNIDAD = /<div class="eyebrow">([\s\S]*?)<\/div>/;
const RESUMEN = /<p class="lead">([\s\S]*?)<\/p>/;

/** La coletilla de instrucciones se repite en los 7 bancos: no es descripción. */
const INSTRUCCIONES = /\s*Elegí,\s*tocá[\s\S]*$/;

/** Nombre legible de cada tipo de pregunta, tal como los llama el parcial. */
const TIPOS = {
  one: 'seleccione una',
  many: 'seleccione una o más',
  match: 'relacione',
  table: 'complete la tabla',
  text: 'completar',
};

/** Texto plano a partir de un fragmento de HTML: sin tags y sin entidades. */
function aTexto(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Primer grupo de la regex como texto plano, o "" si no matcheó. */
function extraer(html, regex) {
  const m = regex.exec(html);
  return m ? aTexto(m[1]) : '';
}

/**
 * "Arquitectura de Computadoras · C1 · U1" -> "U1".
 * El último segmento es el que ubica el banco dentro del cursado.
 */
function unidadDe(eyebrow) {
  const partes = eyebrow.split('·').map((p) => p.trim()).filter(Boolean);
  return partes.at(-1) ?? '';
}

/**
 * Metadata de un banco de preguntas.
 *
 * Si el HTML no trae `const DATA`, no es un banco: devolvemos null y el que
 * llama decide. Pero si trae DATA y no parsea, tiramos error — significa que
 * el formato cambió, y es mejor avisar que publicar una sección mintiendo
 * la cantidad de preguntas.
 */
export function leerCuestionario(ruta) {
  const html = fs.readFileSync(ruta, 'utf8');

  const m = DATOS.exec(html);
  if (!m) return null;

  let datos;
  try {
    datos = JSON.parse(m[1]);
  } catch (error) {
    throw new Error(`No pude parsear el banco de preguntas de ${ruta}: ${error.message}`);
  }

  const preguntas = Array.isArray(datos.qs) ? datos.qs : [];
  if (!preguntas.length) {
    throw new Error(`El banco de ${ruta} no tiene preguntas`);
  }

  const temas = [...new Set(preguntas.map((q) => q.sec).filter(Boolean))];
  const tipos = [...new Set(preguntas.map((q) => q.t).filter(Boolean))].map(
    (t) => TIPOS[t] ?? t,
  );

  return {
    banco: datos.id ?? '',
    titulo: extraer(html, TITULO),
    unidad: unidadDe(extraer(html, UNIDAD)),
    descripcion: extraer(html, RESUMEN).replace(INSTRUCCIONES, '').trim(),
    preguntas: preguntas.length,
    temas,
    tipos,
  };
}
