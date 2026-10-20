import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth";
import Login from "./Login";
import Panel from "./Panel";

export const metadata: Metadata = { title: "Panel del restaurante", robots: { index: false } };

async function Gate() {
  return (await isAdmin()) ? <Panel /> : <Login />;
}

export default function Admin() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10"><div className="skeleton h-40 rounded-2xl" /></div>}>
      <Gate />
    </Suspense>
  );
}
