# Plan profesional · Lumbre Errante

> Para Claude Code. Guarda este archivo en `docs/PLAN-PROFESIONAL.md` del proyecto y empieza con:
> **"Lee docs/PLAN-PROFESIONAL.md y docs/PROGRESS.md. Ejecuta la Fase 1, tarea por tarea, y para al final de la fase para que la revise."**

## Contexto

- **Proyecto:** Lumbre Errante, una web demo de un restaurante ficticio. Cada plato se ve en 3D con relieve, se tocan los ingredientes para ver qué son y sus alérgenos, y los pedidos llegan a un panel de cocina.
- **Objetivo:** enseñársela a restaurantes reales para venderles el producto. Tiene que parecer un producto terminado, no un prototipo.
- **En producción:** https://restaurante-azure-ten.vercel.app
- **Rama:** `v2-demo`
- **Stack:** Next.js 16.4 (App Router), React 19, TypeScript, Tailwind v4, framer-motion, three, @react-three/fiber, drei, @google/model-viewer, transformers.js (Depth Anything V2 small y SlimSAM), zustand, zod, Supabase, Resend, Upstash Redis, vitest, eslint, Vercel.
- **Herramientas de la sesión:** plugins `frontend-design`, `ui-ux-pro-max`, `motion`, `21st`, `vercel` y `graphify` (ya existe `graphify-out/`). MCP `claude-in-chrome`, `motion` y `vercel`.

## Reglas de trabajo

1. **Trabaja fase a fase.** Al terminar cada fase, para y resume qué has cambiado, en qué archivos y qué falta.
2. **Antes de dar una fase por terminada:** `npm run lint`, `npm run build` y `npx vitest run` tienen que pasar.
3. **Verifica cada cambio visual con `claude-in-chrome`** a 390, 768 y 1440 px. No marques nada como hecho sin haberlo visto.
4. **Actualiza `docs/PROGRESS.md`** al cerrar cada tarea.
5. **No añadas dependencias nuevas** sin preguntar. Las que ya están instaladas bastan.
6. **No cambies la identidad de marca** (colores, tipografías, logo, textos) salvo que la tarea lo pida.
7. **Respeta `prefers-reduced-motion`** en todo lo que se mueva.
8. **Un commit por tarea**, con un mensaje claro en español.

---

## Fase 1: Pulido visual (sin fallos a la vista)

**Herramientas:** `ui-ux-pro-max`, `frontend-design`, `claude-in-chrome`

### 1.0 Auditoría inicial
- Con `ui-ux-pro-max` y `claude-in-chrome`, revisa la portada, la carta, la historia, las reservas, el contacto, `/cesta`, `/ra` y las páginas legales a 390, 768 y 1440 px.
- Entrega una lista de fallos ordenada por gravedad **antes de tocar nada** y suma a las tareas siguientes lo que encuentres.

### 1.1 Juntas visibles en la madera (verificado)
- **Causa:** la clase `.mesa` usa un SVG `feTurbulence` de `width='600'` que se repite en horizontal. `stitchTiles='stitch'` no oculta la unión, así que aparece un corte vertical cada 600 px (en x=600 y x=1200 a 1440 px de ancho).
- **Arreglo (probado en Chromium):**
  - Cambia el SVG a `width='2560'` y deja `height='600'`, `baseFrequency='0.004 0.11'` y lo demás igual.
  - En `.mesa`, añade:
    ```css
    background-repeat: repeat, no-repeat, repeat-y;
    background-position: center, center, center top;
    ```
    Las capas, en orden, son: luz cálida, viñeta y madera.
- **Hecho cuando:** no se ve ninguna junta vertical en la portada ni en la carta a 1440 y a 1920 px.

### 1.2 Portada en móvil
- A 390 px, la paella ocupa más que el ancho de la pantalla, se corta por los lados y el botón flotante "Quiero esto para mi restaurante" la tapa.
- Ajusta el tamaño del plato para que quepa entero con margen. En móvil, el botón flotante no debe tapar el plato ni la barra inferior; puede aparecer al hacer scroll o integrarse en otro sitio.
- Comprueba que el texto del hero no se corta durante la animación de entrada.
- **Hecho cuando:** a 390 px el plato se ve completo y nada se solapa.

### 1.3 Botón secundario de la portada
- En escritorio, "Reservar mesa" casi no se distingue como botón. Dale borde o fondo visible con buen contraste, coherente con "Ver carta".

### 1.4 Fotos de "Nuestra historia"
- Dos fotos son de un comedor oscuro de madera y la tercera de un salón blanco con manteles; no parecen el mismo local.
- Sustituye la tercera por una coherente con las otras (Wikimedia Commons, añadiendo el crédito en `/creditos`) o deja una sola foto principal.

### 1.5 Mapa de contacto
- Ahora es un esquema de cuadros. Haz un mapa ilustrado más trabajado con los colores de la marca, o quítalo y deja el horario y el contacto bien maquetados.

---

## Fase 2: Que funcione de verdad

**Herramientas:** Upstash Redis, Resend, zod

### 2.1 Pedidos en vivo en el panel de cocina
- Conecta Upstash Redis para que los pedidos de la cesta aparezcan en el panel sin recargar (polling corto o SSE).
- Los pedidos caducan a las 24 h. Mantén los límites por IP y los 3 pedidos de ejemplo cuando no haya pedidos reales.
- Si no hay variables de Upstash, la web tiene que seguir funcionando en modo demo, sin errores.
- **Entrega:** la lista de variables de entorno que tengo que poner en Vercel.

### 2.2 Validación
- Valida con zod en el servidor la cesta, las reservas y el contacto, con mensajes de error claros en español y bajo cada campo.

### 2.3 Confirmación de reserva por email (Resend)
- Al reservar, opcionalmente, se envía un email de confirmación con la marca. Si no hay `RESEND_API_KEY`, se omite sin romper nada.

### 2.4 Contacto real
- Configura `NEXT_PUBLIC_CONTACT` y comprueba que el botón de WhatsApp y el de "Quiero esto para mi restaurante" lo usan.

---

## Fase 3: Movimiento con intención

**Herramientas:** framer-motion, plugin y MCP `motion`

Solo estas tres animaciones. No añadas más.

### 3.1 Entrada de la portada
- El plato baja suavemente sobre la mesa al cargar y sale un vapor sutil (con canvas o CSS ligero). Esto cubre también la decoración pendiente.

### 3.2 Cambio de plato en la carta
- Transición fluida entre platos al deslizar o usar las flechas, sin saltos ni parpadeos del visor 3D.

### 3.3 Añadir a la cesta
- El plato "vuela" hasta el icono de la cesta y el contador hace un pequeño rebote.

**Hecho cuando:** las tres animaciones van a 60 fps en un móvil de gama media (prueba con la CPU ralentizada 4x en DevTools) y desaparecen con `prefers-reduced-motion`.

---

## Fase 4: El 3D como protagonista

**Herramientas:** three, @react-three/fiber, drei, model-viewer, el pipeline de transformers.js

### 4.1 Máscaras vacías
- Regenera las máscaras del perejil del hummus, la guindilla del ramen y la menta de la panna cotta. Si SlimSAM no las detecta, prueba con otros puntos o cajas de entrada.

### 4.2 Segmentación
- Revisa y corrige la de la pasta, el poke, el bibimbap, la césar y la panna cotta. Cada ingrediente que se pueda tocar tiene que corresponder a lo que se ve.

### 4.3 Presentación del plato
- Añade `ContactShadows` de drei bajo el plato y una iluminación cálida coherente con el concepto de "lumbre".

### 4.4 Carga diferida
- Carga el `Canvas` con `next/dynamic` y `ssr: false` solo cuando entra en pantalla (IntersectionObserver). Mientras tanto, muestra la foto plana del plato como sustituto, sin saltos de maquetación.

---

## Fase 5: Rendimiento y presentación

**Herramientas:** `claude-in-chrome`, plugin y MCP `vercel`

### 5.1 Lighthouse
- Pasa Lighthouse en móvil a `/`, `/cesta` y `/ra`.
- **Objetivo:** 90 o más en Rendimiento, Accesibilidad, Buenas prácticas y SEO.
- Identifica los bundles más pesados (three, transformers.js, model-viewer) y que cada uno se cargue solo en la ruta que lo usa. Optimiza las imágenes con `next/image`, tamaños correctos y AVIF/WebP.

### 5.2 Accesibilidad
- Foco visible en todos los controles, `aria-label` en los botones de icono (flechas, +, −, cesta), contraste AA y navegación con teclado por la carta y los ingredientes.

### 5.3 demo.gif
- Graba con `claude-in-chrome` un GIF de unos 15 s: tocar un ingrediente, ver los alérgenos, añadir a la cesta y ver llegar el pedido al panel de cocina. Guárdalo en `public/demo.gif` y enlázalo en el README.

### 5.4 Verificación final (Fase 9 de PROGRESS.md)
- Lint, build y tests en verde. Revisión en Chrome a los tres anchos. Despliegue en Vercel y comprobación en producción.
- Actualiza el README con capturas, el GIF, el stack y cómo ejecutarlo.

---

## Fuera de alcance por ahora
- Migrar los datos a Supabase. Se hará cuando un restaurante real lo pida.
- Dominio propio (lo configuro yo en Vercel cuando esté listo).
- Nuevas secciones o páginas.
