# Lumbre Errante

Web de un restaurante ficticio para enseñar a otros restaurantes qué se puede hacer con su carta: cada plato se ve desde arriba, en relieve, y cada ingrediente se puede tocar para ver qué es, de qué está hecha la salsa y sus alérgenos. Los pedidos llegan a un panel de cocina.

Todo es inventado (local, precios, reservas). Las fotos son reales, de Wikimedia Commons, con sus créditos en `/creditos`.

- Demo: https://restaurante-azure-ten.vercel.app
- Captura: _pendiente de añadir_

## Qué incluye

- Carta con platos en relieve 3D: una sola malla con desplazamiento por mapa de profundidad, y lectura del ingrediente bajo el dedo o el cursor.
- Intro y efectos de escena con Three.js (React Three Fiber, drei, postprocessing), animaciones con Motion y GSAP, scroll suave con Lenis.
- Versión móvil propia de la portada.
- Cesta y pedidos, reservas y panel de cocina (`/panel/demo`).
- Códigos QR por mesa (`/qr`, `/mesa/[n]`).
- Páginas legales, cookies y créditos de las fotos.
- Modo demo con datos que caducan a las 24 h.

## Tecnologías

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Three.js, Motion, GSAP, Lenis, Zustand, Zod, Vitest. Pedidos por email con Resend y almacén en Upstash Redis (solo fuera de demo y en Vercel). El tratamiento de las fotos usa transformers.js en local (Depth Anything V2 small y SlimSAM).

## Ejecutarlo

```powershell
npm install
copy .env.example .env.local
npm run dev
```

- Web: http://localhost:3000
- Panel de cocina de la demo: http://localhost:3000/panel/demo (con `NEXT_PUBLIC_DEMO=true`)
- QR imprimibles: http://localhost:3000/qr

Otros comandos: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` (carrito y totales).

## Cómo funciona un plato

1. Foto cenital en `data/photos/<id>.jpg` (si no existe, se descarga la elegida en `data/photo-sources.json`).
2. Se recorta el plato y se estima la profundidad.
3. Los puntos de `scripts/_annotations.mjs` indican dónde está cada ingrediente; SlimSAM saca la máscara y se guarda un mapa de ids.
4. El visor dibuja la malla y lee el id del píxel tocado.

Salida en `public/dishes/<id>/` (`color.webp`, `depth.webp`, `ids.png`).

### Añadir un plato nuevo

1. Añádelo a `data/menu.json` (nombre, país, precio, categoría).
2. Pon su foto en `data/photos/<id>.jpg`.
3. Mira la foto con la cuadrícula (`node scripts/grid-preview.mjs <carpeta> <id>`), apunta los ingredientes y sus puntos en `scripts/_annotations.mjs` y ejecuta `node scripts/_annotations.mjs`.
4. `npm run dishes <id>` y revisa el resultado en `/dev/platos` (solo en local).

## Modo demo

Con `NEXT_PUBLIC_DEMO=true`: franja «Demo · Restaurante ficticio», panel abierto en `/panel/demo` con tres pedidos de ejemplo, pedidos y reservas que se borran a las 24 h, ningún email real y un límite de pedidos por IP.

En Vercel hace falta un almacén compartido: añade Upstash Redis desde el Marketplace y las variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Sin él, cada instancia guarda los pedidos en su propia memoria y el panel puede no verlos.

La contraseña de `/admin` fuera de demo es `ADMIN_PASSWORD` (por defecto `demo`). Es una protección básica pensada para la demo; cámbiala antes de usarlo en serio.

## Aviso

Precios, ingredientes y alérgenos son de ejemplo. Un restaurante real tiene que revisarlos antes de publicar la carta.

## Autor

Raúl Gómez. Desarrollado con ayuda de Claude Code.
