"use client";
import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import DishViewer from "@/components/DishViewer";
import Embers from "@/components/fx/Embers";
import Steam from "@/components/fx/Steam";
import Cutlery from "@/components/fx/Cutlery";
import Magnetic from "@/components/fx/Magnetic";
import Marquee from "@/components/fx/Marquee";
import { dishes, restaurant } from "@/lib/dishes";

const WORDS = ["Lumbre", "Errante"];
const COUNTRIES = [...new Set(dishes.map((d) => d.country))];

export default function Hero() {
  const star = dishes.find((d) => d.star) ?? dishes[0];
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const dishY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const dishScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const textOp = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section id="inicio" ref={ref} className="relative overflow-hidden bg-[#1a130e]">
      <motion.div aria-hidden className="mesa absolute inset-x-0 -top-10 -bottom-24" style={reduce ? undefined : { y: bgY }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-40 bg-gradient-to-b from-[#1a130e] to-transparent" />
      <Embers />
      <Cutlery />
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-4 px-4 pt-10 pb-10 md:grid-cols-[1.15fr_1fr] md:pb-28">
        <motion.div className="min-w-0" style={reduce ? undefined : { y: textY, opacity: textOp }}>
          <motion.p
            className="text-xs tracking-[0.35em] text-oro uppercase"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2 }}
          >
            Madrid · cocina del mundo
          </motion.p>
          <h1 className="font-display mt-4 text-[clamp(3.6rem,12.5vw,9.5rem)] leading-[0.9] font-semibold tracking-tight" aria-label="Lumbre Errante">
            {WORDS.map((w, i) => (
              <span key={w} aria-hidden className="block overflow-hidden pb-[0.1em]">
                <motion.span
                  className={`block ${i === 1 ? "text-grad italic" : ""}`}
                  initial={{ y: "105%" }} animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 1.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.5 }}>
            <p className="mt-6 max-w-md text-xl text-crema/90">{restaurant.slogan}.</p>
            <p className="mt-2 hidden max-w-md text-sm text-crema2 md:block">Doce platos de cinco países, escaneados en 3D. Gíralos, toca cada ingrediente y pide desde tu mesa.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic><Link href="/#carta" className="btn btn-oro !px-7 !py-3.5">Pedir ahora</Link></Magnetic>
              <Magnetic><Link href="/#reservas" className="btn btn-linea !px-5 !py-3.5 max-md:!border-transparent max-md:text-crema2 md:!px-7">Reservar mesa</Link></Magnetic>
            </div>
          </motion.div>
        </motion.div>
        <motion.div className="relative mx-auto w-[86%] min-w-0 md:w-full" style={reduce ? undefined : { y: dishY, scale: dishScale }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.2 }}>
          <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(232,145,58,.35),transparent_65%)] blur-2xl" />
          <DishViewer dish={star} dir={1} hero />
          <Steam />
          <p className="pointer-events-none -mt-2 text-center text-xs text-crema2">{star.name} · {star.country}</p>
        </motion.div>
      </div>
      <div className="font-display absolute inset-x-0 bottom-0 hidden md:block border-y border-linea/70 bg-carbon/70 py-3 text-lg text-crema/70 italic backdrop-blur">
        <Marquee items={[...COUNTRIES, "Carta en 3D", "Toca los ingredientes", "Pide desde la mesa"]} />
      </div>
    </section>
  );
}
