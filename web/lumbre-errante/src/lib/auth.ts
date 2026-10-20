import { cookies } from "next/headers";
import { env } from "./env";

/** Admin real: cookie con la contraseña. En modo demo el panel está abierto (los datos son ficticios). */
export async function isAdmin() {
  if (env.demo) return true;
  return (await cookies()).get("admin")?.value === env.ADMIN_PASSWORD;
}

export const checkPassword = (p: string) => p === env.ADMIN_PASSWORD;
export const adminCookieValue = () => env.ADMIN_PASSWORD;
