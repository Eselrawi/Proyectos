"use client";
import { useEffect } from "react";
import { lenisRef } from "@/lib/smooth";

/**
 * Scroll suave con Lenis, sincronizado con el reloj de GSAP para que ScrollTrigger no se descuadre.
 * Las librerías se cargan tras la primera pintura para no pesar en rutas sin scroll largo (cesta, panel).
 */
export default function Smooth() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let off: (() => void) | undefined;
    let dead = false;
    Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]).then(([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
      if (dead) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.1, anchors: true });
      lenisRef.current = lenis;
      const tick = (t: number) => lenis.raf(t * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      off = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        lenisRef.current = null;
      };
    });
    return () => { dead = true; off?.(); };
  }, []);
  return null;
}
