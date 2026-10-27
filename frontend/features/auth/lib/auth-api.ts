import type { BillingCycle, PlanId } from "@/features/landing/data";
import { clientHttp } from "@/lib/http/client";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string | null;
  billingCycle: "MONTHLY" | "YEARLY" | null;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptedTerms: true;
  marketingConsent: boolean;
  plan?: PlanId;
  billing?: BillingCycle;
}

/** เรียก backend ฝั่ง auth (Client Component เท่านั้น) */
export const authApi = {
  register: (payload: RegisterPayload) =>
    clientHttp.post<{ email: string }>("/auth/register", payload),

  verifyEmail: (email: string, code: string) =>
    clientHttp.post<{ user: SessionUser }>("/auth/verify-email", { email, code }),

  resendOtp: (email: string) => clientHttp.post("/auth/resend-otp", { email }),

  login: (email: string, password: string, remember: boolean) =>
    clientHttp.post<{ user: SessionUser }>("/auth/login", { email, password, remember }),

  me: () => clientHttp.get<{ user: SessionUser }>("/auth/me"),

  selectPlan: (plan: PlanId, billing: BillingCycle) =>
    clientHttp.put<{ user: SessionUser }>("/auth/plan", { plan, billing }),

  forgotPassword: (email: string) => clientHttp.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    clientHttp.post("/auth/reset-password", { token, password }),
};

/** อีเมลสะกดผิดบ่อย ช่วยซ่อนบางส่วนตอนแสดงในหน้ายืนยัน เช่น so***@gmail.com */
export function maskEmail(email: string) {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}
