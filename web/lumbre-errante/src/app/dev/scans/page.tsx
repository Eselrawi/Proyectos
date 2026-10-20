import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Scans from "./Scans";

export const metadata: Metadata = { title: "Modelos escaneados", robots: { index: false } };

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Scans />;
}
