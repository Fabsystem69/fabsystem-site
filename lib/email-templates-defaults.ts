// Contenu par defaut des emails clients, exactement celui deja code en dur
// dans chaque service avant l'ajout du systeme de personnalisation — ce
// fichier fait a la fois office de valeur de repli (aucune ligne EmailTemplate
// en base pour cette cle) et de contenu affiche/reinitialisable depuis le
// dashboard. Les variables {{comme_ca}} sont remplacees au moment de
// l'envoi (voir lib/services/email-templates.ts) ; ne jamais en retirer une
// utilisee par le code appelant sans mettre a jour ce dernier.
export type EmailTemplateDefinition = {
  key: string;
  label: string;
  description: string;
  variables: { name: string; description: string }[];
  subject: string;
  bodyText: string;
};

export const EMAIL_TEMPLATE_DEFAULTS: readonly EmailTemplateDefinition[] = [
  {
    key: "ebook-download-links",
    label: "Confirmation d'achat — liens de téléchargement",
    description: "Envoyé après tout achat contenant au moins un fichier téléchargeable (ebook…).",
    variables: [
      { name: "greeting", description: "Bonjour {prénom}, ou Bonjour, si le nom n'est pas renseigné" },
      { name: "order_number", description: "Numéro de commande" },
      { name: "total", description: "Montant total formaté (ex. 14,90 €)" },
      { name: "download_links", description: "Liste des liens de téléchargement, un par ligne" },
    ],
    subject: "Votre commande {{order_number}} — liens de téléchargement",
    bodyText: [
      "{{greeting}}",
      "",
      "Merci pour votre achat (commande {{order_number}}, {{total}}).",
      "",
      "Vous pouvez télécharger directement vos fichiers ci-dessous :",
      "",
      "{{download_links}}",
      "",
      "Ces liens restent valables 30 jours. Vous pouvez aussi retrouver vos achats à tout moment depuis votre espace client, rubrique \"Mes achats\".",
    ].join("\n"),
  },
  {
    key: "dossier-confirmation",
    label: "Confirmation de commande — accompagnement",
    description: "Envoyé après l'achat d'un appel conseil, accompagnement guidé ou conception complète.",
    variables: [
      { name: "greeting", description: "Bonjour {prénom}, ou Bonjour, si le nom n'est pas renseigné" },
      { name: "offer_label", description: "Nom de l'offre achetée (ex. Accompagnement guidé)" },
      {
        name: "bonus_access_block",
        description:
          "Laissé vide par le système si l'offre n'inclut pas l'éditeur+ebook, sinon rempli automatiquement — ne pas retirer sa position dans le texte",
      },
    ],
    subject: "Votre dossier \"{{offer_label}}\" est enregistré",
    bodyText: [
      "{{greeting}}",
      "",
      "Merci pour votre commande \"{{offer_label}}\" — votre dossier est bien enregistré.",
      "",
      "Fabien étudie votre dossier et revient vers vous rapidement pour la suite (premier retour ou proposition de visio selon la clarté du besoin).{{bonus_access_block}}",
      "",
      "Vous pouvez suivre l'avancement de votre dossier à tout moment depuis votre espace client, rubrique \"Mon accompagnement\".",
    ].join("\n"),
  },
  {
    key: "dossier-relance-inactif",
    label: "Relance — dossier inactif",
    description: "Envoyé automatiquement quand un dossier d'accompagnement n'a plus bougé depuis 14 jours.",
    variables: [{ name: "greeting", description: "Bonjour {prénom}, ou Bonjour, si le nom n'est pas renseigné" }],
    subject: "Des nouvelles de votre dossier FabSystem ?",
    bodyText: [
      "{{greeting}}",
      "",
      "Votre dossier d'accompagnement n'a pas bougé depuis un moment — si vous êtes bloqué sur quelque chose, ou si vous préférez qu'on avance ensemble par WhatsApp, n'hésitez pas à répondre à cet email.",
    ].join("\n"),
  },
  {
    key: "dossier-j30",
    label: "Suivi J+30 après livraison",
    description: "Envoyé automatiquement 30 jours après la livraison d'un dossier d'accompagnement.",
    variables: [{ name: "greeting", description: "Bonjour {prénom}, ou Bonjour, si le nom n'est pas renseigné" }],
    subject: "Comment se passe votre installation ?",
    bodyText: [
      "{{greeting}}",
      "",
      "Ça fait maintenant un mois que votre dossier a été livré — comment se passe le chantier ? Si un point vous bloque, mieux vaut le voir maintenant que plus tard, n'hésitez pas à me répondre.",
    ].join("\n"),
  },
  {
    key: "dossier-temoignage-demande",
    label: "Demande de témoignage",
    description: "Envoyé automatiquement 15 jours après la livraison, si le témoignage n'a pas déjà été demandé.",
    variables: [{ name: "greeting", description: "Bonjour {prénom}, ou Bonjour, si le nom n'est pas renseigné" }],
    subject: "Un mot sur votre accompagnement FabSystem ?",
    bodyText: [
      "{{greeting}}",
      "",
      "Si vous avez deux minutes, votre témoignage aide d'autres personnes à se lancer sur leur installation électrique.",
      "",
      "https://www.fabsystem.fr/temoignage",
    ].join("\n"),
  },
  {
    key: "dossier-purge-warning",
    label: "Avertissement de purge des documents",
    description: "Envoyé environ 11 mois après la livraison, avant la suppression automatique des documents (12 mois).",
    variables: [{ name: "greeting", description: "Bonjour {prénom}, ou Bonjour, si le nom n'est pas renseigné" }],
    subject: "Vos documents FabSystem seront bientôt retirés",
    bodyText: [
      "{{greeting}}",
      "",
      "Les documents partagés sur votre dossier (schémas, photos) seront retirés dans environ 30 jours pour libérer de la place. Téléchargez-les dès maintenant si vous voulez les conserver.",
      "",
      "https://www.fabsystem.fr/mon-compte/mon-accompagnement",
    ].join("\n"),
  },
  {
    key: "schema-unlock-project-expiry",
    label: "Rappel — déblocage projet bientôt expiré",
    description: "Envoyé quand l'accès illimité offert sur un projet approche de son expiration.",
    variables: [
      { name: "project_name", description: "Nom du projet" },
      { name: "days_left", description: "Nombre de jours restants" },
    ],
    subject: "Votre déblocage \"{{project_name}}\" expire dans {{days_left}} jour(s)",
    bodyText: [
      "Bonjour,",
      "",
      "L'accès illimité de votre projet \"{{project_name}}\" dans l'éditeur de schéma FabSystem expire dans {{days_left}} jour(s).",
      "",
      "Vous êtes bloqué sur votre installation, ou besoin d'un coup de main pour la suite ? Répondez simplement à cet email, je suis là pour vous aider.",
      "",
      "Vous pouvez aussi renouveler l'accès directement depuis l'éditeur, sur ce projet.",
    ].join("\n"),
  },
  {
    key: "schema-unlock-trial-expiry",
    label: "Rappel — essai éditeur bientôt expiré",
    description: "Envoyé quand l'accès gratuit temporaire à l'éditeur approche de son expiration.",
    variables: [{ name: "days_left", description: "Nombre de jours restants" }],
    subject: "Plus que {{days_left}} jour(s) d'accès complet offert sur l'éditeur de schéma",
    bodyText: [
      "Bonjour,",
      "",
      "Votre accès illimité gratuit à l'éditeur de schéma électrique FabSystem se termine dans {{days_left}} jour(s) !",
      "",
      "Si vous avez besoin de poursuivre une installation plus complète, Éditeur Plus donne accès aux projets et consommateurs illimités, à l'historique des versions et au partage de schéma.",
      "",
      "Ou passez directement à l'accompagnement pour être guidé de A à Z sur votre installation électrique.",
    ].join("\n"),
  },
] as const;

export function getEmailTemplateDefault(key: string) {
  return EMAIL_TEMPLATE_DEFAULTS.find((template) => template.key === key) ?? null;
}
