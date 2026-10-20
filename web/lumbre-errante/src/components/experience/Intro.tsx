"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { scrollToY } from "@/lib/smooth";

const WORDS = ["LUMBRE", "ERRANTE"];
// Brasas con valores fijos (no aleatorios) para que servidor y cliente pinten lo mismo
const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  size: 3 + ((i * 5) % 4),
  dur: 5 + ((i * 7) % 6),
  delay: -((i * 3) % 9),
}));

function Letter({ ch, i, p }: { ch: string; i: number; p: MotionValue<number> }) {
  const a = 0.5 + i * 0.015;
  const o = useTransform(p, [a, a + 0.1], [0, 1]);
  const y = useTransform(p, [a, a + 0.12], [34, 0]);
  return (
    <motion.span style={{ opacity: o, y }} className={ch === " " ? "inline-block w-[0.5em]" : "inline-block"}>
      {ch}
    </motion.span>
  );
}

const RING = ["ramen", "pizza", "sashimi", "burger", "tortilla", "tarta", "gyozas", "arroz"].map((id, i, a) => ({
  id,
  ang: (i / a.length) * Math.PI * 2 - Math.PI / 2,
  spin: i % 2 ? 40 : -40,
}));

// Platos que llegan volando desde fuera y se colocan en corona alrededor del nombre
function RingPlate({ id, ang, spin, p }: { id: string; ang: number; spin: number; p: MotionValue<number> }) {
  const r = useTransform(p, [0.3, 0.78], [2.2, 1]);
  const x = useTransform(r, (v) => `${Math.cos(ang) * v * 43}vw`);
  const y = useTransform(r, (v) => `${Math.sin(ang) * v * 32}vh`);
  const rot = useTransform(p, [0.3, 0.9], [spin * 3, spin / 4]);
  const s = useTransform(p, [0.3, 0.8], [0.5, 1]);
  const o = useTransform(p, [0.3, 0.45, 0.88, 0.98], [0, 1, 1, 0]);
  return (
    <motion.div className="absolute top-1/2 left-1/2 -ml-[8vmin] -mt-[8vmin] h-[16vmin] w-[16vmin] drop-shadow-[0_18px_22px_rgba(0,0,0,.6)]" style={{ x, y, rotate: rot, scale: s, opacity: o }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/scans/${id}-poster.webp`} alt="" draggable={false} className="h-full w-full object-contain" />
    </motion.div>
  );
}

/**
 * Intro por scroll (provisional, sin vídeo): se enciende una llama, la cámara baja hasta la mesa de madera
 * y aparece el nombre. La sección queda fija mientras dura y entrega el relevo a la portada,
 * que comparte el mismo fondo de madera para que el paso no se note.
 */
export default function Intro() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const flameOp = useTransform(p, [0, 0.08, 0.38, 0.55], [0, 1, 1, 0]);
  const flameScale = useTransform(p, [0, 0.12, 0.55], [0.3, 1, 2.6]);
  const flameY = useTransform(p, [0.3, 0.55], [0, -80]);
  const glowScale = useTransform(p, [0, 0.5, 1], [0.2, 1.1, 1.6]);
  const glowOp = useTransform(p, [0, 0.1, 0.9, 1], [0, 0.9, 0.7, 0.5]);
  const tableOp = useTransform(p, [0.1, 0.5], [0, 1]);
  const tableRot = useTransform(p, [0.1, 0.7], [74, 0]);
  const tableScale = useTransform(p, [0.1, 0.8], [1.9, 1.05]);
  const embersOp = useTransform(p, [0.05, 0.25, 0.9, 1], [0, 1, 1, 0]);
  const titleWrap = useTransform(p, [0.5, 1], [1, 1.12]);
  const titleOut = useTransform(p, [0.9, 1], [1, 0]);
  const subOp = useTransform(p, [0.76, 0.88], [0, 1]);
  const hintOp = useTransform(p, [0, 0.12], [1, 0]);
  const skipOp = useTransform(p, [0, 0.9, 0.97], [1, 1, 0]);
  const skipPE = useTransform(skipOp, (v) => (v > 0.2 ? "auto" : "none"));

  if (reduce) return null;

  const skip = () => {
    const el = ref.current;
    if (el) scrollToY(el.offsetTop + el.offsetHeight, { duration: 1.4 });
  };

  return (
    <section ref={ref} aria-label="Introducción" className="relative h-[150svh] md:h-[220svh] border-t border-linea/40 bg-[#0c0907]">
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        <div aria-hidden className="absolute inset-0 [perspective:900px]">
          <motion.div
            className="mesa absolute -inset-[25%] origin-[50%_65%] will-change-transform"
            style={{ opacity: tableOp, rotateX: tableRot, scale: tableScale }}
          />
        </div>

        <motion.div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,170,70,.55),rgba(232,145,58,.18)_38%,transparent_68%)]"
          style={{ scale: glowScale, opacity: glowOp }}
        />

        <motion.div aria-hidden className="absolute inset-0" style={{ opacity: embersOp }}>
          {EMBERS.map((e, i) => (
            <span key={i} className="ember" style={{ left: e.left, width: e.size, height: e.size, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s` }} />
          ))}
        </motion.div>

        <div aria-hidden className="absolute inset-0 hidden sm:block">
          {RING.map((d) => <RingPlate key={d.id} {...d} p={p} />)}
        </div>

        <motion.div aria-hidden className="absolute inset-0 grid place-items-center" style={{ opacity: flameOp, y: flameY, scale: flameScale }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" className="intro-flame text-oro-claro">
            <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <motion.div aria-hidden className="absolute inset-0 grid place-items-center px-4 text-center" style={{ scale: titleWrap, opacity: titleOut }}>
          <div>
            <p className="font-display text-[clamp(2.4rem,9vw,7.5rem)] leading-none font-semibold tracking-[0.06em] text-crema [text-shadow:0_6px_40px_rgba(0,0,0,.6)]">
              {WORDS.map((w, wi) => (
                <span key={w} className="block sm:inline">
                  {wi > 0 && <span className="hidden sm:inline-block sm:w-[0.45em]" />}
                  {[...w].map((c, ci) => <Letter key={ci} ch={c} i={wi * 7 + ci} p={p} />)}
                </span>
              ))}
            </p>
            <motion.p style={{ opacity: subOp }} className="mt-5 text-xs tracking-[0.4em] text-oro uppercase sm:text-sm">
              Madrid · cocina del mundo
            </motion.p>
          </div>
        </motion.div>

        <motion.div aria-hidden style={{ opacity: hintOp }} className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-xl font-semibold tracking-[0.5em] text-crema uppercase [text-shadow:0_2px_16px_rgba(0,0,0,.9)] sm:text-3xl">
          Desliza
          <span className="block h-24 w-1 rounded-full bg-gradient-to-b from-oro-claro to-transparent [animation:hint_1.8s_ease-in-out_infinite]" />
        </motion.div>

        {/* Fundido al color de la portada para que no se vea el corte entre las dos secciones */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#1a130e]" />

        <motion.button
          type="button"
          onClick={skip}
          style={{ opacity: skipOp, pointerEvents: skipPE }}
          className="absolute right-4 bottom-24 z-10 rounded-full border border-crema/40 bg-carbon/50 px-4 py-2 text-xs text-crema backdrop-blur hover:border-oro md:bottom-8 md:right-8"
        >
          Saltar intro
        </motion.button>
      </div>
    </section>
  );
}
