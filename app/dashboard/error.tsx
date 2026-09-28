"use client";

import { AdminButton, AdminCard } from "@/components/dashboard/ui";

// Même raison que app/mon-compte/error.tsx : aucun error.tsx n'existait
// nulle part dans le site avant ce lot, donc toute erreur non rattrapée
// sous /dashboard/** affichait l'écran d'erreur brut par défaut de Next.js.
// Ici, requireSession() redirige déjà proprement vers /login en cas de
// session expirée (contrairement à requireCustomerActor côté client) —
// cet écran couvre plutôt les autres pannes (bug réel, base injoignable...).
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <AdminCard title="Un problème est survenu">
        <p className="text-sm leading-relaxed text-neutral-400">
          Cette page n&apos;a pas pu s&apos;afficher correctement. Réessayez, ou revenez à l&apos;accueil du dashboard.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <AdminButton type="button" variant="primary" onClick={reset}>
            Réessayer
          </AdminButton>
          <AdminButton href="/dashboard/crm" variant="secondary">
            Retour à l&apos;accueil
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
