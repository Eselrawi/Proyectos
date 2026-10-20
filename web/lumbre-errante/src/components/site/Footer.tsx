import Image from "next/image";
import Link from "next/link";
import { restaurant } from "@/lib/dishes";
import { owner } from "@/lib/owner";

export default function Footer() {
  return (
    <footer className="border-t border-linea bg-carbon pb-24 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/brand/logo-dark.svg" alt="" width={30} height={30} />
            <span className="font-display text-lg font-semibold">Lumbre Errante</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-crema2">{restaurant.slogan}.</p>
        </div>
        <nav aria-label="Legal" className="text-sm">
          <h3 className="mb-2 text-xs tracking-widest text-crema2 uppercase">Legal</h3>
          <ul className="space-y-1.5">
            <li><Link href="/legal" className="hover:text-oro">Aviso legal y condiciones</Link></li>
            <li><Link href="/privacidad" className="hover:text-oro">Privacidad</Link></li>
            <li><Link href="/cookies" className="hover:text-oro">Cookies</Link></li>
            <li><Link href="/creditos" className="hover:text-oro">Créditos de fotos</Link></li>
            <li><Link href="/ra" className="hover:text-oro">Ver platos en RA</Link></li>
          </ul>
        </nav>
        <div className="text-sm text-crema2">
          <h3 className="mb-2 text-xs tracking-widest uppercase">Sobre esta web</h3>
          <p>{restaurant.notice}</p>
        </div>
      </div>
      <p className="mx-auto max-w-6xl border-t border-linea/60 px-4 pt-5 text-xs text-crema2">
        © {owner.year} {owner.name}. Todos los derechos reservados. Diseño, código y contenidos protegidos; prohibida su copia o reutilización sin permiso.
      </p>
    </footer>
  );
}
