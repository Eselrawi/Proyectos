"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import type { Dish } from "@/lib/types";
import { money } from "@/lib/cart";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface RailProps {
  list: Dish[];
  active: number;
  onActive: (i: number) => void;
  onOpen: (i: number) => void;
  header: ReactNode;
}

function Plate({ dish, priority }: { dish: Dish; priority?: boolean }) {
  return (
    <span className="relative block h-full w-full drop-shadow-[0_30px_28px_rgba(0,0,0,.65)]">
      <Image
        src={dish.poster}
        alt={`${dish.name}, visto desde arriba`}
        fill
        sizes="(min-width:768px) 300px, 70vw"
        priority={priority}
        draggable={false}
        className="object-contain"
      />
    </span>
  );
}

/** Ficha del plato centrado y controles de la fila. */
function Info({ dish, onPrev, onNext, onOpen, index, total }: { dish: Dish; onPrev: () => void; onNext: () => void; onOpen: () => void; index: number; total: number }) {
  return (
    <div className="mx-auto mt-2 flex w-full max-w-3xl flex-col items-center gap-2 px-4 text-center" aria-live="polite">
      <p className="text-xs tracking-[0.3em] text-oro uppercase">
        {dish.country} · {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </p>
      <h3 className="font-display text-2xl leading-tight font-semibold sm:text-4xl">{dish.name}</h3>
      <div className="flex items-center gap-3">
        <button onClick={onPrev} aria-label="Plato anterior" data-hot className="grid h-11 w-11 place-items-center rounded-full border border-linea text-xl text-crema hover:border-oro">‹</button>
        <button onClick={onOpen} data-hot className="btn btn-oro !px-7">
          Ver plato · {money(dish.price)}
        </button>
        <button onClick={onNext} aria-label="Plato siguiente" data-hot className="grid h-11 w-11 place-items-center rounded-full border border-linea text-xl text-crema hover:border-oro">›</button>
      </div>
    </div>
  );
}

/** Escritorio: la fila solo se mueve con las flechas (botones o teclado), clic en un plato o arrastre. El scroll de la página no la toca. */
function PinRail({ list, active, onActive, onOpen, header }: RailProps) {
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const pos = useRef(0); // posición dibujada (se acerca a target con suavizado)
  const target = useRef(0);
  const activeRef = useRef(active);
  const onActiveRef = useRef(onActive);
  const drag = useRef<{ x: number; from: number; moved: boolean } | null>(null);
  const n = list.length;

  useEffect(() => { onActiveRef.current = onActive; }, [onActive]);

  const plate = useCallback(() => {
    const el = stage.current;
    return el ? clamp(Math.min(el.clientWidth * 0.22, window.innerHeight * 0.3), 140, 300) : 200;
  }, []);

  const layout = useCallback((rot: number) => {
    const el = stage.current;
    if (!el) return;
    const size = plate();
    const spacing = size * 1.3;
    el.style.setProperty("--plate", `${size}px`);
    items.current.forEach((li, i) => {
      if (!li) return;
      const d = i - pos.current;
      const a = Math.abs(d);
      if (a > 3.2) { li.style.visibility = "hidden"; return; }
      li.style.visibility = "visible";
      li.style.transform = `translate3d(${d * spacing}px,0,0) scale(${Math.max(0.5, 1.3 - Math.min(a, 2) * 0.34)})`;
      li.style.opacity = String(Math.max(0.2, 1 - a * 0.3));
      li.style.filter = `brightness(${1 - Math.min(a, 1.5) * 0.42})`;
      li.style.zIndex = String(10 - Math.round(a));
      const inner = li.firstElementChild as HTMLElement | null;
      if (inner) inner.style.transform = `rotate(${rot - d * 7}deg)`;
    });
  }, [plate]);

  // Bucle de dibujo: la fila persigue su destino y los platos se inclinan según la velocidad
  useEffect(() => {
    pos.current = 0;
    target.current = 0;
    activeRef.current = 0;
    let prev = 0, vel = 0;
    const tick = (_t: number, dt: number) => {
      const k = 1 - Math.pow(1 - 0.14, Math.max(dt, 1) / 16.67);
      const d = target.current - pos.current;
      pos.current = Math.abs(d) < 0.0008 ? target.current : pos.current + d * k;
      vel += ((pos.current - prev) * 60 - vel) * 0.14;
      prev = pos.current;
      layout(clamp(vel * 9, -26, 26));
    };
    gsap.ticker.add(tick);
    const onResize = () => layout(0);
    window.addEventListener("resize", onResize);
    layout(0);
    return () => { gsap.ticker.remove(tick); window.removeEventListener("resize", onResize); };
  }, [n, layout]);

  const goTo = useCallback((i: number) => {
    const k = clamp(i, 0, n - 1);
    target.current = k;
    if (k !== activeRef.current) { activeRef.current = k; onActiveRef.current(k); }
  }, [n]);

  const step = useCallback((d: number) => goTo(activeRef.current + d), [goTo]);

  // Flechas del teclado mientras la fila está a la vista
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      const r = stage.current?.getBoundingClientRect();
      if (!r || r.top > window.innerHeight * 0.6 || r.bottom < window.innerHeight * 0.4) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, from: target.current, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    if (d.moved) target.current = clamp(d.from - dx / (plate() * 1.3), 0, n - 1);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) goTo(Math.round(target.current));
  };

  const dish = list[clamp(active, 0, n - 1)];
  return (
    <div
      ref={stage}
      className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden py-4"
    >
      <div className="mx-auto w-full max-w-5xl px-4">{header}</div>
      <div
        className="relative mx-auto my-2 h-[calc(var(--plate,200px)*1.45)] w-full touch-pan-y select-none"
        role="group"
        aria-label="Fila de platos: arrastra o usa las flechas del teclado"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      >
        <ul>
          {list.map((d, i) => (
            <li
              key={d.id}
              ref={(el) => { items.current[i] = el; }}
              className="absolute top-1/2 left-1/2 -mt-[calc(var(--plate)/2)] -ml-[calc(var(--plate)/2)] h-[var(--plate)] w-[var(--plate)] will-change-transform"
              style={{ visibility: "hidden" }}
            >
              <div className="h-full w-full">
                <button
                  data-hot
                  data-cursor="Ver"
                  className="block h-full w-full rounded-full"
                  aria-label={`${d.name}, ${d.country}`}
                  aria-current={i === active}
                  onClick={() => { if (drag.current?.moved) return; if (i === activeRef.current) onOpen(i); else goTo(i); }}
                >
                  <Plate dish={d} priority={i < 3} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {dish && <Info dish={dish} index={active} total={n} onPrev={() => step(-1)} onNext={() => step(1)} onOpen={() => onOpen(active)} />}
    </div>
  );
}

/** Móvil (y sin animaciones): carrusel nativo con imán, sin fijar la pantalla. */
function FlowRail({ list, active, onActive, onOpen, header }: RailProps) {
  const row = useRef<HTMLUListElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const raf = useRef(0);
  const n = list.length;

  const centre = () => {
    const r = row.current;
    if (!r) return;
    const mid = r.scrollLeft + r.clientWidth / 2;
    let best = 0, bd = Infinity;
    items.current.forEach((li, i) => {
      if (!li) return;
      const d = Math.abs(li.offsetLeft + li.offsetWidth / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    onActive(best);
  };
  const to = (i: number) => items.current[clamp(i, 0, n - 1)]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  const dish = list[clamp(active, 0, n - 1)];

  return (
    <div
      className="py-10"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); to(active + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); to(active - 1); }
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-4">{header}</div>
      <ul
        ref={row}
        onScroll={() => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(centre); }}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[15vw] pb-4 [scrollbar-width:none]"
        aria-label="Fila de platos"
      >
        {list.map((d, i) => (
          <li key={d.id} ref={(el) => { items.current[i] = el; }} className="w-[70vw] max-w-[320px] shrink-0 snap-center">
            <button
              className={`block aspect-square w-full rounded-full transition-[transform,opacity] duration-300 ${i === active ? "scale-100 opacity-100" : "scale-[.86] opacity-60"}`}
              aria-label={`${d.name}, ${d.country}`}
              aria-current={i === active}
              onClick={() => (i === active ? onOpen(i) : to(i))}
            >
              <Plate dish={d} priority={i < 2} />
            </button>
          </li>
        ))}
      </ul>
      {dish && <Info dish={dish} index={active} total={n} onPrev={() => to(active - 1)} onNext={() => to(active + 1)} onOpen={() => onOpen(active)} />}
    </div>
  );
}

export default function DishRail(props: RailProps) {
  const [pin, setPin] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const set = () => setPin(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return pin ? <PinRail {...props} /> : <FlowRail {...props} />;
}
