import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Review from "./Review";

export const metadata: Metadata = { title: "Revisión de máscaras", robots: { index: false } };

export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_REVIEW !== "1") notFound();
  return <Review />;
}
