import type { Metadata } from "next";
import Doc from "@/components/site/Doc";
import { owner } from "@/lib/owner";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function Privacidad() {
  return (
    <Doc title="Política de privacidad">
      <p>Esta demo guarda lo mínimo para funcionar y lo borra sola. Te lo explicamos conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).</p>
      <h2>Responsable</h2>
      <p>{owner.name}.{owner.email ? <> Contacto: <a href={`mailto:${owner.email}`}>{owner.email}</a>.</> : " Contacto: a través del botón «Quiero esto para mi restaurante»."}</p>
      <h2>Qué datos se tratan</h2>
      <ul>
        <li>Pedidos de prueba: nombre, mesa o teléfono, nota y platos elegidos.</li>
        <li>Reservas de prueba: nombre, teléfono, fecha, hora y número de personas.</li>
        <li>Dirección IP, solo en memoria y de forma temporal, para limitar el número de pedidos y reservas por persona. No se guarda en ningún registro.</li>
        <li>Si me escribes por correo o WhatsApp para pedir información, los datos que me envíes.</li>
      </ul>
      <h2>Para qué y con qué base legal</h2>
      <p>Pedidos y reservas: solo para mostrar cómo llegaría un pedido a la cocina; base legal, tu consentimiento al enviar el formulario. Contacto: responder a tu consulta; base legal, tu consentimiento o la aplicación de medidas precontractuales a petición tuya. No se toman decisiones automatizadas ni se elaboran perfiles.</p>
      <h2>Cuánto tiempo se conservan</h2>
      <p>Los pedidos y reservas de la demo se marcan como demo y se eliminan automáticamente a las 24 horas. Las consultas por correo o WhatsApp se conservan el tiempo necesario para atenderlas y, después, durante los plazos legales aplicables.</p>
      <h2>Destinatarios</h2>
      <p>No se ceden datos a terceros. La web se aloja en un proveedor de infraestructura (por ejemplo, Vercel) que trata los datos únicamente para prestar el alojamiento. Te recomendamos no escribir datos personales reales en la demo.</p>
      <h2>Tus derechos</h2>
      <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo al contacto indicado arriba. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">aepd.es</a>).</p>
      <p>Esta web no usa analítica ni publicidad. Consulta la <a href="/cookies">política de cookies</a>.</p>
    </Doc>
  );
}
