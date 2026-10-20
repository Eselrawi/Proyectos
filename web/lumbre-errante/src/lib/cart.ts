"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Dish } from "./types";
import { addLine, orderTotal, setLineQty, type Line } from "./totals";

interface CartState {
  lines: Line[];
  add: (d: Dish) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (d) => set((s) => ({ lines: addLine(s.lines, d) })),
      setQty: (id, qty) => set((s) => ({ lines: setLineQty(s.lines, id, qty) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "cesta", version: 2, migrate: () => ({ lines: [] }) as unknown as CartState },
  ),
);

export const money = (n: number) => n.toFixed(2).replace(".", ",") + " €";
export const cartTotal = (lines: Line[]) => orderTotal(lines);
