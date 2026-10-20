"use client";
import { createElement, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ALLERGENS, type Dish } from "@/lib/types";

type MV = HTMLElement & { zoom?: (steps: number) => void; resetTurntableRotation?: () => void };

// model-viewer se descarga una sola vez y solo cuando hay un visor en pantalla
let mvModule: Promise<unknown> | null = null;
const loadMV = () => (mvModule ??= import("@google/model-viewer"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function DishViewer({
  dish, next, hero = false, compact = false,
}: {
  dish: Dish; next?: Dish; dir?: number; onSwipe?: (d: number) => void; hero?: boolean; compact?: boolean;
}) {
  const [mv, setMv] = useState<MV | null>(null);
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false); // módulo de model-viewer cargado
  const [loaded, setLoaded] = useState(false); // modelo del plato cargado
  const [failed, setFailed] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ing = dish.ingredients.find((i) => i.id === sel) ?? null;

  useEffect(() => {
    setGl(hasWebGL());
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    try { setHint(!localStorage.getItem("hint-ingredientes")); } catch { setHint(true); }
    loadMV().then(() => setReady(true)).catch(() => setFailed(true));
  }, []);

  // Al cambiar de plato: ficha cerrada y pantalla de carga con la foto del nuevo plato
  useEffect(() => { setSel(null); setLoaded(false); }, [dish.id]);

  // Calienta la caché con el siguiente plato para que el cambio sea inmediato
  useEffect(() => {
    if (!next) return;
    const t = setTimeout(() => { fetch(next.model, { priority: "low" } as RequestInit).catch(() => {}); }, 800);
    return () => clearTimeout(t);
  }, [next]);

  useEffect(() => {
    const m = mv;
    if (!m) return;
    const onLoad = () => setLoaded(true);
    const onErr = () => setFailed(true);
    m.addEventListener("load", onLoad);
    m.addEventListener("error", onErr);
    if ((m as unknown as { loaded?: boolean }).loaded) setLoaded(true);
    return () => { m.removeEventListener("load", onLoad); m.removeEventListener("error", onErr); };
  }, [mv]);

  // Con el cursor sobre el plato en 3D la rueda no mueve la página ni hace zoom (el zoom va con + y −)
  useEffect(() => {
    if (!box || hero) return;
    const stop = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation(); };
    box.addEventListener("wheel", stop, { passive: false, capture: true });
    return () => box.removeEventListener("wheel", stop, { capture: true });
  }, [box, hero]);

  const select = useCallback((id: string | null) => {
    setSel(id);
    if (id) { try { localStorage.setItem("hint-ingredientes", "1"); } catch { /* sin almacenamiento */ } setHint(false); }
  }, []);

  const zoom = (d: number) => mv?.zoom?.(d);
  const flat = gl === false || failed;

  return (
    <div className="relative">
      <div
        ref={setBox}
        data-lenis-prevent={hero ? undefined : ""}
        className={`relative mx-auto aspect-square w-full select-none ${compact ? "max-w-[420px]" : "max-w-[560px]"}`}
        onKeyDown={(e) => { if (e.key === "Escape") select(null); }}
      >
        {/* Foto del plato desenfocada mientras llega el modelo 3D */}
        <div
          aria-hidden={loaded && !flat}
          role={loaded && !flat ? undefined : "status"}
          aria-label={loaded && !flat ? undefined : "Cargando plato"}
          className={`pointer-events-none absolute inset-[4%] z-10 grid place-items-center transition-opacity duration-500 ${loaded && !flat ? "opacity-0" : "opacity-100"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dish.poster} alt={flat ? dish.name : ""} className={`h-full w-full object-contain ${flat ? "" : "scale-105 opacity-80 blur-md saturate-125"}`} />
          {!flat && <p className="absolute inset-x-0 bottom-[8%] text-center text-[11px] tracking-[0.3em] text-crema/80 uppercase">Preparando el plato…</p>}
        </div>

        {ready && !flat &&
          createElement(
            "model-viewer",
            {
              ref: setMv,
              key: dish.id,
              src: dish.model,
              alt: `${dish.name}, modelo 3D del plato`,
              orientation: dish.orientation ?? "0deg 0deg 0deg",
              "camera-controls": !hero,
              "disable-pan": true,
              "auto-rotate": hero || undefined,
              "auto-rotate-delay": hero ? 0 : 4000,
              "rotation-per-second": hero ? "14deg" : "10deg",
              "camera-orbit": hero ? "0deg 38deg auto" : (dish.orbit ?? "0deg 28deg auto"),
              "min-camera-orbit": "auto 0deg auto",
              "max-camera-orbit": "auto 88deg auto",
              "field-of-view": "28deg",
              "shadow-intensity": "0.9",
              "shadow-softness": "1",
              exposure: "1.05",
              "interaction-prompt": "none",
              "touch-action": "pan-y",
              reveal: "auto",
              class: "dish-mv",
              style: { width: "100%", height: "100%", background: "transparent", opacity: loaded ? 1 : 0, transition: "opacity .5s", "--poster-color": "transparent" },
            },
            !hero && dish.ingredients.map((g) =>
              createElement(
                "button",
                {
                  key: dish.id + g.id,
                  slot: `hotspot-${g.id}`,
                  type: "button",
                  className: `hotspot${sel === g.id ? " is-on" : ""}`,
                  "data-position": g.position,
                  "data-normal": g.normal,
                  "data-visibility-attribute": "visible",
                  "aria-label": g.name,
                  "aria-pressed": sel === g.id,
                  onClick: () => select(sel === g.id ? null : g.id),
                },
                createElement("span", { className: "hotspot-tip" }, g.name),
              ),
            ),
          )}

        {loaded && hint && !sel && !hero && !flat && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs whitespace-nowrap text-crema backdrop-blur">
            Arrastra para girarlo · toca las bolitas
          </motion.p>
        )}
        {!hero && !flat && loaded && (
          <div className="absolute right-1 bottom-1 z-20 flex flex-col gap-1">
            <button onClick={() => zoom(2)} aria-label="Acercar" className="grid h-9 w-9 place-items-center rounded-full bg-black/50 text-crema backdrop-blur">+</button>
            <button onClick={() => zoom(-2)} aria-label="Alejar" className="grid h-9 w-9 place-items-center rounded-full bg-black/50 text-crema backdrop-blur">−</button>
          </div>
        )}
      </div>

      {!hero && (
        <ul className="mx-auto mt-2 flex max-w-[560px] gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" aria-label="Ingredientes del plato">
          {dish.ingredients.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => select(sel === g.id ? null : g.id)}
                aria-pressed={sel === g.id}
                className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${sel === g.id ? "border-oro bg-oro text-carbon" : "border-linea text-crema2 hover:border-oro/60"}`}
              >
                {g.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {ing && !hero && (
          <motion.aside
            key={ing.id}
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            className="mx-auto mt-3 max-w-[560px] rounded-2xl border border-linea bg-pizarra p-4 shadow-xl"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-oro uppercase">{ing.category}</p>
                <h3 className="font-display text-xl font-semibold text-crema">{ing.name}</h3>
              </div>
              <button aria-label="Cerrar ficha" onClick={() => select(null)} className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-crema2 hover:bg-white/10">×</button>
            </div>
            <p className="mt-1 text-sm text-crema/85">{ing.description}</p>
            {ing.components && <p className="mt-2 text-sm text-crema/85"><b className="text-crema">Lleva:</b> {ing.components.join(", ")}.</p>}
            <p className="mt-3 text-sm text-crema/85">
              <b className="text-crema">Alérgenos:</b> {ing.allergens.length ? ing.allergens.map((a) => ALLERGENS[a] ?? a).join(", ") : "ninguno declarado"}
            </p>
            <p className="mt-1 text-xs text-crema2">Alérgenos: confirma con el personal del restaurante.</p>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
