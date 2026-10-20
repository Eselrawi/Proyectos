import { SITE_URL } from "@/lib/site";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import RaViewer from "@/components/RaViewer";

export const metadata: Metadata = {
  title: "Ver los platos en realidad aumentada",
  description: "Escanea el código con tu móvil y pon cada plato sobre tu mesa en realidad aumentada.",
};

const BASE = SITE_URL;

async function Viewer({ searchParams }: { searchParams: Promise<{ plato?: string }> }): Promise<React.ReactNode> {
  const { plato } = await searchParams;
  return <RaViewer initial={plato} />;
}

export default async function Ra({ searchParams }: { searchParams: Promise<{ plato?: string }> }) {
  const svg = await QRCode.toString(`${BASE}/ra`, { type: "svg", margin: 1, color: { dark: "#15120f", light: "#f4ead8" } });
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/#carta" className="text-sm text-crema2">← Volver a la carta</Link>
      <h1 className="font-display mt-4 text-3xl font-semibold sm:text-4xl">Pon el plato en tu mesa</h1>
      <p className="mt-2 max-w-xl text-crema/85">
        Elige un plato y pulsa «Ver en mi mesa». Tu móvil usa la cámara para colocarlo en tamaño real sobre la mesa. Funciona en iPhone y en Android reciente.
      </p>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <Suspense fallback={<div className="skeleton aspect-square w-full max-w-md rounded-3xl" />}>
          <Viewer searchParams={searchParams} />
        </Suspense>
        <aside className="mx-auto hidden w-48 rounded-2xl border border-linea bg-crema p-3 text-center text-carbon md:block">
          <div className="[&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="mt-1 text-xs font-medium">Escanéalo con el móvil para verlo en RA</p>
        </aside>
      </div>
    </main>
  );
}
