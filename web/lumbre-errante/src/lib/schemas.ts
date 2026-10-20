import { z } from "zod";

const clean = (max: number) => z.string().trim().min(1).max(max);

export const orderSchema = z.object({
  customer: clean(60),
  table: clean(30),
  note: z.string().trim().max(300).optional().default(""),
  items: z.array(z.object({ dishId: z.string().max(40), qty: z.number().int().min(1).max(20) })).min(1).max(30),
});

export const reservationSchema = z.object({
  name: clean(60),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,16}$/, "Teléfono no válido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  people: z.number().int().min(1).max(12),
});

export const statusSchema = z.object({ status: z.enum(["nuevo", "preparando", "listo"]) });
