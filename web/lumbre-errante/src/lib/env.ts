import { z } from "zod";

const schema = z.object({
  ADMIN_PASSWORD: z.string().min(4).default("demo"),
  RESEND_API_KEY: z.string().optional(),
  RESTAURANT_EMAIL: z.string().email().optional().or(z.literal("")),
  NEXT_PUBLIC_DEMO: z.enum(["true", "false"]).default("true"),
});

const parsed = schema.safeParse({
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || undefined,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  RESTAURANT_EMAIL: process.env.RESTAURANT_EMAIL || undefined,
  NEXT_PUBLIC_DEMO: process.env.NEXT_PUBLIC_DEMO || undefined,
});

if (!parsed.success) throw new Error("Variables de entorno inválidas: " + parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "));

export const env = { ...parsed.data, demo: parsed.data.NEXT_PUBLIC_DEMO !== "false" };
