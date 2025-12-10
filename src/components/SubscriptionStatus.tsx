"use client";

import EmptyStateUpgrade from "./EmptyStateUpgrade";
import { useUserAccess } from "../hooks/useUserAccess";
import { UserProductAccess } from "../types/subscription";

const statusStyles: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/10",
  trialing: "text-amber-200 bg-amber-500/10",
  past_due: "text-red-200 bg-red-500/10",
  canceled: "text-slate-200 bg-slate-600/20",
  incomplete: "text-orange-200 bg-orange-500/10"
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
};

const SubscriptionStatus = () => {
  const { products, loading, error, refresh } = useUserAccess();

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
        Carregando assinaturas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-900/30 p-6 text-sm text-red-200">
        Não foi possível carregar suas assinaturas: {error}
      </div>
    );
  }

  if (!products.length) {
    return <EmptyStateUpgrade title="Nenhuma assinatura ativa" description="Escolha um plano para liberar as automações." />;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-300/80">Licenciamento</p>
          <h3 className="text-2xl font-semibold text-white">Suas assinaturas</h3>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-xl border border-white/10 px-3 py-1 text-sm text-orange-100 transition hover:border-orange-300/60 hover:text-white"
        >
          Atualizar
        </button>
      </div>
      <div className="space-y-3">
        {products.map((subscription: UserProductAccess) => (
          <div
            key={`${subscription.product_slug}-${subscription.access_via}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-white">{subscription.product_name}</p>
              <p className="text-xs text-slate-300">
                Acesso via {subscription.access_via}
                {subscription.bundle_source ? ` (${subscription.bundle_source})` : ""}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  statusStyles[subscription.status || ""] || "bg-white/10 text-slate-100"
                }`}
              >
                {subscription.status || "active"}
              </span>
              <div className="text-xs text-slate-300">Expira em {formatDate(subscription.current_period_end)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
