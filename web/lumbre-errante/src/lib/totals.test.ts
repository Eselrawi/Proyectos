import { describe, expect, it } from "vitest";
import { addLine, orderTotal, priceItems, setLineQty } from "./totals";

const catalog = [
  { id: "paella", name: "Paella", price: 17.5 },
  { id: "hummus", name: "Hummus", price: 7.5 },
  { id: "ramen", name: "Ramen", price: 13.9 },
];

describe("carrito", () => {
  it("añade un plato nuevo con cantidad 1", () => {
    expect(addLine([], catalog[0])).toEqual([{ dishId: "paella", name: "Paella", price: 17.5, qty: 1 }]);
  });

  it("suma cantidad si el plato ya está", () => {
    const l = addLine(addLine([], catalog[0]), catalog[0]);
    expect(l).toHaveLength(1);
    expect(l[0].qty).toBe(2);
  });

  it("limita a 20 unidades", () => {
    let l = addLine([], catalog[0]);
    for (let i = 0; i < 40; i++) l = addLine(l, catalog[0]);
    expect(l[0].qty).toBe(20);
  });

  it("cantidad 0 o negativa quita la línea", () => {
    const l = addLine([], catalog[0]);
    expect(setLineQty(l, "paella", 0)).toEqual([]);
    expect(setLineQty(l, "paella", -3)).toEqual([]);
  });

  it("setLineQty cambia la cantidad y redondea hacia abajo", () => {
    const l = addLine([], catalog[0]);
    expect(setLineQty(l, "paella", 3.9)[0].qty).toBe(3);
  });
});

describe("totales", () => {
  it("suma sin errores de coma flotante", () => {
    expect(orderTotal([{ price: 13.9, qty: 3 }])).toBe(41.7);
    expect(orderTotal([{ price: 0.1, qty: 3 }])).toBe(0.3);
  });

  it("pedido vacío vale 0", () => {
    expect(orderTotal([])).toBe(0);
  });

  it("el servidor ignora precios y nombres que mande el cliente", () => {
    const raw = [{ dishId: "paella", qty: 2, price: 0.01, name: "gratis" } as { dishId: string; qty: number }];
    const items = priceItems(raw, catalog);
    expect(items).toEqual([{ dishId: "paella", name: "Paella", price: 17.5, qty: 2 }]);
    expect(orderTotal(items)).toBe(35);
  });

  it("descarta platos que no existen y cantidades inválidas", () => {
    const items = priceItems(
      [{ dishId: "inexistente", qty: 1 }, { dishId: "ramen", qty: 0 }, { dishId: "ramen", qty: Number.NaN }, { dishId: "hummus", qty: 1 }],
      catalog,
    );
    expect(items.map((i) => i.dishId)).toEqual(["hummus"]);
  });

  it("agrupa líneas repetidas del mismo plato", () => {
    const items = priceItems([{ dishId: "ramen", qty: 1 }, { dishId: "ramen", qty: 2 }], catalog);
    expect(items).toEqual([{ dishId: "ramen", name: "Ramen", price: 13.9, qty: 3 }]);
  });
});
