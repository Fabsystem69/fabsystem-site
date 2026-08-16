import type { SchemaApiProblem } from "@/features/schemas/projectSchemaApi";
import type { SchemaSaveAssistant } from "@/features/schemas/store/useSchemaStore";

export function buildCloudStatusMessage(problem: SchemaApiProblem, phase: "open" | "save") {
  switch (problem.code) {
    case "AUTH_REQUIRED":
      return phase === "open" ? "Connexion requise pour le cloud" : "Session cloud expirée";
    case "ACCESS_DENIED":
    case "PROJECT_NOT_FOUND":
      return "Projet cloud indisponible";
    case "RATE_LIMITED":
      return "Cloud temporairement limité";
    case "PAYLOAD_TOO_LARGE":
      return "Schéma trop lourd pour le cloud";
    case "BAD_REQUEST":
      return "Schéma refusé par le cloud";
    case "NETWORK":
      return "Cloud indisponible hors ligne";
    default:
      return phase === "open" ? "Ouverture cloud impossible" : "Erreur de sauvegarde cloud";
  }
}

export function buildCloudAssistant(problem: SchemaApiProblem, phase: "open" | "save"): SchemaSaveAssistant {
  const retryText =
    problem.retryAfterSeconds && problem.retryAfterSeconds > 0
      ? ` Réessaie dans environ ${problem.retryAfterSeconds} s.`
      : "";

  switch (problem.code) {
    case "AUTH_REQUIRED":
      return {
        code: "AUTH_REQUIRED",
        title: phase === "open" ? "Connexion requise pour ouvrir ce projet cloud" : "Connexion requise pour continuer la sauvegarde cloud",
        message:
          "La sauvegarde cloud est réservée aux clients connectés. Connectez-vous à votre espace client pour retrouver ce projet, ou continuez en local puis téléchargez un fichier .fabschema.",
      };
    case "ACCESS_DENIED":
      return {
        code: "ACCESS_DENIED",
        title: "Ce projet cloud ne vous appartient plus",
        message:
          "Le lien actuel ne donne plus accès à ce projet. Ouvrez-le depuis votre espace client, ou continuez en local sans lier ce schéma au cloud.",
      };
    case "PROJECT_NOT_FOUND":
      return {
        code: "PROJECT_NOT_FOUND",
        title: "Projet cloud introuvable",
        message:
          "Le projet demandé n'existe plus ou le lien est périmé. Ouvrez un projet existant depuis votre espace client, ou continuez en local.",
      };
    case "RATE_LIMITED":
      return {
        code: "RATE_LIMITED",
        title: "Le cloud ralentit les sauvegardes pour le moment",
        message: `Le projet reste ouvert, mais la dernière sauvegarde cloud a été refusée pour éviter les abus.${retryText} Vous pouvez aussi télécharger un fichier .fabschema.`,
        retryAfterSeconds: problem.retryAfterSeconds,
      };
    case "PAYLOAD_TOO_LARGE":
      return {
        code: "PAYLOAD_TOO_LARGE",
        title: "Ce schéma est trop volumineux pour le cloud",
        message:
          "Le cloud a refusé cette version car elle dépasse la taille maximale autorisée. Téléchargez un fichier .fabschema pour garder une copie complète, puis simplifiez le schéma avant une nouvelle liaison cloud.",
      };
    case "BAD_REQUEST":
      return {
        code: "BAD_REQUEST",
        title: "Le cloud a refusé ce schéma",
        message:
          "Certaines données du schéma sont invalides ou trop longues. Vérifiez les libellés inhabituels, ou téléchargez un fichier .fabschema pour conserver votre travail pendant la correction.",
      };
    case "NETWORK":
      return {
        code: "NETWORK",
        title: phase === "open" ? "Connexion au cloud impossible" : "Connexion au cloud perdue",
        message:
          "Le navigateur n'a pas réussi à joindre le cloud. Vous pouvez continuer en local et télécharger un fichier .fabschema en attendant le retour du réseau.",
      };
    default:
      return {
        code: "UNKNOWN",
        title: "Le cloud ne répond pas comme prévu",
        message:
          "Le schéma est toujours ouvert, mais la dernière opération cloud a échoué. Continuez en local et gardez une copie .fabschema le temps de vérifier votre connexion ou votre session client.",
      };
  }
}

export function buildLocalDraftAssistant(): SchemaSaveAssistant {
  return {
    code: "LOCAL_STORAGE_UNAVAILABLE",
    title: "Le brouillon local n'a pas pu être enregistré",
    message:
      "Le navigateur a refusé le stockage local. Continuez à travailler, mais téléchargez rapidement un fichier .fabschema pour éviter toute perte de schéma.",
  };
}
