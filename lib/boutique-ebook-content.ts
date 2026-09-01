// Contenu éditorial des ebooks du catalogue Boutique, fusionné depuis
// l'ancienne page marketing dédiée /ebook/cabler-son-van (supprimée) puis
// enrichi en UI-5. Module partagé entre la carte (hub /boutique) et la
// fiche produit (/boutique/[slug]) — MASTER-03 §25/06-FICHE-PRODUIT.md §25 :
// les deux doivent utiliser la même source, jamais une copie divergente.
// `promesseCourte` et `forYouIf` sont reformulés à partir du contenu déjà
// réel ci-dessous (sommaire/benefits) et des accroches univers déjà
// validées dans Boutique/02-UNIVERS.md — aucune promesse commerciale
// nouvelle n'est inventée.
export type EbookEnrichment = {
  coverSrc: string;
  coverAlt: string;
  promesseCourte: string;
  forYouIf: string[];
  faqVariant?: "van" | "bateau";
  sommaire?: { n: string; title: string; detail: string }[];
  benefits?: string[];
  formats?: { icon: string; title: string; detail: string }[];
  reassuranceSuffix?: string;
  showFaq?: boolean;
  /** Volume approximatif du contenu source, arrondi à la dizaine —
   * argument de valeur perçue (pas un nombre de pages imprimées, le
   * format de vente est numérique). */
  pageCount?: number;
  /** Pages/planches réelles extraites du contenu source (docs/ebook/), pas
   * des maquettes — preuve visuelle concrète du contenu plutôt qu'une
   * promesse abstraite. */
  preview?: { src: string; alt: string }[];
};

export const EBOOK_ENRICHMENT: Record<string, EbookEnrichment> = {
  "ebook-schema-electrique": {
    coverSrc: "/ebook/ebook-schema-fabsystem-images/couverture-schema-boutique.png",
    coverAlt: "Couverture du guide « Dessiner son installation électrique »",
    promesseCourte:
      "Une méthode visuelle pour lire, organiser, annoter et faire relire le schéma électrique d'un van, d'un bateau ou d'un camping-car.",
    forYouIf: [
      "vous avez des composants et des idées, mais pas encore une architecture lisible",
      "vous voulez comprendre un schéma avant de toucher aux câbles",
      "vous voulez préparer un projet de van, de bateau ou de camping-car à faire relire",
      "vous cherchez une méthode claire pour utiliser l'éditeur FabSystem sans dessiner au hasard",
    ],
    benefits: [
      "Lire le chemin de l'énergie : sources, protections, distribution et consommateurs",
      "Construire un premier schéma progressivement, sans masquer les incertitudes",
      "Repérer les informations à documenter avant une réalisation ou une demande d'aide",
      "Comparer des architectures solaire, batterie, chargeur et station électrique",
      "Préparer une relecture technique avec un schéma transmissible et annoté",
      "Distinguer un schéma de projet d'une validation d'installation réelle",
    ],
    sommaire: [
      { n: "01", title: "Lire avant de brancher", detail: "La méthode pour suivre un circuit et comprendre ce que raconte un schéma." },
      { n: "02", title: "Poser les bonnes briques", detail: "Sources, batteries, protections, distribution et consommateurs : le vocabulaire utile." },
      { n: "03", title: "Dessiner pour décider", detail: "Organiser un projet dans l'éditeur, annoter les hypothèses et garder un schéma lisible." },
      { n: "04", title: "Cas pratiques embarqués", detail: "Solaire, station électrique, AFERIY P280 et installation Victron légère." },
      { n: "05", title: "Vérifier et transmettre", detail: "Relire, corriger, exporter et préparer un échange avec un professionnel." },
    ],
    formats: [
      { icon: "🖨️", title: "PDF imprimable", detail: "Mise en page A4 avec pagination pour préparer ou annoter le projet sur papier." },
      { icon: "📖", title: "EPUB", detail: "Lecture fluide sur liseuse, tablette ou application de lecture." },
      { icon: "⚡", title: "30 jours d'éditeur", detail: "Un code personnel active 30 jours d'accès complet à l'éditeur de schémas." },
    ],
    preview: [
      { src: "/ebook/ebook-schema-fabsystem-images/chapitre-01-ouverture-v1.webp", alt: "Ouverture du premier chapitre du guide" },
      { src: "/ebook/ebook-schema-fabsystem-images/chapitre-06-ouverture-v1.webp", alt: "Ouverture d'un chapitre consacré à l'organisation du schéma" },
      { src: "/ebook/ebook-schema-fabsystem-images/chapitre-14-ouverture-v1.webp", alt: "Ouverture d'un cas pratique du guide" },
    ],
  },
  "ebook-electricite-van": {
    coverSrc: "/ebook/couverture.jpg",
    coverAlt: "Couverture du livre « Câbler son van sans se planter »",
    promesseCourte:
      "Concevez une installation électrique cohérente, dimensionnée correctement et pensée pour être réalisée dans le bon ordre.",
    forYouIf: [
      "vous partez d'une page blanche et voulez concevoir une installation cohérente",
      "vous voulez dimensionner batterie et solaire sans deviner",
      "vous voulez poser votre installation dans le bon ordre, sans tout redémonter",
      "vous voulez comprendre la VASP et l'assurance avant de vous lancer",
    ],
    sommaire: [
      { n: "01", title: "Les bases du 12V embarqué", detail: "Comprendre avant de câbler : tension, intensité, sections, ce qui compte vraiment." },
      { n: "02", title: "Dimensionner batterie et solaire", detail: "Calculer son besoin réel plutôt que de recopier le forum d'un autre projet." },
      { n: "03", title: "Choisir son architecture et son matériel", detail: "Schéma de principe, composants, ce qui est indispensable et ce qui ne l'est pas." },
      { n: "04", title: "Poser son installation dans l'ordre", detail: "La séquence qui évite de tout redémonter à la moitié du chantier." },
      { n: "05", title: "VASP et assurance", detail: "Ce qu'il faut savoir, sans y passer trois soirs à éplucher des forums." },
      { n: "06", title: "La plomberie embarquée", detail: "De la cuve à l'eau chaude : pompe, cuve, chauffe-eau, raccordements." },
      { n: "07", title: "Mise en service et diagnostic", detail: "Vérifier son installation et repérer une panne avant qu'elle ne tourne mal." },
      { n: "08", title: "Vivre avec son installation", detail: "Entretien, hivernage, et les questions qui reviennent le plus souvent." },
    ],
    benefits: [
      "Dimensionner sa batterie et son solaire sans se tromper",
      "Poser son installation dans l'ordre qui évite de tout redémonter",
      "Comprendre la VASP et l'assurance sans y passer trois soirs",
      "La plomberie embarquée, de la cuve à l'eau chaude",
      "Mettre en service et repérer une panne avant qu'elle ne tourne mal",
      "Vivre avec son installation : entretien, hivernage, questions fréquentes",
    ],
    formats: [
      { icon: "🖥️", title: "Sur ordinateur", detail: "Lecture confortable pour préparer le projet, schémas en grand format." },
      { icon: "📖", title: "Sur téléphone", detail: "Consultation rapide pendant le chantier — format compact, facile à garder sous la main." },
      { icon: "✍️", title: "Version interactive", detail: "Votre nom en couverture, quiz à la fin de chaque partie pour vérifier votre compréhension." },
    ],
    reassuranceSuffix:
      " sont déduits de la prestation. Ce livre n'est jamais un coût perdu — au pire, c'est votre meilleure préparation avant qu'on travaille ensemble.",
    showFaq: true,
    faqVariant: "van",
    pageCount: 400,
    preview: [
      { src: "/ebook/apercu/van-1-loi-ohm.jpg", alt: "Planche « La loi d'Ohm : tout ce qui freine chauffe »" },
      { src: "/ebook/apercu/van-2-protections.jpg", alt: "Planche « Les protections »" },
      { src: "/ebook/apercu/van-3-distribution.jpg", alt: "Planche « La distribution et les protections »" },
    ],
  },
  "ebook-electricite-bateau": {
    coverSrc: "/ebook/couverture-bateau.jpg",
    coverAlt: "Couverture du livre « De la lampe à pétrole au lithium »",
    promesseCourte:
      "Comprenez ce qui est déjà à bord, identifiez les points importants et faites évoluer votre installation proprement.",
    forYouIf: [
      "vous voulez diagnostiquer l'existant avant de reprendre quoi que ce soit",
      "vous voulez distinguer ce qui relève de la loi (CE, Division 240) de ce que l'assurance exige vraiment",
      "vous voulez dimensionner batterie, solaire et coordonner vos sources de charge",
      "vous voulez choisir du matériel adapté au marin et l'installer dans le bon ordre",
    ],
    benefits: [
      "Diagnostiquer l'existant avant de reprendre quoi que ce soit",
      "Distinguer ce qui relève de la loi (CE, Division 240) et des normes, et ce que l'assurance exige vraiment",
      "Dimensionner sa batterie, son solaire et coordonner ses sources de charge",
      "Choisir du matériel adapté au marin (sertissage, fusibles, coupe-batteries) et l'installer dans le bon ordre",
      "Mettre en place un réseau NMEA 0183/2000 et refaire sa plomberie embarquée en toute sécurité",
      "Vivre avec son installation : entretien, hivernage, diagnostic de panne",
    ],
    sommaire: [
      { n: "01", title: "Les bases que personne ne t'explique", detail: "Unités, loi d'Ohm, dangers du 12V, masse, corrosion galvanique : le socle avant de toucher un câble." },
      { n: "02", title: "Normes, réglementation & assurance", detail: "CE, Division 240, ISO 13297, dossier technique : ce qui est obligatoire et ce qui est opposable par l'assurance." },
      { n: "03", title: "Concevoir l'installation", detail: "État des lieux, bilan de consommation, sources, dimensionnement de la batterie." },
      { n: "04", title: "Choisir le matériel", detail: "Batterie, chargeurs, solaire, câbles, protections, monitoring : sur quels critères choisir." },
      { n: "05", title: "Installation pas à pas", detail: "L'ordre du chantier qui évite de tout redémonter, du gros câble à la mise sous tension." },
      { n: "06", title: "Réseau embarqué et NMEA", detail: "0183 vs 2000, topologie du bus, capteurs, redondance : mettre en réseau son bateau." },
      { n: "07", title: "Plomberie", detail: "Passe-coques, vannes, eau douce et eaux noires : le point de sécurité n°1 à bord." },
      { n: "08", title: "Mise en service et tests", detail: "Réglages de charge, tests en charge réelle, mesures de performance, carnet de bord." },
      { n: "09", title: "Vivre avec : guide du propriétaire", detail: "Contrôles mensuel et annuel, hivernage, diagnostic de panne, transmission du bateau." },
    ],
    formats: [
      { icon: "🖥️", title: "Sur ordinateur", detail: "Lecture confortable pour préparer le projet, schémas et photos de chantier en grand format." },
      { icon: "📱", title: "Sur téléphone", detail: "Se charge vite sur le chantier, pensée pour être consultée en mobilité." },
      { icon: "📚", title: "Version EPUB", detail: "Pour liseuse ou appli de lecture, et facile à imprimer si vous préférez le papier." },
    ],
    reassuranceSuffix:
      " sont déduits de la prestation. Ce livre n'est jamais un coût perdu — au pire, c'est votre meilleure préparation avant qu'on travaille ensemble.",
    showFaq: true,
    faqVariant: "bateau",
    pageCount: 500,
    preview: [
      { src: "/ebook/apercu/bateau-1-mise-sous-tension.jpg", alt: "Planche « Vérifier chaque circuit avant mise sous tension »" },
      { src: "/ebook/apercu/bateau-2-diagnostic.jpg", alt: "Planche « Diagnostiquer une panne »" },
      { src: "/ebook/apercu/bateau-3-controle-mensuel.jpg", alt: "Planche « Contrôle mensuel »" },
    ],
  },
};
