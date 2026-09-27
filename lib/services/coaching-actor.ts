// Auteur d'une modification du dossier van (retour utilisateur, étape 6 :
// "conserve un historique des modifications importantes avec auteur et
// date"). Même convention que DossierEvent.authorName (défaut "FabSystem",
// jamais le nom réel de l'admin) : un simple "coach" vs "client" suffit à
// l'usage demandé, pas la peine d'aller chercher/exposer une identité plus
// précise pour un simple journal d'activité.
export type CoachingActor = { kind: "coach" } | { kind: "client" };

export function resolveAuthorName(actor: CoachingActor): string {
  return actor.kind === "coach" ? "FabSystem" : "Client";
}
