export type ProductSlug = "1kv_videos" | "1kv_narration" | "1kv_captions" | "bundle_complete" | string;

export interface Product {
  slug: ProductSlug;
  name: string;
  description?: string | null;
  isBundle: boolean;
  bundleItems: ProductSlug[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export interface Subscription {
  id: string;
  userId: string;
  productSlug: ProductSlug;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  cancelAt?: string | null;
  canceledAt?: string | null;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsageEvent {
  id: string;
  userId: string;
  productSlug: ProductSlug;
  eventType: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface UserProductAccess {
  product_slug: ProductSlug;
  product_name: string;
  access_via: "role" | "subscription" | "bundle";
  status: SubscriptionStatus | null;
  current_period_end: string | null;
  bundle_source: ProductSlug | null;
  role: string | null;
}
