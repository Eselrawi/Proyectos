"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import DishViewer from "@/components/DishViewer";
import Reservations from "@/components/site/Reservations";
import Contact from "@/components/site/Contact";
import { categories, dishAllergens, dishes, restaurant } from "@/lib/dishes";
import { cartTotal, money, useCart } from "@/lib/cart";
import { flyToCart } from "@/lib/flyToCart";
import { ALLERGENS, TAGS, type Dish } from "@/lib/types";

function Stepper({ dish, big = false }: { dish: Dish; big?: boolean }) {
  const qty = useCart((s) => s.lines.find((l) => l.dishId === dish.id)?.qty ?? 0);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const size = big ? "h-12 w-12 text-2xl" : "h-10 w-10 text-xl";
  if (!qty) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); flyToCart(e.currentTarget, dish.poster); add(dish); }}
        aria-label={`Añadir ${dish.name}`}
        className={`grid shrink-0 place-items-center rounded-full bg-terracota text-white active:scale-90 ${size}`}
      >+</button>
    );
  }
  return (
    <div className="flex shrink-0 items-center rounded-full bg-terracota text-white" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setQty(dish.id, qty - 1)} aria-label={`Quitar un ${dish.name}`} className={`grid place-items-center rounded-full active:scale-90 ${size}`}>−</button>
      <span className="min-w-5 text-center font-semibold" aria-live="polite">{qty}</span>
      <button onClick={() => add(dish)} aria-label={`Añadir otro ${dish.name}`} className={`grid place-items-center rounded-full active:scale-90 ${size}`}>+</button>
    </div>
  );
}

function Sheet({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  const al = dishAllergens(dish);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal aria-label={dish.name}
        className="max-h-[92svh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-linea bg-pizarra pb-[env(safe-area-inset-bottom)]"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex h-12 items-center justify-center bg-pizarra/95 backdrop-blur">
          <span className="h-1 w-10 rounded-full bg-linea" aria-hidden />
          <button onClick={onClose} aria-label="Cerrar" className="absolute top-1 right-2 grid h-10 w-10 place-items-center rounded-full text-xl text-crema2">✕</button>
        </div>
        <div className="px-4 pb-5">
          <p className="text-xs tracking-[0.18em] text-crema2 uppercase">{dish.country}</p>
          <h3 className="font-display text-3xl font-semibold">{dish.name}</h3>
          <p className="mt-1 text-sm text-crema/80">{dish.description}</p>
          <div className="mt-2">
            <DishViewer dish={dish} compact />
          </div>
          <p className="mt-1 text-xs text-crema2">Gíralo con el dedo y toca las bolitas para ver cada ingrediente.</p>
          {al.length > 0 && (
            <p className="mt-3 text-xs text-crema2"><span className="text-crema">Alérgenos:</span> {al.map((a) => ALLERGENS[a] ?? a).join(", ")}</p>
          )}
        </div>
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-linea bg-carbon/95 px-4 py-3 backdrop-blur">
          <p className="font-display text-2xl font-semibold">{money(dish.price)}</p>
          <Stepper dish={dish} big />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MobileHome() {
  const [cat, setCat] = useState(categories[0].id);
  const [open, setOpen] = useState<Dish | null>(null);
  const [mesa, setMesa] = useState<string | null>(null);
  const n = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const total = useCart((s) => cartTotal(s.lines));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    try { setMesa(localStorage.getItem("mesa")); } catch { /* sin almacenamiento */ }
  }, []);

  const list = dishes.filter((d) => d.category === cat);

  return (
    <>
      <section id="inicio" className="mesa px-4 pt-6 pb-4">
        <p className="text-[11px] tracking-[0.3em] text-oro uppercase">Madrid · cocina del mundo</p>
        <h1 className="font-display mt-1 text-5xl leading-[0.95] font-semibold">Lumbre <span className="text-grad italic">Errante</span></h1>
        <p className="mt-2 text-sm text-crema/80">{restaurant.slogan}.</p>
        {mesa && <p className="mt-3 inline-block rounded-full border border-oro/50 px-3 py-1 text-xs text-oro-claro">Mesa {mesa}</p>}
      </section>

      <section id="carta" className="mesa pb-28">
        <div role="tablist" aria-label="Categorías" className="sticky top-16 z-30 flex gap-2 overflow-x-auto border-y border-linea/70 bg-carbon/95 px-4 py-2.5 backdrop-blur [scrollbar-width:none]">
          {categories.map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
              className={`rounded-full px-4 py-2.5 text-sm whitespace-nowrap ${cat === c.id ? "bg-oro font-semibold text-carbon" : "border border-linea text-crema"}`}>
              {c.name}
            </button>
          ))}
        </div>

        <ul className="space-y-3 px-4 pt-4">
          {list.map((d) => (
            <li key={d.id}>
              <div role="button" tabIndex={0} onClick={() => setOpen(d)} onKeyDown={(e) => e.key === "Enter" && setOpen(d)}
                className="flex items-center gap-3 rounded-2xl border border-linea bg-carbon/70 p-3 active:bg-carbon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.poster} alt="" width={88} height={88} loading="lazy" draggable={false} className="h-[88px] w-[88px] shrink-0 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,.5)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] tracking-[0.15em] text-crema2 uppercase">{d.country}</p>
                  <p className="font-display text-lg leading-tight font-semibold">{d.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-crema2">{d.description}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold text-oro-claro">{money(d.price)}</span>
                    {d.tags.map((t) => <span key={t} className="text-[10px] text-crema2">{TAGS[t] ?? t}</span>)}
                  </div>
                </div>
                <Stepper dish={d} />
              </div>
            </li>
          ))}
        </ul>
        <p className="px-4 pt-4 text-center text-xs text-crema2">Toca un plato para verlo en 3D, con sus ingredientes y alérgenos.</p>
      </section>

      <Reservations />
      <Contact />

      {ready && n > 0 && !open && (
        <Link href="/cesta" className="btn btn-oro fixed inset-x-3 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-40 !justify-between !py-3.5 shadow-2xl">
          <span>Ver pedido · {n}</span>
          <span>{money(total)}</span>
        </Link>
      )}

      <AnimatePresence>{open && <Sheet key={open.id} dish={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}
