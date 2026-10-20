import type { Metadata } from "next";
import Doc from "@/components/site/Doc";
import { owner } from "@/lib/owner";

export const metadata: Metadata = { title: "Aviso legal y condiciones de uso" };

export default function Legal() {
  return (
    <Doc title="Aviso legal y condiciones de uso">
      <p>
        Lumbre Errante es un restaurante <b>ficticio</b>. Esta web es una demostración técnica de una carta digital en 3D para restaurantes. Ni el local, ni la dirección, ni el teléfono, ni los precios, ni las reservas son reales, y no se presta ningún servicio de restauración ni se cobra ningún importe.
      </p>
      <h2>Titular</h2>
      <p>
        Titular del sitio y de sus contenidos: {owner.name}.{" "}
        {owner.email ? <>Contacto: <a href={`mailto:${owner.email}`}>{owner.email}</a>.</> : "Contacto: a través del botón «Quiero esto para mi restaurante»."} Sitio de demostración sin actividad comercial propia; se ofrece con fines de presentación a posibles clientes.
      </p>
      <h2>Propiedad intelectual e industrial</h2>
      <p>
        © {owner.year} {owner.name}. Todos los derechos reservados. El diseño, la maquetación, el código fuente, las animaciones, los textos, el logotipo y la marca «Lumbre Errante» son obra original del titular y están protegidos por la normativa de propiedad intelectual e industrial. No se concede ninguna licencia de uso, copia, modificación ni distribución sobre ellos.
      </p>
      <p>
        Los modelos 3D de los platos son escaneos de terceros publicados en Sketchfab con licencia Creative Commons Atribución (CC BY 4.0). Conservan la autoría y licencia de sus creadores, que figuran en la página de <a href="/creditos">créditos</a>. La licencia de esos modelos no se extiende al resto de la web.
      </p>
      <h2>Uso permitido</h2>
      <ul>
        <li>Puedes navegar la web y probar sus funciones para valorar el servicio.</li>
        <li>Queda prohibido copiar, reproducir, extraer (scraping), descompilar o reutilizar total o parcialmente el diseño, el código o los contenidos sin autorización escrita del titular.</li>
        <li>Queda prohibido usar la web para fines ilícitos, sobrecargar el servicio o intentar acceder a zonas no públicas.</li>
      </ul>
      <h2>Alérgenos y precios</h2>
      <p>La información de alérgenos y los precios son ejemplos y no deben usarse como referencia real. En un restaurante en funcionamiento, confirma siempre los alérgenos con el personal.</p>
      <h2>Responsabilidad</h2>
      <p>El titular no garantiza la disponibilidad continua de la demo ni responde de los daños derivados de su uso. Los enlaces a terceros se ofrecen a título informativo.</p>
      <h2>Legislación y jurisdicción</h2>
      <p>Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la ley.</p>
      <h2>Más información</h2>
      <p>Consulta también la <a href="/privacidad">política de privacidad</a> y la <a href="/cookies">política de cookies</a>.</p>
    </Doc>
  );
}
