import { create } from "zustand";
import type { ActingCustomer } from "@/features/schemas/adminCustomerApi";

// Client pour lequel l'Admin travaille dans l'éditeur (session uniquement,
// jamais persisté) — séparé de useSchemaStore, déjà très volumineux.
interface AdminCustomerState {
  actingCustomer: ActingCustomer | null;
  setActingCustomer: (customer: ActingCustomer | null) => void;
}

export const useAdminCustomerStore = create<AdminCustomerState>((set) => ({
  actingCustomer: null,
  setActingCustomer: (customer) => set({ actingCustomer: customer }),
}));
