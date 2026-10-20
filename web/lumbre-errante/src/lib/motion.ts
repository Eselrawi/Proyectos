/** Curvas y duraciones únicas de la web: todo el movimiento sale de aquí. */
export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.76, 0, 0.24, 1],
  soft: [0.4, 0, 0.2, 1],
} as const;

export const DUR = { fast: 0.25, base: 0.6, slow: 1 } as const;
