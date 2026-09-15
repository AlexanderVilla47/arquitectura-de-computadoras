#!/usr/bin/env node
// Genera el sitio estático a partir de data/curso.json.
//
//   node scripts/build.mjs
//
// Salida: site/index.html, site/estilos.css, site/secciones/<id>.html
// y el índice del README entre los marcadores INDICE:INICIO / INDICE:FIN.
//
// Sin frameworks, sin CDNs, sin build tools. Todo abre con doble clic (file://).
//
// Dirección de diseño: "blueprint de circuito". Es una materia de arquitectura,
// así que el sitio se ve como un plano técnico: malla de fondo, tipografía DIN
// de ingeniería, metadata en monoespaciada y un gradiente cian -> violeta que
// recorre las 8 unidades, de modo que el color te ubica en el cursado.

import fs from 'node:fs';
import path from 'node:path';

import { RAIZ, esc, hrefDeRuta, tamanoLegible } from './lib/util.mjs';

const ENTRADA = path.join(RAIZ, 'data', 'curso.json');
const SITIO = path.join(RAIZ, 'site');
const DIR_SECCIONES = path.join(SITIO, 'secciones');
const README = path.join(RAIZ, 'README.md');

/** Matiz por unidad: cian (inicio del cursado) -> violeta (final). */
const MATICES = [186, 198, 210, 222, 236, 252, 270, 290];
const MATIZ_INICIO = 172;
const MATIZ_EXTRA = 38;

function matizDe(seccion) {
  if (seccion.grupo === 'inicio') return MATIZ_INICIO;
  if (seccion.grupo === 'extras') return MATIZ_EXTRA;
  return MATICES[(seccion.orden - 1) % MATICES.length];
}

// ---------------------------------------------------------------------------
// Íconos — glifos de trazo, heredan color con currentColor
// ---------------------------------------------------------------------------

const TRAZO = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

function hoja(interior) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
<path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" ${TRAZO}/>
<path d="M14 2.5V7a.5.5 0 0 0 .5.5H19" ${TRAZO}/>
${interior}
</svg>`;
}

const ICONOS = {
  pdf: hoja(`<path d="M8.5 12.5h1.2a1.2 1.2 0 0 1 0 2.4H8.5zm0 4.6v-4.6" ${TRAZO}/><path d="M12.8 12.5v4.6h1a1.6 1.6 0 0 0 1.6-1.6v-1.4a1.6 1.6 0 0 0-1.6-1.6z" ${TRAZO}/>`),
  docx: hoja(`<path d="M8 12.5l1.4 4.6 1.6-3.4 1.6 3.4 1.4-4.6" ${TRAZO}/>`),
  xlsx: hoja(`<path d="M8.6 12.5l5 4.6M13.6 12.5l-5 4.6" ${TRAZO}/>`),
  ppt: hoja(`<path d="M9 17.1v-4.6h2a1.5 1.5 0 0 1 0 3H9" ${TRAZO}/>`),
  txt: hoja(`<path d="M8.4 13.4h6M8.4 15.6h6M8.4 17.8h3.6" ${TRAZO}/>`),
  zip: `<svg viewBox="0 0 24 24" aria-hidden="true">
<path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" ${TRAZO}/>
<path d="M14 2.5V7a.5.5 0 0 0 .5.5H19" ${TRAZO}/>
<path d="M10.2 3v2M11.8 5v2M10.2 7v2M11.8 9v2M10.2 11v2" ${TRAZO}/>
<rect x="9.4" y="13.4" width="3.2" height="4.2" rx=".9" ${TRAZO}/>
</svg>`,
  imagen: `<svg viewBox="0 0 24 24" aria-hidden="true">
<rect x="3" y="4.5" width="18" height="15" rx="2" ${TRAZO}/>
<circle cx="8.6" cy="10" r="1.7" ${TRAZO}/>
<path d="M3.6 17.4l4.8-4.6 3.4 3.3 3-2.8 5.6 5" ${TRAZO}/>
</svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true">
<rect x="2.5" y="5" width="19" height="14" rx="4" ${TRAZO}/>
<path d="M10.4 9.3l4.8 2.7-4.8 2.7z" fill="currentColor" stroke="none"/>
</svg>`,
  enlace: `<svg viewBox="0 0 24 24" aria-hidden="true">
<path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1 1" ${TRAZO}/>
<path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1-1" ${TRAZO}/>
</svg>`,
  calendario: `<svg viewBox="0 0 24 24" aria-hidden="true">
<rect x="3" y="5" width="18" height="16" rx="2.4" ${TRAZO}/>
<path d="M3 10h18M8 3v4M16 3v4" ${TRAZO}/>
<path d="M7.4 13.8h2.2M12.2 13.8h2.2M7.4 17.2h2.2M12.2 17.2h2.2" ${TRAZO}/>
</svg>`,
  /* Chip de circuito: marca las unidades del cursado. */
  chip: `<svg viewBox="0 0 24 24" aria-hidden="true">
<rect x="6.5" y="6.5" width="11" height="11" rx="1.6" ${TRAZO}/>
<rect x="10" y="10" width="4" height="4" rx=".7" ${TRAZO}/>
<path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21" ${TRAZO}/>
</svg>`,
  carpeta: `<svg viewBox="0 0 24 24" aria-hidden="true">
<path d="M3 7.2a1.8 1.8 0 0 1 1.8-1.8h4.3l2.2 2.6H19.2A1.8 1.8 0 0 1 21 9.8v8.4a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.2z" ${TRAZO}/>
</svg>`,
  otro: hoja(''),
};

/** Elige el ícono mirando primero la extensión concreta, después el tipo. */
function iconoDe(item) {
  if (item.tipo === 'enlace') return ICONOS.enlace;
  if (item.tipo === 'video') return ICONOS.video;
  if (['zip', 'rar', '7z'].includes(item.ext)) return ICONOS.zip;
  if (['pptx', 'ppt'].includes(item.ext)) return ICONOS.ppt;
  if (item.ext === 'txt') return ICONOS.txt;
  return ICONOS[item.tipo] ?? ICONOS.otro;
}

/** Cada tipo de archivo tiene su matiz propio: se reconocen de un vistazo. */
function matizDeItem(item) {
  if (item.tipo === 'enlace') return 186;
  if (item.tipo === 'video') return 344;
  if (['zip', 'rar', '7z'].includes(item.ext)) return 38;
  if (item.tipo === 'pdf') return 6;
  if (item.tipo === 'docx') return 214;
  if (item.tipo === 'xlsx') return 152;
  if (item.tipo === 'imagen') return 276;
  return 220;
}

const ICONO_SECCION = {
  cronograma: ICONOS.calendario,
  videos: ICONOS.video,
  archivos: ICONOS.chip,
};

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const CSS = `/* =========================================================================
   Aula · Arquitectura de Computadoras — UTN FRRE
   Generado por scripts/build.mjs. No editar a mano: se pisa en cada build.

   Dirección: "blueprint de circuito". Malla técnica de fondo, DIN de
   ingeniería en los títulos, monoespaciada en toda la metadata, y un
   gradiente cian -> violeta que recorre las 8 unidades del cursado.
   ========================================================================= */

:root {
  /* Sin CDN no hay webfonts: exprimimos las familias locales con más carácter.
     Bahnschrift es la DIN 1451 que trae Windows — tipografía de señalética
     e ingeniería. Cascadia/Consolas para los números. */
  --display: "Bahnschrift", "DIN Alternate", "Oswald", "Segoe UI Variable Display", "Helvetica Neue", sans-serif;
  --texto: "Segoe UI Variable Text", "Segoe UI", -apple-system, system-ui, sans-serif;
  --mono: "Cascadia Mono", "Cascadia Code", Consolas, "SF Mono", "JetBrains Mono", ui-monospace, monospace;

  --tinta:    #e8edf5;
  --apagado:  #8a97ad;
  --tenue:    #5c697f;

  --fondo:    #070a11;
  --superficie: #0e131d;
  --elevada:  #141b28;
  --borde:    #1f2937;
  --borde-vivo: #2b3849;

  --malla:    rgba(120, 170, 220, .055);
  --senal:    186;

  --radio:    14px;
  --shell:    1120px;
  --lectura:  940px;

  color-scheme: dark;
}

@media (prefers-color-scheme: light) {
  :root {
    /* Contraparte en papel de calco: mismo plano, otra iluminación. */
    --tinta:    #141a24;
    --apagado:  #5a6779;
    --tenue:    #8b98aa;

    --fondo:    #eef1f6;
    --superficie: #ffffff;
    --elevada:  #f7f9fc;
    --borde:    #d9e0ea;
    --borde-vivo: #bcc8d8;

    --malla:    rgba(30, 80, 140, .07);

    color-scheme: light;
  }
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--fondo);
  color: var(--tinta);
  font-family: var(--texto);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}

/* --- Malla de plano técnico + viñeta. Fija, no scrollea con el contenido. --- */
.malla {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--malla) 1px, transparent 1px),
    linear-gradient(90deg, var(--malla) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(ellipse 85% 65% at 50% 0%, #000 20%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 85% 65% at 50% 0%, #000 20%, transparent 78%);
}

.resplandor {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(760px 420px at 18% -8%, hsl(var(--senal) 90% 55% / .17), transparent 62%),
    radial-gradient(680px 400px at 88% 2%, hsl(288 85% 60% / .13), transparent 60%);
}

@media (prefers-color-scheme: light) {
  .resplandor {
    background:
      radial-gradient(760px 420px at 18% -8%, hsl(var(--senal) 85% 52% / .13), transparent 62%),
      radial-gradient(680px 400px at 88% 2%, hsl(288 80% 58% / .10), transparent 60%);
  }
}

main, .top { position: relative; z-index: 1; }

a { color: inherit; text-decoration: none; }

/* =========================== Barra superior =========================== */

.top {
  border-bottom: 1px solid var(--borde);
  background: color-mix(in srgb, var(--fondo) 82%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  position: sticky;
  top: 0;
  z-index: 20;
}

.top-int {
  max-width: var(--shell);
  margin: 0 auto;
  padding: 13px 26px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.marca { display: flex; align-items: center; gap: 11px; min-width: 0; }

.marca-ico {
  width: 30px; height: 30px;
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  border: 1px solid hsl(var(--senal) 70% 50% / .4);
  border-radius: 8px;
  background: hsl(var(--senal) 80% 50% / .12);
  color: hsl(var(--senal) 85% 62%);
}
.marca-ico svg { width: 18px; height: 18px; }

.marca-txt { display: flex; flex-direction: column; line-height: 1.1; min-width: 0; }

.marca-nom {
  font-family: var(--display);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: .055em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.marca-sub {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .14em;
  color: var(--tenue);
  text-transform: uppercase;
}

.miga {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: .07em;
  color: var(--tenue);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
  overflow: hidden;
}

.miga a { color: var(--apagado); transition: color .16s; }
.miga a:hover { color: hsl(var(--senal) 85% 62%); }
.miga .sep { color: var(--borde-vivo); }
.miga .act {
  color: var(--tinta);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 34ch;
}

/* ============================= Contenedor ============================= */

.envoltura { max-width: var(--shell); margin: 0 auto; padding: 0 26px 96px; }
.angosta { max-width: var(--lectura); }

/* =============================== Portada ============================== */

.hero { padding: 76px 0 62px; position: relative; }

.kicker {
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: .24em;
  text-transform: uppercase;
  color: hsl(var(--senal) 80% 62%);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}

/* La "traza" es un cable de circuito que sale del kicker y se pierde. */
.kicker::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, hsl(var(--senal) 80% 55% / .55), transparent);
  max-width: 320px;
}

.hero h1 {
  font-family: var(--display);
  font-weight: 700;
  font-size: clamp(34px, 6.6vw, 76px);
  line-height: .95;
  letter-spacing: -.022em;
  margin: 0 0 22px;
  text-transform: uppercase;
}

/* "de Computadoras" viaja junto: partirlo deja un "DE" huerfano feisimo. */
.hero h1 .brillo { display: inline-block; white-space: nowrap; }

.hero h1 .brillo {
  background: linear-gradient(104deg, hsl(var(--senal) 88% 66%), hsl(288 82% 72%) 62%, hsl(38 92% 64%));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  margin: 0;
  max-width: 56ch;
  color: var(--apagado);
  font-size: 16.5px;
  line-height: 1.68;
}

/* --- Panel de lecturas, tipo instrumental --- */
.lecturas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  gap: 1px;
  margin-top: 46px;
  background: var(--borde);
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  overflow: hidden;
}

.lectura-celda { background: var(--superficie); padding: 18px 20px; }

.lectura-celda .val {
  font-family: var(--mono);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -.02em;
  color: hsl(var(--senal) 82% 64%);
  line-height: 1.1;
}

.lectura-celda .etq {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .17em;
  text-transform: uppercase;
  color: var(--tenue);
  margin-top: 5px;
}

/* ========================== Títulos de bloque ========================= */

.bloque { margin-top: 62px; }

.bloque-tit {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--borde);
}

.bloque-tit h2 {
  font-family: var(--display);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  margin: 0;
}

.bloque-tit .nota {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--tenue);
  margin-left: auto;
}

/* ============================== Tarjetas ============================== */

.rejilla { display: grid; gap: 14px; }
.rejilla.dos { grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); }
.rejilla.tres { grid-template-columns: repeat(auto-fit, minmax(min(268px, 100%), 1fr)); }

.tarjeta {
  --h: var(--senal);
  position: relative;
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 21px 22px;
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  overflow: hidden;
  isolation: isolate;
  transition: transform .22s cubic-bezier(.2,.7,.3,1), border-color .22s, box-shadow .22s;

  /* Entrada escalonada: el retardo lo pone build.mjs tarjeta por tarjeta. */
  opacity: 0;
  animation: asomar .55s cubic-bezier(.2,.7,.3,1) forwards;
}

@keyframes asomar {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .tarjeta { animation: none; opacity: 1; }
  html { scroll-behavior: auto; }
}

/* Halo que se enciende al pasar el mouse. */
.tarjeta::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(420px 150px at 0% 0%, hsl(var(--h) 85% 55% / .13), transparent 70%);
  opacity: 0;
  transition: opacity .24s;
}

/* Barra de señal en el borde izquierdo. */
.tarjeta::after {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, hsl(var(--h) 88% 62%), hsl(var(--h) 88% 62% / 0));
  transform: scaleY(0);
  transform-origin: top;
  transition: transform .28s cubic-bezier(.2,.7,.3,1);
}

.tarjeta:hover {
  transform: translateY(-3px);
  border-color: hsl(var(--h) 60% 45% / .55);
  box-shadow: 0 16px 40px -16px hsl(var(--h) 80% 30% / .6);
}

.tarjeta:hover::before { opacity: 1; }
.tarjeta:hover::after { transform: scaleY(1); }

.tarjeta:focus-visible {
  outline: 2px solid hsl(var(--h) 85% 62%);
  outline-offset: 3px;
}

/* Numeral gigante de fondo: la unidad se lee incluso de reojo. */
.tarjeta .sello {
  position: absolute;
  right: 14px;
  bottom: -22px;
  z-index: -1;
  font-family: var(--mono);
  font-size: 86px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -.05em;
  color: hsl(var(--h) 70% 60% / .085);
  transition: color .24s, transform .28s cubic-bezier(.2,.7,.3,1);
}

.tarjeta:hover .sello {
  color: hsl(var(--h) 75% 62% / .16);
  transform: translateY(-3px);
}

.tarjeta-ico {
  flex: 0 0 42px;
  width: 42px; height: 42px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  border: 1px solid hsl(var(--h) 60% 50% / .32);
  background: hsl(var(--h) 80% 50% / .11);
  color: hsl(var(--h) 85% 64%);
  transition: background .24s, border-color .24s;
}

.tarjeta-ico svg { width: 21px; height: 21px; }
.tarjeta:hover .tarjeta-ico { background: hsl(var(--h) 80% 50% / .19); border-color: hsl(var(--h) 65% 55% / .5); }

.tarjeta-cuerpo { min-width: 0; flex: 1; }

.tarjeta-etq {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: hsl(var(--h) 60% 62%);
  display: block;
  margin-bottom: 4px;
}

.tarjeta-tit {
  overflow-wrap: anywhere;
  font-family: var(--display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: .012em;
  display: block;
  line-height: 1.25;
}

.tarjeta-meta {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--tenue);
  display: block;
  margin-top: 6px;
  letter-spacing: .04em;
}

.tarjeta .ir {
  flex: 0 0 auto;
  font-size: 19px;
  color: var(--tenue);
  transition: transform .24s cubic-bezier(.2,.7,.3,1), color .24s;
}

.tarjeta:hover .ir { transform: translateX(4px); color: hsl(var(--h) 85% 64%); }

/* ======================== Encabezado de sección ======================= */

.enc {
  --h: var(--senal);
  position: relative;
  padding: 52px 0 34px;
  border-bottom: 1px solid var(--borde);
  margin-bottom: 8px;
}

.enc-fila { display: flex; align-items: flex-start; gap: 22px; }

.enc-num {
  font-family: var(--mono);
  font-size: clamp(46px, 9vw, 74px);
  font-weight: 700;
  line-height: .86;
  letter-spacing: -.055em;
  color: hsl(var(--h) 85% 62%);
  flex: 0 0 auto;
  text-shadow: 0 0 44px hsl(var(--h) 90% 55% / .45);
}

.enc h1 {
  overflow-wrap: anywhere;
  font-family: var(--display);
  font-size: clamp(25px, 4.2vw, 40px);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -.012em;
  margin: 0;
  text-transform: uppercase;
}

.enc .sub {
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: .17em;
  text-transform: uppercase;
  color: hsl(var(--h) 55% 64%);
  display: block;
  margin-bottom: 9px;
}

.enc .conteo {
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--tenue);
  margin-top: 12px;
  display: block;
}

/* ========================== Listado de material ======================= */

.lista { list-style: none; margin: 0; padding: 0; }

.lista li { border-bottom: 1px solid var(--borde); }
.lista li:last-child { border-bottom: 0; }

.fila {
  --h: 220;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 15px 16px;
  margin: 0 -16px;
  border-radius: 11px;
  position: relative;
  transition: background .17s;
}

.fila:hover { background: var(--elevada); }

.fila:focus-visible {
  outline: 2px solid hsl(var(--h) 85% 62%);
  outline-offset: -2px;
}

.fila-ico {
  flex: 0 0 38px;
  width: 38px; height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid hsl(var(--h) 55% 50% / .26);
  background: hsl(var(--h) 75% 50% / .09);
  color: hsl(var(--h) 80% 64%);
  transition: background .17s, border-color .17s, transform .22s cubic-bezier(.2,.7,.3,1);
}

.fila-ico svg { width: 19px; height: 19px; }

.fila:hover .fila-ico {
  background: hsl(var(--h) 75% 50% / .17);
  border-color: hsl(var(--h) 60% 55% / .45);
  transform: scale(1.06);
}

.fila-cuerpo { min-width: 0; flex: 1; }

.fila-nom {
  display: block;
  overflow-wrap: anywhere;
  font-size: 14.8px;
  line-height: 1.4;
  color: var(--tinta);
  transition: color .17s;
}

.fila:hover .fila-nom { color: hsl(var(--h) 80% 68%); }

.fila-pie {
  display: block;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--tenue);
  margin-top: 3px;
}

.fila-meta {
  flex: 0 0 auto;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .07em;
  color: var(--tenue);
  text-transform: uppercase;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 9px;
}

.fila-meta .accion {
  opacity: 0;
  color: hsl(var(--h) 80% 64%);
  transition: opacity .17s;
  font-size: 13px;
}

.fila:hover .fila-meta .accion { opacity: 1; }

/* Índice numerado de los videos. */
.fila-n {
  flex: 0 0 auto;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--tenue);
  width: 2.2ch;
  text-align: right;
}

/* Archivo que ya no está en disco. */
.falta { opacity: .45; }
.falta .fila-nom { text-decoration: line-through; }

.aviso {
  display: inline-block;
  margin-left: 9px;
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
  background: hsl(38 80% 50% / .14);
  color: hsl(38 85% 62%);
  border: 1px solid hsl(38 70% 50% / .32);
  vertical-align: middle;
}

/* ====================== Agrupador dentro de sección =================== */

.grupo {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 38px 0 6px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .19em;
  text-transform: uppercase;
  color: hsl(var(--h, 186) 55% 62%);
}

.grupo::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--borde-vivo), transparent);
}

.grupo:first-of-type { margin-top: 26px; }

/* ========================= Tabla del cronograma ======================= */

.meta-crono {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin: 26px 0 30px;
}

.pastilla {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: .12em;
  text-transform: uppercase;
  border: 1px solid var(--borde);
  background: var(--superficie);
  border-radius: 999px;
  padding: 6px 14px;
  color: var(--apagado);
}

.pastilla b { color: var(--tinta); font-weight: 600; }

.tabla-caja {
  overflow-x: auto;
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  background: var(--superficie);
}

table { border-collapse: collapse; width: 100%; font-size: 14px; min-width: 600px; }

thead th {
  text-align: left;
  padding: 14px 16px;
  border-bottom: 1px solid var(--borde);
  background: var(--elevada);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .17em;
  text-transform: uppercase;
  color: var(--tenue);
  white-space: nowrap;
}

tbody td { padding: 14px 16px; border-bottom: 1px solid var(--borde); vertical-align: top; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr { transition: background .16s; }
tbody tr:hover { background: var(--elevada); }

.celda-sem { width: 58px; }

.sem {
  display: grid;
  place-items: center;
  width: 30px; height: 30px;
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 12.5px;
  font-weight: 600;
  /* El matiz avanza con la semana: la tabla dibuja el arco del cuatrimestre. */
  color: hsl(var(--h) 85% 64%);
  background: hsl(var(--h) 80% 50% / .12);
  border: 1px solid hsl(var(--h) 60% 50% / .28);
}

.unidad {
  font-family: var(--display);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: .03em;
  color: var(--tinta);
  white-space: nowrap;
}

.teoria { color: var(--apagado); }

.practica {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--tenue);
  letter-spacing: .04em;
  white-space: nowrap;
}

.tag-video {
  display: inline-block;
  margin-left: 8px;
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .1em;
  padding: 1px 7px;
  border-radius: 999px;
  color: hsl(344 80% 68%);
  background: hsl(344 80% 55% / .13);
  border: 1px solid hsl(344 70% 55% / .3);
  vertical-align: middle;
}

/* ============================ Pie de sección ========================== */

.nav-pies {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 13px;
  margin-top: 52px;
}

.nav-pies .hueco { visibility: hidden; }

.salto {
  min-width: 0;
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  background: var(--superficie);
  padding: 16px 19px;
  transition: border-color .2s, transform .2s cubic-bezier(.2,.7,.3,1), background .2s;
  display: block;
}

.salto:hover {
  border-color: var(--borde-vivo);
  background: var(--elevada);
  transform: translateY(-2px);
}

.salto .etq {
  display: block;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .17em;
  text-transform: uppercase;
  color: var(--tenue);
  margin-bottom: 5px;
}

.salto .nom {
  overflow-wrap: anywhere;
  font-family: var(--display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .02em;
  display: block;
  line-height: 1.25;
}

.salto.der { text-align: right; }

.pie-sitio {
  margin-top: 74px;
  padding-top: 26px;
  border-top: 1px solid var(--borde);
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--tenue);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.vacio {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--tenue);
  padding: 30px 0;
}

/* ============================== Responsive ============================ */

@media (max-width: 720px) {
  .envoltura, .top-int { padding-left: 18px; padding-right: 18px; }
  .hero { padding: 48px 0 38px; }
  .miga .act { display: none; }
  .enc-fila { flex-direction: column; gap: 12px; }
  .enc-num { font-size: 44px; }
  .nav-pies { grid-template-columns: minmax(0, 1fr); }
  .nav-pies .hueco { display: none; }
  .fila { gap: 13px; padding: 14px 12px; margin: 0 -12px; }
  .fila-meta .tam { display: none; }
  .tarjeta .sello { font-size: 68px; }
}

@media (max-width: 420px) {
  .fila-meta { display: none; }

  /* El nowrap evita el "DE" huerfano, pero abajo de 420px "DE COMPUTADORAS"
     ya no entra en la pantalla: ahi preferimos que corte antes que desbordar. */
  .hero h1 .brillo { white-space: normal; }
}

@media print {
  .malla, .resplandor, .top, .nav-pies { display: none; }
  body { background: #fff; color: #000; }
}
`;

// ---------------------------------------------------------------------------
// Helpers de HTML
// ---------------------------------------------------------------------------

const LOGO = ICONOS.chip;

/**
 * Arma el href. `subida` es el prefijo hasta la raíz del repo ("../" o "../../").
 * Cada segmento se codifica por separado: las rutas tienen espacios, puntos
 * y acentos, y si codificáramos la ruta entera nos comeríamos las barras.
 */
const aArchivo = (subida, ruta) => hrefDeRuta(subida + ruta);

function pagina({ titulo, subida, miga, cuerpo, matiz = 186 }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="color-scheme" content="dark light">
<link rel="stylesheet" href="${subida}site/estilos.css">
</head>
<body style="--senal:${matiz}">
<div class="malla"></div>
<div class="resplandor"></div>

<header class="top">
  <div class="top-int">
    <a class="marca" href="${subida}site/index.html">
      <span class="marca-ico">${LOGO}</span>
      <span class="marca-txt">
        <span class="marca-nom">Arquitectura de Computadoras</span>
        <span class="marca-sub">UTN FRRE · 2026 C2</span>
      </span>
    </a>
    ${miga ? `<nav class="miga">${miga}</nav>` : ''}
  </div>
</header>

<main class="envoltura${cuerpo.angosta ? ' angosta' : ''}">
${cuerpo.html}
  <footer class="pie-sitio">
    <span>Material de cursado · UTN FRRE</span>
    <span>Dictado especial · 2do cuatrimestre 2026</span>
  </footer>
</main>
</body>
</html>
`;
}

/** Una fila de material: ícono + título + metadata a la derecha. */
function fila(item, subida, indice) {
  const h = matizDeItem(item);
  const esExterno = Boolean(item.url);

  const href = esExterno ? item.url : aArchivo(subida, item.archivo);
  // Los .docx/.xlsx/.zip no los renderiza el navegador: se bajan.
  const descarga =
    !esExterno &&
    (['docx', 'xlsx', 'otro'].includes(item.tipo) ||
      ['zip', 'rar', '7z'].includes(item.ext));

  const attrs = [
    'class="fila"',
    `style="--h:${h}"`,
    `href="${href}"`,
    descarga ? 'download' : '',
    esExterno ? 'target="_blank" rel="noopener"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const pie = esExterno
    ? item.tipo === 'video'
      ? 'YouTube'
      : 'Enlace externo'
    : '';

  const meta = esExterno
    ? `<span class="accion">↗</span>`
    : [
        item.ext ? `<span>${esc(item.ext.toUpperCase())}</span>` : '',
        item.bytes ? `<span class="tam">${esc(tamanoLegible(item.bytes))}</span>` : '',
        `<span class="accion">${descarga ? '↓' : '→'}</span>`,
      ]
        .filter(Boolean)
        .join('');

  return `      <li${item.faltante ? ' class="falta"' : ''}><a ${attrs}>
        ${indice != null ? `<span class="fila-n">${esc(String(indice))}</span>` : ''}
        <span class="fila-ico">${iconoDe(item)}</span>
        <span class="fila-cuerpo">
          <span class="fila-nom">${esc(item.titulo)}${item.faltante ? '<span class="aviso">falta</span>' : ''}</span>
          ${pie ? `<span class="fila-pie">${esc(pie)}</span>` : ''}
        </span>
        <span class="fila-meta">${meta}</span>
      </a></li>`;
}

// ---------------------------------------------------------------------------
// Render de secciones
// ---------------------------------------------------------------------------

function encabezadoSeccion(seccion) {
  const num =
    seccion.grupo === 'unidades' ? String(seccion.orden).padStart(2, '0') : null;

  const archivos = seccion.items.filter((i) => i.archivo && !i.faltante).length;
  const enlaces = seccion.items.filter((i) => i.url).length;
  const conteo =
    seccion.tipo === 'cronograma'
      ? `${seccion.datos.filas.length} semanas`
      : [
          archivos ? `${archivos} archivo${archivos === 1 ? '' : 's'}` : null,
          enlaces ? `${enlaces} enlace${enlaces === 1 ? '' : 's'}` : null,
        ]
          .filter(Boolean)
          .join('  ·  ');

  // El título de las unidades ya trae el número adelante: lo sacamos porque
  // el numeral gigante de la izquierda ya cumple ese rol.
  const titulo = num ? seccion.titulo.replace(/^\s*\d+\s*[.\-–]\s*/, '') : seccion.titulo;

  return `  <header class="enc">
    <div class="enc-fila">
      ${num ? `<div class="enc-num">${num}</div>` : ''}
      <div>
        ${seccion.subtitulo ? `<span class="sub">${esc(seccion.subtitulo)}</span>` : ''}
        <h1>${esc(titulo)}</h1>
        ${conteo ? `<span class="conteo">${esc(conteo)}</span>` : ''}
      </div>
    </div>
  </header>`;
}

function cuerpoCronograma(seccion) {
  const d = seccion.datos;

  const pastillas = d.meta
    .map((m) => `<span class="pastilla">${esc(m.etiqueta)} <b>${esc(m.valor)}</b></span>`)
    .join('\n      ');

  const total = d.filas.length;
  const filas = d.filas
    .map((f, i) => {
      // El matiz recorre el mismo arco cian -> violeta que las unidades.
      const h = Math.round(186 + (104 * i) / Math.max(1, total - 1));
      const tag = f.videos > 1 ? `<span class="tag-video">${f.videos} videos</span>` : '';
      return `        <tr style="--h:${h}">
          <td class="celda-sem"><span class="sem">${f.semana}</span></td>
          <td class="unidad">${esc(f.unidad)}</td>
          <td class="teoria">${esc(f.teoria)}${tag}</td>
          <td class="practica">${esc(f.practica)}</td>
        </tr>`;
    })
    .join('\n');

  return `${pastillas ? `    <div class="meta-crono">\n      ${pastillas}\n    </div>` : ''}
    <div class="tabla-caja">
      <table>
        <thead><tr>${d.encabezados.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>
${filas}
        </tbody>
      </table>
    </div>`;
}

function cuerpoItems(seccion, subida) {
  if (!seccion.items.length) {
    return `    <p class="vacio">Todavía no hay material en esta sección.</p>`;
  }

  const numerar = seccion.tipo === 'videos';
  const usaGrupos = seccion.items.some((i) => i.grupo);

  if (!usaGrupos) {
    return `    <ul class="lista">
${seccion.items.map((i) => fila(i, subida)).join('\n')}
    </ul>`;
  }

  const porGrupo = new Map();
  for (const item of seccion.items) {
    const g = item.grupo ?? '';
    if (!porGrupo.has(g)) porGrupo.set(g, []);
    porGrupo.get(g).push(item);
  }

  const total = porGrupo.size;
  return [...porGrupo]
    .map(([g, items], i) => {
      const h = Math.round(186 + (104 * i) / Math.max(1, total - 1));
      return `    ${g ? `<div class="grupo" style="--h:${h}">${esc(g)}</div>` : ''}
    <ul class="lista">
${items.map((it) => fila(it, subida, numerar ? it.n : null)).join('\n')}
    </ul>`;
    })
    .join('\n');
}

function paginaSeccion(seccion, vecinos) {
  const subida = '../../';
  const matiz = matizDe(seccion);

  const cuerpo =
    seccion.tipo === 'cronograma'
      ? cuerpoCronograma(seccion)
      : cuerpoItems(seccion, subida);

  const salto = (s, lado) =>
    s
      ? `<a class="salto ${lado === 'der' ? 'der' : ''}" href="${encodeURIComponent(s.id)}.html">
      <span class="etq">${lado === 'der' ? 'Siguiente →' : '← Anterior'}</span>
      <span class="nom">${esc(s.titulo)}</span>
    </a>`
      : '<span class="hueco"></span>';

  return pagina({
    titulo: `${seccion.titulo} · Arquitectura de Computadoras`,
    subida,
    matiz,
    miga: `<a href="${subida}site/index.html">Inicio</a><span class="sep">/</span><span class="act">${esc(seccion.titulo)}</span>`,
    cuerpo: {
      angosta: true,
      html: `${encabezadoSeccion(seccion)}
  <section>
${cuerpo}
  </section>
  <nav class="nav-pies">
    ${salto(vecinos.anterior, 'izq')}
    ${salto(vecinos.siguiente, 'der')}
  </nav>`,
    },
  });
}

// ---------------------------------------------------------------------------
// Portada
// ---------------------------------------------------------------------------

function tarjetaSeccion(seccion, retardo) {
  const h = matizDe(seccion);
  const archivos = seccion.items.filter((i) => i.archivo && !i.faltante).length;
  const enlaces = seccion.items.filter((i) => i.url).length;

  const meta =
    seccion.tipo === 'cronograma'
      ? `${seccion.datos.filas.length} semanas`
      : [
          archivos ? `${archivos} archivo${archivos === 1 ? '' : 's'}` : null,
          enlaces ? `${enlaces} enlace${enlaces === 1 ? '' : 's'}` : null,
        ]
          .filter(Boolean)
          .join('  ·  ') || 'vacío';

  const num = seccion.grupo === 'unidades' ? String(seccion.orden).padStart(2, '0') : null;
  const titulo = num ? seccion.titulo.replace(/^\s*\d+\s*[.\-–]\s*/, '') : seccion.titulo;

  return `    <a class="tarjeta" style="--h:${h}; animation-delay:${retardo}ms" href="secciones/${encodeURIComponent(seccion.id)}.html">
      ${num ? `<span class="sello">${num}</span>` : ''}
      <span class="tarjeta-ico">${ICONO_SECCION[seccion.tipo] ?? ICONOS.carpeta}</span>
      <span class="tarjeta-cuerpo">
        ${seccion.subtitulo ? `<span class="tarjeta-etq">${esc(seccion.subtitulo)}</span>` : ''}
        <span class="tarjeta-tit">${esc(titulo)}</span>
        <span class="tarjeta-meta">${esc(meta)}</span>
      </span>
      <span class="ir">→</span>
    </a>`;
}

function bloque(titulo, nota, secciones, columnas, baseRetardo) {
  if (!secciones.length) return '';
  return `  <section class="bloque">
    <div class="bloque-tit">
      <h2>${esc(titulo)}</h2>
      ${nota ? `<span class="nota">${esc(nota)}</span>` : ''}
    </div>
    <div class="rejilla ${columnas}">
${secciones.map((s, i) => tarjetaSeccion(s, baseRetardo + i * 55)).join('\n')}
    </div>
  </section>`;
}

function paginaIndice(curso) {
  const por = (g) => curso.secciones.filter((s) => s.grupo === g);
  const unidades = por('unidades');
  const inicio = por('inicio');
  const extras = por('extras');

  const archivos = curso.secciones.flatMap((s) =>
    s.items.filter((i) => i.archivo && !i.faltante),
  );
  const videos = curso.secciones.flatMap((s) => s.items.filter((i) => i.tipo === 'video'));
  const semanas =
    curso.secciones.find((s) => s.tipo === 'cronograma')?.datos.filas.length ?? 0;

  const lecturas = [
    [String(unidades.length).padStart(2, '0'), 'Unidades'],
    [String(archivos.length), 'Archivos'],
    [String(videos.length), 'Videos'],
    [String(semanas), 'Semanas'],
  ]
    .map(
      ([v, e]) =>
        `      <div class="lectura-celda"><div class="val">${esc(v)}</div><div class="etq">${esc(e)}</div></div>`,
    )
    .join('\n');

  return pagina({
    titulo: `${curso.curso} · Aula`,
    subida: '../',
    matiz: 186,
    miga: '',
    cuerpo: {
      angosta: false,
      html: `  <section class="hero">
    <div class="kicker">UTN FRRE · Dictado especial</div>
    <h1>Arquitectura<br><span class="brillo">de Computadoras</span></h1>
    <p>Todo el material del cursado en un solo lugar: la planificación semana a semana, las clases en video y las ocho unidades con sus guías, presentaciones y prácticos.</p>
    <div class="lecturas">
${lecturas}
    </div>
  </section>

${bloque('Para empezar', 'Planificación y clases', inicio, 'dos', 120)}

${bloque('Unidades', 'Material del cursado', unidades, 'tres', 240)}

${bloque('Recursos Extras', 'Apuntes, finales y práctica', extras, 'tres', 420)}`,
    },
  });
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

const MARCA_INICIO = '<!-- INDICE:INICIO -->';
const MARCA_FIN = '<!-- INDICE:FIN -->';

function indiceMarkdown(curso) {
  const lineas = ['', '_Generado por `npm run build` — no lo edites a mano._', ''];

  for (const grupo of ['inicio', 'unidades', 'extras']) {
    const secciones = curso.secciones.filter((s) => s.grupo === grupo);
    if (!secciones.length) continue;

    const nombre = {
      inicio: 'Para empezar',
      unidades: 'Unidades',
      extras: 'Recursos Extras',
    }[grupo];
    lineas.push(`### ${nombre}`, '');

    for (const s of secciones) {
      const sub = s.subtitulo ? ` — _${s.subtitulo}_` : '';
      lineas.push('<details>', `<summary><b>${s.titulo}</b>${sub}</summary>`, '');

      if (s.tipo === 'cronograma') {
        lineas.push(`Planificación de ${s.datos.filas.length} semanas.`, '');
      } else if (!s.items.length) {
        lineas.push('_Sin material cargado._', '');
      } else {
        for (const i of s.items) {
          const destino = i.url ?? hrefDeRuta(i.archivo);
          const marca = i.faltante ? ' ⚠️ _(falta el archivo)_' : '';
          lineas.push(`- [${i.titulo}](${destino})${marca}`);
        }
        lineas.push('');
      }
      lineas.push('</details>', '');
    }
  }

  return lineas.join('\n');
}

function actualizarReadme(curso) {
  if (!fs.existsSync(README)) return false;

  const texto = fs.readFileSync(README, 'utf8');
  const i = texto.indexOf(MARCA_INICIO);
  const f = texto.indexOf(MARCA_FIN);
  if (i < 0 || f < 0) return false;

  fs.writeFileSync(
    README,
    texto.slice(0, i + MARCA_INICIO.length) + indiceMarkdown(curso) + texto.slice(f),
    'utf8',
  );
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(ENTRADA)) {
    console.error('No existe data/curso.json — corré "npm run scan" primero.');
    process.exit(1);
  }
  const curso = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));

  fs.mkdirSync(DIR_SECCIONES, { recursive: true });
  fs.writeFileSync(path.join(SITIO, 'estilos.css'), CSS, 'utf8');
  fs.writeFileSync(path.join(SITIO, 'index.html'), paginaIndice(curso), 'utf8');

  const orden = curso.secciones;
  for (let i = 0; i < orden.length; i++) {
    fs.writeFileSync(
      path.join(DIR_SECCIONES, `${orden[i].id}.html`),
      paginaSeccion(orden[i], { anterior: orden[i - 1], siguiente: orden[i + 1] }),
      'utf8',
    );
  }

  // GitHub Pages sirve desde la raíz del repo: sin esto habría que entrar a
  // /site/ a mano. El meta refresh anda igual abriendo el archivo con file://.
  fs.writeFileSync(
    path.join(RAIZ, 'index.html'),
    `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=site/index.html">
<link rel="canonical" href="site/index.html">
<title>${esc(curso.curso)}</title>
</head>
<body>
<p>Redirigiendo al aula… si no pasa nada, entrá a <a href="site/index.html">site/index.html</a>.</p>
</body>
</html>
`,
    'utf8',
  );

  const readmeOk = actualizarReadme(curso);

  console.log('\nSitio generado en site/');
  console.log('  index.html             (redireccion para GitHub Pages)');
  console.log('  site/index.html');
  console.log('  site/estilos.css');
  console.log(`  site/secciones/*.html  (${orden.length} páginas)`);
  console.log(`  README.md              ${readmeOk ? 'índice actualizado' : '(sin marcadores, no se tocó)'}`);
  console.log('\nAbrilo con doble clic en site/index.html\n');
}

main();
