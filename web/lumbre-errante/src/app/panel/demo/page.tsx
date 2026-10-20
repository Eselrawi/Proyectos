import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/app/admin/Panel";

export const metadata: Metadata = { title: "Panel de cocina (demo)", robots: { index: false } };

export default function PanelDemo() {
  if (process.env.NEXT_PUBLIC_DEMO === "false") notFound();
  return <Panel demo />;
}
