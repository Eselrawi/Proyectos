import data from "../../data/menu.json";
import restaurantData from "../../data/restaurant.json";
import type { Category, Dish } from "./types";

type Raw = Omit<Dish, "model" | "poster">;

export const dishes: Dish[] = (data.dishes as Raw[]).map((d) => ({ ...d, model: `/scans/${d.id}.glb`, poster: `/scans/${d.id}-poster.webp` }));
export const categories = data.categories as Category[];
export const restaurant = restaurantData;

/** Platos con alérgeno declarado en cualquiera de sus ingredientes. */
export const dishAllergens = (d: Dish) => [...new Set(d.ingredients.flatMap((i) => i.allergens))];
