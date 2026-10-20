"use client";
import { useEffect, useRef } from "react";

/** Luz cálida que sigue al ratón y un anillo que crece sobre lo clicable. Solo con puntero fino. */
export default function Cursor() {
  const glow = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const txt = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0, hot = false, label = "";
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as HTMLElement | null;
      hot = !!t?.closest("a,button,summary,label,[data-hot]");
      label = t?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
      if (txt.current && txt.current.textContent !== label) txt.current.textContent = label;
    };
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (glow.current) glow.current.style.transform = `translate3d(${x - 260}px,${y - 260}px,0)`;
      if (ring.current) {
        const s = label ? 2.3 : hot ? 1.9 : 1;
        ring.current.style.transform = `translate3d(${rx - 18}px,${ry - 18}px,0) scale(${s})`;
        ring.current.style.opacity = label ? "1" : hot ? ".9" : ".55";
        ring.current.style.backgroundColor = label ? "rgba(21,18,15,.72)" : "transparent";
      }
      if (txt.current) txt.current.style.opacity = label ? "1" : "0";
      raf = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[55] hidden [@media(pointer:fine)]:block">
      <div ref={glow} className="absolute top-0 left-0 h-[520px] w-[520px] rounded-full mix-blend-screen"
        style={{ background: "radial-gradient(circle, rgba(232,145,58,.13), transparent 62%)" }} />
      <div ref={ring} className="absolute top-0 left-0 grid h-9 w-9 place-items-center rounded-full border border-oro-claro backdrop-blur-sm transition-[opacity,background-color] duration-200">
        <span ref={txt} className="text-[7px] font-semibold tracking-wider text-oro-claro uppercase opacity-0 transition-opacity duration-200" />
      </div>
    </div>
  );
}
