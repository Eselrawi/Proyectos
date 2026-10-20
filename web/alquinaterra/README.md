# Alquinaterra · web (React + Three.js)

Maqueta para enseñar al cliente el nivel visual.

**Concepto:** un gran árbol fotorrealista que se recorre bajando con el scroll.
Copa = portada · 6 ramas (4 categorías, reseñas, horario), cada una con su "fruto" 3D ·
pie del árbol = ubicación y contacto. Cielo fotográfico (HDRI) con nubes; en modo oscuro, atardecer.

**Stack:** Vite · React 19 · React Three Fiber + drei + postprocessing · GSAP + ScrollTrigger · Lenis.
Versiones anteriores: `legacy-vanilla/` (HTML sin compilar) y `legacy-react-v1/` (React, diseño por secciones).

## Comandos

```bash
npm install
npm run dev            # desarrollo en http://localhost:5173
npm run build          # producción → dist/  (lo que se sube a Vercel)
npm run preview        # probar dist/ en local
npm run build:single   # todo en un bloque con imágenes incrustadas → dist-single/
```

## Desplegar en Vercel

1. Subir esta carpeta a un repositorio de GitHub.
2. En Vercel: *Add New → Project*, importar el repo. Detecta Vite solo
   (build `npm run build`, salida `dist`). No hace falta configurar nada más.

## Estructura

```
index.html                    Metadatos, Open Graph, JSON-LD, fuentes
src/data/business.js          TODOS los datos y textos, marcados [REAL]/[EJEMPLO]/[PENDIENTE]/[PRUEBA]
src/three/TreeScene.jsx       El árbol: tronco, copa, ramas, frutos, raíces, cámara que baja
src/lib/scrollStore.js        Posición en el recorrido (compartida entre el DOM y el 3D)
src/components/Sections.jsx   Contenido de cada parada (copa, ramas, reseñas, horario, raíces)
src/components/Stop.jsx       Parada fija en pantalla mientras la cámara se detiene + títulos letra a letra
src/components/DepthNav.jsx   Indicador lateral de altura (escritorio)
src/styles/main.css           Tokens, modo claro/oscuro, cielo azul→tierra, tarjetas
src/assets/tree/              Recursos del árbol: hi/ (ordenador) y lo/ (móvil), cielos HDR, imágenes
                              de carga (poster-*), meta.json. Fuentes y licencias en LEEME.txt
tools/build_assets.py         Regenera los recursos a partir de las fuentes CC0
src/assets/img/prueba/        ⚠ Fotos de PRUEBA (Unsplash), ver LEEME.txt
```

## Cómo funciona

- Cada parada es una sección de 175vh con la tarjeta fija (sticky). Mientras está fija, la cámara
  se queda en su rama; entre paradas baja en hélice alrededor del tronco, en contrapicado
  (mirando hacia arriba, como la foto de referencia). El árbol está quieto y la cámara lo rodea,
  así que el cielo, el sol y el suelo se mueven con paralaje real.
- Frutos: espiga (alimentación), frasco ámbar (cosmética), cápsulas (suplementos),
  farolillo (asesoramiento), estrellas (reseñas), cartel (horario), pin dorado (contacto).
- Encuadre automático: si el producto de la rama activa quedaría bajo la tarjeta de texto o fuera
  de la pantalla, la cámara se desplaza lo justo para dejarlo a la vista (ordenador y móvil).

### El árbol (src/three/TreeScene.jsx)

- **Tronco maduro**: sección irregular que cambia con la altura, contrafuertes que se abren hacia
  7 raíces superficiales, 9 nudos y relieve real a dos escalas desplazado desde el mapa de altura
  de la corteza (hasta 460×200 segmentos en ordenador). Material PBR: color, normales, oclusión
  y rugosidad (Poly Haven "Bark Willow 02", retocada hacia la paleta de la foto).
- **Ramas y copa**: generadas de forma recursiva (rama → ramitas → hojas), fusionadas en una malla.
- **Muñones cortados** con madera de anillos y grietas, de los que rebrotan hojas tiernas (como en la foto).
- **Hojas fotografiadas** (ambientCG LeafSet023/024): atlas de 16 hojas distintas, curvadas, con
  normales, translucidez a contraluz, variación de tono y oclusión en el interior de la copa;
  la brisa las mueve en el shader. Proyectan sombras recortadas con su silueta.
- **Luz**: cielo HDRI fotográfico como fondo y luz ambiental, sol direccional alineado con el sol
  del HDRI, sombras suaves que siguen a la zona visible, niebla del color del horizonte.
- **Acabado fotográfico** (solo ordenador): oclusión ambiental N8AO, tone mapping neutro,
  leve desaturación y contraste, viñeta y grano fino.

### Rendimiento y respaldo

- La escena se descarga aparte tras el primer pintado. Mientras carga se ve una imagen fija del
  mismo árbol (poster-*, por tema y tamaño): nunca aparece en blanco. Sin WebGL se queda esa imagen.
- Móvil: texturas 1K, menos hojas y segmentos, sin sombras dinámicas ni postprocesado.
- `PerformanceMonitor`: si faltan fps, primero quita la oclusión, luego el resto del
  postprocesado y por último baja la resolución.
- "Reducir movimiento": la cámara salta entre paradas sin animación, sin brisa ni hojas que caen.
- Peso: ~7 MB de texturas + 1,4 MB de cielo HDR en ordenador; ~1,6 MB + 1,4 MB en móvil.

### Comprobar el resultado real

`npm run build && npm run preview` y abrir http://localhost:4173 en el ordenador y en el móvil
(misma red: `npm run preview -- --host`). Para pruebas en equipos sin GPU existen los
parámetros `?dpr=0.6` y `?fx=0` (resolución y postprocesado); no afectan a la web normal.

Para cambiar o añadir una rama: editar `branches` en `src/data/business.js` y, si cambia el número,
`BRANCH_Y` en `src/three/TreeScene.jsx`.

## Qué es real y qué no

**Real y verificado:** nombre, categoría, dirección, teléfono, 4,7★ / 60 reseñas en Google,
Instagram @alquinaterra, categorías de producto.

**Ejemplo (revisar con el cliente):** frase del hero, descripciones de categorías, meta description.

**Prueba:** las 3 fotos de la galería (Unsplash, no son de la tienda). Llevan sello y crédito en el footer.

**Pendiente del cliente:**
- [ ] Logo definitivo · [ ] Fotos reales (interior, producto, fachada)
- [ ] Horario (y entonces añadir `openingHours` al JSON-LD)
- [ ] Móvil con WhatsApp (`whatsapp` en `src/data/business.js` activa el botón)
- [ ] Razón social, NIF y email para el aviso legal
- [ ] Dominio (canonical, og:image absoluta, `url` del JSON-LD)
- [ ] Place ID de Google para el enlace directo "Dejar reseña"

Sin afirmaciones médicas ni promesas de resultados.
