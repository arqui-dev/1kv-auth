"use client";

import { useMemo, useState } from "react";
import { DEFAULT_PRODUCTS, trackUsage } from "../utils/access";
import { Product } from "../types/subscription";

type PricingTableProps = {
  products?: Product[];
  onSelectPlan?: (slug: string) => void;
};

const PricingTable = ({ products = DEFAULT_PRODUCTS, onSelectPlan }: PricingTableProps) => {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const visibleProducts = useMemo(() => products.filter((product) => product.isActive !== false), [products]);

  const handleSelect = async (product: Product) => {
    setBusySlug(product.slug);
    try {
      await trackUsage(product.slug, "plan_selected", { source: "pricing_table" });
      onSelectPlan?.(product.slug);
      window.location.assign("https://1kvideos.com/");
    } catch (error) {
      console.error("[Pricing] Failed to redirect", error);
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {visibleProducts.map((product) => (
        <div
          key={product.slug}
          className={`relative flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl ring-1 ring-white/5 ${
            product.isBundle ? "border-orange-400/50 bg-gradient-to-br from-amber-900/50 via-slate-900/60 to-slate-950" : ""
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-orange-300/80">
                {product.isBundle ? "Pacote completo" : "Produto"}
              </p>
            </div>
            <h3 className="text-2xl font-semibold text-white">{product.name}</h3>
            <p className="text-sm text-slate-300">{product.description}</p>
            {product.isBundle && (
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-orange-100">
                Inclui: {product.bundleItems.join(", ")}
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSelect(product)}
              disabled={busySlug === product.slug}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busySlug === product.slug ? "Abrindo..." : "Escolher plano"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PricingTable;
