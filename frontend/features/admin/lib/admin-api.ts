import { clientHttp } from "@/lib/http/client";

export type SubStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
export type Billing = "monthly" | "yearly";

export interface AdminSubscription {
  plan: string;
  planName: string;
  billing: Billing;
  status: SubStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  method: string | null;
  /** จัดการผ่าน Stripe อยู่ การแก้ที่นี่อาจถูกทับเมื่อ Stripe ส่งสถานะใหม่ */
  stripeManaged: boolean;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Overview {
  totals: {
    owners: number;
    banned: number;
    shops: number;
    suspendedShops: number;
    trialing: number;
    active: number;
    pastDue: number;
    canceled: number;
    mrr: number;
    ordersToday: number;
    sales30d: number;
    orders30d: number;
  };
  signups: { day: string; count: number }[];
  plans: { plan: string; name: string; count: number }[];
  recent: { id: string; email: string; name: string; createdAt: string; banned: boolean }[];
  expiring: {
    userId: string;
    email: string;
    name: string;
    status: SubStatus;
    planName: string;
    endsAt: string | null;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  createdAt: string;
  banned: boolean;
  banReason: string;
  shops: number;
  subscription: AdminSubscription | null;
}

export interface AdminLog {
  id: string;
  admin: string;
  action: string;
  targetType: string;
  targetId: string;
  target: string;
  detail: string;
  createdAt: string;
}

export interface UserShop {
  id: string;
  name: string;
  branch: string;
  isOpen: boolean;
  suspended: boolean;
  suspendReason: string;
  tables: number;
  staff: number;
  orders: number;
  menuItems: number;
  createdAt: string;
}

export interface UserDetail extends Omit<AdminUser, "shops"> {
  bannedAt: string | null;
  limits: { tables: number | null; staff: number | null; branches: number };
  shops: UserShop[];
  logs: AdminLog[];
}

export interface AdminShop {
  id: string;
  name: string;
  branch: string;
  isOpen: boolean;
  suspended: boolean;
  suspendReason: string;
  createdAt: string;
  tables: number;
  staff: number;
  orders: number;
  owner: { id: string; email: string; name: string; banned: boolean };
}

export interface AdminPlan {
  id: string;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  tablesLimit: number | null;
  staffLimit: number | null;
  branchesLimit: number;
  active: boolean;
  sortOrder: number;
  /** ข้อความปุ่มบนการ์ดราคา */
  cta: string;
  /** จุดเด่นที่แสดงเป็นรายการ */
  perks: string[];
  /** แพ็กเกจแนะนำ (ไฮไลต์และเป็นค่าเริ่มต้นตอนเลือก) */
  featured: boolean;
  subscribers: number;
}
export type PlanBody = Omit<AdminPlan, "id" | "subscribers">;

export interface SystemSettings {
  trialDays: number;
  /** รายปีแถมฟรีกี่เดือน */
  yearlyFreeMonths: number;
  supportEmail: string;
  supportPhone: string;
  supportLine: string;
}

export interface SubscriptionPatch {
  plan?: string;
  billing?: Billing;
  status?: SubStatus;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  extendDays?: number;
  cancelAtPeriodEnd?: boolean;
}

export interface ListParams {
  q?: string;
  status?: string;
  plan?: string;
  page?: number;
}

/** เรียก API ผู้ดูแลระบบ (/admin/*) Client Component เท่านั้น */
export const adminApi = {
  overview: (signal?: AbortSignal) => clientHttp.get<Overview>("/admin/overview", { signal }).then((r) => r.data),

  users: (params: ListParams, signal?: AbortSignal) =>
    clientHttp.get<Paged<AdminUser>>("/admin/users", { params, signal }).then((r) => r.data),
  user: (id: string, signal?: AbortSignal) =>
    clientHttp.get<UserDetail>(`/admin/users/${id}`, { signal }).then((r) => r.data),
  ban: (id: string, reason: string) => clientHttp.post(`/admin/users/${id}/ban`, { reason }),
  unban: (id: string) => clientHttp.post(`/admin/users/${id}/unban`),
  updateSubscription: (id: string, patch: SubscriptionPatch) =>
    clientHttp.patch<AdminSubscription>(`/admin/users/${id}/subscription`, patch).then((r) => r.data),

  shops: (params: ListParams, signal?: AbortSignal) =>
    clientHttp.get<Paged<AdminShop>>("/admin/shops", { params, signal }).then((r) => r.data),
  suspendShop: (id: string, reason: string) => clientHttp.post(`/admin/shops/${id}/suspend`, { reason }),
  unsuspendShop: (id: string) => clientHttp.post(`/admin/shops/${id}/unsuspend`),

  plans: (signal?: AbortSignal) => clientHttp.get<AdminPlan[]>("/admin/plans", { signal }).then((r) => r.data),
  createPlan: (body: PlanBody & { id: string }) => clientHttp.post("/admin/plans", body),
  updatePlan: (id: string, body: PlanBody) => clientHttp.put(`/admin/plans/${id}`, body),
  deletePlan: (id: string) => clientHttp.delete(`/admin/plans/${id}`),

  settings: (signal?: AbortSignal) => clientHttp.get<SystemSettings>("/admin/settings", { signal }).then((r) => r.data),
  saveSettings: (body: SystemSettings) => clientHttp.put<SystemSettings>("/admin/settings", body).then((r) => r.data),

  logs: (page: number, signal?: AbortSignal) =>
    clientHttp.get<Paged<AdminLog>>("/admin/logs", { params: { page }, signal }).then((r) => r.data),
};
