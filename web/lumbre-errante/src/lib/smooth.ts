import type Lenis from "lenis";

/** Instancia de Lenis (la crea `Smooth`); permite mover el scroll sin pelearse con él. */
export const lenisRef: { current: Lenis | null } = { current: null };

export function scrollToY(y: number, opts?: { immediate?: boolean; duration?: number }) {
  const l = lenisRef.current;
  if (l) l.scrollTo(y, { immediate: opts?.immediate, duration: opts?.duration ?? 0.9 });
  else window.scrollTo({ top: y, behavior: opts?.immediate ? "auto" : "smooth" });
}

export function scrollToEl(el: HTMLElement | null, offset = -72) {
  if (!el) return;
  const l = lenisRef.current;
  if (l) l.scrollTo(el, { offset, duration: 1 });
  else el.scrollIntoView({ behavior: "smooth" });
}
