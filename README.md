# Arquitectura de Computadoras — UTN FRRE

Aula estática con todo el material del **Dictado Especial, 2º cuatrimestre 2026**:
la planificación semana a semana, las 39 clases en video y las 8 unidades con sus
guías, presentaciones y prácticos, más los apuntes y finales que fui juntando.

**Para usarla: abrí [`site/index.html`](site/index.html)** con doble clic. No necesita
servidor, ni internet, ni instalar nada.

---

## Cómo funciona

Hay una sola fuente de verdad: **las carpetas de material tal como están en el disco**.
Los scripts las leen y generan todo lo demás.

```
carpetas de material  ──scan──>  data/curso.json  ──build──>  site/
```

| Comando | Qué hace |
|---|---|
| `npm run scan` | Regenera `data/curso.json` **desde cero**, pisando todo. |
| `npm run sync` | Actualiza `data/curso.json` **sin pisar** los títulos que editaste a mano. |
| `npm run build` | Genera `site/` y refresca el índice de este README. |
| `npm run actualizar` | `sync` + `build` de una. **Es el que vas a usar casi siempre.** |

Node 18 o superior. **Cero dependencias**: no hay `npm install` que hacer.

---

## Agregar material nuevo

### La forma fácil: la carpeta `_Entrada/`

Tirá los archivos en [`_Entrada/`](_Entrada/) sin pensar dónde van. La próxima vez
que corras `npm run sync` te los va a listar como *pendientes de clasificar*, y de
ahí se mueven a la sección que corresponda.

### La forma directa

1. Copiá el archivo dentro de la carpeta de la unidad, por ejemplo
   `Aula Cursado Especial/Archivos/4. ALU/`
2. Corré `npm run actualizar`
3. Listo — ya aparece en el sitio

**Siempre usá `sync`, no `scan`.** `sync` respeta los títulos que hayas editado a
mano en `data/curso.json`; `scan` los borra y vuelve a poner el nombre del archivo.

### Agregar un link (video de YouTube, recurso del campus)

Creá o editá un `links.txt` dentro de la carpeta de la unidad. Cualquiera de estos
dos formatos funciona:

```
Video Resolución ejercicio 11 -> https://youtu.be/xxxxx

Video Explicación Ejercicio 5
https://youtu.be/yyyyy
```

### Cambiarle el nombre a algo

Editá el `"titulo"` en `data/curso.json` y corré `npm run build`.
Mientras uses `sync`, tu texto queda. El nombre del archivo en disco no se toca.

### Agregar una unidad o una carpeta entera

- **Unidad nueva**: creá la carpeta `Aula Cursado Especial/Archivos/9. Lo que sea/`.
  Se detecta sola y se ordena por el número.
- **Carpeta suelta nueva**: agregá una entrada al array `EXTRAS` en
  [`scripts/scan.mjs`](scripts/scan.mjs) — son 5 líneas.

---

## Si borrás un archivo

`sync` no lo elimina del JSON: lo marca con `"faltante": true` y en el sitio
aparece tachado con un cartelito. Así te enterás de que algo se perdió en vez de
que desaparezca en silencio. Para sacarlo del todo, borrá el item de
`data/curso.json` a mano.

---

## Archivos pesados y material excluido

GitHub **rechaza** cualquier archivo de más de 100 MB y **avisa** arriba de 50 MB.
Ahora mismo no hay ninguno que se pase del límite duro.

| Archivo | Tamaño | Estado |
|---|---|---|
| `Recursos Extras/Teoria/Apunte Arquitectura.docx` | 85 MB | pasa, con aviso |
| `Recursos Extras/GuiaPracticaResueltaArquitectura.pdf` | 54 MB | pasa, con aviso |

La guía práctica resuelta pesaba **115 MB** y no entraba: son 154 páginas
escaneadas a 300 dpi, una imagen por página. Se recomprimió a 180 dpi calidad 82
con PyMuPDF y quedó en **54 MB** sin perder legibilidad — es material manuscrito
con diagramas a lápiz, así que se verificó la calidad antes de reemplazarlo. El
original sin tocar está en `_NoPublicar/Originales/`.

### Qué NO se publica

La carpeta `_NoPublicar/` está en el `.gitignore`: sigue en tu disco, pero no
viaja a GitHub ni aparece en el sitio.

- **`_NoPublicar/Libros/`** — libros comerciales con derechos de autor
  (Stallings, Quiroga, Meinadier). Este repo es **público**: subirlos sería
  redistribuirlos, y eso puede terminar en un takedown de GitHub sobre la cuenta.
  Como material de estudio personal no hay problema — por eso quedan afuera del
  repo y no borrados.
- **`_NoPublicar/Originales/`** — originales sin comprimir de archivos que sí
  están en el repo en versión liviana.

`npm run scan` te avisa cada vez que aparece un archivo que se pasa del límite.

---

## Estructura del repo

```
Aula Cursado Especial/
  Archivos/<N>. <Tema>/     material de las 8 unidades (+ links.txt opcional)
  ImagenesOrden/            capturas del aula original, de referencia
  cronograma                planificación pegada del campus
  Videos Teoria.docx        tabla de videos con sus links de YouTube
Recursos Extras/
  Teoria/                   apuntes completos y resúmenes
  Finales/                  parciales y finales resueltos
  *.pdf                     compilados y práctica suelta
_Entrada/                   buzón: tirá acá lo nuevo y después se clasifica
_NoPublicar/                fuera del repo: libros con copyright y originales
data/curso.json             índice generado — editable a mano para los títulos
scripts/
  scan.mjs                  disco  -> curso.json
  build.mjs                 curso.json -> site/
  lib/                      lector de .docx, parser del cronograma, utilidades
site/                       el sitio generado (no editar: se pisa en cada build)
```

El `cronograma` y el `Videos Teoria.docx` **se leen automáticamente**. El `.docx`
se abre con un lector de ZIP escrito en Node puro (`scripts/lib/docx.mjs`), así que
si actualizás el documento, `npm run actualizar` levanta la tabla nueva sola.

---

## Publicarlo en GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → rama `main`, carpeta `/ (root)`.
El aula queda en `https://<usuario>.github.io/<repo>/site/`.

Tené en cuenta que el repo pesa ~424 MB. Anda, pero el `git clone` va a ser lento.

---

## Índice del curso

<!-- INDICE:INICIO -->
_Generado por `npm run build` — no lo edites a mano._

### Para empezar

<details>
<summary><b>Cronograma</b> — _Planificación semana por semana_</summary>

Planificación de 16 semanas.

</details>

<details>
<summary><b>Videos de Teoría y Práctica</b> — _39 clases en video_</summary>

- [Practica, Clase Nro 1: Codificación y Hamming](https://www.youtube.com/watch?v=7_SjaPZSfyE&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=1&pp=iAQB)
- [Hamming y combinacionale 1/4](https://www.youtube.com/watch?v=fxc1kvNbM9A&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=2&pp=iAQB0gcJCa0JAYcqIYzv)
- [Combinacionales 2/4](https://www.youtube.com/watch?v=oXysrypVWT8&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=9&pp=iAQB)
- [¿Cómo se construye un mapa de Karnaugh?](https://www.youtube.com/watch?v=nIgIREYHbx4&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=4&pp=iAQB0gcJCa0JAYcqIYzv)
- [¿Cómo inflar los GLOBOS en un mapa de karnaugh?](https://www.youtube.com/watch?v=vacBsx_ZljY&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=5&pp=iAQB)
- [¿Cómo nombrar los globos de Karnaugh?](https://www.youtube.com/watch?v=9dd6eW6-p1M&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=6&pp=iAQB)
- [Reglas de Boole sin memorizar](https://www.youtube.com/watch?v=vOSCevaytLA&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=7&pp=iAQB)
- [Clase Nro 3: Circuitos combinacionales 3/4](https://www.youtube.com/watch?v=db0wj1N--Iw&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=8&pp=iAQB0gcJCa0JAYcqIYzv)
- [Clase Nro 4 Circuitos Combinacionales 4/4](https://www.youtube.com/watch?v=KmLKZ-SpzlQ&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=10&pp=iAQB)
- [Circuitos Secuenciales I](https://www.youtube.com/watch?v=VXX3jLUjJCQ&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=11&pp=iAQB)
- [Secuenciales II](https://www.youtube.com/watch?v=6uRqHk3jAxg&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=13&pp=iAQB)
- [Contadores y descontadores](https://www.youtube.com/watch?v=E8I03zIU7tA&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=12&pp=iAQB)
- [Biestable Funcionamiento y tabla, Circuito Secuencial](https://www.youtube.com/watch?v=Q29XnzI5G0k&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=14&pp=iAQB0gcJCa0JAYcqIYzv)
- [Secuenciales Conversion y Redificion](https://www.youtube.com/watch?v=WIjwT9LepEE&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=15&pp=iAQB)
- [Secuenciales Seriales](https://www.youtube.com/watch?v=qzYIJL4bYrk&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=16&pp=iAQB)
- [Secuenciales Seriales II](https://www.youtube.com/watch?v=QVj6zCwkDTQ&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=17&pp=iAQB)
- [Ejercicios de Secuenciales](https://www.youtube.com/watch?v=lOPADeQ4RM0&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=18&pp=iAQB0gcJCa0JAYcqIYzv)
- [Ejercicios de Secuenciales II](https://www.youtube.com/watch?v=pj_t_Tf7oPY&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=19&pp=iAQB)
- [ALU, SUMA](https://www.youtube.com/watch?v=4vzIbbw5kjc&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=20&pp=iAQB)
- [ALU Sumadores BCD](https://www.youtube.com/watch?v=PbXA3gbA3Bw&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=21&pp=iAQB)
- [Repaso previo al 1er parcial](https://www.youtube.com/watch?v=nAs4gyHMfXY&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=22&pp=iAQB)
- [ALU Operaciones y Carga forzada](https://www.youtube.com/watch?v=pVWVH0sLw3Y&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=23&pp=iAQB0gcJCa0JAYcqIYzv)
- [ALU, MC, SIGNO](https://www.youtube.com/watch?v=e4jHukp62gY&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=24&pp=iAQB)
- [ALU e Introducción a la Memoria Central](https://www.youtube.com/watch?v=tXEY-9wbM9A&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=25&pp=iAQB)
- [Memoria Central 1/2](https://www.youtube.com/watch?v=yhpzvWDRhM4&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=28&pp=iAQB)
- [Memoria Central 2/2](https://www.youtube.com/watch?v=cVGrX93lEUo&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=29&pp=iAQB)
- [Clase de consulta previo a Recuperatorio](https://www.youtube.com/watch?v=pu6gx_6tR_k&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=26&pp=iAQB)
- [Introducción Unidad de Control](https://www.youtube.com/watch?v=2gaW51ybRoI&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=27&pp=iAQB0gcJCa0JAYcqIYzv)
- [Unidad de Control 1/2](https://www.youtube.com/watch?v=dwaUTG1oI1U&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=30&pp=iAQB)
- [Unidad de Control 2/2](https://www.youtube.com/watch?v=PktryKiy6wU&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=31&pp=iAQB)
- [Lenguaje de Maquina](https://www.youtube.com/watch?v=oI5Oaq6hDw0&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=32&pp=iAQB)
- [Lenguaje de Maquina Uso de Indices](https://www.youtube.com/watch?v=-J-ISd_xBwI&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=33&pp=iAQB)
- [Lenguaje de Maquina Direccionamiento Indexado y Base](https://www.youtube.com/watch?v=8ReBwVOV19s&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=34&pp=iAQB)
- [Lenguaje de Maquina recorrido de memoria](https://www.youtube.com/watch?v=8tbcAhEzNhc&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=35&pp=iAQB)
- [Procesador intel 8086 & 8088 (Parte 1/4)](https://www.youtube.com/watch?v=trp0d5mtG_A&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=36&t=1088s&pp=iAQB)
- [Procesador Intel 8086 (2/4)](https://www.youtube.com/watch?v=8P1K0NE6PAg&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=37&pp=iAQB)
- [Procesador Intel Assambler II Interrupciones (3/4)](https://www.youtube.com/watch?v=yHmN1IkOMjo&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=38&pp=iAQB)
- [Procesador Inten Asambler (4/4)](https://www.youtube.com/watch?v=7TzLDVMO8jE&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=39&pp=iAQB)
- [Ejercicios Complementarios Control de Flujo](https://www.youtube.com/watch?v=ei00SzlrtvA&list=PLnfu22OUNLKA4JOROay711pZN0WpZIYSi&index=40&pp=iAQB0gcJCa0JAYcqIYzv)

</details>

### Unidades

<details>
<summary><b>1. Sistemas de Numeración y Codificación</b> — _Semanas 1 a 3_</summary>

- [00 Codificación Numérica-Resueltos](Aula%20Cursado%20Especial/Archivos/1.%20Sistemas%20de%20Numeraci%C3%B3n%20y%20Codificaci%C3%B3n/00%20Codificaci%C3%B3n%20Num%C3%A9rica-Resueltos.pdf)
- [2025 - Guia Autoestudio Codificacion](Aula%20Cursado%20Especial/Archivos/1.%20Sistemas%20de%20Numeraci%C3%B3n%20y%20Codificaci%C3%B3n/2025%20-%20Guia%20Autoestudio%20Codificacion.pdf)
- [Codificación Ejercicios COmplementarios](Aula%20Cursado%20Especial/Archivos/1.%20Sistemas%20de%20Numeraci%C3%B3n%20y%20Codificaci%C3%B3n/Codificaci%C3%B3n%20Ejercicios%20COmplementarios.pdf)
- [Sist Numeracion y Codificacion 2018](Aula%20Cursado%20Especial/Archivos/1.%20Sistemas%20de%20Numeraci%C3%B3n%20y%20Codificaci%C3%B3n/Sist%20Numeracion%20y%20Codificacion%202018.pdf)
- [Sist Numeracion y Codificacion guia](Aula%20Cursado%20Especial/Archivos/1.%20Sistemas%20de%20Numeraci%C3%B3n%20y%20Codificaci%C3%B3n/Sist%20Numeracion%20y%20Codificacion%20guia.pdf)
- [Tabla ASCII-EBCDIC](Aula%20Cursado%20Especial/Archivos/1.%20Sistemas%20de%20Numeraci%C3%B3n%20y%20Codificaci%C3%B3n/Tabla%20ASCII-EBCDIC.pdf)

</details>

<details>
<summary><b>2. Algebra de Boole y Circuitos Combinacionales</b> — _Semana 4_</summary>

- [01-GuiaCombinacionales](Aula%20Cursado%20Especial/Archivos/2.%20Algebra%20de%20Boole%20y%20Circuitos%20Combinacionales/01-GuiaCombinacionales.pdf)
- [01IntroCombinacionales-Ej4](Aula%20Cursado%20Especial/Archivos/2.%20Algebra%20de%20Boole%20y%20Circuitos%20Combinacionales/01IntroCombinacionales-Ej4.pdf)
- [2023 GUIAS DE AUTOESTUDIO Logica](Aula%20Cursado%20Especial/Archivos/2.%20Algebra%20de%20Boole%20y%20Circuitos%20Combinacionales/2023%20GUIAS%20DE%20AUTOESTUDIO%20Logica.pdf)
- [Comparador de 4 bits](Aula%20Cursado%20Especial/Archivos/2.%20Algebra%20de%20Boole%20y%20Circuitos%20Combinacionales/Comparador%20de%204%20bits.pdf)
- [GUIA AUTOESTUDIO Funciones Logicas Parte II](Aula%20Cursado%20Especial/Archivos/2.%20Algebra%20de%20Boole%20y%20Circuitos%20Combinacionales/GUIA%20AUTOESTUDIO%20Funciones%20Logicas%20Parte%20II.pdf)
- [problemas-de-circuitos-digitales](Aula%20Cursado%20Especial/Archivos/2.%20Algebra%20de%20Boole%20y%20Circuitos%20Combinacionales/problemas-de-circuitos-digitales.pdf)
- [Video Resolución ejercicio 11. Comparador de 4 bits](https://drive.google.com/file/d/1GFWp-C5nn-bWs50dAUi_knfZ-R8OD5M3/view?usp=sharing)

</details>

<details>
<summary><b>3. Circuitos Secuenciales</b> — _Semanas 5 y 6_</summary>

- [02 Secuenciales-Ejecicio5 bis](Aula%20Cursado%20Especial/Archivos/3.%20Circuitos%20Secuenciales/02%20Secuenciales-Ejecicio5%20bis.pdf)
- [02 Secuenciales-Ejecicio5.pptx](Aula%20Cursado%20Especial/Archivos/3.%20Circuitos%20Secuenciales/02%20Secuenciales-Ejecicio5.pptx.pdf)
- [02-GuiaSecuenciales](Aula%20Cursado%20Especial/Archivos/3.%20Circuitos%20Secuenciales/02-GuiaSecuenciales.pdf)
- [Video Explicación Ejercicio 5 - Contador secuencial 3, 2, 9, 7, 1, 0, 8, 6 y repite](https://youtu.be/8FPMyRe-NH8)
- [Video Planteo de Ejercicios Secuenciales con Entrada en Serie (Ejercicios 9, 10, 11 y 12)](https://youtu.be/WNrSS4RMujA)
- [Video Planteo de Ejercicios Complementarios (Ejercicios 3 y 4)](https://youtu.be/32Nifrj8lrg)

</details>

<details>
<summary><b>4. ALU</b> — _Semanas 7 y 8_</summary>

- [03-Guia ALU](Aula%20Cursado%20Especial/Archivos/4.%20ALU/03-Guia%20ALU.pdf)
- [ALU-3SumQuinario-BCD](Aula%20Cursado%20Especial/Archivos/4.%20ALU/ALU-3SumQuinario-BCD.pdf)
- [ALU-Ejercicio5-Mini ALU](Aula%20Cursado%20Especial/Archivos/4.%20ALU/ALU-Ejercicio5-Mini%20ALU.pdf)
- [Carga Forzada](Aula%20Cursado%20Especial/Archivos/4.%20ALU/Carga%20Forzada.pdf)

</details>

<details>
<summary><b>5. Memoria Central</b> — _Semana 9_</summary>

- [04-Guia Memoria Central](Aula%20Cursado%20Especial/Archivos/5.%20Memoria%20Central/04-Guia%20Memoria%20Central.pdf)
- [04-IntroMC (1)](Aula%20Cursado%20Especial/Archivos/5.%20Memoria%20Central/04-IntroMC%20(1).pdf)
- [04-IntroMC](Aula%20Cursado%20Especial/Archivos/5.%20Memoria%20Central/04-IntroMC.pdf)

</details>

<details>
<summary><b>6. Unidad de Control</b> — _Semana 10_</summary>

- [05-GuiaUC](Aula%20Cursado%20Especial/Archivos/6.%20Unidad%20de%20Control/05-GuiaUC.pdf)
- [05-IntroUC](Aula%20Cursado%20Especial/Archivos/6.%20Unidad%20de%20Control/05-IntroUC%20(1).pdf)

</details>

<details>
<summary><b>7. Lenguaje de Máquina</b> — _Semanas 11 a 13_</summary>

- [06-GuiaLenguajeMaquina](Aula%20Cursado%20Especial/Archivos/7.%20Lenguaje%20de%20M%C3%A1quina/06-GuiaLenguajeMaquina.pdf)
- [06-IntroLengMaquina-05](Aula%20Cursado%20Especial/Archivos/7.%20Lenguaje%20de%20M%C3%A1quina/06-IntroLengMaquina-05.pdf)
- [06-IntroLengMaquina-Multi](Aula%20Cursado%20Especial/Archivos/7.%20Lenguaje%20de%20M%C3%A1quina/06-IntroLengMaquina-Multi.pdf)

</details>

<details>
<summary><b>8. Assembler</b> — _Semanas 14 a 16_</summary>

- [8086 Material Complementario-20260915](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/8086%20Material%20Complementario-20260915.zip)
- [Assembler Ejercicios Resueltos](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/Assembler%20Ejercicios%20Resueltos.pdf)
- [Ejemplos de Saltos (1)](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/Ejemplos%20de%20Saltos%20(1).zip)
- [Ejemplos de Saltos](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/Ejemplos%20de%20Saltos.zip)
- [EjerciciosResueltos basicos](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/EjerciciosResueltos_basicos.pdf)
- [Emu8086 Setup](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/Emu8086%20Setup%20(1).zip)
- [emu8086](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/emu8086.pdf)
- [Guia de TP Assembler](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/Guia%20de%20TP%20Assembler.pdf)
- [PartesProgramayModosDir](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/PartesProgramayModosDir%20(1).zip)
- [Presentacion 8086](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/Presentacion%208086.pdf)
- [RESUMEN DIRECTIVAS](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/RESUMEN%20DIRECTIVAS%20(1).xlsx)
- [RESUMEN instrucciones 8086](Aula%20Cursado%20Especial/Archivos/8.%20Assembler/RESUMEN%20instrucciones_8086.pdf)

</details>

### Recursos Extras

<details>
<summary><b>Apuntes de Teoría</b> — _Apuntes y resúmenes_</summary>

- [7acf5c64-2db7-499e-b425-e57d6c371065 Unidad III Unidad Aritmtico Lgica](Recursos%20Extras/Teoria/7acf5c64-2db7-499e-b425-e57d6c371065_Unidad_III_Unidad_Aritmtico_Lgica_.pdf)
- [8086 resumen propio](Recursos%20Extras/Teoria/8086%20resumen%20propio.pdf)
- [Apunte Arq de Comp (2019) - Nicolás Alegre](Recursos%20Extras/Teoria/Apunte%20Arq%20de%20Comp%20(2019)%20-%20Nicol%C3%A1s%20Alegre.pdf)
- [Apunte Arquitectura Aldo](Recursos%20Extras/Teoria/Apunte%20Arquitectura%20Aldo.pdf)
- [Apunte Arquitectura Black](Recursos%20Extras/Teoria/Apunte%20Arquitectura_Black.pdf)
- [Apunte Arquitectura](Recursos%20Extras/Teoria/Apunte%20Arquitectura.docx)
- [APUNTE TEORIA DEFINITIVO](Recursos%20Extras/Teoria/APUNTE%20TEORIA%20DEFINITIVO%20(1).pdf)
- [APUNTE TEORIA](Recursos%20Extras/Teoria/APUNTE%20TEORIA.docx)
- [ARQ FinalPractica Diciembre 2025](Recursos%20Extras/Teoria/ARQ_FinalPractica_Diciembre_2025.pdf)
- [Arquitectura - Teoria para final](Recursos%20Extras/Teoria/Arquitectura%20-%20Teoria%20para%20final.pdf)
- [ARQUITECTURA - TEORIA](Recursos%20Extras/Teoria/ARQUITECTURA%20-%20TEORIA.pdf)
- [Arquitectura 8086](Recursos%20Extras/Teoria/Arquitectura%208086.pdf)
- [mauro](Recursos%20Extras/Teoria/mauro.docx)
- [Nuevo documento de texto](Recursos%20Extras/Teoria/Nuevo%20documento%20de%20texto.txt)
- [Resumen final aco](Recursos%20Extras/Teoria/Resumen_final_aco.pdf)
- [ResumenArqui majoymartin](Recursos%20Extras/Teoria/ResumenArqui_majoymartin.pdf)
- [U1y2 NICO](Recursos%20Extras/Teoria/U1y2%20NICO.pdf)
- [U3 NICO](Recursos%20Extras/Teoria/U3%20NICO.pdf)

</details>

<details>
<summary><b>Finales y Parciales Resueltos</b> — _Exámenes resueltos_</summary>

- [1er parcial resuelto](Recursos%20Extras/Finales/1er%20parcial%20resuelto.pdf)
- [1er PARCIAL](Recursos%20Extras/Finales/1er_PARCIAL.pdf)
- [2do parcial resuelto](Recursos%20Extras/Finales/2do%20parcial%20resuelto%20(1).pdf)
- [3er parcial resuelto](Recursos%20Extras/Finales/3er%20parcial%20resuelto.pdf)
- [09. Compilado 1er parcial](Recursos%20Extras/Finales/09.%20Compilado%201er%20parcial.pdf)
- [EJ1 PARCIAL](Recursos%20Extras/Finales/EJ1_PARCIAL.pdf)
- [Ejercicio 2](Recursos%20Extras/Finales/Ejercicio%202.pdf)
- [EJERCICIO Alarma](Recursos%20Extras/Finales/EJERCICIO_Alarma.pdf)
- [Ejercicios de Examenes Finales - Arquitectura de Computadoras - By Geradem](Recursos%20Extras/Finales/Ejercicios%20de%20Examenes%20Finales%20-%20Arquitectura%20de%20Computadoras%20-%20By%20Geradem.pdf)
- [PHOTO-2026-02-09-17-45-26](Recursos%20Extras/Finales/PHOTO-2026-02-09-17-45-26.jpg)
- [PHOTO-2026-02-09-17-45-26(1)](Recursos%20Extras/Finales/PHOTO-2026-02-09-17-45-26(1).jpg)
- [PHOTO-2026-02-09-17-45-26(2)](Recursos%20Extras/Finales/PHOTO-2026-02-09-17-45-26(2).jpg)
- [PHOTO-2026-02-09-17-45-26(3)](Recursos%20Extras/Finales/PHOTO-2026-02-09-17-45-26(3).jpg)
- [PHOTO-2026-02-09-17-45-26(4)](Recursos%20Extras/Finales/PHOTO-2026-02-09-17-45-26(4).jpg)

</details>

<details>
<summary><b>Práctica Extra</b> — _Compilados y guías resueltas_</summary>

- [EJERCICIOS RESUELTOS DE SECUENCIALES](Recursos%20Extras/EJERCICIOS%20RESUELTOS%20DE%20SECUENCIALES.pdf)
- [Ejercicios LogicaCombinacional](Recursos%20Extras/Ejercicios_LogicaCombinacional.pdf)
- [GuiaPracticaResueltaArquitectura](Recursos%20Extras/GuiaPracticaResueltaArquitectura.pdf)
- [ranking temas 2019 a 2022](Recursos%20Extras/ranking%20temas%20%202019%20a%202022.pdf)

</details>
<!-- INDICE:FIN -->
