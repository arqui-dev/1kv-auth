"use client";

import { useState } from "react";
import { ProductSlug } from "../types/subscription";

type EmptyStateUpgradeProps = {
  productSlug?: ProductSlug;
  title?: string;
  description?: string;
  className?: string;
  onUpgrade?: () => Promise<void> | void;
};

const EmptyStateUpgrade = ({
  productSlug = "bundle_complete",
  title = "Desbloqueie esta automação",
  description = "Sua conta está ativa, mas esta automação precisa de uma assinatura. Faça upgrade para continuar.",
  className = "",
  onUpgrade
}: EmptyStateUpgradeProps) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setBusy(true);
    setError(null);
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else {
        // Fallback: leva para a landing de planos
        window.location.assign("https://1kvideos.com/");
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível abrir a página de upgrade.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-orange-500/20 bg-gradient-to-r from-slate-900/80 via-slate-900/70 to-amber-900/40 p-6 text-white shadow-xl ${className}`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-300/80">Acesso limitado</p>
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-200/80">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-5 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleUpgrade}
            disabled={busy}
            type="button"
          >
            {busy ? "Abrindo..." : "Fazer upgrade"}
          </button>
          <div className="text-xs text-slate-300">
            Sem acesso às automações? Conheça os planos e libere o uso completo.
          </div>
        </div>
        {error && <div className="rounded-xl bg-red-900/40 px-4 py-2 text-sm text-red-200">{error}</div>}
      </div>
    </div>
  );
};

export default EmptyStateUpgrade;
