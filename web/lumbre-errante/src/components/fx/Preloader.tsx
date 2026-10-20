"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Telón de marca al abrir la web (una vez por visita). */
export default function Preloader() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem("intro"); sessionStorage.setItem("intro", "1"); } catch { /* sin almacenamiento */ }
    const quick = seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setShow(false), quick ? 0 : 1300);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="pre"
          className="fixed inset-0 z-[100] grid place-items-center bg-carbon"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="text-center">
            <motion.svg width="54" height="54" viewBox="0 0 24 24" fill="none" className="mx-auto text-oro"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <motion.path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: "easeInOut" }} />
            </motion.svg>
            <motion.p className="font-display mt-4 text-2xl tracking-[0.35em] text-crema uppercase"
              initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.35em" }} transition={{ duration: 1 }}>
              Lumbre Errante
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
