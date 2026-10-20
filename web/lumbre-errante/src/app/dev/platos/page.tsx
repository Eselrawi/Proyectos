import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Platos from "./Platos";

export const metadata: Metadata = { title: "Revisión de platos", robots: { index: false } };

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Platos />;
}
