"use client";
import { createElement, useEffect, useState } from "react";
import { dishes } from "@/lib/dishes";

export default function RaViewer({ initial }: { initial?: string }) {
  const [id, setId] = useState(dishes.some((d) => d.id === initial) ? initial! : (dishes.find((d) => d.star) ?? dishes[0]).id);
  const [ready, setReady] = useState(false);
  const dish = dishes.find((d) => d.id === id)!;

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-linea bg-carbon2">
        {ready ? (
          createElement(
            "model-viewer",
            {
              key: id,
              src: dish.model,
              orientation: dish.orientation ?? "0deg 0deg 0deg",
              alt: `${dish.name}, modelo 3D del plato`,
              ar: true,
              "ar-modes": "webxr scene-viewer quick-look",
              "ar-scale": "fixed",
              "ar-placement": "floor",
              "camera-controls": true,
              "touch-action": "pan-y",
              "auto-rotate": true,
              "shadow-intensity": "1",
              "camera-orbit": "0deg 45deg auto",
              exposure: "1.1",
              style: { width: "100%", height: "100%", background: "transparent", "--poster-color": "transparent" },
            },
            createElement(
              "button",
              { slot: "ar-button", className: "btn btn-oro absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg" },
              "Ver en mi mesa (RA)",
            ),
          )
        ) : (
          <div className="skeleton absolute inset-0" aria-label="Cargando modelo 3D" />
        )}
      </div>
      <p className="mt-3 text-center font-display text-xl font-semibold">{dish.name}</p>
      <p className="text-center text-xs text-crema2">{dish.country} · arrastra para girarlo</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Elegir plato">
        {dishes.map((d) => (
          <button
            key={d.id}
            onClick={() => setId(d.id)}
            aria-pressed={d.id === id}
            className={`rounded-full border px-3 py-1.5 text-sm ${d.id === id ? "border-oro bg-oro text-carbon" : "border-linea text-crema/85"}`}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}
