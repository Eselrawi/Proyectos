import * as THREE from "three";
import type { Ingredient } from "./types";

const S = 256;

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5), ((h ^ (h >>> 13)) >>> 0) / 4294967296);
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function blob(ctx: CanvasRenderingContext2D, r: () => number, cx: number, cy: number, rx: number, ry: number, wob = 0.08) {
  const k = 3 + Math.floor(r() * 3);
  const ph = r() * 6.28;
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const m = 1 + wob * Math.sin(a * k + ph) + wob * 0.5 * Math.sin(a * (k + 2) + ph * 2);
    const x = cx + Math.cos(a) * rx * m;
    const y = cy + Math.sin(a) * ry * m;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function grain(ctx: CanvasRenderingContext2D, r: () => number, color: string, n: number, size: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = shade(color, (r() - 0.5) * 0.28);
    ctx.fillRect(r() * S, r() * S, size, size);
  }
  ctx.restore();
}

function radial(ctx: CanvasRenderingContext2D, color: string, cx = S / 2, cy = S / 2, rad = S / 2) {
  const g = ctx.createRadialGradient(cx - rad * 0.25, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
  g.addColorStop(0, shade(color, 0.14));
  g.addColorStop(0.7, color);
  g.addColorStop(1, shade(color, -0.16));
  return g;
}

function draw(ing: Ingredient, ctx: CanvasRenderingContext2D) {
  const r = rng(ing.id);
  const c = ing.color;
  const m = S / 2;
  ctx.clearRect(0, 0, S, S);
  switch (ing.shape) {
    case "steak": {
      blob(ctx, r, m, m, 112, 92, 0.1);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = shade(c, -0.22);
      ctx.lineWidth = 9;
      for (let i = -3; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(30 + i * 34, 20);
        ctx.lineTo(120 + i * 34, 240);
        ctx.stroke();
      }
      ctx.restore();
      grain(ctx, r, c, 400, 3);
      break;
    }
    case "leaf": {
      ctx.beginPath();
      ctx.moveTo(m, 14);
      ctx.bezierCurveTo(m + 130, 70, m + 90, 200, m, 246);
      ctx.bezierCurveTo(m - 90, 200, m - 130, 70, m, 14);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = shade(c, 0.2);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(m, 20);
      ctx.lineTo(m, 246);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      for (let y = 60; y < 220; y += 28) {
        ctx.beginPath();
        ctx.moveTo(m, y + 20);
        ctx.lineTo(m - 70, y - 10);
        ctx.moveTo(m, y + 20);
        ctx.lineTo(m + 70, y - 10);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "wedge": {
      ctx.beginPath();
      ctx.arc(m, m + 40, 110, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(m, m + 70, 90, Math.PI * 1.85, Math.PI * 1.15, true);
      ctx.closePath();
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      grain(ctx, r, c, 200, 3);
      break;
    }
    case "pool": {
      blob(ctx, r, m, m, 118, 110, 0.12);
      const g = ctx.createRadialGradient(m - 30, m - 40, 10, m, m, 120);
      g.addColorStop(0, shade(c, 0.12));
      g.addColorStop(1, shade(c, -0.05));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.globalAlpha = 0.35;
      blob(ctx, r, m - 28, m - 34, 34, 20, 0.2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case "nest": {
      ctx.lineCap = "round";
      for (let i = 0; i < 70; i++) {
        const a0 = r() * 6.28;
        const rad = 30 + r() * 95;
        ctx.strokeStyle = shade(c, (r() - 0.5) * 0.2);
        ctx.lineWidth = 7 + r() * 3;
        ctx.beginPath();
        ctx.arc(m + (r() - 0.5) * 30, m + (r() - 0.5) * 30, rad, a0, a0 + 1.2 + r() * 1.8);
        ctx.stroke();
      }
      break;
    }
    case "cube": {
      const rr = 18;
      ctx.beginPath();
      ctx.roundRect(40, 40, 176, 176, rr);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      grain(ctx, r, c, 500, 4);
      break;
    }
    case "round": {
      ctx.beginPath();
      ctx.arc(m, m, 108, 0, 6.28);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(m - 34, m - 40, 26, 14, -0.6, 0, 6.28);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case "crumb": {
      for (let i = 0; i < 26; i++) {
        ctx.save();
        ctx.translate(m + (r() - 0.5) * 200, m + (r() - 0.5) * 200);
        ctx.rotate(r() * 6.28);
        ctx.fillStyle = shade(c, (r() - 0.5) * 0.25);
        ctx.fillRect(-6, -3, 6 + r() * 16, 3 + r() * 8);
        ctx.restore();
      }
      break;
    }
    case "strip": {
      ctx.beginPath();
      ctx.roundRect(m - 28, 10, 56, 236, 26);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      grain(ctx, r, c, 200, 3);
      break;
    }
    case "fillet": {
      ctx.beginPath();
      ctx.moveTo(14, m);
      ctx.bezierCurveTo(60, 40, 190, 30, 244, 100);
      ctx.bezierCurveTo(250, 170, 150, 230, 60, 190);
      ctx.bezierCurveTo(30, 175, 18, 150, 14, m);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = shade(c, 0.12);
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(40 + i * 24, 30);
        ctx.quadraticCurveTo(70 + i * 24, 120, 40 + i * 24, 220);
        ctx.stroke();
      }
      ctx.restore();
      grain(ctx, r, c, 300, 3);
      break;
    }
    case "croquette": {
      ctx.beginPath();
      ctx.roundRect(m - 55, 40, 110, 176, 52);
      ctx.fillStyle = radial(ctx, c);
      ctx.fill();
      grain(ctx, r, c, 900, 3);
      break;
    }
  }
}

export interface IngTexture {
  tex: THREE.Texture;
  hit: (u: number, v: number) => boolean;
}

function fromImage(img: CanvasImageSource, w: number, h: number): IngTexture {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return wrap(cv, ctx);
}

function wrap(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D): IngTexture {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return {
    tex,
    hit: (u, v) => {
      const x = Math.min(cv.width - 1, Math.max(0, Math.floor(u * cv.width)));
      const y = Math.min(cv.height - 1, Math.max(0, Math.floor((1 - v) * cv.height)));
      return ctx.getImageData(x, y, 1, 1).data[3] > 40;
    },
  };
}

const cache = new Map<string, Promise<IngTexture>>();

export const imageUrl = (id: string) => `/ingredients/${id}.webp`;

/** Usa /ingredients/<id>.webp si existe (foto real); si no, dibuja el ingrediente. */
export function getTexture(ing: Ingredient): Promise<IngTexture> {
  let p = cache.get(ing.id);
  if (!p) {
    p = new Promise<IngTexture>((resolve) => {
      const proc = () => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = S;
        const ctx = cv.getContext("2d", { willReadFrequently: true })!;
        draw(ing, ctx);
        resolve(wrap(cv, ctx));
      };
      const img = new Image();
      img.onload = () => resolve(fromImage(img, Math.min(img.width, 512), Math.min(img.height, 512)));
      img.onerror = proc;
      img.src = imageUrl(ing.id);
    });
    cache.set(ing.id, p);
  }
  return p;
}

export function makeShadowTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export { rng };
