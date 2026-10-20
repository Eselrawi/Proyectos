# Progreso

Rama activa: `v3-wow` (rediseño, ver `docs/PROMPT-REDISENO.md` y `docs/PLAN-PROFESIONAL.md`). Antes: `v2-demo`. Retomar leyendo solo este archivo.

## Stack
- Next.js 16.4 (App Router, cacheComponents: datos de runtime dentro de `<Suspense>`), React, Tailwind v4, three + @react-three/fiber, zustand (cesta persistida), zod, vitest.
- Datos: `data/menu.json` (carta), `data/restaurant.json`, `data/theme.json`, `data/photo-sources.json`, `data/ambience-sources.json`, `data/annotations/<id>.json` (generado por `scripts/_annotations.mjs`), `data/dishes.json` (GENERADO por `npm run dishes`, no editar).
- Pipeline: `scripts/build-dishes-3d.mjs` (foto → color/depth/ids en `public/dishes/<id>/`). Depth Anything V2 small + SlimSAM en local.
- Pedidos/reservas: `src/lib/store.ts` (memoria; Upstash Redis REST si hay `UPSTASH_REDIS_REST_URL/TOKEN`), caducan a 24 h. Precios siempre del servidor (`priceItems`).
- Demo: `NEXT_PUBLIC_DEMO=true` → franja, `/panel/demo` abierto con 3 pedidos de ejemplo, sin emails.

## Fases
- [x] 0 Reconocimiento
- [x] 1 Marca (Lumbre Errante) y contenido
- [x] 3 Pipeline foto a 3D (12 platos, 87-184 KB cada uno)
- [x] 4 Visor 3D (malla con desplazamiento, mapa de ids, fallback sin WebGL)
- [x] 5 Web completa (portada, carta, historia, reservas, contacto, legal, créditos, QR)
- [~] 2 Auditoría: build, tsc, lint y tests OK; falta pasada visual en Chrome (extensión desconectada)
- [~] 6 Decoración: brasas en el hero, parallax, aparición al scroll, inclinación 3D, barra de scroll, visor RA (/ra, QR en /qr); faltan cubiertos y vapor
- [~] 7 Modo demo (hecho: franja, panel, límites, zod, tests, PWA, QR; falta Lighthouse)
- [~] 8 Publicado en https://restaurante-azure-ten.vercel.app (demo, sin Upstash); hecho marketing/mensaje.md; falta demo.gif (necesita Chrome)
- [ ] 9 Verificación final

## Notas
- Context7 MCP da timeout al conectar.
- Sin clave de Pexels: fotos de Wikimedia Commons (CC0 / CC BY-SA, créditos en `/creditos` y `CREDITS.md`).
- Vercel requiere login (`! vercel login`) y, para el efecto "pedido en vivo", Upstash Redis (Marketplace).
- `legacy/`: pipeline y texturas procedurales antiguas (excluidos de tsconfig y eslint).

## No corregido / pendiente
- Segmentación aproximada en pasta, poke, bibimbap, césar, panna cotta (revisar en `/dev/review`).
- Perejil del hummus, guindilla del ramen y menta de la panna cotta: máscara vacía, omitidos de la ficha.
- Contacto del botón "Quiero esto": marcador de posición hasta recibir email/WhatsApp (`NEXT_PUBLIC_CONTACT`).

## Rediseño (rama v3-wow)
- [x] Paso 0 plan aprobado
- [x] Bloque 2 selector horizontal: `components/experience/DishRail.tsx` (escritorio: sección fijada con GSAP, arrastre, flechas y teclado; móvil: carrusel nativo). Sustituye a la galería y al carrusel de la carta. Platos inclinados según la velocidad.
- [x] Bolitas de ingrediente sobre el plato 3D (hover = nombre, clic = ficha), proyectadas fuera del Canvas (drei Html daba error con React 19).
- [x] Madera sin juntas (SVG 2560 px, plan 1.1)
- [x] Plan 1.2-1.5 (sin verificar en Chrome, extensión desconectada): plato del hero al 86 % en móvil, botón "Quiero esto" aparece tras la portada, `btn-linea` con borde y fondo, historia con 2 fotos (crédito de la 3 quitado), mapa SVG mejorado
- [x] Plato vuela a la cesta (`lib/flyToCart.ts`, `data-cart` en la cabecera)
- [x] Cursor con etiqueta "Ver" (`data-cursor`)
- [x] Lighthouse móvil (headless, WebGL por software, rendimiento no fiable): `/ra` 43/100/100/100, `/cesta` 58/98/100/100, `/` 26/97/100/100. Arreglado: contraste de `btn-terra`, `<main>` en `/cesta`, Lenis y GSAP cargados con import dinámico. Falta medir rendimiento con GPU real
- [ ] Bloque 3 transición al visor (layoutId)
- [x] Bloque 1 intro provisional (`experience/Intro.tsx`): llama, cámara baja, título letra a letra, botón Saltar intro; sin vídeo, con `prefers-reduced-motion` no se muestra. Falta la versión con vídeo de IA (necesita cuenta del usuario)
- [x] Fila de platos sin scroll-scrub: solo flechas, teclado, clic y arrastre; Ver plato abre el seleccionado
- [x] Fondo `.mesa` nuevo: degradados cálidos sin textura repetida (adiós a las juntas de la madera)
- [ ] Bloque 4 pulido (cursor "Ver/Tocar", clip-path en fotos, cortina entre páginas, plato vuela a la cesta)
- [ ] Plan profesional: fases 1.2-1.5, 2, 4, 5

## Decisiones
- Dependencias añadidas: lenis, gsap, motion (sustituye a framer-motion), postprocessing y @react-three/postprocessing (bloom de las brasas).
- `lib/motion.ts` (curvas y duraciones) y `lib/smooth.ts` (Lenis compartido).
- Pendiente: desbordamiento horizontal de 18 px en móvil (revisar en 1.2); probar con emulación real, el redimensionado de ventana no cambia el ancho del viewport.

## Platos escaneados (rama v3-wow)
- Los 12 platos son escaneos 3D reales de Sketchfab (CC BY), no relieve de una foto. Carta nueva en `data/menu.json` (ingredientes con `position`/`normal` sobre el modelo). Créditos en `/creditos`.
- Pipeline: `scripts/scans.mjs` (lista y autores) → `fetch-scans.mjs` (usa `SKETCHFAB_TOKEN` de `.env.local`) → `optimize-scans.mjs` (gltf-transform vía npx: ~60k caras, WebP 1K) → `public/scans/<id>.glb`. Pósters cenitales `public/scans/<id>.webp` sacados con `/dev/scans` (solo desarrollo).
- Visor: `DishViewer.tsx` con model-viewer y hotspots por ingrediente. `DishScene`, `dishAssets` y la revisión de máscaras pasaron a `legacy/src/`. `public/dishes/` ya no se usa.
- Descartados: paella (el único escaneo bueno pesa 100 MB y no se deja simplificar), bibimbap (texturas rotas), tartaleta (plato con agujeros). El modelo de "Plato de comida" de D3D que propuso el usuario no es descargable.
- Pendiente: probar RA en un móvil real, revisar a 390 px, medir Lighthouse con GPU real, borrar `public/dishes/` si se confirma.

## Pulido final y legal
- Pósters renombrados a `<id>-poster.webp` (la caché del navegador servía los recortados). Intro con corona de platos y "Desliza" centrado.
- La rueda sobre el visor 3D ya no desplaza la página ni hace zoom; el zoom va con los botones + y −.
- Ingredientes revisados con `/dev/platos` (solo desarrollo): fuera tablas y platos como ingrediente, añadida la carne de la hamburguesa.
- "Nuestra historia" sustituida por "Qué ofrezco" (`Offer.tsx`): funciones del servicio, pasos y botón de contacto.
- Legal: aviso legal con propiedad intelectual y uso permitido, privacidad conforme a RGPD/LOPDGDD, cookies, `LICENSE` (todos los derechos reservados, `UNLICENSED` en package.json), cabeceras de seguridad y copyright en el pie.
- Datos del titular por variables de entorno: `NEXT_PUBLIC_OWNER_NAME` y `NEXT_PUBLIC_CONTACT` (`src/lib/owner.ts`).
