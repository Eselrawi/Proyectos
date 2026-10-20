"use client";
import { useEffect, useRef } from "react";
import { dishes } from "@/lib/dishes";
import type { Dish } from "@/lib/types";

const PAL = ["#ff2a2a", "#18c8ff", "#ffd400", "#2aff4a", "#ff2aff", "#ff8a1a", "#7a5cff", "#18ffa8", "#ff6aa8", "#a8ff1a"];
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

function Overlay({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const S = 420;
    cv.width = cv.height = S;
    const ctx = cv.getContext("2d")!;
    const load = (src: string) => new Promise<HTMLImageElement>((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    Promise.all([load(dish.assets.color), load(dish.assets.ids)]).then(([c, m]) => {
      ctx.fillStyle = "#555"; ctx.fillRect(0, 0, S, S);
      ctx.drawImage(c, 0, 0, S, S);
      const t = document.createElement("canvas"); t.width = t.height = S;
      const tc = t.getContext("2d", { willReadFrequently: true })!;
      tc.imageSmoothingEnabled = false;
      tc.drawImage(m, 0, 0, S, S);
      const ids = tc.getImageData(0, 0, S, S);
      const base = ctx.getImageData(0, 0, S, S);
      for (let i = 0; i < S * S; i++) {
        const v = ids.data[i * 4];
        if (!v) continue;
        const col = hex(PAL[(v - 1) % PAL.length]);
        for (let k = 0; k < 3; k++) base.data[i * 4 + k] = base.data[i * 4 + k] * 0.5 + col[k] * 0.5;
      }
      ctx.putImageData(base, 0, 0);
    });
  }, [dish]);
  return <canvas ref={ref} className="h-auto w-full rounded-full" aria-label={`Máscaras de ${dish.name}`} />;
}

export default function Review() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Revisión de segmentación</h1>
      <p className="mt-1 text-sm text-crema2">Cada color es un ingrediente. Si una máscara está mal, corrige los puntos en <code>scripts/_annotations.mjs</code> y ejecuta <code>npm run dishes</code>.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((d) => (
          <section key={d.id} className="rounded-2xl border border-linea bg-pizarra p-4">
            <h2 className="font-display text-lg">{d.name}</h2>
            <Overlay dish={d} />
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {d.ingredients.map((g) => (
                <li key={g.id} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: PAL[(g.index - 1) % PAL.length] }} />{g.index} {g.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
