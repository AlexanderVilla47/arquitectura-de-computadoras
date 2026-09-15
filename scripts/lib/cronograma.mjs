// Parser del archivo "cronograma" (pegado crudo desde el aula de Moodle).
//
// El formato real es: un preámbulo de pares ETIQUETA / valor, después los 4
// encabezados de la tabla, y a partir de ahí grupos de 4 líneas no vacías
// (semana, unidad, teoría, práctica). No hay separadores: el único invariante
// confiable es "4 líneas por fila".

import fs from 'node:fs';

const ENCABEZADOS = [
  'Semana',
  'Unidad temática',
  'Actividad teórica (video)',
  'Actividad práctica',
];

/** Limpia restos del copiar/pegar de Moodle en la celda de teoría. */
function limpiarCelda(texto) {
  return texto
    .replace(/\[Video\]\(?/gi, '') // resto de un markdown a medio pegar
    .replace(/(?:\s*Ver\s+video\s*)+$/i, '') // los "Ver video" eran links, ya no
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cuenta cuántos videos colgaban de esa fila (había un "Ver video" por video). */
function contarVideos(texto) {
  return (texto.match(/Ver\s+video/gi) || []).length;
}

export function parsearCronograma(ruta) {
  const lineas = fs
    .readFileSync(ruta, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Preámbulo: hasta donde arranca el encabezado de la tabla ---
  const iTabla = lineas.findIndex(
    (l, i) => l === ENCABEZADOS[0] && lineas[i + 1] === ENCABEZADOS[1],
  );
  if (iTabla < 0) {
    throw new Error(`No encontré el encabezado de la tabla en ${ruta}`);
  }

  const preambulo = lineas.slice(0, iTabla);
  const titulo = preambulo[0] || 'Cronograma';
  const subtitulo = preambulo[1] || '';

  // Pares ETIQUETA / valor: la etiqueta va en MAYÚSCULAS y sola en su línea.
  const meta = [];
  for (let i = 2; i < preambulo.length - 1; i++) {
    const etiqueta = preambulo[i];
    if (etiqueta === etiqueta.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(etiqueta)) {
      meta.push({ etiqueta, valor: preambulo[i + 1] });
      i++;
    }
  }

  // --- Filas: grupos de 4 líneas después de los 4 encabezados ---
  const cuerpo = lineas.slice(iTabla + ENCABEZADOS.length);
  const filas = [];
  for (let i = 0; i + 3 < cuerpo.length; i += 4) {
    const [semana, unidad, teoria, practica] = cuerpo.slice(i, i + 4);
    if (!/^\d+$/.test(semana)) {
      // Si esto salta, el formato del pegado cambió: mejor avisar que inventar.
      throw new Error(
        `Fila corrida en el cronograma: esperaba un número de semana y vino "${semana}"`,
      );
    }
    filas.push({
      semana: Number(semana),
      unidad,
      teoria: limpiarCelda(teoria),
      videos: contarVideos(teoria),
      practica: practica.trim(),
    });
  }

  return { titulo, subtitulo, meta, encabezados: ENCABEZADOS, filas };
}
