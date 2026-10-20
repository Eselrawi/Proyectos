import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  return ["", "/cesta", "/legal", "/privacidad", "/cookies", "/creditos", "/ra"].map((p) => ({ url: base + p }));
}
