"use client";
import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/** El hijo se acerca al puntero cuando está cerca (solo ratón). */
export default function Magnetic({ children, pull = 0.35, className }: { children: ReactNode; pull?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y, display: "inline-block" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * pull);
        y.set((e.clientY - (r.top + r.height / 2)) * pull);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}
