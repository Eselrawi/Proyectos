import { Suspense } from "react";
import { redirect } from "next/navigation";

// Cada QR de mesa apunta aquí: abre la carta y deja la mesa preparada en la cesta.
async function Go({ params }: { params: Promise<{ n: string }> }): Promise<React.ReactNode> {
  const { n } = await params;
  const mesa = Number.parseInt(n, 10);
  if (!Number.isFinite(mesa) || mesa < 1 || mesa > 99) redirect("/#carta");
  redirect(`/?mesa=${mesa}#carta`);
}

export default function Mesa({ params }: { params: Promise<{ n: string }> }) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}
