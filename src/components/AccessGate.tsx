"use client";

import { ReactNode, useEffect } from "react";
import { useUserAccess } from "../hooks/useUserAccess";
import { trackUsage } from "../utils/access";
import { ProductSlug } from "../types/subscription";
import EmptyStateUpgrade from "./EmptyStateUpgrade";

type AccessGateProps = {
  productSlug: ProductSlug;
  children: ReactNode;
  fallback?: ReactNode;
  onDenied?: () => void;
};

const AccessGate = ({ productSlug, children, fallback, onDenied }: AccessGateProps) => {
  const { hasAccess, loading, error } = useUserAccess(productSlug);

  useEffect(() => {
    if (!loading && !hasAccess) {
      onDenied?.();
      trackUsage(productSlug, "access_denied", { component: "AccessGate" }).catch(() => null);
    }
  }, [hasAccess, loading, onDenied, productSlug]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-slate-200">
        Verificando permissões...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-6 text-sm text-red-200">
        Não foi possível validar seu acesso. {error}
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || <EmptyStateUpgrade productSlug={productSlug} />;
  }

  return <>{children}</>;
};

export default AccessGate;
