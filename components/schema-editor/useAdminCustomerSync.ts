"use client";

import { useEffect } from "react";
import { fetchCustomerSummaryApi, fetchProjectOwnerIdApi } from "@/features/schemas/adminCustomerApi";
import { useAdminCustomerStore } from "@/features/schemas/store/useAdminCustomerStore";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Quand l'Admin ouvre le projet d'un client (fiche client, fiche coaching,
// "Reprendre un schéma client"), ce client devient automatiquement le compte
// courant de Ouvrir / Sauvegarder.
export function useAdminCustomerSync() {
  const isAdmin = useSchemaStore((s) => s.isAdmin);
  const projectId = useSchemaStore((s) => s.projectId);
  const actingCustomerId = useAdminCustomerStore((s) => s.actingCustomer?.id ?? null);
  const setActingCustomer = useAdminCustomerStore((s) => s.setActingCustomer);

  useEffect(() => {
    if (!isAdmin || !projectId) return;
    let cancelled = false;

    async function syncOwner(id: string) {
      const ownerId = await fetchProjectOwnerIdApi(id);
      if (cancelled || !ownerId || ownerId === actingCustomerId) return;
      const customer = await fetchCustomerSummaryApi(ownerId);
      if (!cancelled && customer) setActingCustomer(customer);
    }

    void syncOwner(projectId);
    return () => {
      cancelled = true;
    };
  }, [isAdmin, projectId, actingCustomerId, setActingCustomer]);
}
