import type { Metadata } from "next";
import Doc from "@/components/site/Doc";

export const metadata: Metadata = { title: "Cookies" };

export default function Cookies() {
  return (
    <Doc title="Cookies">
      <p>Esta web <b>no usa cookies de terceros, ni analítica, ni publicidad</b>, así que no hay banner que aceptar.</p>
      <h2>Qué se guarda en tu dispositivo</h2>
      <ul>
        <li><code>cesta</code> (almacenamiento local): los platos de tu cesta, para que no se pierdan al recargar.</li>
        <li><code>mesa</code> y <code>hint-ingredientes</code> (almacenamiento local): el número de mesa del QR y si ya viste la pista «Toca un ingrediente».</li>
        <li><code>admin</code> (cookie técnica, solo en el panel con contraseña): mantiene la sesión del personal 12 horas.</li>
      </ul>
      <p>Son estrictamente necesarias para el funcionamiento y puedes borrarlas desde tu navegador cuando quieras.</p>
    </Doc>
  );
}
