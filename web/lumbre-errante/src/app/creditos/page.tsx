import type { Metadata } from "next";
import Doc from "@/components/site/Doc";
import ambience from "../../../data/ambience-sources.json";
import { dishes } from "@/lib/dishes";

export const metadata: Metadata = { title: "Créditos" };

type Src = { title: string; page: string; author: string; license: string };

export default function Creditos() {
  const a = ambience as Record<string, Src>;
  const row = (label: string, p: Src) => (
    <li key={label}>
      <b>{label}</b>: {p.author || "autor desconocido"} · {p.license} · <a href={p.page}>{p.title.replace("File:", "")}</a>
    </li>
  );
  return (
    <Doc title="Créditos">
      <p>Los platos son modelos 3D escaneados (fotogrametría) publicados en <a href="https://sketchfab.com">Sketchfab</a> con licencia <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Se han reducido de peso y se muestran sin otros cambios.</p>
      <h2>Platos</h2>
      <ul>
        {dishes.map((d) => (
          <li key={d.id}>
            <b>{d.name}</b>: {d.credit.author} · CC BY 4.0 · <a href={`https://sketchfab.com/3d-models/${d.credit.uid}`}>{d.credit.title}</a>
          </li>
        ))}
      </ul>
      <h2>Fotos del local</h2>
      <p>Wikimedia Commons, licencia CC BY-SA 4.0: cita de autoría y licencia obligatoria.</p>
      <ul>{Object.entries(a).map(([k, p]) => row(k, p))}</ul>
      <h2>Escena y decoración</h2>
      <p>Mesa, vapor, luz y viñeta: generados en el navegador, sin recursos externos.</p>
    </Doc>
  );
}
