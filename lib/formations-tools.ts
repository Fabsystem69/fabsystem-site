// Source unique pour la section "Outils essentiels" de /formations.
// Module pur (pas de "server-only") : importable depuis un composant client
// ou serveur indifféremment.
//
// Aucun compte Amazon Associates n'existe pour l'instant : tous les liens
// sont des liens de recherche simples (jamais un lien produit/ASIN
// fabriqué). Cette fonction est le SEUL endroit qui construit une URL
// Amazon — pour basculer vers des liens affiliés plus tard (tag partenaire,
// etc.), il suffira de modifier buildAmazonSearchUrl ici, sans toucher au
// reste du code.
function buildAmazonSearchUrl(query: string) {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;
}

export type FormationEssentialTool = {
  id: string;
  name: string;
  usage: string;
  genericSearchQuery: string;
  // null = FabSystem n'a pas encore communiqué le modèle qu'il utilise
  // réellement. Ne jamais inventer une marque/modèle ici — laisser null
  // jusqu'à confirmation.
  proModel: string | null;
};

const FORMATION_ESSENTIAL_TOOLS: FormationEssentialTool[] = [
  {
    id: "multimetre",
    name: "Multimètre",
    usage:
      "Indispensable pour tout diagnostic : tension, continuité, résistance. Sans lui, vous travaillez à l'aveugle.",
    genericSearchQuery: "multimètre électricien",
    proModel: null,
  },
  {
    id: "pince-amperemetrique",
    name: "Pince ampèremétrique",
    usage:
      "Mesure le courant réel qui circule, sans couper le fil — utile pour vérifier une consommation ou traquer une fuite.",
    genericSearchQuery: "pince ampèremétrique",
    proModel: null,
  },
  {
    id: "pince-a-sertir",
    name: "Pince à sertir (cosses)",
    usage:
      "Un sertissage propre des cosses, c'est la différence entre une connexion fiable et un point chaud dans deux ans.",
    genericSearchQuery: "pince à sertir cosses électriques",
    proModel: null,
  },
  {
    id: "pince-a-denuder",
    name: "Pince à dénuder",
    usage:
      "Dénude sans entailler les brins — un fil abîmé, c'est une section affaiblie et un point de rupture.",
    genericSearchQuery: "pince à dénuder électricien",
    proModel: null,
  },
  {
    id: "decapeur-thermique",
    name: "Décapeur thermique + gaine thermorétractable",
    usage:
      "Pour des connexions isolées et étanches, dignes d'une installation qui tiendra dans la durée.",
    genericSearchQuery: "décapeur thermique gaine thermorétractable",
    proModel: null,
  },
  {
    id: "coupe-cable",
    name: "Coupe-câble (cisaille électricien)",
    usage: "Une coupe nette, sans écraser les brins ni fatiguer le câble à chaque section.",
    genericSearchQuery: "cisaille coupe câble électricien",
    proModel: null,
  },
  {
    id: "testeur-continuite",
    name: "Testeur de continuité / lampe testeur",
    usage:
      "Le réflexe rapide sur le chantier pour vérifier un circuit sans ressortir le multimètre.",
    genericSearchQuery: "testeur de continuité électricien",
    proModel: null,
  },
  {
    id: "presse-etoupes",
    name: "Presse-étoupes / passe-câbles étanches",
    usage:
      "Spécifique van/bateau : chaque passage de cloison doit rester étanche, pas juste « bouché ».",
    genericSearchQuery: "presse-étoupe passe câble étanche",
    proModel: null,
  },
  {
    id: "tournevis-isoles",
    name: "Jeu de tournevis isolés",
    usage: "La sécurité de base pour travailler sur une installation sous tension sans risque.",
    genericSearchQuery: "jeu tournevis isolés électricien",
    proModel: null,
  },
  {
    id: "perceuse-visseuse",
    name: "Perceuse-visseuse",
    usage: "Pour percer proprement les passages de câble, sans y aller à l'arrache.",
    genericSearchQuery: "perceuse visseuse sans fil",
    proModel: null,
  },
];

export function listFormationEssentialTools(): FormationEssentialTool[] {
  return FORMATION_ESSENTIAL_TOOLS;
}

export function getFormationToolGenericSearchUrl(tool: FormationEssentialTool) {
  return buildAmazonSearchUrl(tool.genericSearchQuery);
}

// Retourne null tant que proModel n'est pas renseigné : le composant doit
// alors afficher un texte de repli (placeholder), jamais un lien fabriqué
// sur le terme générique à la place.
export function getFormationToolProSearchUrl(tool: FormationEssentialTool) {
  return tool.proModel ? buildAmazonSearchUrl(tool.proModel) : null;
}
