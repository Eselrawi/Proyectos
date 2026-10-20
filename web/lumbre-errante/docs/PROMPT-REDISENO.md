# Rediseño premium · Lumbre Errante

> Para Claude Code. Guarda este archivo en `docs/PROMPT-REDISENO.md` y pégale:
> **"Lee docs/PROMPT-REDISENO.md, docs/PLAN-PROFESIONAL.md y docs/PROGRESS.md. Empieza por el paso 0 y para al final de cada bloque para que lo revise."**

---

## Tu papel

Eres el director creativo y el desarrollador front-end principal de un estudio que gana premios en Awwwards. Tienes que llevar Lumbre Errante del nivel "demo bien hecha" al nivel "Site of the Day". La web la verán dueños de restaurantes que deciden en 10 segundos si la quieren: la primera impresión lo es todo.

Usa los plugins `frontend-design`, `ui-ux-pro-max` y `motion` para las decisiones de diseño y movimiento, y `claude-in-chrome` para verificar cada bloque visualmente.

## Cómo trabajamos juntos (importante)

Soy quien está delante del ordenador y no soy experto. **Guíame tú.** Cada vez que necesites algo de mí (iniciar sesión, elegir entre opciones, aprobar un gasto, revisar algo en pantalla), para y escríbelo así, siempre con este formato:

```
🙋 NECESITO DE TI
Qué: <lo que tengo que hacer, en una frase>
Cómo: <pasos numerados, sencillos y concretos>
Por qué: <para qué sirve, en una frase>
Avísame con: "<la frase exacta que te tengo que escribir cuando acabe>"
```

- **Nunca des por hecho que he hecho algo:** espera a que te lo confirme.
- Al terminar cada bloque, dime en 3-5 líneas qué ha cambiado, qué tengo que mirar en el navegador y qué viene después.
- Si algo falla, explícamelo sin tecnicismos y dame la solución, no solo el error.
- **Pide siempre mi confirmación antes de:** gastar créditos o dinero, instalar dependencias que no estén permitidas aquí, borrar archivos o hacer push y desplegar en Vercel.

## Qué es el proyecto (no lo rompas)

Lumbre Errante es un restaurante ficticio de cocina del mundo en Madrid. Tiene 12 platos de 6 países. Cada plato se ve desde arriba en 3D (relieve) y al tocar un ingrediente se ve qué es y sus alérgenos. Hay cesta, panel de cocina, reservas, realidad aumentada en `/ra`, códigos QR y una PWA.

**Todo esto tiene que seguir funcionando igual.** El rediseño cambia cómo se ve y cómo se mueve, no lo que hace.

Stack actual: Next.js 16.4 (App Router), React 19, TypeScript, Tailwind v4, framer-motion, three, @react-three/fiber, drei y zustand.

## Referencias (inspírate en la técnica, no copies el diseño)

1. **Qissa** (qissa.co.uk)
   - Platos vistos desde arriba en una **fila horizontal que se desliza**, con varios en pantalla a la vez, sobre un fondo oscuro.
   - Un ritmo muy pausado: mucho aire entre secciones y una sola idea por pantalla.
   - Títulos serif con una palabra destacada en el color de acento.
2. **Gourou Indian Food** (Honorable Mention en Awwwards)
   - Cada plato tiene su propia ficha con identidad y color.
   - Cintas de texto en movimiento (marquee), titulares enormes y un pie de página con personalidad.
3. **Fix Chocolatier**
   - Una **intro cinematográfica** antes de la web y después un selector para ir **eligiendo entre varios productos**.

## La experiencia que quiero

### Bloque 1: Intro cinematográfica (scroll-scrub)
- Pantalla oscura. Se enciende una lumbre, la cámara baja despacio hasta la mesa de madera y aparece "Lumbre Errante".
- **Técnica:** una secuencia de fotogramas (WebP, 120-180 frames) dibujada en un `<canvas>` y sincronizada con el scroll, al estilo Apple. La sección queda fija (*sticky*) mientras dura la secuencia.
- Los fotogramas saldrán de un vídeo que **generas tú con `claude-in-chrome`** en una IA de vídeo (ver el anexo) y que acaba en `assets/intro.mp4`.
  - Crea un script `scripts/extract-frames.mjs` que, con ffmpeg, saque los fotogramas a `public/intro/` en dos tamaños: 1920 px para escritorio y 960 px para móvil.
  - **Mientras no exista el vídeo**, haz una intro provisional con el logo, el brillo de las brasas y el nombre animados, para no bloquear el resto del trabajo.
- Precarga los primeros 10 frames para que se vean al instante y el resto de forma progresiva. Muestra una barra de carga mínima con el estilo de la marca.
- Añade un botón "Saltar intro" visible.
- **Con `prefers-reduced-motion`:** se muestra un único fotograma final, sin secuencia.
- **En móvil:** menos frames y más pequeños. La intro no debe pesar más de 4 MB en total.

### Bloque 2: Selector horizontal de platos
- Al terminar la intro, los 12 platos aparecen en fila sobre la mesa de madera, vistos desde arriba.
- **Desplazamiento lateral:** con el scroll vertical (scroll horizontal fijado), con arrastre o swipe en móvil y con las flechas del teclado.
- El plato del centro se ve más grande y nítido, con el nombre, el país y el precio. Los de los lados, más pequeños y con menos brillo.
- Los platos rotan ligeramente según la velocidad del desplazamiento, como si se deslizaran sobre la mesa.
- Las mismas categorías y filtros de ahora (Entrantes, Principales, Vegano, Sin gluten...) reordenan la fila con una animación.

### Bloque 3: Transición al visor 3D
- Al hacer clic en un plato, este **crece y se desplaza hasta la posición del visor 3D sin cortes** (shared layout: `layoutId` de framer-motion o FLIP).
- El visor 3D actual, con los ingredientes que se tocan, aparece justo donde aterriza el plato.
- Al cerrar, el plato vuelve a su sitio en la fila.

### Bloque 4: Detalle y pulido en el resto de la web
- **Scroll suave** en toda la web con Lenis.
- **Titulares** que entran por líneas o palabras (máscara con translateY), solo una vez.
- **Una cinta de texto** entre secciones con los países de la carta: "Líbano · Japón · México · Corea · Italia · España".
- **Fotos de "Historia"** con un parallax sutil y un efecto de revelado (clip-path) al entrar en pantalla.
- **Cursor personalizado** en escritorio: un círculo pequeño que crece y dice "Ver" o "Tocar" sobre los platos e ingredientes. Nada de esto en táctil.
- **Vapor** sobre el plato activo, muy sutil, con canvas o un shader ligero.
- **Microinteracciones:** botones magnéticos en los CTA principales, el plato que "vuela" a la cesta al añadirlo y el contador que rebota.
- **Transiciones entre páginas** (`/`, `/cesta`, `/ra`, legales) con un fundido o una cortina de color de la marca.

## Reglas de dirección de arte
- Mantén la identidad: madera oscura, lumbre, dorado cálido y las tipografías actuales. Puedes refinar los tamaños, el espaciado y la jerarquía.
- **Una idea fuerte por pantalla.** Si hay que elegir, quita en lugar de añadir.
- Easing coherente en toda la web: define 2 o 3 curvas y duraciones en un único archivo `lib/motion.ts` y úsalas siempre.
- Nada de animaciones porque sí: cada una tiene que guiar la vista o dar respuesta a una acción.
- El texto se lee siempre bien: contraste AA y nunca encima de una zona con mucho detalle.

## Reglas técnicas
- **Dependencias nuevas permitidas:** `lenis` y `gsap` (con ScrollTrigger). Pregunta antes de añadir cualquier otra.
- framer-motion para la interfaz y las transiciones de layout, y GSAP con ScrollTrigger para todo lo que va ligado al scroll. Que no controlen los dos el mismo elemento.
- Todo lo pesado (three, la secuencia de la intro, transformers.js) se carga de forma diferida, solo cuando hace falta.
- Escribe los componentes nuevos en `components/experience/`, separados y reutilizables.
- **Rendimiento:** 60 fps en el selector y en la intro, probado con la CPU ralentizada 4x en DevTools. LCP por debajo de 2,5 s en móvil. Lighthouse móvil de 85 o más en rendimiento y de 95 o más en accesibilidad.
- **Accesibilidad:** todo se puede usar con teclado, el foco siempre es visible, `aria-label` en los controles de icono y `prefers-reduced-motion` respetado en cada animación.
- **Antes de cerrar cada bloque:** `npm run lint`, `npm run build` y `npx vitest run` en verde, y capturas con `claude-in-chrome` a 390, 768 y 1440 px.
- Un commit por bloque y `docs/PROGRESS.md` actualizado.

## Orden de trabajo
- **Paso 0:** lee el código, localiza la portada, la carta y el visor, y propón en 10-15 líneas cómo vas a encajar los bloques. **Espera a que lo apruebe.**
- **Paso 1:** Bloque 2 (selector horizontal), porque es la base.
- **Paso 2:** Bloque 3 (transición al visor).
- **Paso 3:** Bloque 1 (intro), primero con la versión provisional. Después, genera el vídeo real siguiendo el anexo.
- **Paso 4:** Bloque 4 (pulido).
- **Paso 5:** revisión final completa con `claude-in-chrome`, Lighthouse y un GIF de demostración en `public/demo.gif`.

---

## Anexo: generar el vídeo de la intro con claude-in-chrome

Este paso lo haces tú controlando mi Chrome con `claude-in-chrome`. Yo solo inicio sesión, confirmo los gastos y elijo el vídeo.

### Proceso
1. **Prepara antes de abrir el navegador:**
   - Una imagen de referencia: haz una captura de la madera de la web a 1920×1080 y guárdala en `assets/ref-mesa.png`.
   - Las carpetas `assets/` y `assets/intro-candidates/`.
2. **Pregúntame qué servicio uso** (Google Flow/Veo, Kling, Runway u otro) y si ya tengo cuenta. Si no la tengo, dime con un bloque 🙋 NECESITO DE TI cómo crearla.
3. **Abre el servicio en una pestaña nueva** (no toques mis otras pestañas). Si pide iniciar sesión, para y pídemelo con un bloque 🙋. **Nunca escribas tú contraseñas ni datos de pago.**
4. **Antes de generar,** dime cuántos créditos cuesta cada vídeo y cuántos me quedan, y **espera a mi "Sí, genera"**.
5. **Genera como máximo 3 versiones en 16:9** con el prompt de abajo y la imagen de referencia si el servicio lo permite. Después, **1 versión en 9:16** para móvil.
6. **Cuando estén listas,** dime con un bloque 🙋 que las revise en la pestaña y cuál elijo. No elijas tú.
7. **Descarga la elegida** y muévela a `assets/intro.mp4` (y `assets/intro-mobile.mp4`). Si el navegador la guarda en Descargas, busca el archivo más reciente con extensión `.mp4` y muévelo tú.
8. **Ejecuta `scripts/extract-frames.mjs`,** conecta la intro real, comprueba el resultado con `claude-in-chrome` en `localhost` y enséñamelo.
9. **Si algo se atasca** (la web ha cambiado, un captcha o un error), para y dímelo con un bloque 🙋, sin insistir en bucle.

### Prompt para la IA de vídeo

> Cinematic overhead shot, dark rustic wooden restaurant table at night. It starts in near darkness; a small warm flame ignites at the center and gently grows, casting flickering amber light across the wood grain. The camera slowly descends from high above toward the table surface in one smooth, continuous move with no cuts. Subtle embers float upward, faint steam drifts through the light. Warm palette: deep browns, amber, gold, black. Shallow depth of field, photorealistic, 35mm film look, soft volumetric light. The final frame is a clean, evenly lit top-down view of the empty wooden table, leaving the center free for content. 5 seconds, 24 fps, 16:9, no text, no people, no logos.

**Qué revisar al elegir (díselo así cuando me pidas elegir):**
- Que la cámara baje de forma fluida, sin saltos.
- Que nada se deforme (ni la madera ni la llama).
- Que el último fotograma se parezca a la madera de la web, para que el paso de la intro a la web no se note.
