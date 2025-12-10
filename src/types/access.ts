export type UserRole = "user" | "admin" | "superadmin";

export type AccessSource = "role" | "subscription" | "bundle" | null;

export interface UserAccess {
  productSlug: string;
  hasAccess: boolean;
  source: AccessSource;
  status?: string | null;
  currentPeriodEnd?: string | null;
  bundleSource?: string | null;
  role?: UserRole;
}
