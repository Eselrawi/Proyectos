import { SITE_URL } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import Smooth from "@/components/fx/Smooth";
import Cursor from "@/components/fx/Cursor";
import Preloader from "@/components/fx/Preloader";

const sans = DM_Sans({ subsets: ["latin"], variable: "--f-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--f-display" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Lumbre Errante · Cocina sin fronteras", template: "%s · Lumbre Errante" },
  description: "Restaurante ficticio de cocina del mundo en Madrid. Mira cada plato desde arriba en 3D, toca los ingredientes y pide desde la mesa. Demo.",
  applicationName: "Lumbre Errante",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Lumbre Errante · Cocina sin fronteras",
    description: "Carta en 3D: toca los ingredientes de cada plato y pide desde la mesa. Demo con restaurante ficticio.",
    locale: "es_ES",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Lumbre Errante" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#15120f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Preloader />
        <Smooth />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
