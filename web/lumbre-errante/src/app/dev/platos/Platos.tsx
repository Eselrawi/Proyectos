"use client";
import DishViewer from "@/components/DishViewer";
import { dishes } from "@/lib/dishes";

/** Herramienta de desarrollo: todos los platos con sus puntos, para revisar los ingredientes de un vistazo. */
export default function Platos() {
  return (
    <main className="grid grid-cols-3 gap-2 p-2">
      {dishes.map((d) => (
        <div key={d.id}>
          <p className="text-sm text-oro">{d.id} · {d.ingredients.length}</p>
          <DishViewer dish={d} compact />
        </div>
      ))}
    </main>
  );
}
