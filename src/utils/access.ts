import { supabase } from "../supabaseClient";
import { UserAccess, UserRole } from "../types/access";
import { Product, ProductSlug, UsageEvent, UserProductAccess } from "../types/subscription";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    slug: "1kv_videos",
    name: "Gerador de Vídeos",
    description: "Automação principal para criação de vídeos faceless.",
    isBundle: false,
    bundleItems: [],
    isActive: true
  },
  {
    slug: "1kv_narration",
    name: "Narração com IA",
    description: "Geração de narrações com IA e ajustes de voz.",
    isBundle: false,
    bundleItems: [],
    isActive: true
  },
  {
    slug: "1kv_captions",
    name: "Legendas Automáticas",
    description: "Criação e sincronização de legendas.",
    isBundle: false,
    bundleItems: [],
    isActive: true
  },
  {
    slug: "bundle_complete",
    name: "Pacote Completo",
    description: "Inclui gerador de vídeos, narração e legendas.",
    isBundle: true,
    bundleItems: ["1kv_videos", "1kv_narration", "1kv_captions"],
    isActive: true
  }
];

const DEFAULT_ACCESS: UserProductAccess[] = DEFAULT_PRODUCTS.map((product) => ({
  product_slug: product.slug,
  product_name: product.name,
  access_via: product.isBundle ? "bundle" : "subscription",
  status: "active",
  current_period_end: null,
  bundle_source: product.isBundle ? product.slug : null,
  role: "user"
}));

export async function checkUserAccess(productSlug: ProductSlug): Promise<UserAccess> {
  const { data, error } = await supabase.rpc("has_access_to_product", {
    p_product_slug: productSlug
  });

  if (error) {
    console.error("[Access] Failed to check access", error);
    throw error;
  }

  const hasAccess = Boolean(data);

  return {
    productSlug,
    hasAccess,
    source: hasAccess ? "subscription" : null,
    status: null
  };
}

export async function getUserProducts(): Promise<UserProductAccess[]> {
  const { data, error } = await supabase.rpc("get_user_products");

  if (error) {
    console.error("[Access] Failed to fetch user products", error);
    throw error;
  }

  return (data || []) as UserProductAccess[];
}

export async function trackUsage(
  productSlug: ProductSlug,
  eventType: string,
  metadata: Record<string, any> = {}
): Promise<UsageEvent | null> {
  // If the user is not authenticated, skip logging to avoid policy failures
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("usage_events")
    .insert([{ product_slug: productSlug, event_type: eventType, metadata }])
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Access] Failed to track usage", error);
    return null;
  }

  return data as UsageEvent;
}

export function normalizeAccessRecords(records: UserProductAccess[]): UserAccess[] {
  return records.map((record) => ({
    productSlug: record.product_slug,
    hasAccess: true,
    source: record.access_via,
    status: record.status,
    currentPeriodEnd: record.current_period_end,
    bundleSource: record.bundle_source,
    role: (record.role as UserRole) || "user"
  }));
}
