import * as THREE from "three";
import type { Dish } from "./types";

export interface DishAssets {
  id: string;
  color: THREE.Texture;
  depth: THREE.Texture;
  normal: THREE.Texture;
  ids: Uint8Array; // N*N, 0 = plato/fondo, k = ingrediente k (1-based)
  size: number;
  centroids: Record<number, [number, number]>; // 0-1, origen arriba-izquierda
  small: Uint8ClampedArray; // color 256x256 RGBA (origen arriba-izquierda) para afinar las máscaras
  dispose: () => void;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("no se pudo cargar " + src));
    i.src = src;
  });

const readPixels = (img: HTMLImageElement) => {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return { c, ctx, data: ctx.getImageData(0, 0, c.width, c.height) };
};

function normalFromDepth(depth: Uint8ClampedArray, n: number, strength: number) {
  const out = new Uint8ClampedArray(n * n * 4);
  const h = (x: number, y: number) => depth[(Math.min(n - 1, Math.max(0, y)) * n + Math.min(n - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = ((n - 1 - y) * n + x) * 4; // filas invertidas: v=1 es la fila superior de la imagen
      out[i] = (-dx / l) * 127.5 + 127.5;
      out[i + 1] = (dy / l) * 127.5 + 127.5;
      out[i + 2] = (1 / l) * 127.5 + 127.5;
      out[i + 3] = 255;
    }
  return out;
}

const cache = new Map<string, Promise<DishAssets>>();

async function load(dish: Dish): Promise<DishAssets> {
  const [ci, di, ii] = await Promise.all([loadImage(dish.assets.color), loadImage(dish.assets.depth), loadImage(dish.assets.ids)]);

  const color = new THREE.Texture(ci);
  color.colorSpace = THREE.SRGBColorSpace;
  color.anisotropy = 4;
  color.needsUpdate = true;

  const dp = readPixels(di);
  const n = dp.c.width;
  const depth = new THREE.CanvasTexture(dp.c);
  depth.colorSpace = THREE.NoColorSpace;

  const nm = new THREE.DataTexture(normalFromDepth(dp.data.data, n, 3), n, n, THREE.RGBAFormat);
  nm.flipY = false;
  nm.generateMipmaps = true;
  nm.minFilter = THREE.LinearMipmapLinearFilter;
  nm.magFilter = THREE.LinearFilter;
  nm.needsUpdate = true;

  const ip = readPixels(ii);
  const size = ip.c.width;
  const ids = new Uint8Array(size * size);
  const sum: Record<number, [number, number, number]> = {};
  for (let i = 0; i < ids.length; i++) {
    const v = ip.data.data[i * 4];
    ids[i] = v;
    if (v) {
      const s = (sum[v] ??= [0, 0, 0]);
      s[0] += i % size;
      s[1] += Math.floor(i / size);
      s[2]++;
    }
  }
  const centroids: Record<number, [number, number]> = {};
  for (const [k, s] of Object.entries(sum)) centroids[+k] = [s[0] / s[2] / size, s[1] / s[2] / size];

  const sc = document.createElement("canvas");
  sc.width = sc.height = 256;
  const sg = sc.getContext("2d", { willReadFrequently: true })!;
  sg.drawImage(ci, 0, 0, 256, 256);
  const small = sg.getImageData(0, 0, 256, 256).data;

  return {
    id: dish.id, color, depth, normal: nm, ids, size, centroids, small,
    dispose: () => { color.dispose(); depth.dispose(); nm.dispose(); },
  };
}

const MAX = 4;

/** Carga (con caché LRU de 4 platos; los expulsados se liberan de la GPU). */
export function loadDishAssets(dish: Dish): Promise<DishAssets> {
  let p = cache.get(dish.id);
  if (p) { cache.delete(dish.id); cache.set(dish.id, p); return p; }
  p = load(dish);
  cache.set(dish.id, p);
  while (cache.size > MAX) {
    const [k, old] = cache.entries().next().value as [string, Promise<DishAssets>];
    cache.delete(k);
    old.then((a) => a.dispose()).catch(() => {});
  }
  return p;
}

export const preloadDish = (dish: Dish) => { loadDishAssets(dish).catch(() => {}); };

/**
 * Máscara (0-1) del ingrediente seleccionado, para resalte en GPU.
 * Parte del mapa de ids (aproximado) y lo afina con el color real de la foto:
 * crece unos píxeles y solo conserva lo que se parece al color medio del ingrediente,
 * de modo que el resalte sigue la forma visible y no la mancha de la segmentación.
 */
export function selectionMask(a: DishAssets, sel: number, out?: THREE.DataTexture): THREE.DataTexture {
  const M = 256;
  const step = a.size / M;
  const core = new Uint8Array(M * M);
  let nCore = 0;
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
    const v = a.ids[Math.floor(y * step) * a.size + Math.floor(x * step)] === sel ? 1 : 0;
    core[y * M + x] = v;
    nCore += v;
  }
  const buf = new Float32Array(M * M);
  if (nCore > 0) {
    // color medio y dispersión dentro del núcleo
    let mr = 0, mg = 0, mb = 0;
    for (let i = 0; i < core.length; i++) if (core[i]) { mr += a.small[i * 4]; mg += a.small[i * 4 + 1]; mb += a.small[i * 4 + 2]; }
    mr /= nCore; mg /= nCore; mb /= nCore;
    const dist = (i: number) => Math.hypot(a.small[i * 4] - mr, a.small[i * 4 + 1] - mg, a.small[i * 4 + 2] - mb);
    let sd = 0;
    for (let i = 0; i < core.length; i++) if (core[i]) sd += dist(i);
    const tol = Math.max(34, Math.min(80, (sd / nCore) * 1.6));
    // dilatar el núcleo R píxeles
    const R = 7;
    const near = new Uint8Array(M * M);
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
      if (!core[y * M + x]) continue;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < M && xx >= 0 && xx < M && dx * dx + dy * dy <= R * R) near[yy * M + xx] = 1;
      }
    }
    let kept = 0;
    for (let i = 0; i < near.length; i++) {
      if (!near[i]) continue;
      const d = dist(i);
      // dentro del núcleo se tolera más; fuera, solo lo que es claramente del mismo color
      const lim = core[i] ? tol * 1.5 : tol;
      if (d < lim) { buf[i] = 1; kept++; }
    }
    if (kept < nCore * 0.3) for (let i = 0; i < core.length; i++) buf[i] = core[i]; // el color no sirve: usar la segmentación
  }
  // suavizado corto: bordes limpios pero sin dientes de sierra
  const blur = (src: Float32Array, R: number) => {
    const tmp = new Float32Array(M * M);
    const dst = new Float32Array(M * M);
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
      let s = 0;
      for (let d = -R; d <= R; d++) s += src[y * M + Math.min(M - 1, Math.max(0, x + d))];
      tmp[y * M + x] = s / (2 * R + 1);
    }
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
      let s = 0;
      for (let d = -R; d <= R; d++) s += tmp[Math.min(M - 1, Math.max(0, y + d)) * M + x];
      dst[y * M + x] = s / (2 * R + 1);
    }
    return dst;
  };
  const sm = blur(blur(buf, 2), 1);
  const u8 = new Uint8Array(M * M);
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
    const v = Math.min(1, Math.max(0, (sm[y * M + x] - 0.15) / 0.7)); // más contraste en el borde
    u8[(M - 1 - y) * M + x] = Math.round(v * 255);
  }
  if (out) { (out.image.data as Uint8Array).set(u8); out.needsUpdate = true; return out; }
  const t = new THREE.DataTexture(u8, M, M, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
