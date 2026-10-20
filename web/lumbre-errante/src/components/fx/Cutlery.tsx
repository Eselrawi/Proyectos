"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/** Tenedor y cuchillo que flotan a los lados del hero con parallax distinto. */
export default function Cutlery() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yF = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const yK = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const rF = useTransform(scrollYProgress, [0, 1], [-18, 8]);
  const rK = useTransform(scrollYProgress, [0, 1], [16, -10]);
  const stroke = { stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden text-oro/40 md:block">
      <motion.svg style={reduce ? undefined : { y: yF, rotate: rF }} className="absolute top-[14%] left-[3%] h-56 w-12" viewBox="0 0 24 110" {...stroke}>
        <path d="M5 4v18c0 5 3 7 7 7s7-2 7-7V4M12 4v25M12 29v77" />
      </motion.svg>
      <motion.svg style={reduce ? undefined : { y: yK, rotate: rK }} className="absolute right-[3%] bottom-[16%] h-56 w-12" viewBox="0 0 24 110" {...stroke}>
        <path d="M12 4c6 6 7 24 0 46h-4V8c0-2 2-4 4-4zM8 50v56" />
      </motion.svg>
    </div>
  );
}
