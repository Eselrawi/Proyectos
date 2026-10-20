import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import QRCode from "qrcode";

export const metadata: Metadata = { title: "QR para imprimir", robots: { index: false } };

const BASE = SITE_URL;
const qr = (text: string) => QRCode.toString(text, { type: "svg", margin: 1, color: { dark: "#15120f", light: "#ffffff" } });

export default async function Qr() {
  const demo = await qr(BASE);
  const ra = await qr(`${BASE}/ra`);
  const mesas = await Promise.all(Array.from({ length: 8 }, async (_, i) => ({ n: i + 1, svg: await qr(`${BASE}/mesa/${i + 1}`) })));
  return (
    <main className="mx-auto max-w-3xl bg-white px-6 py-8 text-carbon print:p-0">
      <h1 className="font-display text-3xl font-semibold">Lumbre Errante · Carta 3D</h1>
      <p className="mt-1 text-sm">Escanea, toca los ingredientes y pide desde tu móvil. <b>Demo con restaurante ficticio.</b></p>
      <div className="mt-6 grid place-items-center">
        <div className="w-72 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: demo }} />
        <p className="mt-2 text-sm break-all">{BASE}</p>
      </div>
      <h2 className="font-display mt-10 text-xl font-semibold">Realidad aumentada</h2>
      <p className="text-sm">Con este código el cliente pone el plato sobre su mesa con la cámara del móvil.</p>
      <div className="mt-3 w-48 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: ra }} />
      <h2 className="font-display mt-10 text-xl font-semibold print:break-before-page">QR por mesa</h2>
      <p className="text-sm">Cada código abre la carta con la mesa ya anotada en el pedido.</p>
      <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {mesas.map((m) => (
          <li key={m.n} className="text-center">
            <div className="[&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: m.svg }} />
            <p className="font-display text-lg font-semibold">Mesa {m.n}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
