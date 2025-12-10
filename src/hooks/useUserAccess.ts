"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { checkUserAccess, getUserProducts, normalizeAccessRecords } from "../utils/access";
import { UserAccess } from "../types/access";
import { UserProductAccess } from "../types/subscription";

type AccessState = {
  loading: boolean;
  error?: string;
  products: UserProductAccess[];
  accessByProduct: Record<string, UserAccess>;
};

const initialState: AccessState = {
  loading: true,
  products: [],
  accessByProduct: {}
};

export function useUserAccess(targetProduct?: string) {
  const [state, setState] = useState<AccessState>(initialState);

  const refresh = useCallback(async () => {
    try {
      setState((current) => ({ ...current, loading: true, error: undefined }));

      const products = await getUserProducts();
      const accessRecords = normalizeAccessRecords(products);
      const accessByProduct = accessRecords.reduce<Record<string, UserAccess>>((acc, record) => {
        acc[record.productSlug] = record;
        return acc;
      }, {});

      setState({
        loading: false,
        products,
        accessByProduct
      });
    } catch (error: any) {
      console.error("[Access] Failed to refresh access", error);
      setState((current) => ({
        ...current,
        loading: false,
        error: error?.message || "Erro ao verificar permissões"
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasAccess = useMemo(() => {
    if (!targetProduct) return true;
    const record = state.accessByProduct[targetProduct];
    if (record) return record.hasAccess;
    if (!state.loading && !record) {
      checkUserAccess(targetProduct)
        .then((result) => {
          setState((current) => ({
            ...current,
            accessByProduct: { ...current.accessByProduct, [targetProduct]: result }
          }));
        })
        .catch(() => null);
    }
    return false;
  }, [state.accessByProduct, state.loading, targetProduct]);

  return {
    loading: state.loading,
    error: state.error,
    products: state.products,
    accessByProduct: state.accessByProduct,
    hasAccess,
    refresh
  };
}
