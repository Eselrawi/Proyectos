"use client";
import { createElement, useEffect, useRef, useState } from "react";
import { SCANS } from "../../../../scripts/scans.mjs";

type MV = HTMLElement & {
  toBlob: (o?: { mimeType?: string; qualityArgument?: number; idealAspect?: boolean }) => Promise<Blob>;
  positionAndNormalFromPoint: (x: number, y: number) => { position: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number } } | null;
  updateFraming: () => Promise<void>;
};

/**
 * Herramienta de desarrollo para los modelos escaneados: orientar cada plato, sacar su póster cenital
 * y colocar los puntos de ingredientes (se manejan desde la consola con window.__scans).
 */
export default function Scans() {
  const [mv, setMv] = useState<MV | null>(null);
  const ref = useRef<MV | null>(null);
  useEffect(() => { ref.current = mv; }, [mv]);
  const [ready, setReady] = useState(false);
  const [id, setId] = useState("pizza");
  const [orientation, setOrientation] = useState("0deg 0deg 0deg");

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__scans = {
      set: (nid: string, ori?: string) => { setId(nid); if (ori) setOrientation(ori); },
      el: () => ref.current,
      pick: (x: number, y: number) => {
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        const p = el.positionAndNormalFromPoint(r.left + x, r.top + y);
        return p && { position: [p.position.x, p.position.y, p.position.z].map((n) => +n.toFixed(4)).join(" "), normal: [p.normal.x, p.normal.y, p.normal.z].map((n) => +n.toFixed(3)).join(" ") };
      },
      poster: async (nid: string) => {
        const el = ref.current!;
        const blob = await el.toBlob({ mimeType: "image/webp", qualityArgument: 0.88, idealAspect: true });
        const r = await fetch(`/api/dev/save?name=${nid}-poster.webp`, { method: "POST", body: blob });
        return r.status;
      },
    };
  }, []);

  return (
    <main className="p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <select value={id} onChange={(e) => setId(e.target.value)} className="rounded border border-linea bg-carbon2 p-1">
          {Object.keys(SCANS).map((k) => <option key={k}>{k}</option>)}
        </select>
        <input value={orientation} onChange={(e) => setOrientation(e.target.value)} className="w-56 rounded border border-linea bg-carbon2 p-1" aria-label="Orientación" />
      </div>
      {ready &&
        createElement("model-viewer", {
          ref: setMv,
          key: id + orientation,
          id: "mv",
          src: `/scans/${id}.glb`,
          orientation,
          "camera-controls": true,
          "camera-orbit": "0deg 0deg auto",
          "field-of-view": "30deg",
          "shadow-intensity": "0",
          exposure: "1.1",
          style: { width: 640, height: 640, background: "transparent" },
        })}
    </main>
  );
}
