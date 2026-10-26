import { ROUTES } from "@/constants/routes";

export type AuthMode = "login" | "register";

export function getAuthMode(pathname: string): AuthMode {
  return pathname.startsWith(ROUTES.register) ? "register" : "login";
}
