# Propuesta UX: carta 3D y realidad aumentada

Responde a `capturas/prompt_instruccion_claude.md`. Dice qué hace ya la web, qué se ha añadido ahora y qué falta.

## Punto de partida distinto al del prompt

La web no usa un visor incrustado de Sketchfab. Cada plato sale de una foto propia: `scripts/build-dishes-3d.mjs` genera mapa de color, de profundidad y de ingredientes, y el visor (`DishScene`) dibuja una malla con relieve en un canvas transparente. No se han descargado modelos de repositorios abiertos: tendrían licencias distintas y no encajarían con los doce platos de la carta. Para RA, cada plato tiene además un `plato.glb` en `public/dishes/<id>/`.

## 1. Arquitectura de la información

| Fase | Componente | Archivo |
|---|---|---|
| Descubrimiento | Fila de platos vistos desde arriba, con categorías y filtros | `experience/DishRail.tsx`, `Menu.tsx` |
| Interacción | Visor 3D con bolitas de ingredientes, ficha de alérgenos, zoom y giroscopio | `DishViewer.tsx`, `DishScene.tsx` |
| Proyección | Visor RA con model-viewer (WebXR, Scene Viewer y Quick Look) | `RaViewer.tsx`, ruta `/ra` |
| Compra | Barra de precio, botón de RA y cesta con vuelo del plato | `Menu.tsx`, `lib/flyToCart.ts` |

Flujo: se elige un plato en la fila (flechas, arrastre o clic) → "Ver plato" baja al visor con ese mismo plato → se tocan los ingredientes → "Ver en mi mesa" abre `/ra?plato=<id>` → se añade a la cesta.

Diferencia con el prompt: la fase de descubrimiento es una fila horizontal y no una cuadrícula. En móvil es un carrusel nativo con imán.

## 2. Especificaciones de UI

- **Fondo y luz:** visor sobre fondo oscuro cálido (`.mesa`, degradados de brasa sin texturas que se repitan). El canvas es transparente, así que el plato comparte la luz ambiental de la página y no parece un recuadro.
- **Paleta:** carbón `#15120f`, crema `#f3e9d8`, oro `#d4a24c`, terracota `#b04a26` en botones (contraste 5:1 con texto blanco).
- **Tipografías:** Fraunces para títulos, DM Sans para texto.
- **Botón de RA:** contorno crema, icono de cubo y etiqueta "1:1" en oro. Es secundario respecto a "Añadir a la cesta" para no competir con la compra, pero siempre visible junto al precio.
- **Escala:** el visor RA usa `ar-scale="fixed"`, así que el plato se proyecta a tamaño real. La etiqueta 1:1 lo anuncia antes de pulsar.
- **Hotspots:** bolitas sobre el plato; el cursor las rotula y el clic abre la ficha con ingredientes y alérgenos. Debajo hay una lista de botones con los mismos ingredientes, para teclado y lector de pantalla.
- **Cursor:** anillo que muestra "Ver" sobre los platos de la fila.

## 3. Carga sin pantallas en blanco

1. La fila usa `next/image` con `color.webp`, que ya está en caché cuando se abre el visor.
2. Mientras llegan los mapas del plato, el visor muestra esa misma foto desenfocada con un brillo de carga y el texto "Preparando el plato…". Al estar listo, la malla aparece en el mismo sitio.
3. Sin WebGL, o si falla, se queda la foto plana con las bolitas colocadas encima.
4. En `/ra` el esqueleto ocupa el sitio del visor hasta que model-viewer carga.

## 4. Guía de optimización

- **Peso actual:** 12 platos, 11 MB en total, entre 87 y 184 KB cada uno (webp + `plato.glb`). Ya cumple el objetivo de 1K-2K.
- **Carga diferida:** `DishScene` con `next/dynamic` y `ssr: false`; model-viewer solo se importa en `/ra`; Lenis y GSAP se cargan tras la primera pintura. Al cargar un plato se precarga el siguiente (`preloadDish`).
- **Pendiente:** cargar el canvas solo cuando entra en pantalla (IntersectionObserver) y pasar los `plato.glb` por compresión Draco o Meshopt.
- **Medición pendiente:** Lighthouse en móvil con GPU real. Las pruebas con Chrome sin cabeza dan rendimiento 26-58 porque el WebGL va por software.

## Qué se añadió con este documento

- Botón "Ver en mi mesa" con icono de cubo y etiqueta 1:1, en lugar del enlace de texto "Ver en RA".
- Carga con foto desenfocada en lugar del círculo gris pulsante.

## Qué no se ha hecho

- Cuadrícula de descubrimiento con imágenes estáticas. La fila de platos cumple ese papel.
- Compresión Draco/Meshopt de los `.glb`.
- Archivos `.usdz` propios. Quick Look en iOS convierte el `.glb` a través de model-viewer, pero no se ha probado en un iPhone.
