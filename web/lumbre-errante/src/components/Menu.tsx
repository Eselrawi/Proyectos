"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DishViewer from "./DishViewer";
import DishRail from "./experience/DishRail";
import SplitText from "@/components/fx/SplitText";
import { categories, dishAllergens, dishes } from "@/lib/dishes";
import { money, useCart } from "@/lib/cart";
import { scrollToEl } from "@/lib/smooth";
import { flyToCart } from "@/lib/flyToCart";
import { ALLERGENS } from "@/lib/types";

type Diet = "vegetariano" | "vegano" | "sin-gluten";
const DIETS: { id: Diet; label: string }[] = [
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "sin-gluten", label: "Sin gluten" },
];

export default function Menu() {
  const [cat, setCat] = useState(categories[0].id);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [noAll, setNoAll] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [flash, setFlash] = useState<string | null>(null);
  const iRef = useRef(0);
  const detail = useRef<HTMLDivElement>(null);
  const sec = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const add = useCart((s) => s.add);
  const qty = useCart((s) => s.lines);

  const list = useMemo(
    () =>
      dishes.filter((d) => {
        if (d.category !== cat) return false;
        const al = dishAllergens(d);
        if (diets.includes("vegano") && !d.tags.includes("vegano")) return false;
        if (diets.includes("vegetariano") && !d.tags.includes("vegetariano") && !d.tags.includes("vegano")) return false;
        if (diets.includes("sin-gluten") && al.includes("gluten")) return false;
        return !noAll.some((a) => al.includes(a));
      }),
    [cat, diets, noAll],
  );

  // Al cambiar categoría o filtros, la fila empieza otra vez por el primer plato
  useEffect(() => { iRef.current = 0; setI(0); }, [list]);

  // La barra de pedido fija de móvil solo se ve mientras la carta está en pantalla
  useEffect(() => {
    const el = sec.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const setActive = useCallback((a: number) => {
    setDir(a >= iRef.current ? 1 : -1);
    iRef.current = a;
    setI(a);
  }, []);

  const dish = list[Math.min(i, list.length - 1)];
  const next = list.length > 1 ? list[(i + 1) % list.length] : undefined;
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const inCart = dish ? qty.find((l) => l.dishId === dish.id)?.qty ?? 0 : 0;
  const filtering = diets.length > 0 || noAll.length > 0;

  const header = (
    <>
      <p className="text-xs tracking-[0.3em] text-oro uppercase">La carta</p>
      <SplitText text="Elige un plato" className="font-display mt-1 text-3xl font-semibold sm:text-5xl" />
      <div role="tablist" aria-label="Categorías" className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {categories.map((c) => (
          <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
            className={`rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors ${cat === c.id ? "bg-oro font-semibold text-carbon" : "border border-linea text-crema hover:border-oro/60"}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {DIETS.map((d) => (
          <button key={d.id} aria-pressed={diets.includes(d.id)} onClick={() => setDiets((a) => toggle(a, d.id))}
            className={`rounded-full border px-3 py-1.5 text-xs ${diets.includes(d.id) ? "border-terracota bg-terracota/20 text-crema" : "border-linea text-crema2 hover:border-terracota/60"}`}>
            {d.label}
          </button>
        ))}
        <details className="relative">
          <summary className={`cursor-pointer list-none rounded-full border px-3 py-1.5 text-xs ${noAll.length ? "border-terracota bg-terracota/20 text-crema" : "border-linea text-crema2"}`}>
            Sin alérgenos{noAll.length ? ` (${noAll.length})` : ""}
          </summary>
          <fieldset className="absolute z-30 mt-2 grid w-64 grid-cols-1 gap-1 rounded-2xl border border-linea bg-pizarra p-3 shadow-2xl">
            <legend className="sr-only">Excluir alérgenos</legend>
            {Object.entries(ALLERGENS).map(([k, v]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={noAll.includes(k)} onChange={() => setNoAll((a) => toggle(a, k))} className="accent-[#d4a24c]" />
                {v}
              </label>
            ))}
          </fieldset>
        </details>
        {filtering && (
          <button onClick={() => { setDiets([]); setNoAll([]); }} className="text-xs text-crema2 underline underline-offset-2">Quitar filtros</button>
        )}
      </div>
    </>
  );

  return (
    <section id="carta" ref={sec} className="mesa border-y border-linea">
      {!dish ? (
        <div className="mx-auto max-w-3xl px-4 py-14">
          {header}
          <div className="mt-10 rounded-2xl border border-dashed border-linea p-8 text-center">
            <p className="font-display text-xl">Ningún plato cumple esos filtros</p>
            <p className="mt-1 text-sm text-crema2">Prueba otra categoría o quita algún filtro.</p>
            <button onClick={() => { setDiets([]); setNoAll([]); }} className="btn btn-linea mt-4">Quitar filtros</button>
          </div>
        </div>
      ) : (
        <>
          <DishRail
            key={cat + diets.join() + noAll.join()}
            list={list}
            active={i}
            onActive={setActive}
            onOpen={() => scrollToEl(detail.current)}
            header={header}
          />
          <div ref={detail} id="plato" className="mx-auto max-w-3xl px-4 pt-10 pb-16">
            <p className="text-xs tracking-[0.18em] text-crema2 uppercase">{dish.country}</p>
            <h3 className="font-display text-3xl font-semibold sm:text-4xl">{dish.name}</h3>
            <p className="mt-1 max-w-lg text-sm text-crema/80">{dish.description}</p>
            <p className="mt-2 max-w-xl text-sm text-crema2"><span className="max-md:hidden">Pasa el cursor por las bolitas para ver cada ingrediente, o tócalas para ver sus alérgenos.</span><span className="md:hidden">Toca las bolitas para ver cada ingrediente y sus alérgenos.</span></p>

            <DishViewer dish={dish} next={next} dir={dir} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-linea bg-carbon/70 p-4 backdrop-blur">
              <div>
                <p className="font-display text-2xl font-semibold">{money(dish.price)}</p>
                <p className="text-xs text-crema2">IVA incluido</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/ra?plato=${dish.id}`}
                  className="btn btn-linea gap-2 !px-4"
                  aria-label={`Ver ${dish.name} en mi mesa con realidad aumentada, a escala real 1:1`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" />
                  </svg>
                  <span>Ver en mi mesa</span>
                  <span className="rounded-full border border-oro/60 px-1.5 py-px text-[10px] font-semibold text-oro-claro">1:1</span>
                </a>
                <button
                  onClick={(e) => { flyToCart(e.currentTarget, dish.poster); add(dish); setFlash(dish.id); setTimeout(() => setFlash(null), 1400); }}
                  className="btn btn-terra min-w-44"
                  aria-live="polite"
                >
                  {flash === dish.id ? "Añadido ✓" : inCart ? `Añadir otro (${inCart})` : "Añadir a la cesta"}
                </button>
              </div>
            </div>
          </div>

          {inView && (
            <div className="fixed inset-x-0 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-linea bg-carbon/95 px-4 py-2.5 backdrop-blur md:hidden">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{dish.name}</p>
                <p className="text-xs text-crema2">{money(dish.price)}</p>
              </div>
              <button
                onClick={(e) => { flyToCart(e.currentTarget, dish.poster); add(dish); setFlash(dish.id); setTimeout(() => setFlash(null), 1400); }}
                className="btn btn-terra !px-5 !py-2.5 text-sm"
                aria-live="polite"
              >
                {flash === dish.id ? "Añadido ✓" : inCart ? `Añadir otro (${inCart})` : "Añadir"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
