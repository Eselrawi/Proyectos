import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

export default function Doc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12 pb-24">
        <Link href="/" className="text-sm text-crema2 hover:text-crema">← Inicio</Link>
        <h1 className="font-display mt-3 text-3xl font-semibold">{title}</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-crema/85 [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-crema [&_a]:text-oro [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      </main>
      <Footer />
    </>
  );
}
