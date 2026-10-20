export type IngredientCategory = "proteína" | "hoja" | "guarnición" | "salsa" | "topping";

export interface Ingredient {
  id: string;
  position: string; // "x y z" en el espacio del modelo (hotspot de model-viewer)
  normal: string;
  name: string;
  category: IngredientCategory;
  description: string;
  allergens: string[];
  components?: string[];
}

export interface Dish {
  id: string;
  name: string;
  country: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  star: boolean;
  ingredients: Ingredient[];
  model: string; // glb optimizado de public/scans
  poster: string; // vista cenital con fondo transparente
  orientation?: string; // model-viewer, "roll pitch yaw"
  orbit?: string; // cámara de la ficha
  credit: { title: string; author: string; uid: string };
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = "nuevo" | "preparando" | "listo";

export interface Order {
  id: string;
  createdAt: number;
  status: OrderStatus;
  customer: string;
  table: string;
  note: string;
  items: OrderItem[];
  total: number;
  demo?: boolean;
}

export const ALLERGENS: Record<string, string> = {
  gluten: "Gluten",
  crustaceos: "Crustáceos",
  huevo: "Huevo",
  pescado: "Pescado",
  cacahuetes: "Cacahuetes",
  soja: "Soja",
  lacteos: "Lácteos",
  "frutos-cascara": "Frutos de cáscara",
  apio: "Apio",
  mostaza: "Mostaza",
  sesamo: "Sésamo",
  sulfitos: "Sulfitos",
  altramuces: "Altramuces",
  moluscos: "Moluscos",
};

export const TAGS: Record<string, string> = {
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  "sin-gluten": "Sin gluten",
};
