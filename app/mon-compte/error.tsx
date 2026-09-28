"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// "Lien expiré ou session expirée -> Reconnexion compréhensible"
// (PLAN_AMELIORATION_CRM_FABSYSTEM.md §10). Aucune limite (error.tsx/
// global-error.tsx) n'existait nulle part dans le site avant ce fichier :
// une erreur non rattrapée sous /mon-compte/** (page ou action serveur,
// y compris une session expirée dans requireCustomerActor()) affichait
// l'écran d'erreur brut par défaut de Next.js. On ne peut pas distinguer
// ici une session expirée d'un vrai bug (le message d'erreur précis est
// retiré par Next en production pour ne rien exposer) — le message reste
// donc volontairement générique, en langage clair, avec deux sorties :
// réessayer, ou se reconnecter si le problème persiste.
export default function MonCompteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <Card className="p-6">
        <h1 className="text-lg font-semibold text-neutral-950">Un problème est survenu</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Cette page n&apos;a pas pu s&apos;afficher correctement. Cela peut arriver si votre connexion a expiré.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Réessayer</Button>
          <Button href="/connexion-client" variant="secondary">
            Me reconnecter
          </Button>
        </div>
      </Card>
    </div>
  );
}
