import Image from "next/image";
import type { Metadata } from "next";

// Brouillon premium prive :
// - ne pas commit, push ou deployer ce fichier sans accord explicite de l'utilisateur
// - pendant la conception, ce contenu doit rester local uniquement
// - si le guide est publie plus tard, il devra être protège par authentification
//   et vérification d'achat, pas seulement par noindex
export const metadata: Metadata = {
  title: "Guide premium FabSystem | Créer des schémas électriques clairs pour van, bateau et station",
  description:
    "Edition HTML imprimable du guide premium FabSystem pour apprendre à lire, structurer et dessiner des schémas électriques clairs sur van, bateau et station électrique.",
  alternates: {
    canonical: "/outils/ebook-schema-fabsystem",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

type ChapterSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type ChapterDraft = {
  label: string;
  title: string;
  blurb: string;
  intro: string[];
  sections: ChapterSection[];
  calloutTitle: string;
  calloutBody: string;
  summaryTitle: string;
  summary: string[];
  exerciseTitle: string;
  exercise: string[];
};

const readerProfiles = [
  {
    title: "Vous partez de zéro",
    body: "Vous voulez enfin comprendre ce qu'un schéma doit montrer avant de commencer vos achats ou votre câblage.",
  },
  {
    title: "Vous avez déjà du matériel",
    body: "Vous cherchez à remettre de l'ordre dans une installation de van, de bateau ou de station devenue trop floue.",
  },
  {
    title: "Vous voulez un support pro",
    body: "Vous avez besoin d'un document lisible à faire relire, à transmettre ou à garder comme base claire dans le temps.",
  },
];

const guidePillars = [
  {
    title: "Lire avant de brancher",
    body: "Reprendre toujours le projet dans le bon ordre : source, protection, distribution, consommateurs.",
  },
  {
    title: "Dessiner pour decider",
    body: "Utiliser l'editeur FabSystem comme un vrai outil de projet, pas comme un simple canevas propre.",
  },
  {
    title: "Faire simple sans tricher",
    body: "Rendre lisibles les installations de van, de bateau et de station électrique sans les appauvrir.",
  },
  {
    title: "Vérifier sans paniquer",
    body: "Savoir relire un schéma, detecter les erreurs de structure et préparer une installation plus fiable.",
  },
];

const coveredWorlds = [
  "Van amenage",
  "Bateau de plaisance",
  "Station électrique tout-en-un",
  "Solaire embarque",
  "Petit réseau 230V",
  "Lecture et correction de schémas",
];

const editionMarkers = [
  {
    label: "Chapitres",
    value: "76",
  },
  {
    label: "Univers couverts",
    value: "Van + maritime",
  },
  {
    label: "Format de lecture",
    value: "Écran et impression",
  },
];

const openingPromises = [
  "Comprendre la logique d'un schéma avant de brancher quoi que ce soit.",
  "Avancer avec une méthode claire, pas avec une accumulation de pieces et d'hypotheses.",
  "S'appuyer sur des exemples réels de projets embarques plutot que sur de la théorie abstraite.",
];

const parts = [
  {
    id: "partie-1",
    label: "Partie 1",
    title: "Bien commencer",
    pageBudget: "8 a 10 pages",
    goal: "Poser la promesse du livre, rassurer le lecteur et lui donner une méthode de lecture simple.",
    chapters: [
      "Pourquoi apprendre à faire un schéma avant de tirer un câble",
      "Ce qu'un bon schéma doit montrer, et ce qu'il ne doit pas montrer",
      "Les erreurs classiques d'un schéma joli mais inutilisable",
      "Comment utiliser cet ebook avec l'editeur FabSystem",
      "La méthode FabSystem : comprendre, poser, relier, vérifier, corriger",
    ],
  },
  {
    id: "partie-2",
    label: "Partie 2",
    title: "Lire un schéma sans paniquer",
    pageBudget: "10 a 12 pages",
    goal: "Donner une grille de lecture universelle avant d'ouvrir l'editeur.",
    chapters: [
      "Les 4 questions à se poser devant n'importe quel schéma",
      "Source, protection, distribution, consommateur : la logique de base",
      "Le positif, le négatif, la masse et la terre",
      "Différence entre circuit 12V, solaire et 230V",
      "Comment suivre le sens de l'énergie dans un schéma",
      "Lire un schéma simple puis un schéma plus complet",
    ],
  },
  {
    id: "partie-3",
    label: "Partie 3",
    title: "Les briques d'un schéma propre",
    pageBudget: "12 a 14 pages",
    goal: "Expliquer chaque famille de composant avant de la dessiner dans FabSystem.",
    chapters: [
      "Batterie, fusible principal et coupe-circuit",
      "Platine de distribution, interrupteurs et busbars",
      "Consommateurs : frigo, pompe, USB, LED",
      "Panneau solaire et MPPT",
      "Prise de quai et petit réseau 230V",
      "Station électrique tout-en-un : ce qu'elle simplifie, ce qu'elle ne simplifie pas",
    ],
  },
  {
    id: "partie-4",
    label: "Partie 4",
    title: "Prise en main de l'editeur FabSystem",
    pageBudget: "12 a 15 pages",
    goal: "Faire du lecteur quelqu'un d'autonome dans l'interface avant les cas pratiques.",
    chapters: [
      "L'écran de demarrage",
      "La bibliotheque de composants",
      "Le canvas",
      "Les liaisons et les poignees",
      "Le panneau de propriétés",
      "Les raccourcis utiles",
      "La sauvegarde, l'export et l'impression",
    ],
  },
  {
    id: "partie-5",
    label: "Partie 5",
    title: "Premier schéma guide dans FabSystem",
    pageBudget: "12 a 14 pages",
    goal: "S'appuyer sur le mode guide existant pour construire un premier schéma 12V realiste et sans danger.",
    chapters: [
      "Le premier exercice : batterie, fusible, coupe-circuit, platine, LED, prise USB",
      "Ajouter les composants dans le bon ordre",
      "Relier correctement le positif",
      "Comprendre le retour négatif",
      "Vérifier la cohérence avant d'aller plus loin",
    ],
  },
  {
    id: "partie-6",
    label: "Partie 6",
    title: "Créer un schéma solaire simple",
    pageBudget: "8 a 10 pages",
    goal: "S'appuyer sur le gabarit premier pas solaire pour enseigner la chaine panneaux -> MPPT -> batterie -> suivi.",
    chapters: [
      "À quoi sert le gabarit premier pas solaire",
      "Deux panneaux, un MPPT, une batterie, un écran",
      "Lire les entrées PV et les sorties batterie",
      "Modifier le schéma pour son propre besoin",
      "Erreurs de debutant à éviter",
    ],
  },
  {
    id: "partie-7",
    label: "Partie 7",
    title: "Créer un schéma station électrique",
    pageBudget: "10 a 12 pages",
    goal: "Montrer comment une station tout-en-un devient un vrai schéma lisible dans l'editeur.",
    chapters: [
      "Pourquoi partir d'une station électrique dans un van",
      "Le gabarit station électrique de FabSystem",
      "Entrée solaire, prise de quai, sortie 12V, sortie 230V",
      "Dessiner un petit réseau 12V propre derriere la station",
      "Dessiner un petit réseau 230V protège",
      "Les pieges frequents avec une station",
    ],
  },
  {
    id: "partie-8",
    label: "Partie 8",
    title: "Cas pratique AFERIY P280",
    pageBudget: "10 a 12 pages",
    goal: "Capitaliser sur le template AFERIY P280 déjà présent dans le projet pour expliquer un cas riche mais concret.",
    chapters: [
      "Pourquoi ce cas est pedagogiquement fort",
      "Les deux entrées XT90 et la sortie XT60",
      "Représenter le solaire et la recharge roulage",
      "Organiser le 12V fixe derriere la station",
      "Organiser le 230V fixe derriere la station",
      "Ce que ce montage apprend sur l'architecture",
    ],
  },
  {
    id: "partie-9",
    label: "Partie 9",
    title: "Cas pratique Victron leger",
    pageBudget: "10 a 12 pages",
    goal: "Montrer une architecture plus classique et plus exigeante, avec batterie, MPPT, MultiPlus et monitoring.",
    chapters: [
      "Pourquoi un montage Victron apprend la rigueur",
      "Batterie, MPPT, MultiPlus, SmartShunt : qui fait quoi",
      "Dessiner la chaine énergie sans surcharger la page",
      "Représenter le 12V quotidien proprement",
      "Représenter le 230V sans bricolage visuel",
      "Ajouter une option DC-DC sans casser la lecture",
    ],
  },
  {
    id: "partie-10",
    label: "Partie 10",
    title: "Faire un schéma utile, pas juste beau",
    pageBudget: "8 a 10 pages",
    goal: "Apprendre à annoter, simplifier et séparer l'information au bon endroit.",
    chapters: [
      "Ou mettre les protections sur le dessin",
      "Comment noter les sections de câble",
      "Comment nommer les circuits",
      "Quand séparer un schéma en plusieurs vues",
      "Ce qu'il vaut mieux mettre en legende plutot que sur le dessin",
    ],
  },
  {
    id: "partie-11",
    label: "Partie 11",
    title: "Corriger un schéma existant",
    pageBudget: "8 a 10 pages",
    goal: "Donner une méthode de relecture et de correction à partir de cas réels.",
    chapters: [
      "La méthode de relecture FabSystem",
      "Detecter un fusible mal place",
      "Detecter un retour négatif incohérent",
      "Detecter une distribution confuse",
      "Reprendre un schéma trop charge et le rendre lisible",
    ],
  },
  {
    id: "partie-12",
    label: "Partie 12",
    title: "Préparer un schéma à imprimer ou transmettre",
    pageBudget: "6 a 8 pages",
    goal: "Transformer un brouillon d'editeur en document exploitable sur chantier ou en accompagnement.",
    chapters: [
      "Ce qu'il faut vérifier avant export",
      "Quel niveau de détail selon le lecteur",
      "Comment imprimer sans perdre la lisibilité",
      "Comment faire une version atelier et une version projet",
    ],
  },
  {
    id: "partie-13",
    label: "Partie 13",
    title: "Trois mini-projets complets",
    pageBudget: "10 a 12 pages",
    goal: "Consolider la méthode sur trois niveaux de complexité différents.",
    chapters: [
      "Mini-projet van ultra simple",
      "Mini-projet van avec frigo, pompe et solaire",
      "Mini-projet station électrique avec quai, 12V et petit 230V",
      "Comment choisir le bon niveau de complexité",
    ],
  },
  {
    id: "partie-14",
    label: "Partie 14",
    title: "Conclusion et annexes",
    pageBudget: "12 a 16 pages",
    goal: "Fermer la boucle avec des checklists, un glossaire et des fiches imprimables utiles.",
    chapters: [
      "Ce qu'un bon schéma change vraiment dans un projet",
      "Ce que l'editeur FabSystem aide à faire vite",
      "Check-list de validation d'un schéma 12V",
      "Check-list de validation d'un schéma station électrique",
      "Glossaire simple des termes électriques",
      "Fiche ordre de construction d'un schéma",
    ],
  },
];

const partChapterRanges = parts.reduce<Array<{ start: number; end: number }>>((ranges, part) => {
  const previousEnd = ranges.length > 0 ? ranges[ranges.length - 1].end : 0;

  ranges.push({
    start: previousEnd + 1,
    end: previousEnd + part.chapters.length,
  });

  return ranges;
}, []);

const firstEditionParts = parts;

const firstChapter = {
  label: "Chapitre 1",
  title: "Pourquoi apprendre à faire un schéma avant de tirer un câble",
  blurb:
    "Premier chapitre intégralement rédigé pour verrouiller le ton de l'ebook : rassurant, pedagogique, concret et centre sur la logique de projet avant le matériel.",
  intro: [
    "Quand on commence un projet électrique dans un van, on a souvent envie d'aller vite. On regarde une video, on remplit un panier, on imagine déjà la batterie sous la banquette, le frigo qui tourne et les ports USB qui s'allument. C'est humain. Le problème, c'est que l'électricité ne pardonne pas très bien l'improvisation.",
    "Un schéma n'est pas un luxe réserve aux gros montages. C'est un plan de circulation de l'énergie. Il te permet de voir ce qui alimente quoi, ce qui doit être protège, ce qui doit être sépare et ce qui doit rester simple. Tant que ce plan n'existe pas, tu avances avec des morceaux d'idées, mais pas encore avec une architecture.",
    "Dans FabSystem, on ne dessine pas un schéma pour faire joli. On le dessine pour clarifier un projet, reduire les oublis et garder une logique lisible du debut à la fin. C'est cette logique qui te fera gagner du temps au moment du câblage, mais surtout au moment des vérifications, des corrections et des évolutions futures.",
  ],
  sections: [
    {
      title: "Le schéma te force à penser dans le bon ordre",
      paragraphs: [
        "Sans schéma, beaucoup de debutants raisonnent à l'envers. Ils partent des consommateurs parce que ce sont eux qu'ils voient tout de suite : un frigo, une pompe, des LED, des prises USB, parfois un petit 230V. Ensuite seulement ils cherchent comment raccorder tout cela. C'est souvent la que le projet se complique.",
        "Avec un schéma, tu reprends le fil dans le bon sens. Tu pars de la source d'énergie, puis tu places les protections, ensuite la distribution, puis enfin les consommateurs. Cette simple inversion change tout. Elle t'oblige à poser des questions concretes avant de tirer le moindre câble.",
      ],
      bullets: [
        "D'ou vient l'énergie : batterie, station électrique, panneau solaire, prise de quai ?",
        "Quelle protection doit être placée au plus près de la source ?",
        "Comment l'énergie est-elle distribuée ensuite vers chaque circuit ?",
        "Quels circuits doivent être séparés pour rester lisibles et faciles à diagnostiquer ?",
        "Ou se trouve le retour négatif, et comment éviter un réseau de masses confus ?",
      ],
    },
    {
      title: "Le schéma te fait gagner bien avant le premier branchement",
      paragraphs: [
        "Le vrai gain du schéma n'arrive pas seulement pendant le montage. Il arrive bien plus tot, au moment ou tu fais tes choix. Un schéma propre te montre si ton architecture est trop compliquee, si tu as oublie un composant essentiel, ou si tu essaies de faire tenir trop d'idées dans un seul montage.",
        "C'est aussi un outil de budget. Quand tu dessinés clairement la chaine complete, tu vois apparaitre les pieces invisibles dans les listes trop rapides : fusible principal, coupe-circuit, repartiteur, porte-fusibles, connecteurs, cosses, sections de câble, passe-cloisons, gaine, étiquetage. Ce sont souvent ces oublis qui font exploser un budget ou qui poussent à bricoler des solutions de dernière minute.",
        "Autrement dit, le schéma ne t'aide pas seulement à câbler proprement. Il t'aide à acheter juste, à prioriser et à éviter les achats en double.",
      ],
    },
    {
      title: "Ce qu'un schéma t'évite dans la vraie vie",
      paragraphs: [
        "Quand un projet n'est pas pose sur un schéma, les erreurs ne sont pas toujours spectaculaires. Elles sont souvent petites, dispersees et couteuses. Une protection oubliee ici, un retour négatif mal pense la, un circuit qui se rajoute à la fin sans vraie place. C'est ce cumul qui fatigue un chantier.",
        "Le schéma joue alors le rôle d'un filtre. Il ne supprime pas toutes les erreurs, mais il rend visibles celles qui seraient restees cachees jusqu'au moment le plus pénible : le montage final, le premier allumage ou la panne à distance.",
      ],
      bullets: [
        "Oublier un fusible principal ou le placer au mauvais endroit.",
        "Melanger sur le même dessin des éléments 12V, solaire et 230V sans séparation claire.",
        "Ajouter un consommateur en fin de projet sans revoir la distribution.",
        "Multiplier les raccords improvises parce qu'aucune logique de depart n'a été fixee.",
        "Se retrouver incapable d'expliquer son installation à quelqu'un d'autre ou à soi-même six mois plus tard.",
      ],
    },
    {
      title: "Le schéma est aussi un outil de dialogue",
      paragraphs: [
        "Un bon schéma n'est pas utile uniquement pour la personne qui le dessine. Il sert aussi à faire relire un projet, à demander un avis, à valider une architecture ou à préparer un accompagnement. C'est beaucoup plus simple d'echanger à partir d'un dessin clair que d'une liste de produits et de quelques photos.",
        "Dans l'univers FabSystem, c'est essentiel. Le schéma devient le support commun entre le porteur du projet, l'accompagnant, l'atelier ou le futur toi qui reviendra sur l'installation plus tard. Plus le schéma est propre, plus les retours sont rapides, précis et utiles.",
        "C'est pour cela que nous allons utiliser l'editeur comme un vrai outil de travail. Pas pour produire une image decorative, mais pour construire un document qui aide à decider, à vérifier et à transmettre.",
      ],
    },
    {
      title: "Ce qu'un schéma n'est pas",
      paragraphs: [
        "Il faut aussi être juste sur ce qu'un schéma apporte. Un schéma ne remplace pas à lui seul le dimensionnement, la vérification des intensites, le choix des sections ou les règles de sécurité. Il ne dit pas non plus comment fixer chaque élément physiquement dans le van.",
        "En revanche, il donne la colonne vertebrale du projet. Il te permet de séparer les questions. D'abord la logique du système. Ensuite le choix du matériel. Puis seulement l'implantation, le câblage et les tests. Cette séparation est précieuse, parce qu'elle t'évite de tout melanger au même moment.",
      ],
      bullets: [
        "Un schéma n'est pas une preuve de conformite à lui seul.",
        "Un schéma n'est pas un plan 3D d'implantation dans le van.",
        "Un schéma n'est pas un calcul automatique des sections ou des fusibles.",
        "Un schéma reste pourtant la meilleure base pour vérifier ensuite ces points avec méthode.",
      ],
    },
  ],
  calloutTitle: "Le vrai changement de posture",
  calloutBody:
    "Tant que tu n'as pas de schéma, tu construis ton installation dans ta tete. À partir du moment ou tu dessinés l'architecture, tu passes d'une intuition à une decision. C'est ce passage qui rend un projet plus pro, même quand le montage reste simple.",
  summaryTitle: "À retenir avant de passer au chapitre 2",
  summary: [
    "Le schéma vient avant le câblage, pas après.",
    "Il sert à clarifier la logique du projet avant de depenser du temps et de l'argent.",
    "Il aide autant pour acheter, vérifier et transmettre que pour brancher.",
    "Il ne remplace pas les règles de sécurité, mais il rend leur application beaucoup plus claire.",
    "L'editeur FabSystem sera utilisé dans ce livre comme un outil de méthode, pas comme un simple outil de dessin.",
  ],
  exerciseTitle: "Mini exercice de depart",
  exercise: [
    "Prends ton projet actuel, même s'il est encore flou.",
    "Ecris sur une feuille ou dans l'editeur quatre mots : source, protection, distribution, consommateurs.",
    "Classe dessous chaque élément que tu as déjà en tete.",
    "Si un élément ne trouve pas sa place, ce n'est pas grave : c'est déjà une information utile.",
    "Tu verras souvent qu'un projet devient plus simple dès qu'on lui redonne cet ordre.",
  ],
};

const secondChapter = {
  label: "Chapitre 2",
  title: "Ce qu'un bon schéma doit montrer, et ce qu'il ne doit pas montrer",
  blurb:
    "Deuxieme chapitre rédigé pour installer une règle de lecture simple : un schéma utile ne montre pas tout, il montre ce qui aide vraiment à comprendre et à travailler.",
  intro: [
    "Quand on debute, on croit souvent qu'un bon schéma doit tout contenir. On veut y mettre le matériel exact, les longueurs, la place dans le meuble, les idées de finition, les options futures, parfois même la couleur des câbles et le nom du vendeur. L'intention est bonne, mais le résultat devient vite illisible.",
    "Un schéma utile ne cherche pas à tout raconter. Il cherche à montrer l'information qui aide à comprendre, protéger, distribuer et vérifier l'énergie. C'est cette nuance qui fait la différence entre un dessin rassurant sur le moment et un vrai document de travail.",
    "Dans FabSystem, cette discipline est très importante. L'editeur permet d'ajouter vite des composants, des liaisons et des notes. Si tu ne choisis pas une priorité de lecture, tu peux fabriquer en quelques minutes un schéma très complet... mais déjà trop charge pour être vraiment utile.",
  ],
  sections: [
    {
      title: "Un bon schéma montre d'abord la logique du système",
      paragraphs: [
        "La première mission d'un schéma est de rendre visible l'architecture. En quelques secondes, on doit comprendre d'ou vient l'énergie, par quelles protections elle passe, comment elle est répartie et vers quels usages elle part. Si cette lecture de base n'est pas immédiate, le schéma n'a pas encore fait son travail.",
        "Autrement dit, un bon schéma ne commence pas par le détail. Il commence par l'ossature. C'est elle qui permet ensuite d'ajouter les précisions utiles sans perdre le lecteur.",
      ],
      bullets: [
        "La ou les sources d'énergie du projet.",
        "Les protections principales et secondaires.",
        "Les points de distribution ou de répartition.",
        "Les grands circuits de consommation.",
        "Les separations claires entre 12V, solaire et 230V quand ils coexistent.",
      ],
    },
    {
      title: "Un bon schéma montre les liaisons qui comptent vraiment",
      paragraphs: [
        "Tous les fils n'ont pas la même importance visuelle. Certaines liaisons structurent tout le projet : batterie vers fusible principal, fusible vers coupe-circuit, coupe-circuit vers distribution, distribution vers circuits. D'autres liaisons sont secondaires ou peuvent être simplifiees tant qu'elles restent comprenables.",
        "Le bon réflexe consiste donc à mettre en avant les chemins d'énergie essentiels. Si tout a le même poids visuel, rien ne ressort. Le lecteur se fatigue, cherche ou regarder et perd la logique globale.",
        "Dans un schéma propre, les liaisons les plus critiques doivent être faciles à suivre du regard. C'est encore plus vrai pour un debutant, qui à besoin d'un parcours de lecture simple et stable.",
      ],
    },
    {
      title: "Un bon schéma montre ce qui aide à vérifier le montage",
      paragraphs: [
        "Le schéma n'est pas seulement la pour comprendre le projet sur le papier. Il doit aussi aider à le relire avant câblage, pendant câblage et après câblage. Pour cela, certaines informations sont très utiles, même si elles ne sont pas spectaculaires.",
        "C'est par exemple le cas des noms de circuits, de la place des fusibles, des points de coupure, des grandes familles de consommateurs ou des sections de câble quand elles sont déjà connues. Ces informations ne rendent pas seulement le schéma plus précis. Elles le rendent exploitable.",
      ],
      bullets: [
        "Le nom clair de chaque circuit important.",
        "L'emplacement logique des protections.",
        "Le type de sortie ou d'entrée quand cela change la comprehension.",
        "Les sections de câble si elles sont déjà valides.",
        "Une legende simple quand un symbole ou une couleur peut preter à confusion.",
      ],
    },
    {
      title: "Ce qu'un bon schéma ne doit pas montrer au premier niveau",
      paragraphs: [
        "L'erreur classique, c'est de vouloir tout fusionner dans la même vue. Le schéma principal finit alors par porter des détails qui n'aident pas la lecture initiale. On croit être plus précis, mais on devient surtout plus confus.",
        "Il faut accepter qu'un schéma principal puisse rester sobre. Les détails d'implantation, de fixation, de finition ou de liste d'achat peuvent vivre ailleurs : dans une note, une legende, une fiche matériel ou une vue secondaire.",
      ],
      bullets: [
        "La position exacte de chaque élément dans le meuble si cela n'aide pas la logique électrique.",
        "Des annotations trop longues qui coupent la lecture.",
        "Des options futures melangees au montage actuel sans distinction visuelle.",
        "Des références commerciales partout si elles n'apportent rien à la comprehension.",
        "Une accumulation de couleurs, d'icones et de labels qui se concurrencent.",
      ],
    },
    {
      title: "Le bon niveau de détail depend de l'usage du schéma",
      paragraphs: [
        "Un schéma de conception n'a pas exactement le même rôle qu'un schéma d'atelier ou qu'un schéma remis à un client. C'est pour cela qu'il faut toujours se demander à quoi la vue va servir. Est-ce un brouillon pour choisir l'architecture ? Une version de validation ? Une version presque chantier ?",
        "Cette question change le niveau de détail acceptable. Au debut, on veut surtout valider la logique. Plus tard, on peut enrichir le schéma avec plus de noms de circuits, de sections, de protections ou d'annotations. Le problème n'est donc pas d'avoir du détail. Le problème, c'est d'avoir le détail trop tot ou au mauvais endroit.",
      ],
    },
    {
      title: "Dans FabSystem, pense ton schéma par couches",
      paragraphs: [
        "La bonne méthode dans l'editeur consiste à construire en couches. D'abord l'architecture générale. Ensuite les protections. Ensuite la distribution. Ensuite les consommateurs. Puis seulement les annotations et les précisions. Cette progression donne naturellement un schéma plus propre.",
        "Si tu pars directement dans les finitions, tu risques de maquiller un schéma qui n'est pas encore solide. Si tu pars d'abord de la structure, chaque ajout vient au service de la clarté au lieu de la noyer.",
        "C'est exactement cette discipline que nous allons garder tout au long de l'ebook : comprendre, poser, relier, vérifier, puis enrichir seulement quand la base tient debout.",
      ],
    },
  ],
  calloutTitle: "La bonne question à se poser",
  calloutBody:
    "Si une information n'aide ni à comprendre la circulation de l'énergie, ni à protéger le circuit, ni à vérifier le montage, elle n'a peut-être pas besoin d'être sur la vue principale.",
  summaryTitle: "À retenir avant de passer au chapitre 3",
  summary: [
    "Un bon schéma montre d'abord la logique générale du système.",
    "Il met en avant les liaisons et protections qui structurent vraiment le projet.",
    "Il contient les informations utiles à la vérification, pas tout l'univers du chantier.",
    "Les détails d'implantation ou de finition peuvent vivre ailleurs que sur la vue principale.",
    "Dans FabSystem, le plus simple est de construire le schéma par couches successives.",
  ],
  exerciseTitle: "Mini exercice de tri visuel",
  exercise: [
    "Prends un schéma que tu trouves charge, même un brouillon très simple.",
    "Demande-toi si chaque élément aide à comprendre, protéger ou vérifier.",
    "Supprime mentalement tout ce qui n'aide pas à ces trois objectifs.",
    "Repère ce qui pourrait passer en legende, en note ou en seconde vue.",
    "Tu verras qu'un schéma devient souvent plus pro quand on ose lui retirer du bruit.",
  ],
};

const thirdChapter = {
  label: "Chapitre 3",
  title: "Les erreurs classiques d'un schéma joli mais inutilisable",
  blurb:
    "Troisieme chapitre rédigé pour aider le lecteur à reconnaitre les faux bons schémas : propres en apparence, mais peu utiles au moment de travailler.",
  intro: [
    "Il y a des schémas franchement brouillons. Ceux-la se reperent vite. Le vrai piege, ce sont les schémas qui ont l'air sérieux, bien ranges, presque pro, mais qui n'aident pas vraiment à comprendre l'installation.",
    "Ces schémas donnent confiance trop tot. On pense que tout est sous contrôle parce que la page est propre, alors que la logique reste faible ou partielle. C'est souvent comme cela qu'on avance avec un faux sentiment de sécurité.",
    "Le but de ce chapitre est simple : t'apprendre à voir les erreurs qui se cachent derriere une belle facade.",
  ],
  sections: [
    {
      title: "Une belle mise en page ne remplace pas une vraie logique",
      paragraphs: [
        "Aligner des blocs, choisir de jolies couleurs ou garder des traits propres ne suffit pas. Si l'on ne comprend pas clairement ou commence l'énergie, comment elle est protégée et comment elle est répartie, le schéma ne fait pas son travail.",
        "La forme doit aider la logique. Elle ne doit jamais essayer de la remplacer.",
      ],
    },
    {
      title: "Le faux confort du tout-sur-la-même-page",
      paragraphs: [
        "Beaucoup de debutants veulent tout montrer d'un seul coup pour avoir l'impression de tenir tout le projet. Le résultat est souvent l'inverse : une page surchargee qui fatigue la lecture.",
        "Des qu'un schéma grossit, il faut accepter de le séparer en vues utiles. Ce n'est pas compliquer le projet. C'est lui redonner de l'air.",
      ],
      bullets: [
        "Vue architecture générale.",
        "Vue distribution 12V.",
        "Vue 230V si besoin.",
        "Vue d'implantation ou de legendes à part.",
      ],
    },
    {
      title: "Les protections placées pour la photo",
      paragraphs: [
        "Un fusible dessine à peu près au bon endroit ne suffit pas. Une protection doit avoir un rôle lisible et un emplacement logique. Sinon, elle devient une decoration rassurante.",
        "Quand tu lis un schéma, demande-toi toujours si la protection existe pour de vrai dans la logique du circuit, pas seulement dans le dessin.",
      ],
    },
    {
      title: "Le melange du présent, de l'optionnel et du futur",
      paragraphs: [
        "Un schéma devient vite flou quand il melange ce qui sera monte tout de suite, ce qui est juste prévu plus tard et ce qui reste une simple idée. Le lecteur ne sait plus ce qui doit être câble maintenant.",
        "Il faut donc distinguer clairement le certain, l'optionnel et le futur, sinon la page devient ambiguë.",
      ],
    },
  ],
  calloutTitle: "Le bon test",
  calloutBody:
    "Si quelqu'un d'autre que toi n'arrive pas à expliquer ton schéma en quelques phrases simples, il est probablement plus decoratif que vraiment utile.",
  summaryTitle: "À retenir avant de passer au chapitre 4",
  summary: [
    "Un schéma joli peut rester mauvais.",
    "La logique compte avant la mise en page.",
    "Les protections doivent être placées avec sens.",
    "Une seule vue n'est pas toujours la bonne solution.",
    "Il faut distinguer clairement l'actuel, l'optionnel et le futur.",
  ],
  exerciseTitle: "Mini exercice de relecture",
  exercise: [
    "Reprends un de tes brouillons.",
    "Cherche une erreur de hierarchie, une erreur de surcharge et une erreur de logique.",
    "Corrige seulement ces trois points.",
    "Observe si le schéma devient déjà plus credible.",
  ],
};

const fourthChapter = {
  label: "Chapitre 4",
  title: "Comment utiliser cet ebook avec l'editeur FabSystem",
  blurb:
    "Quatrieme chapitre rédigé pour transformer le livre en compagnon de travail, pas en lecture passive oubliee après deux pages.",
  intro: [
    "Cet ebook n'a pas été pense pour être lu loin de l'outil. Son vrai intérêt apparait quand tu l'ouvres en même temps que l'editeur FabSystem et que tu fais des allers-retours entre la théorie et ton schéma.",
    "L'objectif n'est pas de tout comprendre avant de toucher l'outil. L'objectif est de progresser par petites boucles : lire, tester, corriger, relire.",
    "Cette maniere de travailler rassure beaucoup, parce qu'elle remplace l'impression de devoir tout maitriser tout de suite par une progression visible.",
  ],
  sections: [
    {
      title: "Lire en actif",
      paragraphs: [
        "À chaque chapitre utile, demande-toi ce que tu peux dessiner ou vérifier maintenant. Cette simple question change la qualité de lecture. Tu n'empiles plus de l'information. Tu construis déjà ton projet.",
      ],
    },
    {
      title: "Travailler par passes",
      paragraphs: [
        "Ne cherche pas à dessiner toute l'installation en une fois. Commence par l'architecture, puis reviens pour les protections, puis pour la distribution, puis pour les détails.",
        "Cette logique de passes successives évite la saturation.",
      ],
    },
    {
      title: "Sauvegarder des versions claires",
      paragraphs: [
        "Versionner son schéma est une habitude très simple et très rentable. Cela permet de revenir en arriere, de comparer et de ne pas casser une base lisible en voulant aller trop vite.",
      ],
      bullets: [
        "Version 1 : idée générale.",
        "Version 2 : protections et distribution.",
        "Version 3 : schéma à faire relire.",
      ],
    },
    {
      title: "Utiliser les gabarits comme des supports, pas comme des prisons",
      paragraphs: [
        "Un template est la pour accelerer la comprehension ou donner une base. Il n'est pas la pour t'obliger à adapter ton projet à lui. S'il ne colle pas, tu l'ajustes.",
      ],
    },
  ],
  calloutTitle: "La bonne cadence",
  calloutBody:
    "Lis juste assez pour agir, puis agis juste assez pour voir ce que tu n'avais pas encore compris. C'est cette boucle qui fait progresser vite.",
  summaryTitle: "À retenir avant de passer au chapitre 5",
  summary: [
    "L'ebook sert surtout en aller-retour avec l'editeur.",
    "Il vaut mieux avancer en petites passes qu'en bloc.",
    "Versionner ses schémas fait gagner du temps.",
    "Un gabarit doit t'aider, pas te contraindre.",
  ],
  exerciseTitle: "Mini exercice de prise en main",
  exercise: [
    "Ouvre l'editeur FabSystem.",
    "Créé une version très simple de ton architecture.",
    "Sauvegarde-la comme version 1.",
    "Reviens ensuite au chapitre 5 pour l'ameliorer avec méthode.",
  ],
};

const fifthChapter = {
  label: "Chapitre 5",
  title: "La méthode FabSystem : comprendre, poser, relier, vérifier, corriger",
  blurb:
    "Cinquième chapitre rédigé pour fixer une méthode simple et répétable, réutilisable sur presque tous les schémas du livre.",
  intro: [
    "Le plus difficile quand on débute n'est pas seulement de connaître les composants. C'est de savoir dans quel ordre travailler. Sans méthode, on saute d'un sujet à l'autre : on choisit un composant, on revient sur l'architecture, on doute d'une protection déjà posée, et on se fatigue très vite sans avancer vraiment.",
    "La méthode FabSystem repose sur cinq verbes très simples, dans un ordre volontairement fixe : comprendre, poser, relier, vérifier, corriger. Elle ne rend pas les projets magiquement faciles, mais elle donne un ordre de travail stable, le même quel que soit le projet.",
    "C'est cette méthode qui servira de fil conducteur à tout le reste de l'ebook. Chaque partie qui suit n'est, au fond, qu'une déclinaison plus détaillée de ces cinq étapes.",
  ],
  sections: [
    {
      title: "Comprendre",
      paragraphs: [
        "Avant de poser quoi que ce soit, il faut comprendre ce que le projet cherche à faire : quelles sources d'énergie, quels usages du quotidien, quelles contraintes de place ou de budget, quelles limites à ne pas dépasser.",
        "Cette étape se fait souvent sans l'éditeur, juste avec des notes ou une liste. Le but n'est pas encore de dessiner, mais de savoir ce que le dessin devra montrer.",
      ],
    },
    {
      title: "Poser",
      paragraphs: [
        "Poser, c'est installer les grandes briques du schéma sans encore tout relier : batterie ou station, protections principales, zone de distribution, grandes familles de consommateurs.",
        "À ce stade, la position exacte compte moins que la présence de chaque brique. L'objectif est de voir apparaître le squelette du projet avant de se soucier des liaisons.",
      ],
    },
    {
      title: "Relier",
      paragraphs: [
        "Une fois les blocs en place, on relie dans l'ordre logique du flux d'énergie : source, puis protection, puis distribution, puis consommateurs. C'est ici que l'architecture devient vraiment lisible, parce que chaque liaison confirme ou révèle un problème de placement.",
      ],
    },
    {
      title: "Vérifier",
      paragraphs: [
        "Vérifier, c'est relire avec des questions concrètes plutôt qu'avec une impression générale : la source est-elle protégée tout de suite ? la distribution reste-t-elle lisible ? chaque consommateur est-il nommé clairement ?",
        "Cette étape ne doit jamais attendre la toute fin du projet. Vérifier tôt évite de construire longtemps sur une base déjà fragile.",
      ],
    },
    {
      title: "Corriger",
      paragraphs: [
        "Corriger, c'est accepter de déplacer, simplifier, renommer ou séparer ce qui ne fonctionne pas encore. Ces deux dernières étapes, vérifier puis corriger, font partie du travail normal d'un bon schéma : elles ne signalent pas un échec, elles font partie du processus depuis le début.",
      ],
      bullets: [
        "Comprendre : sources, usages, contraintes, limites.",
        "Poser : les grandes briques, sans encore les relier.",
        "Relier : dans l'ordre du flux d'énergie.",
        "Vérifier : avec des questions concrètes, pas une impression générale.",
        "Corriger : déplacer, simplifier, renommer, séparer, sans hésiter.",
      ],
    },
  ],
  calloutTitle: "Une méthode vaut mieux qu'un coup d'inspiration",
  calloutBody:
    "Quand tu ne sais plus quoi faire, reviens aux cinq verbes. Ils redonnent une suite d'actions claire même dans un projet plus complexe.",
  summaryTitle: "À retenir avant de passer à la partie 2",
  summary: [
    "La méthode FabSystem repose sur cinq verbes simples, dans un ordre fixe.",
    "Comprendre vient avant poser, et poser avant relier.",
    "Vérifier ne doit pas attendre la fin du projet.",
    "Corriger fait partie du travail normal, pas d'un échec de conception.",
  ],
  exerciseTitle: "Mini exercice de méthode",
  exercise: [
    "Prends ton schéma actuel, même inachevé.",
    "Note l'étape où tu es vraiment : comprendre, poser, relier, vérifier ou corriger.",
    "Fais seulement l'action qui correspond à cette étape, pas celle qui te tente le plus.",
    "Observe si cela réduit la confusion par rapport à ta façon habituelle de travailler.",
  ],
};

const sixthChapter = {
  label: "Chapitre 6",
  title: "Les 4 questions à se poser devant n'importe quel schéma",
  blurb:
    "Debut de la partie 2 : une grille de lecture universelle pour ne plus subir un schéma, même quand il est nouveau pour toi.",
  intro: [
    "On croit souvent ne pas savoir lire un schéma, alors qu'on essaie surtout de le lire sans méthode. Un schéma devient impressionnant quand on le regarde comme un bloc unique.",
    "La solution n'est pas de tout comprendre d'un coup. La solution est de poser toujours les mêmes questions, dans le même ordre.",
    "Ces quatre questions vont calmer la lecture et te donner un vrai point d'appui.",
  ],
  sections: [
    {
      title: "Question 1 : d'ou vient l'énergie ?",
      paragraphs: [
        "La première chose à identifier, c'est la ou les sources : batterie auxiliaire, panneau solaire, prise de quai, alternateur, station électrique. Tant que ce point est flou, tout le reste flotte.",
      ],
    },
    {
      title: "Question 2 : qu'est-ce qui protège quoi ?",
      paragraphs: [
        "Ensuite, il faut chercher les protections : fusible principal, coupe-circuit, porte-fusibles, disjoncteurs. Cette étape structure la lecture et révèle vite si le schéma est sérieux.",
      ],
    },
    {
      title: "Question 3 : comment l'énergie est-elle distribuée ?",
      paragraphs: [
        "Puis on regarde la distribution : platine, busbars, tableau, sorties dediees, circuits séparés. C'est la carte de circulation du projet.",
      ],
    },
    {
      title: "Question 4 : quels usages sont vraiment alimentes ?",
      paragraphs: [
        "Enfin, on vérifie les consommateurs réels : frigo, pompe, USB, LED, 230V. Chaque usage doit pouvoir être suivi jusqu'a son alimentation.",
      ],
    },
  ],
  calloutTitle: "Le schéma se laisse lire si tu sais l'interroger",
  calloutBody:
    "Tu n'as pas besoin d'être specialiste pour tout comprendre d'un coup. Tu as surtout besoin de poser les bonnes questions dans le bon ordre.",
  summaryTitle: "À retenir avant le chapitre 7",
  summary: [
    "Un schéma se lit mieux avec une routine stable.",
    "Les quatre questions portent sur la source, la protection, la distribution et les usages.",
    "Cette méthode fonctionne même sur des schémas nouveaux.",
  ],
  exerciseTitle: "Mini exercice de lecture",
  exercise: [
    "Prends un schéma déjà existant.",
    "Reponds aux quatre questions sans chercher à tout comprendre.",
    "Note ce qui reste flou après ce premier passage.",
  ],
};

const seventhChapter = {
  label: "Chapitre 7",
  title: "Source, protection, distribution, consommateur : la logique de base",
  blurb:
    "Chapitre clé pour fixer l'architecture minimale d'un schéma électrique lisible, avec une logique valable sur la plupart des projets simples.",
  intro: [
    "Une très grande partie de la clarté d'un schéma tient dans une phrase simple : source, protection, distribution, consommateur. Ce n'est pas une formule magique, mais c'est un excellent squelette de départ, valable aussi bien sur un montage minimal que sur un projet plus riche.",
    "Quand cette logique est visible, le schéma devient presque auto-explicatif : n'importe qui peut suivre le fil sans note complémentaire. Quand elle disparaît, même un petit montage peut sembler compliqué, parce que le lecteur doit reconstruire cette logique lui-même.",
    "Le but de ce chapitre est de te faire reconnaître ces quatre niveaux partout, sur tes propres schémas comme sur ceux des autres.",
  ],
  sections: [
    {
      title: "La source",
      paragraphs: [
        "La source est le point de départ de l'énergie disponible. Dans un van simple, c'est souvent la batterie auxiliaire. Dans d'autres cas, cela peut être une station électrique, ou plusieurs sources combinées comme une batterie et un panneau solaire.",
        "Sur le schéma, la source doit toujours être identifiable en un coup d'œil, avant même de chercher le reste de l'installation.",
      ],
    },
    {
      title: "La protection",
      paragraphs: [
        "La protection vient tout de suite après la source, ou au plus près d'elle selon la logique du circuit. Son rôle est central : elle limite les conséquences d'un défaut, comme un court-circuit ou une surcharge, avant qu'il ne se propage au reste de l'installation.",
        "Une protection mal placée, trop loin de sa source, laisse une portion de câble non protégée. C'est l'un des points que la grille de relecture de ce livre te fera vérifier systématiquement.",
      ],
    },
    {
      title: "La distribution",
      paragraphs: [
        "Distribuer, c'est répartir l'énergie vers plusieurs circuits sans perdre la lisibilité. Porte-fusibles, platine, busbar, tableau : peu importe le matériel exact choisi pour ton projet, l'idée reste la même — donner à chaque circuit un départ clair et protégé.",
      ],
    },
    {
      title: "Les consommateurs",
      paragraphs: [
        "Les consommateurs sont les usages finaux : frigo, pompe, éclairage, prises USB. Ce sont eux qui donnent du sens concret au projet, mais ils ne doivent pas prendre toute la place visuelle dans le schéma, au risque de faire disparaître l'architecture derrière une liste d'appareils.",
      ],
      bullets: [
        "Source : le point de départ de l'énergie, toujours identifiable en premier.",
        "Protection : au plus près de la source, jamais optionnelle.",
        "Distribution : un départ clair et protégé pour chaque circuit.",
        "Consommateurs : les usages finaux, nommés, sans écraser l'architecture.",
      ],
    },
  ],
  calloutTitle: "Ce squelette doit rester visible",
  calloutBody:
    "Tu peux ajouter du solaire, du 230V, du monitoring ou une station. Mais si le lecteur ne retrouve plus la logique source, protection, distribution, consommateur, le schéma perd son ancrage.",
  summaryTitle: "À retenir avant le chapitre 8",
  summary: [
    "Source, protection, distribution et consommateur forment la colonne vertébrale du schéma.",
    "Chaque étape a un rôle différent, et aucune ne doit être sautée.",
    "Un petit montage bien structuré vaut toujours mieux qu'un grand montage brouillon.",
  ],
  exerciseTitle: "Mini exercice d'architecture",
  exercise: [
    "Dessine un schéma minimal à quatre niveaux : source, protection, distribution, consommateur.",
    "N'ajoute aucun détail superflu.",
    "Regarde si la lecture est claire sans commentaire complémentaire.",
  ],
};

const eighthChapter = {
  label: "Chapitre 8",
  title: "Le positif, le négatif, la masse et la terre",
  blurb:
    "Chapitre de clarification vocabulaire, le plus important du livre en matière de sécurité : lever la confusion entre quatre mots qui ne désignent jamais la même chose.",
  intro: [
    "Une grande partie du stress en électricité vient des mots. Positif, négatif, masse, terre : ces termes sont proches dans la conversation courante, mais ils ne désignent jamais la même chose dans un schéma, et les confondre n'est pas qu'une maladresse de vocabulaire.",
    "Tant que ce vocabulaire reste flou, la lecture devient fragile. On croit avoir compris un circuit alors qu'on parle de deux choses différentes sans le savoir. Sur ce sujet précis, une confusion de mots peut devenir une vraie confusion de câblage, avec un risque réel de choc électrique à la clé.",
    "Ce chapitre sert à remettre de l'ordre dans ces notions, avec le niveau de précision qu'elles méritent.",
  ],
  sections: [
    {
      title: "Le positif et le négatif",
      paragraphs: [
        "Dans un schéma 12V simple, le positif sert souvent de fil directeur de lecture : c'est lui qui part de la source, traverse les protections, puis rejoint les consommateurs. Le négatif est le chemin de retour vers la source, tout aussi indispensable au fonctionnement du circuit que le positif, même s'il reçoit souvent moins d'attention.",
        "Les deux doivent être organisés avec la même rigueur. Un négatif dessiné à la hâte, sans vraie logique de retour, cache souvent un flou de conception, pas seulement un flou de dessin.",
      ],
    },
    {
      title: "La masse : un retour commun, à un seul point",
      paragraphs: [
        "Dans un véhicule, la masse renvoie au châssis métallique utilisé comme retour négatif commun pour certains circuits, une pratique courante en automobile. L'idée n'est pas mauvaise en soi : elle simplifie le câblage en évitant de faire revenir chaque négatif jusqu'à la batterie.",
        "Le vrai risque n'est pas la masse elle-même, mais la multiplication des points de contact avec le châssis. Plusieurs points de masse mal reliés entre eux peuvent créer des boucles de masse : de petites différences de potentiel qui perturbent l'électronique sensible, provoquent des grésillements sur l'audio, ou faussent des mesures. La bonne pratique consiste à choisir un point de masse unique et propre, puis à y ramener toutes les liaisons qui doivent rejoindre le châssis.",
      ],
    },
    {
      title: "La terre : la sécurité du 230V, jamais mélangée au 12V",
      paragraphs: [
        "La terre, ou conducteur de protection, appartient exclusivement à la logique du 230V. Son rôle est précis : en cas de défaut d'isolement dans un appareil, elle offre un chemin de faible résistance qui permet au disjoncteur différentiel de détecter l'anomalie et de couper l'alimentation avant qu'un choc électrique dangereux ne survienne.",
        "C'est justement pour cette raison que la terre 230V ne doit jamais être confondue avec le négatif 12V, ni reliée à la masse châssis sans une réflexion sérieuse. Si ces deux mondes se retrouvent mélangés par erreur, un défaut sur le circuit 230V pourrait mettre sous tension une partie du châssis métallique du van ou du bateau, transformant une simple armoire électrique en risque réel pour quiconque touche la carrosserie.",
      ],
    },
    {
      title: "Pourquoi cette distinction change la lecture",
      paragraphs: [
        "Quand les mots sont clairs, les circuits le deviennent aussi. Tu sais alors précisément ce que tu dessines, ce que tu lis, et ce que tu fais relire à quelqu'un d'autre. Un schéma qui garde ces trois notions bien séparées protège autant la compréhension du lecteur que la sécurité de l'installation réelle.",
      ],
      bullets: [
        "Positif et négatif : les deux sens du circuit 12V, à traiter avec la même rigueur.",
        "Masse : retour commun au châssis, à ramener vers un point unique et propre.",
        "Terre : sécurité du 230V, jamais reliée au négatif 12V ni à la masse châssis sans validation sérieuse.",
      ],
    },
  ],
  calloutTitle: "Ne laisse jamais le vocabulaire faire le désordre",
  calloutBody:
    "Beaucoup d'erreurs de schéma commencent par une confusion de mots avant même de devenir une confusion de câblage. Sur ce sujet précis, cette confusion peut coûter bien plus qu'un schéma à refaire.",
  summaryTitle: "À retenir avant le chapitre 9",
  summary: [
    "Le positif et le négatif structurent la lecture 12V, avec la même exigence de rigueur.",
    "La masse dépend du contexte véhicule et doit converger vers un point unique, pour éviter les boucles de masse.",
    "La terre appartient exclusivement à la logique de sécurité du 230V.",
    "Négatif 12V et terre 230V ne doivent jamais être confondus ni reliés sans validation sérieuse : le risque est un choc électrique réel.",
  ],
  exerciseTitle: "Mini exercice de vocabulaire",
  exercise: [
    "Reprends une ancienne note ou un ancien schéma.",
    "Cherche où tu as écrit masse, négatif ou terre.",
    "Vérifie si chaque mot désigne bien une notion précise, et si aucune confusion ne s'est glissée entre le 12V et le 230V.",
  ],
};

const ninthChapter = {
  label: "Chapitre 9",
  title: "Différence entre circuit 12V, solaire et 230V",
  blurb:
    "Chapitre de séparation des mondes : comprendre qu'un bon schéma distingue les familles de circuits au lieu de les entasser.",
  intro: [
    "Quand un projet grandit, plusieurs familles de circuits se croisent vite : 12V de service, solaire, parfois 230V. Le risque est alors de tout mélanger sur la page, comme si toutes ces familles obéissaient à la même logique simplement parce qu'elles cohabitent dans le même van ou le même bateau.",
    "Pourtant, chaque famille obéit à une logique un peu différente, aussi bien dans son fonctionnement que dans les précautions qu'elle demande. C'est justement cette différence qui doit apparaître dans le schéma, pas seulement dans ta tête.",
    "Le but n'est pas de faire peur au lecteur avec une séparation artificielle, mais de lui montrer que la clarté vient souvent de la séparation plutôt que de l'accumulation.",
  ],
  sections: [
    {
      title: "Le 12V de service",
      paragraphs: [
        "Le 12V de service alimente le quotidien : frigo, pompe, LED, USB, commandes. C'est souvent la partie la plus vivante du schéma, celle qui grandit le plus vite au fil des envies et des besoins.",
        "C'est aussi une tension basse, ce qui limite le risque de choc électrique direct, mais qui ne dispense jamais de protections correctement dimensionnées : un court-circuit en 12V reste capable de provoquer un échauffement dangereux, voire un départ de feu.",
      ],
    },
    {
      title: "Le solaire",
      paragraphs: [
        "Le solaire ajoute une logique de production et de régulation. On y retrouve les panneaux, les entrées PV, le MPPT ou l'entrée solaire d'une station. Contrairement à une batterie, un panneau solaire reste une source active tant qu'il reçoit de la lumière : il ne s'isole pas simplement en coupant un interrupteur en aval.",
        "Cette particularité justifie à elle seule de garder la chaîne solaire clairement identifiable sur le schéma, avec ses propres protections côté panneau et côté batterie.",
      ],
    },
    {
      title: "Le 230V",
      paragraphs: [
        "Le 230V ne doit jamais être traité comme un simple accessoire du reste. Même quand le réseau est petit, deux prises et un petit tableau, il mérite une représentation clairement séparée, parce que le risque associé à cette tension n'a rien à voir avec celui du 12V.",
        "C'est également la seule des trois familles qui implique une vraie logique de terre et de protection différentielle, vue en détail au chapitre précédent.",
      ],
    },
    {
      title: "Les points d'interface",
      paragraphs: [
        "Ce qui compte beaucoup, ce sont les endroits où ces familles se rencontrent : recharge, conversion, prise de quai, sortie AC d'une station, convertisseur, chargeur combiné. Ces interfaces sont les zones où les erreurs de schéma se concentrent le plus souvent, précisément parce que deux logiques différentes s'y croisent.",
      ],
      bullets: [
        "12V de service : tension basse, mais protections toujours nécessaires.",
        "Solaire : source active tant qu'elle reçoit de la lumière, jamais totalement isolée par un simple interrupteur en aval.",
        "230V : logique de terre et de différentiel propre, jamais un simple accessoire.",
        "Interfaces : les zones de recharge et de conversion, à traiter avec une attention particulière.",
      ],
    },
  ],
  calloutTitle: "Séparer n'est pas fragmenter",
  calloutBody:
    "Quand tu sépares 12V, solaire et 230V, tu ne casses pas le projet. Tu montres simplement que chaque famille a sa propre logique avant de rejoindre l'ensemble.",
  summaryTitle: "À retenir avant le chapitre 10",
  summary: [
    "Le 12V, le solaire et le 230V ne se lisent pas de la même façon, ni ne présentent le même niveau de risque.",
    "Le solaire est une chaîne de production active, jamais totalement isolée par un simple interrupteur en aval.",
    "Le 230V doit rester clairement identifiable, avec sa propre logique de terre et de différentiel.",
    "Les interfaces entre familles sont les zones les plus sensibles à la confusion.",
  ],
  exerciseTitle: "Mini exercice de séparation",
  exercise: [
    "Prends un schéma qui mélange plusieurs familles de circuits.",
    "Sépare mentalement le 12V, le solaire et le 230V.",
    "Observe si chaque famille peut se suivre sans ambiguïté, et repère les points d'interface entre elles.",
  ],
};

const tenthChapter = {
  label: "Chapitre 10",
  title: "Comment suivre le sens de l'énergie dans un schéma",
  blurb:
    "Chapitre de lecture dynamique : apprendre à suivre un schéma comme un flux, pas comme une affiche immobile.",
  intro: [
    "Lire un schéma, ce n'est pas regarder une collection de symboles. C'est suivre un mouvement. L'énergie part de quelque part, traverse des éléments, se distribue, alimente des usages, puis revient selon la logique du circuit.",
    "Quand tu prends cette habitude de lecture en flux, le schéma cesse d'être intimidant. Il devient une histoire ordonnee.",
    "Ce chapitre te donne une maniere concrete de suivre cette circulation sans te perdre.",
  ],
  sections: [
    {
      title: "Trouver le point de depart",
      paragraphs: [
        "Commence toujours par une source principale. Même s'il y en a plusieurs, choisis-en une et suis-la jusqu'au bout avant de passer à une autre.",
      ],
    },
    {
      title: "Suivre les protections puis les bifurcations",
      paragraphs: [
        "Une fois la source reperee, cherche sa première protection, puis la distribution. C'est la que le schéma se divise en branches lisibles.",
      ],
    },
    {
      title: "Ne pas oublier le retour",
      paragraphs: [
        "Beaucoup de debutants lisent l'aller et oublient le retour. Pourtant, un circuit n'est vraiment compris que quand on voit aussi comment il revient vers sa référence ou sa source.",
      ],
    },
    {
      title: "Relire ensuite les recharges et interfaces",
      paragraphs: [
        "Une fois la distribution d'usage comprise, relis le schéma avec une autre question : comment la batterie se recharge-t-elle ? par le solaire ? par la route ? par la prise de quai ?",
      ],
    },
  ],
  calloutTitle: "Lis en flux, pas en nuage",
  calloutBody:
    "Quand ton regard saute d'un composant à l'autre sans chemin clair, tu subis le schéma. Quand tu suis le flux d'énergie, tu reprends la main.",
  summaryTitle: "À retenir avant le chapitre 11",
  summary: [
    "Commence toujours par une source et suis-la jusqu'au bout.",
    "Lis ensuite branche par branche.",
    "N'oublie jamais le retour du circuit.",
    "Les flux de recharge peuvent faire l'objet d'un second passage.",
  ],
  exerciseTitle: "Mini exercice de lecture en flux",
  exercise: [
    "Prends un schéma simple.",
    "Lis une seule branche à la fois, de la source au consommateur puis au retour.",
    "Fais ensuite une deuxieme lecture consacree aux recharges.",
  ],
};

const eleventhChapter = {
  label: "Chapitre 11",
  title: "Lire un schéma simple puis un schéma plus complet",
  blurb:
    "Chapitre de transition pour montrer qu'on peut monter en complexité sans perdre la méthode de lecture acquise jusque-la.",
  intro: [
    "Un schéma simple a une grande valeur pédagogique : il montre la logique sans bruit. Mais cette logique ne disparait pas quand un projet grandit.",
    "Un schéma plus complet reste lisible si la structure de base est respectee. La complexité ne vient pas seulement du nombre d'éléments. Elle vient surtout du manque de méthode.",
    "Le but de ce chapitre est de te montrer comment garder la même lecture quand on ajoute des couches au projet.",
  ],
  sections: [
    {
      title: "Le schéma simple : parfait pour apprendre",
      paragraphs: [
        "Un schéma simple typique peut se limiter à une batterie, une protection principale, une petite distribution et quelques consommateurs. C'est une base idéale pour apprendre.",
      ],
    },
    {
      title: "Le schéma enrichi : plus d'éléments, même logique",
      paragraphs: [
        "Quand tu ajoutes du solaire, de la recharge roulage ou un petit 230V, tu n'abandonnes pas la logique de base. Tu rajoutes des chaines et des interfaces autour d'elle.",
      ],
    },
    {
      title: "Ce qui doit rester visible",
      paragraphs: [
        "Dans un grand schéma, certains repères ne doivent jamais disparaitre : la source principale, les protections, les distributions, les familles de circuits et les interfaces de recharge.",
      ],
    },
    {
      title: "Monter en complexité sans monter en panique",
      paragraphs: [
        "La bonne stratégie consiste à partir d'un petit schéma juste, puis à ajouter une couche à la fois. À chaque ajout, on relit. C'est cette progression qui rend la complexité acceptable.",
      ],
    },
  ],
  calloutTitle: "La complexité supportable est une complexité ordonnee",
  calloutBody:
    "Un schéma plus complet n'est pas un problème si chaque ajout respecte la structure de lecture déjà acquise.",
  summaryTitle: "À retenir avant la suite du livre",
  summary: [
    "Le schéma simple sert de base d'apprentissage.",
    "Le schéma plus complet ne remplace pas la logique de base : il l'etend.",
    "Les grands repères doivent rester visibles même quand le projet grossit.",
    "La meilleure progression consiste à ajouter une couche puis à relire.",
  ],
  exerciseTitle: "Mini exercice de progression",
  exercise: [
    "Prends un schéma simple que tu comprends déjà.",
    "Ajoute une seule couche : solaire, recharge route ou petit 230V.",
    "Relis toute l'architecture avec les quatre questions du chapitre 6.",
  ],
};

const twelfthChapter = {
  label: "Chapitre 12",
  title: "Batterie, fusible principal et coupe-circuit",
  blurb:
    "Ouverture de la partie 3 : comprendre les trois briques qui posent la base d'une installation sérieuse, même très simple.",
  intro: [
    "Beaucoup de schémas se jouent dès les premiers centimètres. Si la batterie, le fusible principal et le coupe-circuit sont mal penses, tout ce qui suit devient plus fragile.",
    "Ces trois éléments ont une valeur pedagogique enorme, parce qu'ils apprennent au lecteur qu'un schéma ne commence pas par les usages. Il commence par la maitrise de la source.",
    "Dans ce chapitre, on ne cherche pas à faire compliqué. On cherche à rendre évidente une architecture de depart saine.",
  ],
  sections: [
    {
      title: "La batterie comme source principale",
      paragraphs: [
        "La batterie auxiliaire n'est pas seulement un gros bloc d'énergie dans le schéma. C'est le point d'origine de presque toute la logique 12V de service.",
        "La dessiner proprement oblige à penser ce qui part d'elle, ce qui revient vers elle et ce qui doit être protège au plus tot.",
      ],
    },
    {
      title: "Le fusible principal n'est pas un détail",
      paragraphs: [
        "Le fusible principal a un rôle très clair : protéger le depart principal de la batterie vers le reste de l'installation. C'est pour cela qu'il doit apparaitre très vite dans la chaine.",
        "Un schéma qui enterre ce fusible ou le place au hasard envoie déjà un mauvais message au lecteur.",
      ],
    },
    {
      title: "Le coupe-circuit comme point de maitrise",
      paragraphs: [
        "Le coupe-circuit apporte une logique de commande et de sécurisation. Il permet de couper proprement une partie de l'installation quand on intervient ou quand on veut isoler le système.",
        "Dans un schéma propre, il se lit comme un point de contrôle, pas comme un accessoire ajoute à la fin.",
      ],
    },
    {
      title: "L'ordre de lecture à conserver",
      paragraphs: [
        "Pour un montage simple, le squelette le plus lisible reste souvent : batterie, fusible principal, coupe-circuit, distribution. Rien n'empeche ensuite d'ajouter des couches, mais ce depart doit rester clair.",
      ],
      bullets: [
        "Source clairement identifiable.",
        "Protection visible au depart.",
        "Point de coupure lisible.",
        "Sortie vers la distribution sans detour inutile.",
      ],
    },
  ],
  calloutTitle: "Le debut du schéma donne le ton de tout le reste",
  calloutBody:
    "Si tes trois premières briques sont lisibles, une grande partie du schéma devient plus simple à suivre, à relire et à expliquer.",
  summaryTitle: "À retenir avant le chapitre 13",
  summary: [
    "La batterie est la vraie source de référence du 12V de service.",
    "Le fusible principal doit se lire très tot dans la chaine.",
    "Le coupe-circuit apporte une logique de maitrise, pas juste un symbole de plus.",
    "L'ordre batterie, fusible, coupe-circuit, distribution est une excellente base.",
  ],
  exerciseTitle: "Mini exercice de structure de depart",
  exercise: [
    "Dessine seulement la batterie, le fusible principal et le coupe-circuit.",
    "Ajoute ensuite la sortie vers une distribution simple.",
    "Regarde si la lecture est immédiate sans commentaire.",
  ],
};

const thirteenthChapter = {
  label: "Chapitre 13",
  title: "Platine de distribution, interrupteurs et busbars",
  blurb:
    "Chapitre de mise en ordre : apprendre à répartir proprement l'énergie au lieu d'empiler les departs en improvisant.",
  intro: [
    "Une installation commence à devenir confortable quand sa distribution devient claire. C'est la que l'on passe d'un montage qui fonctionne à un montage qui reste lisible dans le temps.",
    "Dans beaucoup de vans, la confusion ne vient pas de la batterie. Elle vient de la maniere dont on distribue ensuite les departs vers les circuits.",
    "Le rôle de ce chapitre est donc simple : t'apprendre à dessiner la répartition comme un vrai système.",
  ],
  sections: [
    {
      title: "À quoi sert une distribution",
      paragraphs: [
        "Distribuer, c'est donner à chaque circuit une place lisible et logique. Cela évite les repiquages successifs, les ajouts improvises et les lectures fatigantes.",
      ],
    },
    {
      title: "Platine, tableau ou porte-fusibles",
      paragraphs: [
        "Peu importe le nom exact selon le matériel choisi, l'idée reste la même : on regroupe les departs dans une zone de lecture stable.",
        "Dans un schéma, cette zone doit se voir comme un noeud d'organisation.",
      ],
    },
    {
      title: "Le rôle des busbars",
      paragraphs: [
        "Les busbars permettent de distribuer proprement un positif ou un négatif commun sans multiplier les raccords incoherents. Ils clarifient beaucoup les retours et les depart multiples.",
      ],
    },
    {
      title: "Les interrupteurs dans la logique d'ensemble",
      paragraphs: [
        "Un interrupteur doit se lire comme une commande utile sur un circuit donne, pas comme un élément flottant. Le lecteur doit comprendre ce qu'il coupe ou autorise.",
      ],
      bullets: [
        "Circuit nomme clairement.",
        "Point de commande visible.",
        "Lien facile à suivre entre commande et usage.",
      ],
    },
  ],
  calloutTitle: "La distribution, c'est de l'ergonomie électrique",
  calloutBody:
    "Une bonne distribution ne rend pas juste le schéma plus propre. Elle rend aussi le montage plus simple à faire évoluer et à depanner.",
  summaryTitle: "À retenir avant le chapitre 14",
  summary: [
    "La distribution organise les departs au lieu de les laisser se multiplier au hasard.",
    "Une platine ou un tableau doivent se lire comme un centre de répartition.",
    "Les busbars clarifient les communs et les retours.",
    "Les interrupteurs doivent rester rattaches à une logique de circuit claire.",
  ],
  exerciseTitle: "Mini exercice de répartition",
  exercise: [
    "Prends trois consommateurs simples.",
    "Dessine une distribution centrale pour eux.",
    "Ajoute si besoin un busbar négatif.",
    "Observe la différence avec un dessin ou tout partirait directement dans tous les sens.",
  ],
};

const fourteenthChapter = {
  label: "Chapitre 14",
  title: "Consommateurs : frigo, pompe, USB, LED",
  blurb:
    "Chapitre pratique pour apprendre à représenter les usages finaux sans leur laisser voler toute la page.",
  intro: [
    "Les consommateurs sont souvent ce qui parle le plus au lecteur, parce que ce sont eux qui donnent un sens concret au projet. On comprend tout de suite l'utilité d'un frigo, d'une pompe ou d'un éclairage.",
    "Le risque, c'est de les laisser prendre trop de place dans le schéma. On finit alors par raconter le confort du van, mais plus vraiment son architecture électrique.",
    "Le bon schéma trouve un équilibre : les usages sont presents, nommes et comprenables, sans ecraser la logique de distribution.",
  ],
  sections: [
    {
      title: "Le frigo comme circuit critique",
      paragraphs: [
        "Le frigo a souvent une place particulière dans un schéma de van, parce qu'il fait partie des usages permanents les plus sensibles. Il merite donc un circuit lisible et identifiable rapidement.",
      ],
    },
    {
      title: "La pompe comme circuit d'usage ponctuel",
      paragraphs: [
        "Une pompe à eau n'a pas le même rythme d'utilisation qu'un frigo, mais elle doit rester simple à suivre. Le lecteur doit voir tout de suite d'ou elle part et comment elle est commandee si une commande existe.",
      ],
    },
    {
      title: "Les prises USB et l'éclairage LED",
      paragraphs: [
        "Ces usages paraissent secondaires, pourtant ce sont eux qui se multiplient vite. Si on ne leur donne pas une logique de groupe ou de depart clair, ils encombrent rapidement le schéma.",
      ],
    },
    {
      title: "Nommer sans surcharger",
      paragraphs: [
        "Le bon réflexe consiste à nommer les consommateurs de maniere utile : frigo, pompe, USB tableau, LED plafond. Ce niveau de précision suffit souvent largement pour la vue principale.",
      ],
    },
  ],
  calloutTitle: "Les consommateurs doivent conclure la lecture, pas la brouiller",
  calloutBody:
    "Ils donnent un visage concret au schéma, mais ils doivent rester au service de l'architecture et non l'inverse.",
  summaryTitle: "À retenir avant le chapitre 15",
  summary: [
    "Les consommateurs rendent le projet concret, mais ne doivent pas dominer la page.",
    "Le frigo merite souvent un circuit très lisible.",
    "Pompe, USB et LED gagnent à être groupes avec logique.",
    "Des noms simples suffisent sur la vue principale.",
  ],
  exerciseTitle: "Mini exercice de consommateurs",
  exercise: [
    "Ajoute quatre consommateurs à une distribution simple.",
    "Nomme-les proprement.",
    "Vérifie si chacun peut se suivre sans ambiguite.",
  ],
};

const fifteenthChapter = {
  label: "Chapitre 15",
  title: "Panneau solaire et MPPT",
  blurb:
    "Chapitre de chaine solaire pour rendre lisible ce qui produit l'énergie et ce qui la réguler avant d'alimenter la batterie.",
  intro: [
    "Le solaire impressionne souvent les debutants alors que sa logique reste assez lisible quand on la sépare bien du reste. Il y à une source de production, une régulation, puis un lien vers la batterie.",
    "Ce qui complique souvent la lecture, ce n'est pas le nombre d'éléments. C'est le melange avec la distribution 12V du quotidien.",
    "Le but du chapitre est donc de te faire dessiner une chaine solaire claire avant de la raccrocher à l'ensemble.",
  ],
  sections: [
    {
      title: "Le panneau comme source dediee",
      paragraphs: [
        "Le panneau solaire n'est pas un consommateur inverse. C'est une source d'énergie distincte qui entre dans le schéma avec sa propre logique de lecture.",
      ],
    },
    {
      title: "Le MPPT comme régulateur central",
      paragraphs: [
        "Le MPPT fait le lien intelligent entre la production solaire et la batterie. Dans le schéma, il doit apparaitre comme une brique de régulation, pas comme un boîtier mysterieux au milieu des fils.",
      ],
    },
    {
      title: "L'entrée PV et la sortie batterie",
      paragraphs: [
        "L'un des meilleurs réflexes consiste à distinguer clairement ce qui entre dans le régulateur côté PV et ce qui en sort vers la batterie. Cette séparation calme tout de suite la lecture.",
      ],
    },
    {
      title: "Raccorder sans melanger les mondes",
      paragraphs: [
        "Le solaire nourrit la batterie. Il n'a pas besoin d'être dessine comme un réseau de consommation parallele. C'est cette discipline qui garde le schéma propre.",
      ],
    },
  ],
  calloutTitle: "La clarté solaire vient de la séparation",
  calloutBody:
    "Des que tu distingues clairement le panneau, la régulation et la batterie, la chaine solaire cesse d'être impressionnante.",
  summaryTitle: "À retenir avant le chapitre 16",
  summary: [
    "Le solaire est une source avec sa propre logique de lecture.",
    "Le MPPT doit être clairement identifiable comme régulateur.",
    "Entrée PV et sortie batterie doivent rester distinctes.",
    "Le solaire se raccorde à la batterie sans brouiller la distribution d'usage.",
  ],
  exerciseTitle: "Mini exercice solaire",
  exercise: [
    "Dessine un panneau, un MPPT et une batterie.",
    "Relie uniquement la chaine solaire.",
    "Ajoute ensuite le reste de l'installation dans un second temps.",
  ],
};

const sixteenthChapter = {
  label: "Chapitre 16",
  title: "Prise de quai et petit réseau 230V",
  blurb:
    "Chapitre de transition vers le 230V pour apprendre à le représenter proprement, sans le traiter comme un simple accessoire du 12V.",
  intro: [
    "Le 230V change un peu la posture de lecture, même quand le réseau embarque reste petit. Il faut donc lui donner un espace logique clair dans le schéma.",
    "Une prise de quai, un petit tableau et quelques usages simples peuvent rester très lisibles, à condition de ne pas être colles n'importe comment au reste.",
    "Ce chapitre pose la base d'un petit réseau 230V propre dans un van ou un amenagement simple.",
  ],
  sections: [
    {
      title: "La prise de quai comme entrée externe",
      paragraphs: [
        "La prise de quai représente une arrivee externe du 230V dans le vehicule. Elle doit donc se lire comme une entrée distincte et non comme un élément perdu dans la page.",
      ],
    },
    {
      title: "Protection et tableau",
      paragraphs: [
        "Le petit réseau 230V gagne énormément en lisibilité quand on montre clairement la protection et le tableau ou mini-tableau qui organise les departs.",
      ],
    },
    {
      title: "Les usages à garder modestes",
      paragraphs: [
        "Dans beaucoup de projets simples, le 230V sert à des usages limités : chargeurs, petit ordinateur, prise de confort. Cette modestie doit aussi se lire dans le schéma.",
      ],
    },
    {
      title: "Séparation visuelle avec le 12V",
      paragraphs: [
        "La règle la plus utile reste de bien distinguer la zone 230V de la zone 12V, même si les deux se parlent via un chargeur, un convertisseur ou une station.",
      ],
    },
  ],
  calloutTitle: "Petit réseau ne veut pas dire lecture approximative",
  calloutBody:
    "Même si le 230V sert à peu de choses dans le projet, il merite une représentation claire et respectueuse de sa logique propre.",
  summaryTitle: "À retenir avant le chapitre 17",
  summary: [
    "La prise de quai est une entrée 230V distincte.",
    "Le petit tableau ou les protections doivent apparaitre clairement.",
    "Les usages 230V restent souvent simples, et c'est très bien ainsi.",
    "La séparation visuelle 12V / 230V est indispensable.",
  ],
  exerciseTitle: "Mini exercice 230V",
  exercise: [
    "Dessine une prise de quai, une protection simple et deux usages 230V.",
    "Sépare nettement cette zone du 12V.",
    "Vérifie si la lecture reste claire au premier coup d'oeil.",
  ],
};

const seventeenthChapter = {
  label: "Chapitre 17",
  title: "Station électrique tout-en-un : ce qu'elle simplifie, ce qu'elle ne simplifie pas",
  blurb:
    "Chapitre charniere pour expliquer pourquoi une station peut alleger un projet, tout en demandant quand même un vrai schéma autour d'elle.",
  intro: [
    "Une station électrique tout-en-un rassure beaucoup parce qu'elle concentre la batterie, la charge, parfois le solaire, parfois le convertisseur et parfois même le monitoring dans un seul produit.",
    "C'est une vraie simplification, mais pas une disparition du besoin de schéma. Des qu'on ajoute du solaire fixe, une distribution 12V ou un petit réseau 230V, l'architecture doit toujours être comprise.",
    "Ce chapitre sert à poser une idée simple : une station simplifie certains blocs internes, mais elle ne remplace pas la clarté globale du projet.",
  ],
  sections: [
    {
      title: "Ce que la station simplifie vraiment",
      paragraphs: [
        "La station reduit le nombre de composants séparés à dessiner au coeur du système. Pour un debutant, cela peut beaucoup apaiser la première lecture.",
      ],
    },
    {
      title: "Ce qu'elle ne simplifie pas automatiquement",
      paragraphs: [
        "La station ne decide pas à ta place comment organiser tes sorties 12V, tes usages 230V, tes protections externes ou tes entrées d'énergie. Ces choix restent visibles dans le schéma.",
      ],
    },
    {
      title: "La station comme bloc central",
      paragraphs: [
        "Dans FabSystem, la bonne approche consiste souvent à dessiner la station comme un bloc central très lisible, puis à faire rayonner autour d'elle les entrées, les sorties et les circuits réels.",
      ],
    },
    {
      title: "Pourquoi ce chapitre préparé la suite",
      paragraphs: [
        "Comprendre cette nuance permet ensuite d'aborder des cas concrets comme l'AFERIY P280 sans croire que la station rend inutile toute reflexion d'architecture.",
      ],
    },
  ],
  calloutTitle: "Une station simplifie l'intérieur, pas la pensée du projet",
  calloutBody:
    "Le bon schéma avec station ne consiste pas à dessiner moins. Il consiste à dessiner ce qui reste important autour du bloc central.",
  summaryTitle: "À retenir avant la partie 4",
  summary: [
    "Une station allege le coeur du système.",
    "Elle ne remplace pas la logique de distribution et de séparation des circuits.",
    "Le bloc station doit rester lisible au centre du schéma.",
    "Les entrées et sorties externes gardent toute leur importance.",
  ],
  exerciseTitle: "Mini exercice station",
  exercise: [
    "Dessine un bloc station électrique central.",
    "Ajoute une entrée solaire, une sortie 12V et une sortie 230V.",
    "Observe ce qui doit encore être structure autour du bloc pour que le schéma reste utile.",
  ],
};

const eighteenthChapter = {
  label: "Chapitre 18",
  title: "L'écran de demarrage",
  blurb:
    "Premier chapitre de prise en main pour montrer que l'arrivee dans l'editeur doit déjà te mettre dans une logique de projet, pas dans une logique de gadget.",
  intro: [
    "Quand on ouvre un outil pour la première fois, on cherche souvent tout de suite à cliquer partout. C'est normal. Mais un editeur de schéma devient beaucoup plus simple à vivre si l'écran de demarrage t'aide d'abord à choisir une direction claire.",
    "Dans FabSystem, le bon usage commence dès les premières secondes. Il faut comprendre si tu pars d'une page blanche, d'un gabarit, d'un ancien schéma ou d'un projet à corriger.",
    "Ce chapitre sert donc à desamorcer l'effet de nouveaute. L'écran de demarrage n'est pas seulement une porte d'entrée. C'est déjà un moment de cadrage.",
  ],
  sections: [
    {
      title: "Choisir un point de depart au lieu de partir au hasard",
      paragraphs: [
        "L'erreur classique consiste à ouvrir une page vide alors qu'un gabarit simple aurait fait gagner du temps et de la clarté. L'écran de demarrage doit d'abord t'aider à savoir d'ou tu pars.",
        "Selon ton besoin, tu ne lances pas le même travail. Un premier schéma, une correction, une architecture solaire ou un montage station n'ont pas besoin du même elan de depart.",
      ],
      bullets: [
        "Page blanche si tu veux poser l'architecture à zéro.",
        "Gabarit si tu veux apprendre une logique déjà structuree.",
        "Projet existant si tu veux corriger ou completer.",
        "Version dupliquee si tu veux faire évoluer une base sans la casser.",
      ],
    },
    {
      title: "Lire l'accueil comme un tableau de bord calme",
      paragraphs: [
        "Un bon écran de demarrage ne doit pas te noyer. Il doit te rappeler tes derniers projets, les points d'entrée utiles et les raccourcis de reprise les plus importants.",
        "L'objectif n'est pas de tout montrer. L'objectif est de reduire la friction pour que tu puisses reprendre ton schéma dans de bonnes conditions.",
      ],
    },
    {
      title: "Comprendre ce que FabSystem veut t'encourager à faire",
      paragraphs: [
        "Un écran d'accueil raconte déjà une philosophie. S'il pousse vers les gabarits, il t'invite à apprendre par structure. S'il remet les derniers projets en avant, il t'encourage à travailler dans la duree.",
        "Cette lecture est utile parce qu'elle te permet de ne pas utiliser l'outil à contre-sens. On ne vient pas dans FabSystem pour dessiner au kilometre. On vient pour clarifier un projet.",
      ],
    },
    {
      title: "Ne pas confondre vitesse et precipitation",
      paragraphs: [
        "Aller vite des le demarrage est utile, mais uniquement si tu sais pourquoi tu ouvres telle base et pas telle autre. Un bon depart raccourcit tout le reste.",
        "Si tu choisis le bon point d'entrée, la bibliotheque, le canvas et les réglages te sembleront beaucoup plus coherents ensuite.",
      ],
    },
  ],
  calloutTitle: "Bien demarrer, c'est déjà simplifier la suite",
  calloutBody:
    "Le meilleur écran de demarrage n'impressionne pas. Il t'évite juste de commencer le mauvais schéma de la mauvaise maniere.",
  summaryTitle: "À retenir avant le chapitre 19",
  summary: [
    "L'écran de demarrage sert à cadrer le projet avant de dessiner.",
    "Le bon choix entre page blanche, gabarit et projet existant change toute la suite.",
    "FabSystem doit être lu comme un outil de clarté, pas comme un espace de dessin neutre.",
    "Un bon depart fait gagner du temps sans te precipiter.",
  ],
  exerciseTitle: "Mini exercice de depart",
  exercise: [
    "Liste trois cas simples : premier schéma, schéma à corriger, schéma solaire.",
    "Associe à chacun le meilleur point d'entrée dans l'editeur.",
    "Demande-toi lequel reduit le plus les manipulations inutiles.",
  ],
};

const nineteenthChapter = {
  label: "Chapitre 19",
  title: "La bibliotheque de composants",
  blurb:
    "Chapitre de structure pour apprendre à utiliser la bibliotheque comme un langage de projet, pas comme une boite à icones à vider sur le canvas.",
  intro: [
    "Une bibliotheque de composants peut rassurer ou destabiliser. Si tu l'abordes comme un catalogue, tu risques de tout poser trop tot. Si tu l'abordes comme une grammaire, elle devient très simple.",
    "Dans FabSystem, chaque composant n'est pas juste un dessin. C'est une brique de logique. Il te sert à dire d'ou vient l'énergie, comment elle est protégée, comment elle est distribuée ou à quoi elle sert.",
    "Le but du chapitre est de te faire changer de posture. Tu ne parcours pas une bibliotheque pour remplir la page. Tu la consultes pour choisir les bons mots du schéma.",
  ],
  sections: [
    {
      title: "Chercher par fonction avant de chercher par forme",
      paragraphs: [
        "Quand on debute, on cherche souvent le composant qui ressemble au produit achete. Ce n'est pas toujours le bon réflexe. Le meilleur depart consiste à chercher sa fonction dans l'architecture.",
        "Une batterie reste une source. Un MPPT reste une régulation. Un busbar reste une distribution. Cette lecture fonctionnelle évite les choix decoratifs.",
      ],
    },
    {
      title: "Les familles de composants doivent te guider",
      paragraphs: [
        "Une bonne bibliotheque aide parce qu'elle range les composants dans des familles comprenables. Cette organisation doit te rappeler l'ordre logique du schéma.",
        "Si tu pioches dans toutes les categories à la fois, tu fabriques vite une page sans hierarchie. Si tu avances famille par famille, la lecture se construit presque seule.",
      ],
      bullets: [
        "Sources et stockage.",
        "Protections et coupures.",
        "Distribution et répartition.",
        "Consommateurs et usages.",
        "Entrées et sorties spécifiques comme le solaire ou le 230V.",
      ],
    },
    {
      title: "Resister à la tentation du tout de suite",
      paragraphs: [
        "Le danger d'une bibliotheque riche, c'est de vouloir tout sortir dès le début. Or un schéma propre se monte par couches. Tu n'as pas besoin des vingt composants des la première minute.",
        "Dans la pratique, mieux vaut commencer avec les blocs essentiels, puis ajouter les détails quand l'ossature tient debout.",
      ],
    },
    {
      title: "Penser aussi à la relecture future",
      paragraphs: [
        "Le composant que tu choisis aujourd'hui sera relu demain par toi ou par quelqu'un d'autre. Plus le symbole ou la brique choisie est claire, plus la reprise du schéma sera simple.",
        "La bibliotheque n'est donc pas seulement un point d'insertion. C'est aussi un outil de lisibilité dans le temps.",
      ],
    },
  ],
  calloutTitle: "Choisir un composant, c'est choisir un mot juste",
  calloutBody:
    "Un schéma devient vite brouillon quand on choisit les blocs pour leur apparence au lieu de les choisir pour leur rôle dans l'architecture.",
  summaryTitle: "À retenir avant le chapitre 20",
  summary: [
    "La bibliotheque se lit par fonction avant de se lire par produit.",
    "Les familles de composants aident à construire le schéma dans le bon ordre.",
    "Tout sortir trop tot surcharge la page inutilement.",
    "Le bon composant facilite aussi la relecture future.",
  ],
  exerciseTitle: "Mini exercice bibliotheque",
  exercise: [
    "Prends cinq éléments de ton futur schéma.",
    "Classe-les par fonction avant d'aller les chercher dans la bibliotheque.",
    "Vérifie si cet ordre t'aide à mieux poser la structure.",
  ],
};

const twentiethChapter = {
  label: "Chapitre 20",
  title: "Le canvas",
  blurb:
    "Chapitre de mise en place pour comprendre que le canvas n'est pas un vide à remplir, mais un espace de hierarchie ou le schéma doit respirer.",
  intro: [
    "Le canvas intimide parfois parce qu'il donne une grande liberté. On peut y poser des blocs partout, les deplacer, les rapprocher, les ecarter. Sans méthode, cette liberté produit vite une page molle ou nerveuse.",
    "Un bon canvas n'est pas simplement un fond sur lequel tu dessinés. C'est un espace de lecture. Il doit aider l'oeil à comprendre l'architecture, à suivre les circuits et à distinguer les familles de zones.",
    "Dans ce chapitre, on va donc parler moins de design que de respiration. Un schéma propre occupe l'espace avec intention.",
  ],
  sections: [
    {
      title: "Donner une direction à la lecture",
      paragraphs: [
        "Avant même de relier les composants, il faut sentir d'ou le schéma se lira. Gauche vers droite, haut vers bas, zones separees : peu importe, du moment que la direction reste stable.",
        "Cette stabilite soulage énormément le lecteur. Il sait ou chercher la source, ou repasser par la distribution et ou trouver les consommateurs.",
      ],
    },
    {
      title: "Créer des zones avant de remplir",
      paragraphs: [
        "Le canvas devient beaucoup plus simple quand tu imagines des territoires. Une zone source, une zone protections, une zone distribution, une zone usages, et parfois une zone 230V ou solaire.",
        "Ces zones n'ont pas besoin d'être encadrees visuellement au depart. Le simple fait de les reserver change déjà la qualité du schéma.",
      ],
    },
    {
      title: "Laisser de l'air sans tomber dans le vide",
      paragraphs: [
        "Un schéma serre fatigue. Mais un schéma trop eparpille fatigue aussi, parce que les liaisons s'allongent et que la logique se dissout. Il faut trouver une tension juste entre compacite et respiration.",
        "C'est souvent en deplacant legerement quelques blocs qu'on gagne plus qu'en ajoutant des effets ou des annotations.",
      ],
    },
    {
      title: "Le zoom et le cadrage font partie du travail",
      paragraphs: [
        "Travailler sur le canvas, ce n'est pas seulement placer des blocs. C'est aussi choisir quand tu regardes le schéma de loin et quand tu reviens sur une zone précise.",
        "Cette alternance entre vue globale et vue locale est essentielle pour garder à la fois la cohérence générale et le détail juste.",
      ],
    },
  ],
  calloutTitle: "Le canvas doit porter la lecture avant de porter le détail",
  calloutBody:
    "Si le schéma ne tient pas déjà bien de loin, ajouter des détails ou des jolies etiquettes ne le sauvera pas.",
  summaryTitle: "À retenir avant le chapitre 21",
  summary: [
    "Le canvas est un espace de lecture, pas un simple fond de dessin.",
    "Une direction claire aide l'oeil à suivre l'énergie.",
    "Des zones implicites rendent la page plus stable.",
    "Le bon niveau d'air se trouve entre compacite et dispersion.",
  ],
  exerciseTitle: "Mini exercice de placement",
  exercise: [
    "Pose seulement la source, la protection et la distribution sur un canvas vide.",
    "Teste deux ou trois placements différents.",
    "Choisis celui qui se lit le plus vite sans elonger les futurs circuits.",
  ],
};

const twentyFirstChapter = {
  label: "Chapitre 21",
  title: "Les liaisons et les poignees",
  blurb:
    "Chapitre de circulation pour apprendre à relier sans fabriquer un plat de spaghettis, et pour comprendre que chaque liaison raconte déjà quelque chose du projet.",
  intro: [
    "Beaucoup de schémas se degradent au moment des liaisons. Les composants avaient l'air bien places, puis les traits arrivent et toute la page perd en calme.",
    "C'est normal: les liaisons sont le moment ou l'architecture devient visible. Si elles sont hesitantes, trop longues ou mal accrochees, la lecture s'effondre très vite.",
    "Ce chapitre est la pour te donner de bons réflexes. Pas pour faire des traits parfaits, mais pour dessiner des circulations evidentes.",
  ],
  sections: [
    {
      title: "Relier, c'est montrer une logique",
      paragraphs: [
        "Une liaison ne sert pas juste à dire que deux blocs se connaissent. Elle dit quel chemin l'énergie suit, ou elle entre, ou elle sort et à quelle famille de circuit elle appartient.",
        "Si tu gardes cette idée en tete, tu evites déjà beaucoup de liaisons inutiles ou mal placées.",
      ],
    },
    {
      title: "Les poignees servent à clarifier, pas à bricoler",
      paragraphs: [
        "Les poignees et points d'accroche sont très utiles parce qu'ils permettent de faire passer une liaison proprement. Mais ils peuvent aussi devenir un piege si tu les utilises pour sauver un mauvais placement.",
        "Quand une liaison demande trop de detours, il faut souvent revenir au placement des blocs avant de forcer le trait.",
      ],
    },
    {
      title: "Éviter les croisements sans se rendre maniaque",
      paragraphs: [
        "Tous les croisements ne sont pas interdits, mais ils coutent de la lisibilité. Il faut donc les reduire quand ils n'apportent rien.",
        "Le bon objectif n'est pas la perfection geometrique. C'est une lecture calme, ou le regard n'hesite pas sans cesse entre plusieurs pistes.",
      ],
    },
    {
      title: "Garder un langage de liaison cohérent",
      paragraphs: [
        "Si certaines liaisons sont très tendues, d'autres très courbes, d'autres ultra longues, le schéma semble incohérent même quand l'architecture est correcte.",
        "Un même style de liaison rassure. Il donne l'impression d'un projet pense d'un seul bloc.",
      ],
    },
  ],
  calloutTitle: "Une bonne liaison enlieve du doute",
  calloutBody:
    "Quand la ligne est juste, le lecteur ne la remarque presque pas. Il suit simplement l'énergie sans se poser de question.",
  summaryTitle: "À retenir avant le chapitre 22",
  summary: [
    "Une liaison raconte déjà la circulation du projet.",
    "Les poignees aident la clarté mais ne compensent pas un mauvais placement.",
    "Les croisements inutiles fatiguent vite la lecture.",
    "Un langage de liaison cohérent donne plus de calme au schéma.",
  ],
  exerciseTitle: "Mini exercice de liaison",
  exercise: [
    "Prends trois blocs déjà poses.",
    "Relie-les une première fois sans réfléchir, puis une seconde fois avec l'objectif de calmer la lecture.",
    "Compare ce que l'oeil comprend le plus vite.",
  ],
};

const twentySecondChapter = {
  label: "Chapitre 22",
  title: "Le panneau de propriétés",
  blurb:
    "Chapitre de précision pour comprendre comment enrichir le schéma avec les bonnes informations sans le transformer en fiche technique illisible.",
  intro: [
    "Un schéma ne vit pas seulement par ses blocs et ses liaisons. Il gagne aussi en qualité grâce aux informations que tu attaches à chaque élément.",
    "Le panneau de propriétés sert justement à ça. Il permet de nommer, qualifier, organiser et parfois distinguer des circuits qui se ressembleraient sinon trop.",
    "Le risque, bien sur, c'est d'en faire trop. Ce chapitre t'apprend à utiliser les propriétés comme des aides de lecture, pas comme un depot de détails anxieux.",
  ],
  sections: [
    {
      title: "Nommer pour rendre le schéma transmissible",
      paragraphs: [
        "Un nom simple peut changer toute la qualité d'un schéma. 'Frigo', 'pompe à eau', 'sortie USB', 'quai 230V' : ces mots donnent une lecture immédiate sans alourdir la page.",
        "Le panneau de propriétés t'aide à poser cette couche de clarté au bon endroit.",
      ],
    },
    {
      title: "Ajouter du détail seulement quand il sert",
      paragraphs: [
        "Sections de câble, intensite, type de circuit, remarques utiles: tout cela peut être pertinent. Mais pas forcement partout ni tout de suite.",
        "Le bon réflexe consiste à n'ajouter que ce qui aide à vérifier, à transmettre ou à préparer la suite du travail.",
      ],
    },
    {
      title: "Utiliser les propriétés pour séparer sans surcharger",
      paragraphs: [
        "Certaines distinctions se font mieux dans les propriétés que sur la vue principale. C'est le cas, par exemple, d'un niveau de détail qui serait trop lourd à afficher partout.",
        "Cette séparation est précieuse, car elle permet de garder une vue générale propre tout en conservant des informations utiles.",
      ],
    },
    {
      title: "Relire ce que tu as saisi",
      paragraphs: [
        "Les propriétés peuvent aussi devenir une source de bruit si elles sont incoherentes, trop longues ou redondantes. Il faut donc les relire comme on relit un texte.",
        "Un schéma premium n'accumule pas seulement les détails. Il choisit les bons détails et les fait tenir ensemble.",
      ],
    },
  ],
  calloutTitle: "Le bon détail est celui qui aide sans envahir",
  calloutBody:
    "Le panneau de propriétés devient puissant quand il complete la vue principale au lieu d'essayer de la remplacer.",
  summaryTitle: "À retenir avant le chapitre 23",
  summary: [
    "Le panneau de propriétés sert d'abord à clarifier la lecture.",
    "Tout détail n'a pas besoin d'être affiche tout de suite.",
    "Les propriétés permettent de completer la vue sans la surcharger.",
    "Une bonne relecture des libelles fait gagner beaucoup en credibilite.",
  ],
  exerciseTitle: "Mini exercice de propriétés",
  exercise: [
    "Prends quatre composants de ton schéma.",
    "Ajoute un nom clair et une seule information utile à chacun.",
    "Supprime tout ce qui ne change rien à la comprehension.",
  ],
};

const twentyThirdChapter = {
  label: "Chapitre 23",
  title: "Les raccourcis utiles",
  blurb:
    "Chapitre de rythme pour montrer que les raccourcis ne servent pas seulement à aller vite, mais surtout à garder une fluidite de travail quand le schéma devient plus dense.",
  intro: [
    "Quand un outil te demande trop de micro-manipulations, tu fatigues et tu perds en clarté. Les raccourcis utiles ne sont pas un gadget d'utilisateur avance. Ils sont une maniere de garder le cerveau disponible pour la logique du schéma.",
    "Dans FabSystem, certains raccourcis valent surtout parce qu'ils evitent de casser ton elan: dupliquer, aligner, zoomer, revenir, naviguer entre les zones.",
    "Ce chapitre ne cherche pas à te faire mémoriser un tableau complet. Il cherche à t'aider à repeter quelques gestes qui changent vraiment le confort de travail.",
  ],
  sections: [
    {
      title: "Les raccourcis qui reduisent la friction",
      paragraphs: [
        "Les plus utiles sont rarement les plus spectaculaires. Ce sont ceux qui t'evitent des clics repetitifs quand tu ajustes une structure simple.",
        "Plus le schéma grandit, plus cette economie de geste libéré de l'attention pour la lecture elle-même.",
      ],
    },
    {
      title: "Dupliquer sans reproduire le desordre",
      paragraphs: [
        "La duplication est excellente pour gagner du temps sur des circuits ou composants similaires. Mais elle devient dangereuse si tu clones aussi les petites erreurs de placement, de nommage ou de logique.",
        "Le bon usage d'un raccourci reste donc toujours accompagne d'une micro-relecture.",
      ],
    },
    {
      title: "Naviguer rapidement entre vue globale et détail",
      paragraphs: [
        "Les raccourcis de zoom, de recentrage et de navigation gagnent beaucoup de valeur dans un schéma qui commence à respirer sur plusieurs zones.",
        "Ils permettent de vérifier une liaison locale, puis de revenir très vite à la structure générale sans perdre ton orientation.",
      ],
    },
    {
      title: "Installer une routine simple",
      paragraphs: [
        "Tu n'as pas besoin d'apprendre vingt commandes d'un coup. Trois ou quatre raccourcis bien choisis suffisent pour changer le ressenti de l'outil.",
        "L'important est qu'ils s'integrent dans une routine stable de construction, de correction et de reprise.",
      ],
    },
  ],
  calloutTitle: "Le bon raccourci soutient la méthode",
  calloutBody:
    "Un raccourci utile ne te fait pas seulement gagner des secondes. Il t'aide à rester concentre sur la structure du schéma.",
  summaryTitle: "À retenir avant le chapitre 24",
  summary: [
    "Les raccourcis servent d'abord à fluidifier le travail.",
    "La duplication fait gagner du temps si elle reste relue.",
    "La navigation rapide aide à garder ensemble le détail et la vue générale.",
    "Quelques gestes bien choisis valent mieux qu'une liste oubliee.",
  ],
  exerciseTitle: "Mini exercice de rythme",
  exercise: [
    "Choisis trois raccourcis que tu utiliseras sur chaque session.",
    "Refais un petit schéma simple en t'obligeant à les intégrer.",
    "Observe si ton attention reste plus disponible pour la lecture.",
  ],
};

const twentyFourthChapter = {
  label: "Chapitre 24",
  title: "La sauvegarde, l'export et l'impression",
  blurb:
    "Chapitre de finition pour transformer un schéma de travail en document solide à reprendre, à transmettre et à imprimer sans perdre sa lisibilité.",
  intro: [
    "Un bon schéma ne sert pas seulement pendant le moment de dessin. Il doit aussi vivre après. Reprise personnelle, validation, impression atelier, transmission à un client ou à un accompagnant: tout cela demande une sortie propre.",
    "La sauvegarde, l'export et l'impression ne sont donc pas des operations secondaires. Elles font partie de la qualité finale du travail.",
    "Ce chapitre clot la prise en main de l'editeur en te donnant une logique très simple: versionner sobrement, exporter clairement, imprimer utilement.",
  ],
  sections: [
    {
      title: "Sauvegarder comme on construit",
      paragraphs: [
        "Un schéma gagne à être sauvegarde par étapes. Cela permet de garder une base saine, de revenir en arriere si besoin et de comparer deux architectures sans confusion.",
        "La sauvegarde n'est pas une peur de perdre. C'est une habitude de travail propre.",
      ],
    },
    {
      title: "Exporter une vue qui se lit vraiment",
      paragraphs: [
        "Exporter trop tot ou trop charge peut donner un document decevant. Il faut d'abord s'assurer que la vue choisie raconte bien le schéma au bon niveau de détail.",
        "Le meilleur export est celui qui garde la logique de lecture évidente même hors de l'editeur.",
      ],
    },
    {
      title: "Penser à l'impression comme à un autre support",
      paragraphs: [
        "Une page imprimee ne se comporte pas comme un écran. La place, le contraste, les marges et la densite changent la perception.",
        "Imprimer utilement, c'est donc vérifier ce qui reste lisible, ce qui demande une legende et ce qui devrait vivre sur une seconde vue.",
      ],
    },
    {
      title: "Faire une version projet et une version chantier",
      paragraphs: [
        "Dans beaucoup de cas, une seule sortie ne suffit pas. Une version projet peut rester plus pedagogique, tandis qu'une version chantier doit être plus directe et plus concise.",
        "Cette différence n'alourdit pas le travail. Elle le rend plus juste selon le lecteur final.",
      ],
    },
  ],
  calloutTitle: "La sortie du schéma fait partie de sa qualité",
  calloutBody:
    "Un schéma premium n'est pas seulement bien dessine dans l'outil. Il reste clair quand tu le reprends, quand tu l'exportes et quand tu l'imprimes.",
  summaryTitle: "À retenir avant la partie 5",
  summary: [
    "Sauvegarder par étapes rend le projet plus robuste.",
    "Un bon export garde la logique de lecture hors de l'editeur.",
    "L'impression demande un vrai regard de lisibilité.",
    "Version projet et version chantier peuvent avoir des niveaux de détail différents.",
  ],
  exerciseTitle: "Mini exercice de sortie",
  exercise: [
    "Prends un schéma déjà propre.",
    "Préparé une version écran et une version impression.",
    "Compare ce qui doit être simplifie ou renforcé pour rester lisible.",
  ],
};

const twentyFifthChapter = {
  label: "Chapitre 25",
  title: "Le premier exercice : batterie, fusible, coupe-circuit, platine, LED, prise USB",
  blurb:
    "Premier chapitre guide pour construire un schéma 12V très simple, mais assez réel pour apprendre à poser les bonnes briques dans le bon ordre.",
  intro: [
    "Arrive un moment ou il faut cesser de seulement regarder des schémas et commencer à en construire un. Pour cette première mise en pratique, on choisit volontairement une architecture courte, lisible et très representative d'un petit 12V de service.",
    "Le but n'est pas de faire impressionnant. Le but est de sentir comment un schéma prend forme quand on part d'une batterie, qu'on place une protection, qu'on ouvre une coupure générale, qu'on créé une distribution simple et qu'on alimente deux usages faciles à comprendre.",
    "Cet exercice est important parce qu'il pose la méthode sans te noyer. Quand tu sauras dessiner ce petit ensemble proprement, beaucoup d'autres montages deviendront plus naturels.",
  ],
  sections: [
    {
      title: "Choisir un exercice assez simple pour enseigner l'ordre",
      paragraphs: [
        "Une batterie auxiliaire, un fusible principal, un coupe-circuit, une petite platine, une LED et une prise USB suffisent largement pour apprendre l'ossature d'un schéma utile.",
        "Ce choix n'est pas pauvre. Il est pedagogique. Il concentre la logique sans ajouter trop tot des difficultes qui brouilleraient la lecture.",
      ],
    },
    {
      title: "La batterie comme point de depart visuel",
      paragraphs: [
        "Le premier bloc à poser reste la batterie, parce qu'elle donne un ancrage immédiat au schéma. À partir d'elle, tu peux déjà reserver la zone de protection et la future direction de la distribution.",
        "Cette première pose calme la page. Elle évite de commencer par un usage ou une finition alors que la source n'est pas encore visible.",
      ],
    },
    {
      title: "Installer les briques de sécurité avant les usages",
      paragraphs: [
        "Des que la batterie est la, le fusible principal puis le coupe-circuit prennent logiquement leur place. Tu montres déjà que l'énergie n'ira nulle part sans passer par ces étapes.",
        "La platine de distribution peut ensuite devenir le point de depart des petits circuits LED et USB.",
      ],
    },
    {
      title: "Terminer par les consommateurs les plus lisibles",
      paragraphs: [
        "La LED et la prise USB sont utiles ici parce qu'elles se lisent vite. Elles montrent qu'une distribution simple peut nourrir des usages différents sans compliquer le dessin.",
        "L'enjeu n'est pas de multiplier les sorties. L'enjeu est de vérifier que chaque depart reste comprenable au premier coup d'oeil.",
      ],
    },
  ],
  calloutTitle: "Petit exercice, grande lecon de structure",
  calloutBody:
    "Quand ce premier montage tient bien sur la page, tu as déjà appris l'essentiel: partir de la source, protéger, couper, distribuer, puis seulement consommer.",
  summaryTitle: "À retenir avant le chapitre 26",
  summary: [
    "Un premier schéma guide doit rester volontairement simple.",
    "La batterie pose la logique de depart.",
    "Fusible principal et coupe-circuit viennent avant la distribution.",
    "LED et USB suffisent pour apprendre la lisibilité d'un petit réseau 12V.",
  ],
  exerciseTitle: "Mini exercice guide",
  exercise: [
    "Pose la batterie, puis le fusible principal, puis le coupe-circuit.",
    "Ajoute une petite platine de distribution.",
    "Termine par une LED et une prise USB sans ajouter d'autres usages.",
  ],
};

const twentySixthChapter = {
  label: "Chapitre 26",
  title: "Ajouter les composants dans le bon ordre",
  blurb:
    "Chapitre de progression pour transformer un simple exercice en vraie méthode de construction sur le canvas.",
  intro: [
    "Beaucoup de difficultes viennent moins des composants eux-mêmes que de l'ordre dans lequel on les ajoute. Un schéma propre parait plus simple qu'il ne l'est souvent parce qu'il à été construit avec une sequence stable.",
    "Dans FabSystem, cet ordre compte encore plus, car chaque bloc pose sur le canvas influence les suivants: leur place, leurs liaisons et la respiration générale du dessin.",
    "Ce chapitre sert donc à t'installer une routine. Une routine assez simple pour être repetee, assez robuste pour tenir quand le schéma commencera à grandir.",
  ],
  sections: [
    {
      title: "Poser l'ossature avant les détails",
      paragraphs: [
        "Le meilleur ordre commence par les blocs qui organisent tout le reste: source, protection principale, coupure générale, distribution.",
        "Tant que cette colonne vertebrale n'existe pas, les autres ajouts flottent et te poussent à corriger sans cesse le placement.",
      ],
    },
    {
      title: "Ajouter ensuite les departs simples",
      paragraphs: [
        "Une fois la distribution en place, les premiers circuits deviennent beaucoup plus faciles à poser. Tu n'ajoutes plus des usages dans le vide. Tu les accroches à une logique déjà lisible.",
        "Cette étape te montre aussi très vite si la distribution est bien placée ou si elle doit legerement bouger.",
      ],
    },
    {
      title: "Reporter les annotations non essentielles",
      paragraphs: [
        "Le bon ordre n'est pas seulement une question de composants. C'est aussi le choix de ne pas ajouter trop tot les labels, les détails secondaires ou les petits raffinements de mise en page.",
        "Plus tu attends que l'architecture soit stable, plus ces ajouts deviennent simples et propres.",
      ],
    },
    {
      title: "Accepter de reconstruire plutot que rafistoler",
      paragraphs: [
        "Quand l'ordre de construction à été mauvais, on est tente de tout sauver à coup de deplacements et de petits compromis. C'est parfois moins efficace que de reposer proprement le debut.",
        "Cette discipline demande un peu d'humilite, mais elle fait gagner du temps sur la qualité finale.",
      ],
    },
  ],
  calloutTitle: "L'ordre d'ajout est déjà une méthode de lisibilité",
  calloutBody:
    "Quand tu poses les composants dans le bon ordre, le schéma a beaucoup moins besoin d'être corrigé après coup.",
  summaryTitle: "À retenir avant le chapitre 27",
  summary: [
    "On pose d'abord l'ossature source-protection-coupure-distribution.",
    "Les departs se greffent ensuite plus naturellement.",
    "Les annotations viennent après la stabilite de l'architecture.",
    "Reposer proprement vaut souvent mieux que rafistoler longtemps.",
  ],
  exerciseTitle: "Mini exercice d'ordre",
  exercise: [
    "Recommence le schéma du chapitre précédent.",
    "Ajoute les composants dans un ordre volontairement mauvais, puis dans le bon ordre.",
    "Compare le nombre de corrections nécessaires.",
  ],
};

const twentySeventhChapter = {
  label: "Chapitre 27",
  title: "Relier correctement le positif",
  blurb:
    "Chapitre de circulation positive pour apprendre à dessiner un chemin d'énergie lisible, protège et calme à suivre.",
  intro: [
    "Le positif attire souvent toute l'attention, et c'est logique: c'est lui que l'on suit le plus spontanement dans un petit schéma 12V. Mais cette attention peut devenir un piege si l'on multiplie les chemins, les croisements ou les liaisons hesitantes.",
    "Dans ce premier schéma guide, relier correctement le positif consiste surtout à montrer une progression évidente depuis la batterie jusqu'aux usages, en passant par les briques qui donnent du sens et de la sécurité.",
    "Ce chapitre t'aide à obtenir ce sentiment très important: le regard peut suivre l'énergie sans avoir besoin de s'arreter pour deviner.",
  ],
  sections: [
    {
      title: "Suivre le positif comme une histoire simple",
      paragraphs: [
        "Batterie, fusible principal, coupe-circuit, distribution, consommateurs: si cette phrase se lit déjà facilement, le schéma a de bonnes chances d'être juste.",
        "Ton trace positif doit donc appuyer cette histoire au lieu de la disperser.",
      ],
    },
    {
      title: "Montrer les protections comme des étapes reelles",
      paragraphs: [
        "Le positif ne doit jamais sembler filer directement de la batterie aux usages si une protection ou une coupure existe entre les deux.",
        "Chaque étape importante merite donc d'être clairement traversee par le regard. Sinon, la sécurité devient une information implicite au lieu d'être une information visible.",
      ],
    },
    {
      title: "Faire respirer les departs depuis la distribution",
      paragraphs: [
        "Une fois sur la platine ou le point de distribution, le positif doit pouvoir se séparer proprement vers chaque petit circuit.",
        "C'est souvent la qualité de cette séparation qui donne ou non un sentiment de schéma pro, même sur un montage très simple.",
      ],
    },
    {
      title: "Corriger le trace avant de corriger la deco",
      paragraphs: [
        "Si le positif parait tordu, hesitant ou inutilement long, il faut le calmer avant de penser à d'autres détails.",
        "Un schéma gagne davantage avec un bon chemin positif qu'avec dix petits raffinements visuels poses sur une circulation confuse.",
      ],
    },
  ],
  calloutTitle: "Le positif doit guider, pas agiter la page",
  calloutBody:
    "Quand le chemin positif est propre, le lecteur comprend tout de suite ou l'énergie nait, ou elle est protégée et comment elle est distribuée.",
  summaryTitle: "À retenir avant le chapitre 28",
  summary: [
    "Le positif doit se suivre comme une chaine logique simple.",
    "Les protections doivent rester très visibles sur son trajet.",
    "La distribution doit séparer calmement les petits circuits.",
    "Il faut corriger d'abord la circulation, ensuite seulement les finitions.",
  ],
  exerciseTitle: "Mini exercice de positif",
  exercise: [
    "Trace le positif du premier schéma du debut à la fin.",
    "Supprime un detour inutile ou un croisement evitable.",
    "Relis ensuite le schéma en ne suivant que ce trajet.",
  ],
};

const twentyEighthChapter = {
  label: "Chapitre 28",
  title: "Comprendre le retour négatif",
  blurb:
    "Chapitre de retour pour montrer que le négatif ne doit ni disparaitre du schéma, ni venir le salir par une masse confuse.",
  intro: [
    "Le négatif est souvent moins regarde que le positif, et pourtant c'est lui qui fait tenir beaucoup de cohérence dans un schéma. Quand il est mal pense, la page donne vite une impression de bricolage ou de circuit incomplet.",
    "Sur un premier exercice, il est tentant de le résumer trop vite ou de le dessiner à la fin comme un simple retour technique. C'est une erreur courante.",
    "Le négatif doit rester sobre, mais présent. Il doit montrer que chaque usage revient proprement vers la logique de service sans transformer le schéma en toile d'araignee.",
  ],
  sections: [
    {
      title: "Le négatif n'est pas un détail cache",
      paragraphs: [
        "Si le positif raconte le depart de l'énergie, le négatif rappelle que le circuit doit aussi pouvoir se refermer clairement.",
        "Le faire disparaitre du schéma revient souvent à faire semblant qu'une partie de l'installation se comprend toute seule.",
      ],
    },
    {
      title: "Éviter la masse confuse",
      paragraphs: [
        "Le négatif pose souvent problème quand on le laisse arriver de partout sans point de lecture clair. On perd alors très vite la serenite du dessin.",
        "Sur un petit schéma guide, l'objectif est d'avoir un retour négatif simple, lisible et assez ordonne pour que chaque depart garde sa logique.",
      ],
    },
    {
      title: "Relier les usages sans noircir la page",
      paragraphs: [
        "LED et prise USB doivent pouvoir retrouver leur retour sans faire exploser le nombre de traits ou de lignes qui se croisent.",
        "C'est souvent en regroupant bien les usages et en gardant une structure de distribution propre que le négatif devient facile à dessiner.",
      ],
    },
    {
      title: "Le négatif sert aussi à vérifier",
      paragraphs: [
        "Beaucoup d'oublis apparaissent quand on se force à relire le retour négatif. Un circuit qu'on croyait simple devient soudain incomplet ou ambigu.",
        "Cette vérification est très utile car elle oblige à relire le schéma dans les deux sens, pas seulement depuis la source.",
      ],
    },
  ],
  calloutTitle: "Un bon négatif calme tout le schéma",
  calloutBody:
    "Le retour négatif n'a pas besoin d'être spectaculaire. Il à besoin d'être assez clair pour ne laisser aucun doute sur la fermeture du circuit.",
  summaryTitle: "À retenir avant le chapitre 29",
  summary: [
    "Le négatif doit rester visible dans la logique du schéma.",
    "Il faut éviter les retours disperses et confus.",
    "Une bonne distribution aide autant le négatif que le positif.",
    "Relire le schéma par le retour permet de detecter des oublis.",
  ],
  exerciseTitle: "Mini exercice de retour",
  exercise: [
    "Cache mentalement le positif et relis seulement le négatif.",
    "Vérifie si chaque usage retrouve clairement son chemin de retour.",
    "Corrige tout point de doute avant de poursuivre.",
  ],
};

const twentyNinthChapter = {
  label: "Chapitre 29",
  title: "Vérifier la cohérence avant d'aller plus loin",
  blurb:
    "Chapitre de validation pour apprendre à t'arreter au bon moment, relire ton premier schéma guide et verrouiller une base saine avant d'ajouter d'autres difficultes.",
  intro: [
    "Le mauvais réflexe, après un premier schéma qui commence à ressembler à quelque chose, c'est d'en rajouter tout de suite. Un frigo, une pompe, un panneau, un convertisseur. Pourtant, le bon geste consiste d'abord à vérifier si la base tient vraiment.",
    "Cette pause est précieuse. Elle transforme un exercice en apprentissage. Sans elle, on avance avec un schéma peut-être joli, mais encore trop fragile pour servir de fondation.",
    "Ce chapitre te donne une méthode de relecture simple pour verrouiller ce premier montage avant d'ouvrir les cas suivants.",
  ],
  sections: [
    {
      title: "Reprendre la logique dans l'ordre",
      paragraphs: [
        "La première vérification consiste à relire le schéma comme au chapitre 1: source, protection, coupure, distribution, consommateurs, retours.",
        "Si cet ordre reste évident sans commentaire supplémentaire, le schéma est déjà beaucoup plus solide.",
      ],
    },
    {
      title: "Vérifier ce qui est protège et ce qui ne l'est pas",
      paragraphs: [
        "Un premier schéma guide doit déjà faire apparaitre très clairement ou se trouvent les protections et pourquoi elles sont la.",
        "Si un trajet important semble contourner cette logique, c'est le moment idéal pour corriger avant toute complication supplémentaire.",
      ],
    },
    {
      title: "Traquer le bruit inutile",
      paragraphs: [
        "Certaines petites lourdeurs n'empechent pas de comprendre, mais elles fatiguent la page sans raison. Un bloc trop loin, une liaison trop longue, un détail trop tot, un libelle maladroit.",
        "Les enlever maintenant est beaucoup plus simple que de les trainer dans tous les chapitres suivants.",
      ],
    },
    {
      title: "Savoir s'arreter sur une version saine",
      paragraphs: [
        "Vérifier la cohérence, c'est aussi accepter qu'un schéma simple puisse rester simple. Il n'a pas besoin d'être grossi pour devenir sérieux.",
        "Au contraire, un premier schéma bien termine devient une base de confiance pour aborder ensuite le solaire, le 230V ou la station sans se perdre.",
      ],
    },
  ],
  calloutTitle: "La vraie progression commence avec une base verifiee",
  calloutBody:
    "Le premier schéma guide vaut autant par la relecture qu'il t'impose que par les blocs qu'il t'a appris a poser.",
  summaryTitle: "À retenir avant la partie 6",
  summary: [
    "Il faut relire le schéma dans le bon ordre avant d'ajouter quoi que ce soit.",
    "Les protections doivent rester evidentes.",
    "Le bruit inutile doit être retire tant que le schéma reste petit.",
    "Une version simple et saine vaut mieux qu'une complexité prematuree.",
  ],
  exerciseTitle: "Mini exercice de vérification",
  exercise: [
    "Imprime ou duplique ton premier schéma guide.",
    "Relis-le une fois pour la logique, une fois pour les protections, une fois pour le bruit visuel.",
    "N'ajoute rien tant que ces trois passages ne sont pas satisfaisants.",
  ],
};

const thirtiethChapter = {
  label: "Chapitre 30",
  title: "À quoi sert le gabarit premier pas solaire",
  blurb:
    "Premier chapitre de la partie solaire pour montrer qu'un bon gabarit n'est pas une solution magique, mais un support de lecture et d'apprentissage très efficace.",
  intro: [
    "Quand on commence à dessiner une chaine solaire, on peut vite perdre confiance. Non pas parce que le montage est forcement complique, mais parce qu'il ajoute une source d'énergie de plus avec sa propre logique.",
    "C'est exactement pour cela qu'un gabarit premier pas solaire est utile. Il évite de répartir de zéro alors que ce dont tu as surtout besoin, c'est d'une structure claire pour comprendre comment les blocs s'enchainent.",
    "Ce chapitre sert donc à t'expliquer ce que fait vraiment un bon gabarit. Il ne pense pas à ta place. Il t'offre un premier terrain stable pour apprendre la logique solaire sans t'eparpiller.",
  ],
  sections: [
    {
      title: "Un gabarit sert d'abord à calmer la page",
      paragraphs: [
        "Le grand intérêt d'un gabarit est de te faire gagner la page la plus difficile: celle du debut. Les zones sont déjà plus ou moins pensées, les briques importantes sont anticipees, et la lecture de base existe déjà.",
        "Tu n'ouvres donc pas un espace vide. Tu arrives dans une architecture qui te montre déjà ce qu'il faut comprendre en premier.",
      ],
    },
    {
      title: "Le gabarit te fait gagner du sens, pas seulement du temps",
      paragraphs: [
        "Bien sur, un gabarit fait gagner quelques minutes. Mais son vrai benefice n'est pas la vitesse brute. C'est le fait qu'il t'aide à respecter un ordre logique sans le redecouvrir seul à chaque tentative.",
        "En solaire, ce point est precieux parce qu'il rappelle très vite la différence entre production, régulation et stockage.",
      ],
    },
    {
      title: "Il reste une base à faire tienne",
      paragraphs: [
        "Un gabarit n'est pas la copie de ton projet. C'est une trame. Il faut donc savoir l'adapter ensuite sans le casser ni le remplir d'options au hasard.",
        "Le bon usage consiste à comprendre pourquoi il est structure ainsi avant de commencer à l'ajuster.",
      ],
    },
    {
      title: "FabSystem l'utilisé comme un outil pedagogique",
      paragraphs: [
        "Dans l'univers FabSystem, les gabarits ne servent pas à masquer la logique. Ils servent à l'exposer plus vite. C'est une nuance importante.",
        "Si tu lis bien le gabarit, tu apprends déjà quelque chose avant même de bouger un composant.",
      ],
    },
  ],
  calloutTitle: "Un bon gabarit t'aide à voir avant de modifier",
  calloutBody:
    "Le gabarit premier pas solaire vaut surtout parce qu'il te montre la bonne colonne vertebrale avant de te laisser personnaliser le reste.",
  summaryTitle: "À retenir avant le chapitre 31",
  summary: [
    "Le gabarit solaire sert à donner un point de depart stable.",
    "Son intérêt principal est la clarté, pas seulement le gain de temps.",
    "Il doit être compris avant d'être personnalise.",
    "FabSystem l'utilisé comme support pedagogique, pas comme recette fermee.",
  ],
  exerciseTitle: "Mini exercice gabarit",
  exercise: [
    "Ouvre mentalement le gabarit premier pas solaire.",
    "Repère la source solaire, la régulation et la batterie avant tout autre détail.",
    "Demande-toi ce que le gabarit veut te faire comprendre en premier.",
  ],
};

const thirtyFirstChapter = {
  label: "Chapitre 31",
  title: "Deux panneaux, un MPPT, une batterie, un écran",
  blurb:
    "Chapitre d'architecture simple pour apprendre à lire et dessiner une petite chaine solaire realiste sans la melanger trop vite au reste de l'installation.",
  intro: [
    "Le premier montage solaire qui apprend vraiment quelque chose n'a pas besoin d'être enorme. Deux panneaux, un MPPT, une batterie et un écran de suivi suffisent déjà pour poser une logique claire et utile.",
    "Cette petite architecture est intéressante parce qu'elle reste concrete. Elle te montre une vraie chaine de production et de régulation, tout en restant assez sobre pour être relue calmement.",
    "Le but du chapitre est de t'aider à sentir la bonne tension entre simplicite et realisme. On n'est plus dans l'abstraction, mais on n'est pas encore dans le schéma surcharge.",
  ],
  sections: [
    {
      title: "Les panneaux comme entrée de production",
      paragraphs: [
        "Deux panneaux t'obligent déjà à voir que l'on ne dessine pas seulement un capteur isolé, mais un petit ensemble de production qui doit entrer proprement dans la logique du schéma.",
        "Cette production n'est pas un usage. Elle doit donc être lue comme une arrivee d'énergie distincte des consommateurs du van ou du bateau.",
      ],
    },
    {
      title: "Le MPPT comme cerveau de la chaine",
      paragraphs: [
        "Le MPPT fait le lien entre la production et le stockage. Dans un petit schéma solaire simple, il est souvent le bloc le plus important à rendre lisible après la batterie.",
        "S'il est mal place ou mal lu, toute la chaine parait plus mysterieuse qu'elle ne l'est vraiment.",
      ],
    },
    {
      title: "La batterie comme destination de la régulation",
      paragraphs: [
        "Le solaire ne nourrit pas directement tous les usages du quotidien comme s'il contournait la batterie. Le schéma doit donc rendre très claire cette logique de charge et de stockage.",
        "C'est souvent cette précision qui apaise la lecture pour les debutants.",
      ],
    },
    {
      title: "L'écran comme aide de suivi",
      paragraphs: [
        "L'écran ou le petit dispositif de suivi ajoute une couche de comprehension très utile. Il rappelle qu'un schéma peut aussi montrer ce qui aide à observer le système, pas seulement ce qui fait circuler l'énergie.",
        "Encore faut-il que cet écran reste à sa juste place et ne devienne pas le bloc central visuellement.",
      ],
    },
  ],
  calloutTitle: "Petit montage solaire, grande clarté de lecture",
  calloutBody:
    "Deux panneaux, un MPPT, une batterie et un écran suffisent déjà pour apprendre la logique solaire sans entrer trop tot dans la complexité.",
  summaryTitle: "À retenir avant le chapitre 32",
  summary: [
    "Les panneaux sont une source de production distincte.",
    "Le MPPT est la brique centrale de régulation.",
    "La batterie reste le point de stockage clairement visible.",
    "L'écran aide au suivi sans prendre la première place dans la page.",
  ],
  exerciseTitle: "Mini exercice architecture solaire",
  exercise: [
    "Pose deux panneaux, un MPPT, une batterie et un écran.",
    "Lis ensuite le schéma sans penser aux autres circuits du vehicule.",
    "Vérifie si la chaine solaire reste parfaitement évidente toute seule.",
  ],
};

const thirtySecondChapter = {
  label: "Chapitre 32",
  title: "Lire les entrées PV et les sorties batterie",
  blurb:
    "Chapitre de précision pour apprendre à séparer clairement ce qui entre dans le régulateur côté solaire et ce qui en sort vers la batterie.",
  intro: [
    "Beaucoup de schémas solaires deviennent flous à cause d'une confusion très simple: on ne distingue pas assez bien l'entrée PV du MPPT et sa sortie vers la batterie.",
    "Quand cette séparation est mal lue, le régulateur ressemble à une boite opaque qui fait apparaitre ou disparaitre l'énergie. Or, tout l'intérêt du schéma est justement de rendre ce passage très explicite.",
    "Ce chapitre t'apprend donc à regarder le MPPT par ses interfaces. Ce qu'il recoit, ce qu'il traité, ce qu'il renvoie.",
  ],
  sections: [
    {
      title: "Le côté PV doit se lire comme une arrivee dediee",
      paragraphs: [
        "L'entrée PV n'est pas un petit détail sur le côté du schéma. C'est l'arrivee solaire, donc la porte d'entrée de toute la production.",
        "La rendre visible aide tout de suite à clarifier la partie amont de la chaine.",
      ],
    },
    {
      title: "La sortie batterie doit se lire comme une conséquence logique",
      paragraphs: [
        "Une fois l'énergie recue et regulee, le schéma doit montrer simplement qu'elle repart vers la batterie. Ce trajet ne doit pas donner l'impression d'un depart parallele quelconque.",
        "Le lecteur doit sentir que le stockage vient après la régulation, pas à côté d'elle.",
      ],
    },
    {
      title: "Le régulateur devient lisible par ses connexions",
      paragraphs: [
        "Bien souvent, on comprend mieux un MPPT en regardant ce qui y entre et ce qui en sort qu'en regardant sa forme ou son nom.",
        "Cette observation est très utile pour choisir le bon placement et la bonne respiration autour du bloc.",
      ],
    },
    {
      title: "Une séparation claire calme toute la chaine",
      paragraphs: [
        "Des que les entrées PV et les sorties batterie sont bien distinguees, le schéma perd beaucoup de sa tension inutile.",
        "Tu peux alors envisager l'ajout d'autres circuits sans que le coeur solaire se brouille.",
      ],
    },
  ],
  calloutTitle: "Le MPPT se comprend par ses entrées et ses sorties",
  calloutBody:
    "Si l'entrée PV et la sortie batterie sont lisibles, le régulateur cesse tout de suite d'être un bloc intimidant.",
  summaryTitle: "À retenir avant le chapitre 33",
  summary: [
    "L'entrée PV doit rester très identifiable.",
    "La sortie batterie suit une logique claire après la régulation.",
    "Le MPPT se lit beaucoup par ses connexions.",
    "Cette séparation rend toute la chaine plus calme.",
  ],
  exerciseTitle: "Mini exercice MPPT",
  exercise: [
    "Sur ton schéma solaire, marque visuellement le côté PV et le côté batterie.",
    "Relis uniquement ces deux interfaces.",
    "Corrige tout point qui les melange ou les rend trop discrets.",
  ],
};

const thirtyThirdChapter = {
  label: "Chapitre 33",
  title: "Modifier le schéma pour son propre besoin",
  blurb:
    "Chapitre d'adaptation pour apprendre à partir d'un gabarit solaire propre sans le deformer à chaque idée nouvelle.",
  intro: [
    "Une fois qu'un gabarit simple est compris, la tentation est forte de le tordre très vite pour qu'il ressemble exactement à son projet. C'est naturel, mais il faut le faire avec méthode.",
    "Modifier un schéma solaire ne consiste pas seulement à rajouter des blocs. Il faut comprendre ce que l'ajout change dans l'équilibre de lecture, dans la place du MPPT, dans la respiration de la batterie et dans la lisibilité globale.",
    "Ce chapitre te montre comment personnaliser sans casser. Comment faire évoluer le gabarit pour ton besoin réel tout en gardant sa force pedagogique.",
  ],
  sections: [
    {
      title: "Commencer par l'ecart le plus important",
      paragraphs: [
        "Le bon point de depart consiste à identifier ce qui differe vraiment entre le gabarit et ton projet. Un panneau de plus, un autre point de suivi, un câblage differemment dispose, une integration avec une distribution existante.",
        "Tant que cet ecart principal n'est pas pose, les autres ajustements peuvent rester secondaires.",
      ],
    },
    {
      title: "Modifier une chose à la fois",
      paragraphs: [
        "Si tu changes tout d'un coup, tu ne sais plus ce qui a dégradé ou amélioré la lecture. Il vaut mieux faire évoluer le schéma par petites decisions nettes.",
        "Cette progression est plus lente en apparence, mais bien plus fiable dans le temps.",
      ],
    },
    {
      title: "Vérifier à chaque modification si la chaine reste évidente",
      paragraphs: [
        "À chaque ajout ou deplacement, la question centrale reste la même: est-ce que la production, la régulation et le stockage restent lisibles au premier regard ?",
        "Si la reponse commence à devenir incertaine, il faut revenir à la structure plutot que d'ajouter encore un détail.",
      ],
    },
    {
      title: "Faire du gabarit une base personnelle, pas un collage",
      paragraphs: [
        "Le résultat final doit devenir ton schéma, pas une accumulation de rustines posees sur un modèle de depart.",
        "Cette différence se voit vite: un schéma adapte avec méthode à l'air cohérent d'un seul bloc.",
      ],
    },
  ],
  calloutTitle: "Adapter proprement vaut mieux que personnaliser trop vite",
  calloutBody:
    "Le meilleur usage d'un gabarit consiste à l'emmener doucement vers ton projet, sans perdre la clarté qu'il t'a donnée au depart.",
  summaryTitle: "À retenir avant le chapitre 34",
  summary: [
    "Il faut d'abord identifier l'ecart principal avec ton projet.",
    "Une modification à la fois aide à garder la maitrise.",
    "La chaine solaire doit rester évidente après chaque changement.",
    "Le but est d'obtenir un schéma personnel cohérent, pas un collage.",
  ],
  exerciseTitle: "Mini exercice d'adaptation",
  exercise: [
    "Prends le gabarit solaire simple.",
    "Ajoute une seule adaptation qui ressemble à ton projet.",
    "Vérifie si la lecture reste aussi calme qu'avant.",
  ],
};

const thirtyFourthChapter = {
  label: "Chapitre 34",
  title: "Erreurs de debutant à éviter",
  blurb:
    "Chapitre de vigilance pour identifier les fautes classiques qui abiment un premier schéma solaire alors que l'architecture de base restait pourtant simple.",
  intro: [
    "Les erreurs de debutant ne viennent pas toujours d'une ignorance technique enorme. Elles viennent souvent de petites confusions accumulees: un MPPT mal lu, une batterie visuellement secondaire, un écran trop central, une entrée PV mal distincte, une personnalisation trop rapide.",
    "Le but de ce chapitre n'est pas de faire peur. Au contraire, il sert à rendre ces pieges visibles tant qu'ils sont encore faciles à corriger.",
    "Quand on sait quoi surveiller, on progresse plus vite et avec beaucoup moins de fatigue.",
  ],
  sections: [
    {
      title: "Croire qu'un petit schéma solaire n'a pas besoin d'être structure",
      paragraphs: [
        "C'est probablement l'erreur la plus courante. Parce que le montage parait modeste, on pense qu'on peut être plus flou. En réalité, c'est justement la petite taille du schéma qui rend toute confusion très visible.",
      ],
    },
    {
      title: "Melanger la chaine solaire avec les usages trop tot",
      paragraphs: [
        "Des que les consommateurs, la distribution 12V et la production solaire se melangent sans ordre, le schéma perd sa tranquillite.",
        "Le meilleur réflexe consiste à d'abord faire tenir la chaine solaire seule, puis à l'articuler au reste.",
      ],
    },
    {
      title: "Laisser le MPPT devenir une boite noire",
      paragraphs: [
        "Quand le régulateur n'est pas clairement lu par ses entrées et ses sorties, on commence vite à deviner au lieu de comprendre.",
        "Cette opacite inutile fatigue beaucoup plus qu'on ne l'imagine sur la suite du projet.",
      ],
    },
    {
      title: "Ajouter des options avant d'avoir relu la base",
      paragraphs: [
        "Un deuxieme écran, un autre point de charge, une protection en plus, une integration complexe: tout cela peut venir plus tard. Pas avant d'avoir relu sereinement la base.",
        "L'erreur n'est pas d'être ambitieux. L'erreur est de vouloir tout melanger avant d'avoir une fondation lisible.",
      ],
    },
  ],
  calloutTitle: "Ce qu'il faut éviter tient souvent en peu de choses",
  calloutBody:
    "Un schéma solaire simple se dégradé rarement d'un coup. Il se brouille par une série de petites confusions que l'on peut pourtant corriger très tot.",
  summaryTitle: "À retenir avant la partie 7",
  summary: [
    "Un petit schéma solaire demande autant de structure qu'un autre.",
    "La chaine solaire doit rester lisible avant d'être melangee au reste.",
    "Le MPPT ne doit jamais ressembler à une boite noire.",
    "Les options viennent après la relecture de la base.",
  ],
  exerciseTitle: "Mini exercice d'erreurs",
  exercise: [
    "Relis ton schéma solaire en cherchant une confusion de structure, une confusion de lecture et une option ajoutee trop tot.",
    "Corrige seulement ces trois points.",
    "Observe à quel point le schéma redevient plus calme.",
  ],
};

const thirtyFifthChapter = {
  label: "Chapitre 35",
  title: "Pourquoi partir d'une station électrique dans un van",
  blurb:
    "Premier chapitre de la partie station pour comprendre pourquoi cette solution attire autant de projets de vans, et ce qu'elle simplifie vraiment dès les premiers choix d'architecture.",
  intro: [
    "La station électrique attire parce qu'elle promet une installation plus rapide, plus compacte et moins eparpillee. Pour beaucoup de projets de vans, cette promesse est réelle. Elle permet de reduire le nombre de boîtiers séparés à acheter, à câbler et à relire.",
    "Mais cette simplification ne veut pas dire que le projet devient évident tout seul. Des que l'on ajoute du solaire fixe, une distribution 12V derriere la station, une prise de quai ou un petit usage 230V, un schéma redevient très utile.",
    "Ce chapitre sert donc à te faire partir d'une posture juste. Une station est un excellent point d'entrée pour certains projets, à condition de ne pas la prendre pour une dispense de penser l'architecture globale.",
  ],
  sections: [
    {
      title: "Une station simplifie le coeur du système",
      paragraphs: [
        "L'avantage le plus évident d'une station, c'est qu'elle concentre la batterie, la charge, souvent le convertisseur et parfois une partie du suivi dans un seul bloc.",
        "Sur le schéma, cela allege le centre du montage. Tu n'as pas besoin de dessiner autant de briques internes pour obtenir une vision utile du projet.",
      ],
    },
    {
      title: "Elle rassure aussi le debut du chantier",
      paragraphs: [
        "Dans un van, ce type de solution rassure beaucoup parce qu'il permet de demarrer avec moins d'incertitudes sur l'assemblage du coeur électrique.",
        "Le porteur du projet peut alors concentrer son attention sur les entrées, les sorties et les usages réels autour de la station.",
      ],
    },
    {
      title: "La station n'efface pas les choix de distribution",
      paragraphs: [
        "Ce qui reste à penser, en revanche, c'est tout ce qui se branche autour: solaire, prise de quai, sorties 12V, sorties 230V, petits tableaux, consommateurs fixes.",
        "Autrement dit, la station simplifie l'intérieur du système mais pas le dessin du projet complet.",
      ],
    },
    {
      title: "C'est une solution de projet, pas un raccourci magique",
      paragraphs: [
        "Le bon schéma avec station ne cherche pas à dessiner moins pour dessiner moins. Il cherche à dessiner mieux ce qui reste essentiel.",
        "Si tu gardes cette idée, la station devient une très bonne base d'apprentissage au lieu d'un faux confort.",
      ],
    },
  ],
  calloutTitle: "Une station simplifie beaucoup, mais elle ne remplace pas la clarté",
  calloutBody:
    "La vraie valeur d'une station apparait quand tu gardes un schéma propre autour d'elle pour organiser toutes ses entrées et ses sorties.",
  summaryTitle: "À retenir avant le chapitre 36",
  summary: [
    "La station simplifie le coeur électrique du projet.",
    "Elle rassure le debut du chantier en reduisant les briques internes à câbler.",
    "Elle ne remplace pas les choix de distribution autour d'elle.",
    "Le schéma reste utile dès qu'il y a des entrées et sorties fixes à organiser.",
  ],
  exerciseTitle: "Mini exercice de posture",
  exercise: [
    "Liste ce que la station intègre déjà dans le coeur du système.",
    "Liste ensuite ce qui reste à organiser autour d'elle.",
    "Observe que c'est justement ce second groupe qui doit apparaitre clairement sur le schéma.",
  ],
};

const thirtySixthChapter = {
  label: "Chapitre 36",
  title: "Le gabarit station électrique de FabSystem",
  blurb:
    "Chapitre de prise en main pour montrer comment un gabarit station aide à poser très vite une structure lisible sans répartir d'une page blanche confuse.",
  intro: [
    "Dessiner une station à partir de zéro est possible, mais ce n'est pas toujours le meilleur usage de ton énergie. Un bon gabarit station te fait gagner le plus difficile: la première organisation de la page.",
    "Il place déjà la station dans une logique centrale, anticipe les grandes familles d'entrées et de sorties, et t'offre un point de depart suffisamment stable pour que la personnalisation reste simple.",
    "Le but du chapitre est donc de t'apprendre à lire ce gabarit avant de le modifier. Comme pour le solaire, il ne s'agit pas d'un modèle à recopier aveuglement, mais d'une base pedagogique à comprendre.",
  ],
  sections: [
    {
      title: "Le gabarit pose la station comme bloc central",
      paragraphs: [
        "Le premier service rendu par le gabarit est visuel: il te montre tout de suite ou la station doit vivre sur la page pour que le reste du schéma s'organise autour d'elle.",
        "Cette centralite évite déjà beaucoup d'aller-retours et de deplacements inutiles.",
      ],
    },
    {
      title: "Les zones d'entrées et de sorties sont déjà suggerees",
      paragraphs: [
        "Un bon gabarit station laisse percevoir ou arrivent le solaire ou la prise de quai, et ou repartent les usages 12V et 230V.",
        "Cette anticipation est très utile parce qu'elle te fait comprendre l'architecture avant même de commencer les détails.",
      ],
    },
    {
      title: "Le gabarit doit rester respirable",
      paragraphs: [
        "S'il est trop rempli, un gabarit devient vite contre-productif. L'intérêt d'un bon depart, au contraire, est de te donner une structure assez claire pour être completee progressivement.",
        "Tu dois pouvoir le regarder de loin et sentir déjà comment l'énergie traversera la page.",
      ],
    },
    {
      title: "Le lire d'abord, le modifier ensuite",
      paragraphs: [
        "Le meilleur réflexe consiste à te demander ce que le gabarit raconte avant de le plier à ton projet.",
        "Cette petite pause de lecture t'évite de casser trop vite une structure qui t'a justement été donnée pour t'aider.",
      ],
    },
  ],
  calloutTitle: "Le gabarit station sert à poser le calme de depart",
  calloutBody:
    "S'il est bien lu, le gabarit station t'offre déjà une architecture de page plus sereine avant tout travail de personnalisation.",
  summaryTitle: "À retenir avant le chapitre 37",
  summary: [
    "Le gabarit station place naturellement la station au centre du schéma.",
    "Il suggère déjà les zones d'entrées et de sorties.",
    "Il doit rester assez sobre pour être complete progressivement.",
    "Il vaut mieux le lire avant de le modifier.",
  ],
  exerciseTitle: "Mini exercice gabarit station",
  exercise: [
    "Observe le gabarit station sans rien deplacer.",
    "Repère les zones d'entrées et les zones de sorties.",
    "Demande-toi ce que la page te fait comprendre avant même d'ajouter un seul circuit.",
  ],
};

const thirtySeventhChapter = {
  label: "Chapitre 37",
  title: "Entrée solaire, prise de quai, sortie 12V, sortie 230V",
  blurb:
    "Chapitre de cartographie pour apprendre à lire les grandes interfaces d'une station sans les melanger sur la page.",
  intro: [
    "Une station se comprend beaucoup par ses interfaces. C'est moins son intérieur qui pose problème sur le schéma que la multiplicite de ses entrées et de ses sorties.",
    "Des qu'on la voit comme un bloc central connecté à quatre grands mondes distincts, la lecture s'apaise: entrée solaire, entrée secteur ou prise de quai, sortie 12V, sortie 230V.",
    "Le but de ce chapitre est de t'aider à cartographier ces familles sans les ecraser les unes sur les autres.",
  ],
  sections: [
    {
      title: "Le solaire reste une arrivee d'énergie distincte",
      paragraphs: [
        "L'entrée solaire de la station ne doit pas être dessinée comme un consommateur à l'envers. Elle reste une arrivee de production qu'il faut pouvoir lire comme telle.",
        "Si elle est bien séparée, toute la logique amont du projet reste plus calme.",
      ],
    },
    {
      title: "La prise de quai se lit comme une autre entrée",
      paragraphs: [
        "Le 230V externe arrive lui aussi dans la station ou dans son environnement proche avec sa propre logique. Il ne doit ni se cacher ni se confondre avec les sorties 230V.",
        "Cette distinction entre ce qui entre et ce qui repart est capitale pour ne pas brouiller le schéma.",
      ],
    },
    {
      title: "La sortie 12V structure la vie quotidienne du van",
      paragraphs: [
        "C'est souvent par cette sortie que vivent le frigo, l'éclairage, la pompe ou les prises USB fixes. Elle merite donc une vraie place de distribution dans la page.",
        "La station ne doit pas avaler cette logique. Elle doit simplement en devenir le point d'origine.",
      ],
    },
    {
      title: "La sortie 230V doit rester lisible comme un autre monde",
      paragraphs: [
        "Le 230V sortant gagne à vivre dans une zone bien séparée visuellement. Même quand il n'alimente que peu d'usages, il doit se distinguer du 12V.",
        "Cette séparation est encore plus importante avec une station qui, sinon, donne l'impression que tout se melange dans un seul boîtier magique.",
      ],
    },
  ],
  calloutTitle: "Une station devient simple quand ses interfaces sont clairement cartographiees",
  calloutBody:
    "Plus tu distingues ce qui entre et ce qui sort, côté 12V comme côté 230V, plus le bloc station cesse d'être intimidant.",
  summaryTitle: "À retenir avant le chapitre 38",
  summary: [
    "L'entrée solaire reste une arrivee distincte.",
    "La prise de quai doit se lire comme une autre entrée clairement identifiee.",
    "La sortie 12V doit nourrir une vraie logique de distribution.",
    "La sortie 230V doit rester séparée visuellement du reste.",
  ],
  exerciseTitle: "Mini exercice interfaces",
  exercise: [
    "Dessine une station comme bloc central.",
    "Ajoute autour d'elle les quatre grandes interfaces: solaire, quai, 12V, 230V.",
    "Vérifie si chacune se reconnait en moins de deux secondes.",
  ],
};

const thirtyEighthChapter = {
  label: "Chapitre 38",
  title: "Dessiner un petit réseau 12V propre derriere la station",
  blurb:
    "Chapitre de distribution pour montrer comment une station peut alimenter un réseau 12V fixe sans que celui-ci perde sa lisibilité.",
  intro: [
    "Le vrai usage d'une station dans un van ne s'arrete souvent pas à une prise allume-cigare ou à quelques sorties en facade. Très vite, on veut alimenter un réseau 12V fixe: frigo, lumiere, USB, pompe, petits circuits quotidiens.",
        "Ce réseau n'a pas besoin d'être grand pour meriter une vraie structure. Au contraire, c'est souvent sur les petits montages qu'on voit le mieux si la distribution est propre ou bricolee.",
    "Le but du chapitre est donc de te faire dessiner ce 12V de service comme un monde ordonne derriere la station, pas comme une grappe de petits usages rajoutes au hasard.",
  ],
  sections: [
    {
      title: "La station devient la source, pas la distribution elle-même",
      paragraphs: [
        "La station peut être l'origine du 12V fixe, mais elle n'a pas à avaler visuellement toute la distribution.",
        "Le bon schéma montre souvent une sortie 12V claire qui part ensuite vers une petite platine, un busbar ou un autre point de répartition lisible.",
      ],
    },
    {
      title: "Les usages quotidiens doivent rester regroupes",
      paragraphs: [
        "Frigo, LED, USB, pompe: ces usages gagnent à être poses comme une famille de consommateurs proches, avec des departs qui restent faciles à suivre.",
        "Plus tu les eparpilles, plus la station parait magique et moins le réseau 12V existe comme sous-ensemble cohérent.",
      ],
    },
    {
      title: "Le 12V fixe doit rester sobre",
      paragraphs: [
        "Il n'est pas nécessaire d'ajouter tout de suite tous les raffinements d'un montage très equipe. Ce qui compte ici, c'est la lisibilité de la source, de la distribution et des departs principaux.",
        "La station simplifie déjà assez le coeur du système pour que tu puisses garder le reste respirable.",
      ],
    },
    {
      title: "Penser à la relecture future",
      paragraphs: [
        "Un petit réseau 12V propre derriere la station sera plus facile à faire relire, à faire évoluer ou à depanner plus tard.",
        "C'est la raison pour laquelle il faut lui donner une vraie place sur la page, même si le montage parait modeste aujourd'hui.",
      ],
    },
  ],
  calloutTitle: "Le 12V derriere la station doit exister comme réseau lisible",
  calloutBody:
    "Une station bien dessinée ne remplace pas la distribution 12V. Elle lui donne simplement un point de depart plus simple.",
  summaryTitle: "À retenir avant le chapitre 39",
  summary: [
    "La station est la source du 12V fixe, pas toute la distribution à elle seule.",
    "Les usages 12V gagnent à être regroupes proprement.",
    "La sobriete du schéma reste un avantage majeur.",
    "Une vraie structure 12V facilite aussi la relecture future.",
  ],
  exerciseTitle: "Mini exercice 12V station",
  exercise: [
    "Ajoute une sortie 12V depuis la station vers une petite distribution.",
    "Pose ensuite trois usages fixes faciles à lire.",
    "Vérifie si tu peux expliquer le réseau 12V sans parler de l'intérieur de la station.",
  ],
};

const thirtyNinthChapter = {
  label: "Chapitre 39",
  title: "Dessiner un petit réseau 230V protège",
  blurb:
    "Chapitre de séparation pour apprendre à représenter proprement le petit 230V d'une station sans le laisser polluer le reste du schéma.",
  intro: [
    "Le 230V derriere une station est souvent modeste: un ou deux chargeurs, un petit ordinateur, parfois une prise de confort. Pourtant, sa représentation sur le schéma demande beaucoup de rigueur visuelle.",
    "Si tu le colles trop près du 12V ou si tu le dessinés comme un appendice secondaire, la lecture devient incertaine. On ne sait plus ce qui relève de quel monde ni ou se trouvent les protections.",
    "Ce chapitre t'aide donc à donner au 230V une zone claire, petite si besoin, mais parfaitement lisible et respectueuse de sa logique propre.",
  ],
  sections: [
    {
      title: "Le 230V doit exister comme zone à part",
      paragraphs: [
        "Même quand il n'alimente presque rien, le 230V ne doit pas être absorbe par la masse du schéma 12V.",
        "Une zone séparée, un chemin de lecture distinct et quelques usages modestes suffisent déjà à clarifier beaucoup de choses.",
      ],
    },
    {
      title: "Les protections doivent rester visibles",
      paragraphs: [
        "Sur un petit réseau 230V, il est encore plus tentant d'être rapide. Pourtant, c'est justement la qu'il faut être très net sur la logique de protection et de depart.",
        "Le lecteur doit sentir que le secteur est traité avec autant de structure que le reste, même si le montage est simple.",
      ],
    },
    {
      title: "La station n'efface pas la lecture du 230V",
      paragraphs: [
        "Le fait que le 230V passe par une station ne doit pas donner l'impression qu'il n'a plus besoin d'être lu pour lui-même.",
        "Au contraire, le schéma gagne à montrer clairement comment il sort de la station et vers quels usages il se dirige.",
      ],
    },
    {
      title: "Le petit 230V doit rester à sa juste taille",
      paragraphs: [
        "L'objectif n'est pas d'en faire le heros du schéma. C'est de lui donner une place précise et calme, à la hauteur de son rôle réel.",
        "C'est cette justesse de proportion qui renforcé l'impression de schéma pro.",
      ],
    },
  ],
  calloutTitle: "Petit 230V, lecture sérieuse",
  calloutBody:
    "La qualité d'un schéma station se voit aussi à sa capacité à faire exister un petit monde 230V sans brouiller le 12V autour.",
  summaryTitle: "À retenir avant le chapitre 40",
  summary: [
    "Le 230V doit rester dans une zone séparée du 12V.",
    "Les protections doivent rester visibles même sur un petit réseau.",
    "La station ne dispense pas de lire le 230V pour lui-même.",
    "Le 230V doit rester proportionne à son vrai rôle dans le projet.",
  ],
  exerciseTitle: "Mini exercice 230V station",
  exercise: [
    "Ajoute une petite sortie 230V depuis la station.",
    "Sépare-la clairement du 12V et donne-lui deux usages maximum.",
    "Vérifie si les protections et les departs restent evidents.",
  ],
};

const fortiethChapter = {
  label: "Chapitre 40",
  title: "Les pieges frequents avec une station",
  blurb:
    "Chapitre de vigilance pour identifier les erreurs de lecture et de conception les plus courantes quand on dessine un projet autour d'une station électrique.",
  intro: [
    "La station électrique donne souvent une impression de facilite. C'est vrai, mais cette facilite peut aussi devenir un piege. On croit que parce que le coeur du système est compact, le schéma peut devenir plus approximatif.",
    "En réalité, les erreurs changent simplement de forme. Ce ne sont plus forcement des erreurs de coeur électrique, mais des erreurs d'entrées, de sorties, de répartition ou de melange entre les mondes.",
    "Le but de ce chapitre est de les rendre visibles pendant qu'elles restent faciles à corriger, avant d'attaquer les cas pratiques plus riches.",
  ],
  sections: [
    {
      title: "Prendre la station pour une boite magique",
      paragraphs: [
        "C'est le piege numéro un. Si la station devient un boîtier qui fait tout sans rien expliquer autour d'elle, le schéma perd vite sa valeur.",
        "Le bon dessin montre au contraire ce qui entre, ce qui sort et comment les usages s'organisent derriere le bloc central.",
      ],
    },
    {
      title: "Melanger trop tot le 12V, le 230V et les entrées d'énergie",
      paragraphs: [
        "Le confort donne par la station pousse parfois à tout rapprocher sur la page. Solaire, quai, USB, frigo, prises secteur, tout semble pouvoir partir du même endroit sans autre structure.",
        "C'est justement la qu'il faut redonner des familles de lecture nettes.",
      ],
    },
    {
      title: "Oublier la vraie distribution derriere la station",
      paragraphs: [
        "Beaucoup de petits réseaux 12V ou 230V deviennent brouillons parce qu'ils sont dessinés comme des prolongements flous de la station.",
        "Le schéma gagne pourtant énormément quand ces sous-ensembles existent avec leur propre logique de distribution.",
      ],
    },
    {
      title: "Ajouter trop d'options avant de valider la base",
      paragraphs: [
        "Solaire fixe, DC-DC, quai, éclairage, frigo, prises USB, convertisseur, nouveaux circuits: une station donne envie de tout brancher vite.",
        "La bonne méthode reste la même que dans les parties précédentes: valider une base lisible avant d'ouvrir chaque couche supplémentaire.",
      ],
    },
  ],
  calloutTitle: "La station simplifie le coeur, pas la discipline de lecture",
  calloutBody:
    "Plus un montage semble facile grâce à la station, plus il faut rester rigoureux sur la cartographie des entrées, des sorties et des sous-ensembles.",
  summaryTitle: "À retenir avant la partie 8",
  summary: [
    "La station ne doit jamais devenir une boite magique sur la page.",
    "Les mondes solaire, 12V, 230V et quai doivent rester distingues.",
    "Les distributions derriere la station doivent exister comme sous-ensembles lisibles.",
    "Les options viennent après la validation d'une base claire.",
  ],
  exerciseTitle: "Mini exercice de vigilance",
  exercise: [
    "Relis ton schéma station en cherchant une confusion d'entrée, une confusion de sortie et une confusion de distribution.",
    "Corrige ces trois points avant d'ajouter d'autres options.",
    "Observe à quel point le bloc station devient tout de suite plus facile à expliquer.",
  ],
};

const fortyFirstChapter = {
  label: "Chapitre 41",
  title: "Pourquoi ce cas est pédagogiquement fort",
  blurb:
    "Ouverture de la partie 8 : comprendre ce qu'une station tout-en-un comme l'AFERIY P280 apprend sur la lecture d'un vrai projet, au-delà de la théorie.",
  intro: [
    "Jusqu'ici, chaque gabarit servait à isoler une famille de logique : la station seule, le solaire seul, la distribution seule. Le cas AFERIY P280 fait l'inverse. Il rassemble tout ce que tu as appris dans un seul projet réel, avec de vraies contraintes de courant et de vraies entrées à ne pas confondre.",
    "Ce n'est pas un cas choisi pour sa simplicité. C'est un cas choisi parce qu'il oblige à trancher : deux entrées qui se ressemblent visuellement mais qui n'ont pas le même rôle, une sortie 12V qui a une vraie limite, et une sortie 230V qui mérite un vrai tableau.",
    "Ce chapitre pose le décor avant d'entrer dans le détail des entrées et sorties.",
  ],
  sections: [
    {
      title: "Un vrai produit, pas un exemple inventé",
      paragraphs: [
        "L'AFERIY P280 est une station électrique tout-en-un annoncée à 2048 Wh en LiFePO4, avec une sortie AC pure sinus de 2800 W répartie sur plusieurs prises secteur. Ce n'est pas un chiffre choisi pour l'exercice : c'est ce que documente le fabricant, et c'est ce qui doit apparaître, correctement, dans le schéma.",
        "Travailler sur un vrai produit t'oblige à respecter ses vraies limites plutôt qu'une architecture idéale. C'est exactement la compétence que ce livre essaie de construire depuis le début.",
      ],
    },
    {
      title: "Deux entrées qui se ressemblent, deux rôles différents",
      paragraphs: [
        "La P280 propose deux ports XT90 en entrée. Sur le papier, ils sont identiques. Dans un vrai projet de van, ils ne le sont pas : l'un reçoit le panneau solaire, l'autre reçoit la recharge alternateur via le boîtier DC060 officiel. Un schéma qui les dessine comme deux entrées interchangeables cache une information essentielle au lecteur.",
        "C'est justement ce genre de piège que la méthode FabSystem doit désamorcer : deux connecteurs identiques ne veulent pas dire deux fonctions identiques.",
      ],
    },
    {
      title: "Une sortie 12V qui a un vrai plafond",
      paragraphs: [
        "La sortie XT60 de la P280 est annoncée à 12V / 25A, soit environ 300 W. C'est largement suffisant pour un frigo, une pompe, des USB et de l'éclairage LED, mais ce n'est pas une réserve infinie. Le schéma doit rendre ce plafond visible, pas seulement le connecteur.",
      ],
    },
    {
      title: "Une sortie 230V qui mérite un vrai tableau",
      paragraphs: [
        "La sortie AC de la station alimente deux prises secteur fixes dans le van. Ce n'est plus un accessoire de confort : c'est une installation 230V fixe, avec une protection différentielle et un vrai tableau à dessiner, pas juste deux prises reliées directement au boîtier.",
      ],
      bullets: [
        "Entrée XT90 n°1 : panneau solaire.",
        "Entrée XT90 n°2 : recharge alternateur via le DC060.",
        "Entrée AC : prise de quai ou secteur.",
        "Sortie XT60 12V/25A : petit réseau de bord.",
        "Sortie AC : tableau 230V et deux prises fixes.",
      ],
    },
  ],
  calloutTitle: "Un cas riche parce qu'il est réel",
  calloutBody:
    "Ce n'est pas la complexité qui rend ce cas intéressant, c'est le nombre de décisions concrètes qu'il oblige à prendre correctement.",
  summaryTitle: "À retenir avant le chapitre 42",
  summary: [
    "L'AFERIY P280 est un vrai produit avec de vraies limites à respecter dans le schéma.",
    "Les deux entrées XT90 se ressemblent mais n'ont pas le même rôle.",
    "La sortie 12V a un plafond réel à représenter, pas seulement un connecteur.",
    "La sortie 230V est une vraie installation fixe, pas un simple accessoire.",
  ],
  exerciseTitle: "Mini exercice de repérage",
  exercise: [
    "Note les cinq points d'entrée et de sortie de la station : deux XT90, une entrée AC, une sortie XT60, une sortie AC.",
    "Pour chacun, écris en une phrase ce qui doit toujours rester lisible à son sujet.",
    "Garde cette liste sous les yeux pour les chapitres suivants.",
  ],
};

const fortySecondChapter = {
  label: "Chapitre 42",
  title: "Les deux entrées XT90 et la sortie XT60",
  blurb:
    "Chapitre de précision sur les connecteurs de la P280 : comprendre ce que chaque port accepte réellement avant de le dessiner.",
  intro: [
    "Avant de dessiner quoi que ce soit, il faut connaître les limites réelles des ports. Ce chapitre reste volontairement concret : ce sont des chiffres de fabricant, pas des approximations, et un schéma sérieux doit pouvoir s'appuyer dessus.",
  ],
  sections: [
    {
      title: "Les deux entrées XT90",
      paragraphs: [
        "Les deux ports XT90 de la P280 sont annoncés pour une plage de 11,5 à 55 V, avec un maximum de 20 A et 600 W par port. C'est une plage large, pensée pour accepter aussi bien un panneau solaire qu'un chargeur DC-DC comme le DC060.",
        "Dans le schéma, chaque port doit être nommé selon sa fonction réelle dans ton projet, pas seulement selon son type de connecteur. « Entrée solaire XT90 » et « Entrée recharge alternateur XT90 » ne sont pas la même information que « XT90 » répété deux fois.",
      ],
    },
    {
      title: "La sortie XT60 12V",
      paragraphs: [
        "La sortie 12V de la station utilise un connecteur XT60, annoncé à 25 A, soit environ 300 W disponibles pour le réseau de bord. C'est le point de départ de toute la distribution 12V du van : frigo, pompe, USB, éclairage.",
        "Dans le schéma, cette sortie doit apparaître comme la source du réseau 12V, avec sa protection principale juste après, avant toute répartition vers les circuits.",
      ],
    },
    {
      title: "Pourquoi nommer vaut mieux que décrire le connecteur",
      paragraphs: [
        "Un schéma qui se contente d'écrire « XT90 » ou « XT60 » partout reste techniquement correct, mais il perd une partie de sa valeur pédagogique. Le lecteur doit comprendre le rôle du port avant de chercher sa référence technique.",
        "La bonne pratique consiste à faire apparaître les deux informations ensemble : le rôle en évidence, la référence du connecteur en complément.",
      ],
      bullets: [
        "« Entrée solaire — XT90, 11,5-55 V, 600 W max »",
        "« Entrée recharge alternateur — XT90, via DC060 »",
        "« Sortie réseau 12V — XT60, 25 A max »",
      ],
    },
  ],
  calloutTitle: "Le connecteur n'est pas l'information principale",
  calloutBody:
    "Un port se reconnaît à sa forme. Son rôle, lui, ne se voit que si le schéma le dit clairement.",
  summaryTitle: "À retenir avant le chapitre 43",
  summary: [
    "Les deux entrées XT90 acceptent 11,5-55 V et 600 W max chacune, mais servent à deux usages différents.",
    "La sortie XT60 plafonne à 25 A, soit environ 300 W pour tout le réseau 12V.",
    "Le rôle de chaque port doit être écrit en clair, pas seulement son type de connecteur.",
  ],
  exerciseTitle: "Mini exercice de nommage",
  exercise: [
    "Reprends les cinq ports listés au chapitre précédent.",
    "Écris pour chacun un nom complet : rôle, puis référence technique entre parenthèses.",
    "Vérifie que quelqu'un d'autre comprendrait le projet rien qu'en lisant ces noms.",
  ],
};

const fortyThirdChapter = {
  label: "Chapitre 43",
  title: "Représenter le solaire et la recharge roulage",
  blurb:
    "Chapitre de chaîne de production : dessiner correctement les deux sources qui rechargent la P280 sans les confondre avec sa distribution.",
  intro: [
    "La P280 simplifie beaucoup la recharge, parce qu'elle intègre déjà la régulation solaire et la logique DC-DC. Mais simplifier le matériel ne dispense pas de représenter correctement la chaîne : une source reste une source, même quand elle rentre dans un boîtier compact.",
  ],
  sections: [
    {
      title: "Le panneau solaire vers l'entrée XT90",
      paragraphs: [
        "Le panneau solaire, souvent un modèle souple autour de 200 W dans ce type de projet, part du toit et rejoint directement la première entrée XT90 de la station. Il n'y a pas de régulateur séparé à dessiner : la régulation MPPT est intégrée à la P280.",
        "Le schéma doit quand même montrer ce trajet comme une chaîne à part entière : panneau, câblerie de toit, entrée XT90, plutôt que de le fondre dans le reste du dessin.",
      ],
    },
    {
      title: "La recharge alternateur via le DC060",
      paragraphs: [
        "La recharge en roulant passe par le boîtier DC060 officiel de la marque, documenté comme compatible avec la P280 et avec une charge simultanée possible aux côtés du solaire. Ce boîtier se branche entre la batterie du véhicule et la seconde entrée XT90.",
        "C'est une brique à part entière du schéma, avec sa propre protection côté véhicule, même si elle rejoint ensuite le même type de connecteur que le solaire.",
      ],
    },
    {
      title: "Ne pas mélanger les deux chaînes de recharge",
      paragraphs: [
        "Parce que les deux entrées utilisent le même connecteur, la tentation est grande de les dessiner comme un seul bloc « recharge ». C'est une erreur de lecture : ce sont deux sources indépendantes, avec des logiques et des protections différentes.",
        "Le bon réflexe consiste à garder deux chaînes visuellement distinctes jusqu'à leur arrivée sur la station, même si elles se ressemblent.",
      ],
      bullets: [
        "Chaîne 1 : panneau solaire → câblage toit → entrée XT90 solaire.",
        "Chaîne 2 : batterie véhicule → protection → DC060 → entrée XT90 recharge.",
        "Les deux chaînes convergent vers la P280, mais restent lisibles séparément.",
      ],
    },
  ],
  calloutTitle: "Un même connecteur ne veut pas dire une même chaîne",
  calloutBody:
    "Le solaire et la recharge alternateur partagent un type de port, pas une logique. Le schéma doit continuer à les distinguer jusqu'au bout.",
  summaryTitle: "À retenir avant le chapitre 44",
  summary: [
    "Le panneau solaire rejoint directement une entrée XT90, sans régulateur séparé à dessiner.",
    "La recharge alternateur passe par le DC060 avant de rejoindre la seconde entrée XT90.",
    "Les deux chaînes de recharge doivent rester visuellement distinctes malgré le connecteur commun.",
  ],
  exerciseTitle: "Mini exercice des deux chaînes",
  exercise: [
    "Dessine séparément la chaîne solaire et la chaîne de recharge alternateur.",
    "Fais-les converger seulement au niveau des deux entrées XT90 de la station.",
    "Vérifie qu'on peut suivre chaque chaîne du regard sans les confondre.",
  ],
};

const fortyFourthChapter = {
  label: "Chapitre 44",
  title: "Organiser le 12V fixe derrière la station",
  blurb:
    "Chapitre de distribution : construire un petit réseau 12V lisible et cohérent avec le plafond réel de la sortie XT60.",
  intro: [
    "La sortie XT60 donne environ 300 W disponibles pour le quotidien. C'est une bonne base pour un van bien pensé, à condition que la distribution derrière elle reste organisée et que personne ne soit tenté d'y accrocher un consommateur trop gourmand.",
  ],
  sections: [
    {
      title: "La protection principale, juste après la station",
      paragraphs: [
        "La première chose à dessiner après la sortie XT60, c'est une protection principale dimensionnée sous la limite de 25 A du port. Elle protège tout le réseau 12V en aval, pas seulement un circuit en particulier.",
      ],
    },
    {
      title: "Un tableau de répartition pour les usages courants",
      paragraphs: [
        "Derrière la protection principale, un petit tableau ou porte-fusibles distribue vers les usages classiques d'un van : frigo, pompe à eau, prises USB, éclairage LED. Chaque départ garde son propre fusible, dimensionné pour son usage.",
        "Dans un projet de ce type, un ordre de grandeur réaliste ressemble à ceci : frigo autour de 15 A, pompe autour de 10 A, USB autour de 10 A, éclairage LED autour de 5 A, avec une petite réserve pour une évolution future.",
      ],
      bullets: [
        "Frigo : circuit dédié, environ 15 A.",
        "Pompe à eau : circuit dédié, environ 10 A.",
        "Prises USB : circuit dédié, environ 10 A.",
        "Éclairage LED : circuit dédié, environ 5 A.",
        "Réserve : un départ libre pour une évolution future.",
      ],
    },
    {
      title: "Respecter le plafond plutôt que le découvrir trop tard",
      paragraphs: [
        "Additionner les circuits ci-dessus donne déjà une charge proche du plafond de 25 A si tout fonctionne en même temps. C'est une information que le schéma doit rendre visible, pas cacher derrière une distribution qui semble avoir de la place à l'infini.",
        "Un bon schéma aide justement à repérer ce genre de tension avant l'achat du matériel, pas après le premier essai en usage réel.",
      ],
    },
  ],
  calloutTitle: "300 W, ce n'est pas rien, mais ce n'est pas illimité",
  calloutBody:
    "La sortie 12V de la station suffit largement à un usage de van classique, à condition que le schéma garde ce plafond visible à chaque ajout de circuit.",
  summaryTitle: "À retenir avant le chapitre 45",
  summary: [
    "Une protection principale sous 25 A doit suivre directement la sortie XT60.",
    "Chaque usage courant garde son propre départ et son propre fusible.",
    "Le schéma doit rendre visible la marge réelle disponible sur le réseau 12V.",
  ],
  exerciseTitle: "Mini exercice de budget 12V",
  exercise: [
    "Liste les circuits 12V de ton propre projet avec un calibre de fusible pour chacun.",
    "Additionne ces calibres et compare le résultat au plafond de la source.",
    "Si le total dépasse la marge raisonnable, identifie quel circuit mérite d'être revu.",
  ],
};

const fortyFifthChapter = {
  label: "Chapitre 45",
  title: "Organiser le 230V fixe derrière la station",
  blurb:
    "Chapitre de rigueur 230V : traiter la sortie AC de la station comme une vraie installation fixe, pas comme un prolongateur amélioré.",
  intro: [
    "La sortie AC de la P280 alimente deux prises secteur fixes dans le van. C'est un vrai petit réseau 230V, avec les mêmes exigences de méthode que n'importe quelle installation fixe, quelle que soit la taille de la station qui l'alimente.",
  ],
  sections: [
    {
      title: "Un tableau 230V, pas des prises reliées au hasard",
      paragraphs: [
        "Entre la sortie AC de la station et les deux prises fixes, un petit tableau ou coffret regroupe la protection : un disjoncteur dimensionné pour la ligne, et un dispositif différentiel adapté à un usage mobile.",
        "Dessiner ces deux prises comme reliées directement à la station, sans tableau intermédiaire, cache une étape de sécurité essentielle du schéma.",
      ],
    },
    {
      title: "Ne jamais mettre le quai et la P280 en parallèle sans réflexion",
      paragraphs: [
        "La prise de quai sert à recharger la station, pas à alimenter directement les prises fixes en parallèle de sa propre sortie AC. Mélanger les deux sans un inverseur de source dédié est une erreur de conception, pas seulement une erreur de dessin.",
        "Le schéma doit rendre ce choix explicite : le quai entre par l'entrée AC de la station, les prises fixes sortent par la sortie AC. Ce sont deux chemins distincts qui ne se croisent jamais directement.",
      ],
    },
    {
      title: "Rester modeste sur les usages 230V",
      paragraphs: [
        "Deux prises secteur dans un van servent en général à des usages ponctuels et limités : un chargeur, un petit ordinateur, un appareil ménager compact. Ce n'est pas un réseau domestique complet, et le schéma gagne à le montrer avec cette même modestie.",
      ],
      bullets: [
        "Entrée AC : prise de quai, jamais reliée directement aux prises fixes.",
        "Sortie AC : tableau 230V avec disjoncteur et différentiel.",
        "Deux prises fixes : usages ponctuels, pas un réseau domestique.",
      ],
    },
  ],
  calloutTitle: "Petite station, vraie installation 230V",
  calloutBody:
    "La taille compacte de la P280 ne réduit en rien les exigences de méthode et de sécurité du réseau 230V qu'elle alimente.",
  summaryTitle: "À retenir avant le chapitre 46",
  summary: [
    "Les deux prises fixes passent toujours par un tableau avec protection et différentiel, jamais reliées directement.",
    "Le quai et la sortie AC de la station ne doivent jamais être mis en parallèle sans inverseur de source.",
    "Les usages 230V d'un van restent modestes, et le schéma peut l'assumer clairement.",
  ],
  exerciseTitle: "Mini exercice 230V station",
  exercise: [
    "Dessine l'entrée AC, le tableau de sortie et les deux prises fixes séparément.",
    "Vérifie qu'aucun trait ne relie directement le quai aux prises fixes.",
    "Ajoute la protection différentielle si elle manque encore à ton dessin.",
  ],
};

const fortySixthChapter = {
  label: "Chapitre 46",
  title: "Ce que ce montage apprend sur l'architecture",
  blurb:
    "Clôture de la partie 8 : tirer les enseignements généraux du cas AFERIY P280, valables bien au-delà de ce seul produit.",
  intro: [
    "Ce cas n'était pas qu'un exercice sur un produit précis. Il a servi à mettre en pratique, sur un vrai projet, la quasi-totalité des réflexes construits depuis le début de ce livre. Ce chapitre les rassemble avant de passer à un second cas, plus classique dans son architecture.",
  ],
  sections: [
    {
      title: "Un connecteur ne dit jamais tout",
      paragraphs: [
        "Les deux entrées XT90 identiques ont montré qu'un schéma qui ne décrit que le type de connecteur laisse une partie du travail au lecteur. Nommer le rôle reste toujours plus important que nommer la pièce.",
      ],
    },
    {
      title: "Chaque sortie a une vraie limite à respecter",
      paragraphs: [
        "La sortie XT60 à 25 A a rappelé qu'une station tout-en-un ne supprime pas les questions de dimensionnement, elle les déplace simplement vers un connecteur unique. Le schéma reste l'endroit où cette limite doit rester visible.",
      ],
    },
    {
      title: "La compacité n'excuse jamais un raccourci de sécurité",
      paragraphs: [
        "La partie 230V a montré qu'un petit réseau fixe garde toutes les exigences d'un grand : protection, différentiel, séparation claire entre les sources. Un boîtier compact ne rend pas la rigueur optionnelle.",
      ],
    },
    {
      title: "Ce qui reste transférable à un autre projet",
      paragraphs: [
        "Que ta station soit une AFERIY P280 ou un autre modèle, la méthode reste la même : identifier chaque entrée et sa fonction réelle, respecter les plafonds annoncés par le fabricant, et traiter chaque sortie fixe avec le même sérieux qu'une installation classique.",
      ],
      bullets: [
        "Nommer le rôle de chaque port, pas seulement son connecteur.",
        "Faire apparaître les plafonds de courant annoncés par le fabricant.",
        "Traiter toute sortie fixe, 12V comme 230V, avec la même rigueur qu'un montage classique.",
      ],
    },
  ],
  calloutTitle: "Un cas concret pour une méthode générale",
  calloutBody:
    "Le produit change d'un projet à l'autre. La méthode pour le représenter correctement, elle, reste la même.",
  summaryTitle: "À retenir avant la partie 9",
  summary: [
    "Un connecteur identique peut cacher deux rôles différents : toujours les nommer.",
    "Chaque sortie d'une station a une limite réelle à faire apparaître dans le schéma.",
    "La compacité du matériel ne réduit jamais les exigences de sécurité du 230V.",
    "Cette méthode reste valable pour n'importe quelle station tout-en-un, pas seulement pour ce modèle.",
  ],
  exerciseTitle: "Mini exercice de synthèse",
  exercise: [
    "Reprends ton propre schéma de station, si tu en as un.",
    "Vérifie que chaque port porte un nom de rôle, pas seulement un type de connecteur.",
    "Vérifie que chaque sortie fixe affiche sa limite réelle quelque part dans le document.",
  ],
};

const fortySeventhChapter = {
  label: "Chapitre 47",
  title: "Pourquoi un montage Victron apprend la rigueur",
  blurb:
    "Ouverture de la partie 9 : comprendre ce qu'une architecture Victron plus classique apprend, à l'opposé du cas tout-en-un précédent.",
  intro: [
    "Après une station tout-en-un, ce second cas change complètement de logique. Ici, chaque fonction a son propre boîtier : une batterie, un régulateur solaire, un onduleur-chargeur, un moniteur de batterie. Rien n'est caché dans un seul produit.",
    "C'est justement ce qui rend ce montage exigeant à dessiner correctement, et donc précieux pour la méthode : chaque brique doit trouver sa place exacte dans le schéma, avec ses propres liaisons et ses propres protections.",
  ],
  sections: [
    {
      title: "Une base réaliste, pas une usine à gaz",
      paragraphs: [
        "La configuration retenue ici reste modeste et cohérente pour un van : une batterie LiFePO4 12V 150Ah, un régulateur solaire SmartSolar MPPT 75/15, un onduleur-chargeur MultiPlus Compact 12/800, et un moniteur de batterie SmartShunt 300A. Rien de surdimensionné, rien qui promette plus que ce dont un van a réellement besoin.",
      ],
    },
    {
      title: "Cinq boîtiers, cinq rôles à ne jamais confondre",
      paragraphs: [
        "Contrairement à une station tout-en-un, chaque boîtier ici a une seule responsabilité. C'est plus de composants à dessiner, mais c'est aussi plus facile à expliquer une fois que chaque rôle est clair.",
      ],
      bullets: [
        "Batterie : stockage de l'énergie.",
        "SmartSolar MPPT : régulation de la charge solaire.",
        "MultiPlus : charge secteur et sortie 230V.",
        "SmartShunt : mesure et suivi de l'état de charge.",
        "Tableau 12V : distribution vers les usages du quotidien.",
      ],
    },
    {
      title: "Ce que ce cas ajoute à la méthode",
      paragraphs: [
        "Le cas précédent apprenait à distinguer des rôles derrière des connecteurs identiques. Celui-ci apprend l'inverse : organiser plusieurs boîtiers différents pour qu'ils racontent, ensemble, une seule chaîne d'énergie lisible.",
      ],
    },
  ],
  calloutTitle: "Plus de boîtiers, pas plus de confusion",
  calloutBody:
    "Un montage à plusieurs composants n'est pas plus compliqué à lire qu'une station tout-en-un, à condition que chaque boîtier garde une place et un rôle clairement identifiés.",
  summaryTitle: "À retenir avant le chapitre 48",
  summary: [
    "Ce montage repose sur cinq briques distinctes : batterie, MPPT, MultiPlus, SmartShunt, tableau 12V.",
    "Chaque boîtier a un rôle unique, contrairement à une station qui les regroupe.",
    "La méthode reste la même : nommer, situer, relier dans le bon ordre.",
  ],
  exerciseTitle: "Mini exercice de repérage",
  exercise: [
    "Liste les cinq briques du montage avec un mot-clé pour chacune.",
    "Imagine où chacune se placerait physiquement dans un van.",
    "Garde cette liste pour le chapitre suivant.",
  ],
};

const fortyEighthChapter = {
  label: "Chapitre 48",
  title: "Batterie, MPPT, MultiPlus, SmartShunt : qui fait quoi",
  blurb:
    "Chapitre de clarification des rôles : donner à chaque composant une définition simple avant de les relier entre eux.",
  intro: [
    "Avant de dessiner la moindre liaison, il faut être capable de résumer en une phrase ce que fait chaque composant. Si cette phrase n'est pas claire, le schéma qui suit ne le sera pas non plus.",
  ],
  sections: [
    {
      title: "La batterie",
      paragraphs: [
        "La batterie LiFePO4 150Ah est la réserve d'énergie du système. Tout ce qui suit existe pour la charger correctement ou pour puiser dedans proprement.",
      ],
    },
    {
      title: "Le SmartSolar MPPT",
      paragraphs: [
        "Le MPPT 75/15 régule la charge venant du panneau solaire. Il se place entre le panneau et la batterie, jamais directement sur un circuit de consommation.",
      ],
    },
    {
      title: "Le MultiPlus",
      paragraphs: [
        "Le MultiPlus Compact 12/800 a une double fonction : il charge la batterie quand le secteur ou la prise de quai est branchée, et il fournit du 230V à partir de la batterie quand ce n'est pas le cas. C'est un chargeur et un onduleur dans le même boîtier.",
      ],
    },
    {
      title: "Le SmartShunt",
      paragraphs: [
        "Le SmartShunt ne fournit ni ne consomme d'énergie. Il se place sur le câble négatif principal et mesure tout ce qui entre et sort de la batterie, pour donner un état de charge fiable.",
      ],
      bullets: [
        "Batterie : réserve d'énergie.",
        "SmartSolar MPPT : régulation solaire, entre panneau et batterie.",
        "MultiPlus : charge secteur + sortie 230V, entre quai/secteur, batterie et prises AC.",
        "SmartShunt : mesure, sur le négatif principal, sans fournir d'énergie.",
      ],
    },
  ],
  calloutTitle: "Une phrase par composant, avant tout schéma",
  calloutBody:
    "Si tu ne peux pas résumer le rôle d'un composant en une phrase simple, ce n'est pas encore le moment de le dessiner.",
  summaryTitle: "À retenir avant le chapitre 49",
  summary: [
    "La batterie stocke, le MPPT régule le solaire, le MultiPlus charge et fournit du 230V, le SmartShunt mesure.",
    "Le SmartShunt se place sur le négatif principal, pas sur un circuit de consommation.",
    "Le MultiPlus est à la fois un chargeur et un onduleur : cette double fonction doit apparaître dans le schéma.",
  ],
  exerciseTitle: "Mini exercice des quatre rôles",
  exercise: [
    "Écris une phrase de définition pour chacun des quatre composants.",
    "Vérifie qu'aucune de tes phrases ne mentionne un rôle qui appartient à un autre composant.",
    "Relis-les à voix haute : elles doivent s'enchaîner comme une histoire simple.",
  ],
};

const fortyNinthChapter = {
  label: "Chapitre 49",
  title: "Dessiner la chaîne énergie sans surcharger la page",
  blurb:
    "Chapitre d'assemblage : relier les quatre briques principales dans le bon ordre, sans que le schéma devienne un plat de spaghettis.",
  intro: [
    "Une fois les rôles clarifiés, il reste à les relier. Le risque à ce stade, c'est de vouloir tout montrer sur une seule ligne de lecture. La bonne méthode consiste à traiter la chaîne énergie comme deux histoires parallèles : la charge, et la distribution.",
  ],
  sections: [
    {
      title: "La chaîne de charge",
      paragraphs: [
        "Deux sources rechargent la batterie dans ce montage : le panneau solaire via le SmartSolar MPPT, et le secteur ou la prise de quai via le MultiPlus. Ces deux chaînes convergent vers la batterie, mais elles restent deux histoires distinctes jusque-là.",
      ],
      bullets: [
        "Panneau solaire → SmartSolar MPPT 75/15 → batterie.",
        "Prise de quai / secteur → MultiPlus Compact 12/800 → batterie.",
      ],
    },
    {
      title: "La chaîne de distribution",
      paragraphs: [
        "Depuis la batterie, deux chemins repartent : un vers le tableau 12V pour les usages quotidiens, en passant par le SmartShunt puis une protection principale, et un vers le MultiPlus pour les deux prises 230V.",
      ],
      bullets: [
        "Batterie → SmartShunt → protection principale → tableau 12V → frigo, pompe, USB, LED.",
        "Batterie → MultiPlus → deux prises 230V.",
      ],
    },
    {
      title: "Pourquoi séparer plutôt que tout relier d'un coup",
      paragraphs: [
        "Un schéma qui tente de montrer la charge et la distribution sur la même ligne devient vite illisible, parce que la batterie se retrouve au centre d'un nombre de liaisons difficile à suivre. En séparant visuellement les deux histoires, chacune reste compréhensible seule, et leur point commun, la batterie, devient plus facile à situer.",
      ],
    },
  ],
  calloutTitle: "Deux histoires, un seul point de rencontre",
  calloutBody:
    "La charge et la distribution racontent chacune leur propre logique. La batterie est leur seul point commun, pas le fil conducteur de tout le schéma.",
  summaryTitle: "À retenir avant le chapitre 50",
  summary: [
    "La chaîne de charge relie le solaire et le secteur à la batterie par deux chemins distincts.",
    "La chaîne de distribution part de la batterie vers le 12V et vers le 230V.",
    "Séparer ces deux histoires rend le schéma plus lisible qu'un seul enchevêtrement autour de la batterie.",
  ],
  exerciseTitle: "Mini exercice des deux chaînes",
  exercise: [
    "Dessine la chaîne de charge seule, avec ses deux sources.",
    "Dessine la chaîne de distribution seule, avec ses deux sorties.",
    "Superpose les deux uniquement au niveau de la batterie et vérifie que ça reste lisible.",
  ],
};

const fiftiethChapter = {
  label: "Chapitre 50",
  title: "Représenter le 12V quotidien proprement",
  blurb:
    "Chapitre de distribution 12V : construire un tableau lisible entre le SmartShunt et les usages courants du van.",
  intro: [
    "Le réseau 12V de ce montage ressemble à celui du cas précédent dans son principe, mais il part d'une protection principale plus généreuse, cohérente avec une batterie 150Ah dédiée plutôt qu'une sortie limitée de station.",
  ],
  sections: [
    {
      title: "Une protection principale dimensionnée pour le projet",
      paragraphs: [
        "Entre le SmartShunt et le tableau 12V, une protection principale autour de 40 A protège l'ensemble du réseau de bord, cohérente avec la somme des circuits qu'elle alimente.",
      ],
    },
    {
      title: "Les mêmes usages, la même logique de départs",
      paragraphs: [
        "Frigo, pompe à eau, prises USB et éclairage LED gardent chacun leur propre départ et leur propre fusible, exactement comme dans un montage plus simple. Le nombre de composants dans le système ne change rien à cette règle de base.",
      ],
      bullets: [
        "Frigo : circuit dédié, environ 15 A.",
        "Pompe à eau : circuit dédié, environ 10 A.",
        "Prises USB : circuit dédié, environ 10 A.",
        "Éclairage LED : circuit dédié, environ 5 A.",
        "Réserve : un départ libre, environ 10 à 15 A.",
      ],
    },
    {
      title: "Le SmartShunt doit rester en amont de tout",
      paragraphs: [
        "Pour que la mesure du SmartShunt reste fiable, absolument tout ce qui consomme ou recharge la batterie doit passer par le câble négatif qu'il surveille. Un circuit qui contournerait le shunt fausserait la lecture de l'état de charge, même s'il reste électriquement fonctionnel.",
      ],
    },
  ],
  calloutTitle: "Une distribution familière, une base mieux dimensionnée",
  calloutBody:
    "La logique de distribution ne change pas d'un projet à l'autre. Ce qui change, c'est la marge disponible, ici plus confortable grâce à une batterie dédiée de 150 Ah.",
  summaryTitle: "À retenir avant le chapitre 51",
  summary: [
    "La protection principale du réseau 12V tourne autour de 40 A dans ce montage.",
    "Chaque usage garde son propre départ et son propre fusible, comme dans tout projet.",
    "Tout ce qui touche la batterie doit passer par le négatif surveillé par le SmartShunt.",
  ],
  exerciseTitle: "Mini exercice de vérification du shunt",
  exercise: [
    "Reprends ton schéma 12V et repère le câble négatif principal.",
    "Vérifie que chaque circuit, y compris les sources de charge, passe bien par ce négatif.",
    "Corrige tout circuit qui semblerait contourner le SmartShunt.",
  ],
};

const fiftyFirstChapter = {
  label: "Chapitre 51",
  title: "Représenter le 230V sans bricolage visuel",
  blurb:
    "Chapitre 230V : dessiner la sortie AC du MultiPlus avec la même rigueur que n'importe quelle installation fixe.",
  intro: [
    "Le MultiPlus fournit à la fois la charge secteur et la sortie 230V du van. Cette double fonction est justement ce qui pousse le plus à bâcler le schéma si on n'y prête pas attention.",
  ],
  sections: [
    {
      title: "Une seule entrée AC, un seul rôle à la fois",
      paragraphs: [
        "L'entrée AC du MultiPlus reçoit soit la prise de quai, soit le secteur, jamais les deux en même temps par construction. Le schéma peut donc représenter cette entrée comme un point unique, sans avoir à gérer une bascule entre deux sources comme sur le cas station.",
      ],
    },
    {
      title: "Une sortie AC protégée avant les prises",
      paragraphs: [
        "Entre la sortie AC du MultiPlus et les deux prises 230V fixes, un petit tableau garde sa place : disjoncteur dimensionné pour la ligne, et protection différentielle adaptée à un usage mobile.",
      ],
      bullets: [
        "Entrée AC : quai ou secteur, jamais les deux en simultané.",
        "Sortie AC : tableau avec disjoncteur et différentiel.",
        "Deux prises fixes : usages ponctuels, chargeurs et petite électronique.",
      ],
    },
    {
      title: "Ne pas confondre fonction charge et fonction sortie",
      paragraphs: [
        "Le MultiPlus charge la batterie ET alimente les prises 230V, mais ce sont deux fonctions différentes du même boîtier. Le schéma gagne à les représenter avec deux flèches distinctes plutôt qu'un unique trait qui laisserait croire à une seule fonction.",
      ],
    },
  ],
  calloutTitle: "Un boîtier, deux fonctions, deux flèches",
  calloutBody:
    "Le MultiPlus charge et alimente. Le schéma doit montrer ces deux fonctions séparément, même si elles vivent dans le même appareil.",
  summaryTitle: "À retenir avant le chapitre 52",
  summary: [
    "L'entrée AC du MultiPlus reçoit soit le quai, soit le secteur, jamais les deux en même temps.",
    "La sortie AC passe par un tableau avec disjoncteur et différentiel avant les prises fixes.",
    "Les fonctions charge et sortie du MultiPlus doivent apparaître comme deux flèches distinctes.",
  ],
  exerciseTitle: "Mini exercice des deux fonctions",
  exercise: [
    "Dessine le MultiPlus avec une flèche entrante pour la charge et une flèche sortante pour l'alimentation AC.",
    "Ajoute le tableau de protection entre la sortie AC et les prises fixes.",
    "Vérifie que le schéma ne laisse pas croire à une connexion directe entre le quai et les prises.",
  ],
};

const fiftySecondChapter = {
  label: "Chapitre 52",
  title: "Ajouter une option DC-DC sans casser la lecture",
  blurb:
    "Clôture de la partie 9 : intégrer une recharge alternateur optionnelle sans perturber une architecture déjà stabilisée.",
  intro: [
    "La recharge en roulant reste optionnelle dans ce montage, via un petit chargeur DC-DC comme l'Orion-Tr Smart. Ce chapitre montre comment l'ajouter proprement, sans redessiner tout ce qui a déjà été validé dans les chapitres précédents.",
  ],
  sections: [
    {
      title: "Une troisième source de charge, pas un remplacement",
      paragraphs: [
        "L'Orion-Tr Smart s'ajoute au solaire et au secteur comme une troisième chaîne de charge indépendante, entre la batterie du véhicule et la batterie de service. Il ne remplace ni le MPPT ni le MultiPlus, il les complète.",
      ],
    },
    {
      title: "Où le placer dans un schéma déjà construit",
      paragraphs: [
        "La bonne méthode consiste à ajouter cette troisième chaîne au même niveau visuel que les deux autres chaînes de charge, sans réorganiser le reste du schéma. C'est exactement l'esprit de la construction par couches vu plus tôt dans ce livre : une option nouvelle s'ajoute, elle ne bouleverse pas l'existant.",
      ],
      bullets: [
        "Batterie véhicule → protection → Orion-Tr Smart → batterie de service.",
        "Cette chaîne rejoint la batterie de service au même titre que le solaire et le secteur.",
        "Aucune des chaînes déjà dessinées n'a besoin d'être modifiée pour l'accueillir.",
      ],
    },
    {
      title: "Le bon réflexe pour toute option future",
      paragraphs: [
        "Que ce soit un DC-DC, un second panneau solaire ou un chargeur supplémentaire, la même question s'applique à chaque nouvel ajout : cette brique peut-elle rejoindre la structure existante sans la redessiner entièrement ? Si la réponse est oui, l'architecture de base était la bonne dès le départ.",
      ],
    },
  ],
  calloutTitle: "Une bonne base accueille les options sans se redessiner",
  calloutBody:
    "Si ajouter une option t'oblige à tout redessiner, ce n'est pas l'option qui pose problème : c'est la base qui manquait de structure.",
  summaryTitle: "À retenir avant la partie 10",
  summary: [
    "L'Orion-Tr Smart ajoute une troisième chaîne de charge, sans remplacer le solaire ni le secteur.",
    "Une option nouvelle s'ajoute au même niveau que l'existant, sans réorganiser tout le schéma.",
    "Une architecture bien construite se reconnaît à sa capacité à accueillir des options sans être redessinée.",
  ],
  exerciseTitle: "Mini exercice d'ajout d'option",
  exercise: [
    "Reprends le schéma des deux chaînes de charge du chapitre 49.",
    "Ajoute une troisième chaîne pour une recharge alternateur optionnelle.",
    "Vérifie que rien d'autre dans le schéma n'a eu besoin d'être déplacé.",
  ],
};

const fiftyThirdChapter = {
  label: "Chapitre 53",
  title: "Où mettre les protections sur le dessin",
  blurb:
    "Ouverture de la partie 10 : revenir sur la place des protections dans le schéma, cette fois du point de vue de l'annotation plutôt que de l'architecture.",
  intro: [
    "Tu sais depuis longtemps qu'un fusible doit exister au bon endroit électriquement. Ce chapitre pose une question différente : où le placer visuellement sur le dessin, pour qu'il reste lisible sans écraser le reste du schéma.",
  ],
  sections: [
    {
      title: "Toujours proche de la source qu'elle protège",
      paragraphs: [
        "Une protection se lit d'abord par rapport à ce qu'elle protège. Elle doit donc apparaître visuellement proche de sa source, jamais perdue au milieu d'un groupe de composants qui n'ont rien à voir avec elle.",
      ],
    },
    {
      title: "Un symbole reconnaissable, pas réinventé à chaque fois",
      paragraphs: [
        "Garder le même symbole pour toutes les protections d'un même type tout au long du document aide énormément la lecture. Un lecteur qui a compris un symbole une fois n'a plus besoin de le redéchiffrer à chaque nouvelle occurrence.",
      ],
    },
    {
      title: "La valeur du fusible, en note plutôt qu'en gros texte",
      paragraphs: [
        "Le calibre d'un fusible est une information précieuse, mais elle n'a pas besoin d'être écrite en gros à côté du symbole. Une petite annotation discrète suffit, tant qu'elle reste lisible en cas de besoin.",
      ],
      bullets: [
        "Symbole cohérent pour toutes les protections du même type.",
        "Position toujours proche de la source protégée.",
        "Valeur du fusible en annotation discrète, pas en élément dominant.",
      ],
    },
  ],
  calloutTitle: "Une protection doit se voir, pas crier",
  calloutBody:
    "Une protection bien placée se repère naturellement. Une protection surdimensionnée visuellement finit par distraire plus qu'elle n'informe.",
  summaryTitle: "À retenir avant le chapitre 54",
  summary: [
    "Une protection se dessine toujours proche de la source qu'elle protège.",
    "Le même symbole doit désigner le même type de protection partout dans le document.",
    "Le calibre reste une annotation discrète, pas un élément visuellement dominant.",
  ],
  exerciseTitle: "Mini exercice de repérage des protections",
  exercise: [
    "Reprends un de tes schémas et surligne toutes les protections.",
    "Vérifie qu'elles utilisent toutes le même symbole pour un même type.",
    "Vérifie que chacune reste visuellement proche de sa source.",
  ],
};

const fiftyFourthChapter = {
  label: "Chapitre 54",
  title: "Comment noter les sections de câble",
  blurb:
    "Chapitre de précision : donner aux sections de câble une place claire dans le schéma sans transformer le document en fiche technique.",
  intro: [
    "La section d'un câble est une information utile, parfois même indispensable pour une relecture sérieuse. Elle mérite une place définie dans le schéma, ni oubliée, ni envahissante.",
  ],
  sections: [
    {
      title: "À côté du trait, jamais dedans",
      paragraphs: [
        "La bonne pratique consiste à écrire la section juste au-dessus ou à côté de la liaison concernée, sans interrompre le trait lui-même. Le lecteur doit pouvoir suivre la liaison du regard sans que l'annotation ne casse ce mouvement.",
      ],
    },
    {
      title: "Une convention simple et constante",
      paragraphs: [
        "Choisir une convention, par exemple toujours en millimètres carrés, et la garder du début à la fin du document. Mélanger les unités ou les formats d'une liaison à l'autre oblige le lecteur à se réadapter à chaque fois.",
      ],
    },
    {
      title: "Ne pas noter ce qui n'est pas encore validé",
      paragraphs: [
        "Si une section n'est pas encore choisie avec certitude, il vaut mieux ne rien écrire plutôt que d'inscrire une valeur provisoire qui risque d'être prise pour définitive par erreur.",
      ],
      bullets: [
        "Annotation positionnée à côté du trait, sans le couper.",
        "Une seule unité, utilisée du début à la fin.",
        "Rien n'est noté tant que la section n'est pas confirmée.",
      ],
    },
  ],
  calloutTitle: "Une annotation provisoire finit toujours par être lue comme définitive",
  calloutBody:
    "Si tu n'es pas sûr d'une section de câble, il vaut mieux laisser un blanc visible qu'écrire un chiffre qui deviendra une fausse certitude pour le lecteur suivant.",
  summaryTitle: "À retenir avant le chapitre 55",
  summary: [
    "Les sections s'annotent à côté des liaisons, sans jamais interrompre le trait.",
    "Une seule unité doit être utilisée pour tout le document.",
    "Une section non confirmée ne doit pas apparaître, même à titre indicatif.",
  ],
  exerciseTitle: "Mini exercice de cohérence des sections",
  exercise: [
    "Relis un schéma et vérifie que toutes les sections utilisent la même unité.",
    "Repère toute section qui semble provisoire et décide si elle doit rester affichée.",
    "Harmonise la position de toutes les annotations de section.",
  ],
};

const fiftyFifthChapter = {
  label: "Chapitre 55",
  title: "Comment nommer les circuits",
  blurb:
    "Chapitre de vocabulaire pratique : donner à chaque circuit un nom qui aide vraiment à la lecture, plutôt qu'une étiquette générique.",
  intro: [
    "Un circuit mal nommé oblige le lecteur à deviner. Un circuit bien nommé se comprend en un coup d'œil, même pour quelqu'un qui découvre le projet.",
  ],
  sections: [
    {
      title: "Nommer l'usage, pas le composant",
      paragraphs: [
        "« Frigo » raconte plus qu'« USB-A 5V », même si les deux sont corrects techniquement. Le nom d'un circuit gagne à décrire ce qu'il sert à faire, pas uniquement ce qu'il contient.",
      ],
    },
    {
      title: "Rester cohérent d'un schéma à l'autre",
      paragraphs: [
        "Si un circuit s'appelle « Éclairage LED » sur un schéma, il devrait garder ce même nom sur toutes les versions suivantes du projet. Changer de vocabulaire d'une itération à l'autre casse la continuité de lecture.",
      ],
    },
    {
      title: "Des noms courts, mais jamais ambigus",
      paragraphs: [
        "Un nom trop long encombre le dessin. Un nom trop court devient ambigu. Le bon équilibre tient en général en deux ou trois mots, suffisants pour être compris sans note complémentaire.",
      ],
      bullets: [
        "« Frigo » plutôt que « Sortie 12V n°3 ».",
        "« Éclairage LED cabine » plutôt que « LED ».",
        "Même nom conservé d'une version du schéma à l'autre.",
      ],
    },
  ],
  calloutTitle: "Un bon nom de circuit se comprend sans légende",
  calloutBody:
    "Si un nom de circuit a besoin d'une note à part pour être compris, ce n'est probablement pas encore le bon nom.",
  summaryTitle: "À retenir avant le chapitre 56",
  summary: [
    "Le nom d'un circuit décrit son usage, pas seulement son contenu technique.",
    "Le même nom doit rester valable d'une version du schéma à l'autre.",
    "Deux à trois mots suffisent en général pour un nom clair et sans ambiguïté.",
  ],
  exerciseTitle: "Mini exercice de nommage",
  exercise: [
    "Relis les noms de circuits d'un de tes schémas.",
    "Remplace tout nom purement technique par un nom d'usage.",
    "Vérifie que chaque nom reste compréhensible sans légende à côté.",
  ],
};

const fiftySixthChapter = {
  label: "Chapitre 56",
  title: "Quand séparer un schéma en plusieurs vues",
  blurb:
    "Chapitre de structure : reconnaître le moment où un seul document ne suffit plus pour rester lisible.",
  intro: [
    "Vous avez déjà croisé cette idée plus tôt dans ce livre. Ce chapitre la rend concrète : à quel signal précis faut-il répondre en séparant un schéma en plusieurs vues plutôt qu'en continuant à tout empiler sur une seule page.",
  ],
  sections: [
    {
      title: "Le signal du regard qui cherche",
      paragraphs: [
        "Si tu mets plus de quelques secondes à retrouver un circuit précis sur ton propre schéma, c'est déjà un signal. Un lecteur extérieur mettra encore plus longtemps.",
      ],
    },
    {
      title: "Le signal du mélange de familles",
      paragraphs: [
        "Dès que 12V, solaire et 230V commencent à partager le même espace visuel sans grande séparation, c'est souvent le bon moment pour envisager une vue par famille plutôt qu'une vue unique.",
      ],
    },
    {
      title: "Comment séparer sans tout dupliquer",
      paragraphs: [
        "Séparer ne veut pas dire tout redessiner plusieurs fois. Une vue d'architecture générale peut rester unique, pendant que chaque famille reçoit ensuite sa propre vue de détail.",
      ],
      bullets: [
        "Une vue d'architecture générale, qui reste unique.",
        "Une vue de détail par famille : 12V, solaire, 230V.",
        "Aucune information dupliquée inutilement entre les vues.",
      ],
    },
  ],
  calloutTitle: "Séparer, c'est organiser, pas multiplier",
  calloutBody:
    "Un schéma en plusieurs vues bien pensées reste plus simple à suivre qu'un schéma unique surchargé, même si le nombre de pages augmente.",
  summaryTitle: "À retenir avant le chapitre 57",
  summary: [
    "Un temps de recherche trop long sur ton propre schéma est déjà un signal à prendre au sérieux.",
    "Le mélange visuel de plusieurs familles de circuits appelle souvent une séparation en vues.",
    "Une vue générale peut rester unique pendant que les détails se répartissent par famille.",
  ],
  exerciseTitle: "Mini exercice de séparation",
  exercise: [
    "Chronomètre le temps qu'il te faut pour retrouver un circuit précis sur un de tes schémas.",
    "Si le temps te semble trop long, identifie la famille qui mériterait sa propre vue.",
    "Esquisse cette vue séparée sans dupliquer ce qui reste dans la vue générale.",
  ],
};

const fiftySeventhChapter = {
  label: "Chapitre 57",
  title: "Ce qu'il vaut mieux mettre en légende plutôt que sur le dessin",
  blurb:
    "Clôture de la partie 10 : trancher, une fois pour toutes, ce qui appartient au dessin principal et ce qui appartient à la légende.",
  intro: [
    "Ce chapitre referme la boucle ouverte au chapitre 2 sur ce qu'un bon schéma doit montrer. Il donne cette fois une règle pratique et directement applicable pour décider, information par information.",
  ],
  sections: [
    {
      title: "La légende accueille ce qui est stable",
      paragraphs: [
        "Une légende sert bien les informations qui ne changent pas d'un circuit à l'autre : la signification d'un symbole, une convention de couleur, une unité utilisée partout dans le document.",
      ],
    },
    {
      title: "Le dessin garde ce qui est spécifique",
      paragraphs: [
        "À l'inverse, tout ce qui décrit un circuit précis — son nom, sa protection, sa section — appartient au dessin, à l'endroit exact où ce circuit apparaît. Renvoyer cette information en légende obligerait le lecteur à faire des allers-retours constants.",
      ],
    },
    {
      title: "Une règle simple pour trancher",
      paragraphs: [
        "Face à une hésitation, une question suffit : cette information est-elle vraie pour un seul élément, ou pour tout le document ? Vraie pour un seul élément, elle reste sur le dessin. Vraie pour tout le document, elle rejoint la légende.",
      ],
      bullets: [
        "Légende : symboles, conventions de couleur, unités utilisées dans tout le document.",
        "Dessin : noms de circuits, protections, sections spécifiques à chaque liaison.",
        "En cas de doute : « est-ce vrai pour un seul élément ou pour tout le document ? »",
      ],
    },
  ],
  calloutTitle: "Une bonne légende rend le dessin plus léger, pas plus vide",
  calloutBody:
    "Le bon partage entre dessin et légende ne retire jamais d'information : il la place simplement là où elle est la plus utile à retrouver.",
  summaryTitle: "À retenir avant la partie 11",
  summary: [
    "La légende accueille ce qui reste vrai pour tout le document.",
    "Le dessin garde ce qui décrit un circuit précis.",
    "Une seule question suffit pour trancher : élément unique, ou document entier ?",
  ],
  exerciseTitle: "Mini exercice de tri légende / dessin",
  exercise: [
    "Reprends un schéma avec beaucoup d'annotations.",
    "Classe chaque annotation entre « légende » et « dessin » avec la règle de ce chapitre.",
    "Déplace en légende tout ce qui s'est retrouvé mal classé.",
  ],
};

const fiftyEighthChapter = {
  label: "Chapitre 58",
  title: "La méthode de relecture FabSystem",
  blurb:
    "Ouverture de la partie 11 : poser une méthode de relecture reproductible avant de se lancer dans la correction de cas concrets.",
  intro: [
    "Corriger un schéma sans méthode revient à chercher des erreurs au hasard. Ce chapitre pose une grille de relecture simple, à appliquer dans le même ordre à chaque fois, pour que la correction devienne un réflexe plutôt qu'une inspiration ponctuelle.",
  ],
  sections: [
    {
      title: "Toujours commencer par la source",
      paragraphs: [
        "La relecture démarre exactement comme la lecture d'un schéma neuf : par la source. Une confusion à ce niveau se répercute sur tout le reste, donc elle doit être écartée en premier.",
      ],
    },
    {
      title: "Puis suivre l'ordre de la méthode habituelle",
      paragraphs: [
        "Après la source, la même grille que celle utilisée depuis le début de ce livre s'applique : protection, distribution, consommateurs. Relire dans cet ordre évite de sauter d'un bout à l'autre du schéma sans logique.",
      ],
      bullets: [
        "1. La source est-elle clairement identifiable ?",
        "2. Les protections sont-elles visibles et bien placées ?",
        "3. La distribution reste-t-elle lisible et organisée ?",
        "4. Les consommateurs sont-ils nommés et rattachés clairement ?",
      ],
    },
    {
      title: "Noter avant de corriger",
      paragraphs: [
        "La meilleure pratique consiste à lister tous les points suspects avant de commencer à corriger quoi que ce soit. Corriger au fil de la lecture donne l'impression d'avancer, mais fait souvent perdre la vue d'ensemble du schéma.",
      ],
    },
  ],
  calloutTitle: "Une bonne relecture ressemble toujours à la même relecture",
  calloutBody:
    "La force d'une méthode de relecture, c'est qu'elle reste identique d'un schéma à l'autre. C'est cette répétition qui la rend fiable.",
  summaryTitle: "À retenir avant le chapitre 59",
  summary: [
    "La relecture commence toujours par la source, avant tout le reste.",
    "Elle suit ensuite la même grille que la lecture : protection, distribution, consommateurs.",
    "Il vaut mieux lister tous les points suspects avant de commencer à corriger.",
  ],
  exerciseTitle: "Mini exercice de grille de relecture",
  exercise: [
    "Prends un schéma que tu n'as pas relu depuis un moment.",
    "Applique la grille dans l'ordre : source, protection, distribution, consommateurs.",
    "Note chaque point suspect sans le corriger tout de suite.",
  ],
};

const fiftyNinthChapter = {
  label: "Chapitre 59",
  title: "Détecter un fusible mal placé",
  blurb:
    "Chapitre de cas concret : reconnaître les symptômes visuels d'un fusible mal positionné dans un schéma existant.",
  intro: [
    "Un fusible mal placé ne saute pas toujours aux yeux immédiatement. Ce chapitre donne les signes qui doivent alerter une relecture attentive.",
  ],
  sections: [
    {
      title: "Trop loin de la source",
      paragraphs: [
        "Le signe le plus fréquent : une liaison longue et non protégée entre la source et la première protection. Plus cette distance est grande sur le dessin, plus il faut se demander si elle correspond à une vraie distance physique protégée ailleurs, ou à un oubli pur et simple.",
      ],
    },
    {
      title: "Un fusible orphelin",
      paragraphs: [
        "Un fusible dessiné sans lien clair vers une source précise est un signal fort. S'il n'est pas évident de répondre à la question « qu'est-ce que ce fusible protège exactement ? », le schéma a un problème de lecture, sinon un problème réel.",
      ],
    },
    {
      title: "Un calibre incohérent avec le circuit",
      paragraphs: [
        "Un fusible visiblement surdimensionné ou sous-dimensionné par rapport aux circuits qu'il semble protéger doit déclencher une vérification, même si le schéma reste, sur le papier, cohérent visuellement.",
      ],
      bullets: [
        "Liaison longue et non protégée entre la source et la première protection.",
        "Fusible sans lien clair vers une source identifiable.",
        "Calibre qui semble incohérent avec les circuits protégés.",
      ],
    },
  ],
  calloutTitle: "Un fusible se juge par sa position, pas seulement par sa présence",
  calloutBody:
    "Un schéma qui contient un fusible n'est pas automatiquement un schéma protégé : encore faut-il que ce fusible soit au bon endroit.",
  summaryTitle: "À retenir avant le chapitre 60",
  summary: [
    "Une longue liaison non protégée entre la source et la première protection est un signal d'alerte.",
    "Un fusible sans lien clair vers une source précise doit être questionné.",
    "Un calibre qui semble incohérent mérite une vérification, même si le dessin paraît cohérent.",
  ],
  exerciseTitle: "Mini exercice de détection",
  exercise: [
    "Reprends un schéma existant et repère la distance entre chaque source et sa première protection.",
    "Cherche s'il existe un fusible sans lien clair vers une source.",
    "Note tout calibre qui te semble étonnant par rapport au circuit protégé.",
  ],
};

const sixtiethChapter = {
  label: "Chapitre 60",
  title: "Détecter un retour négatif incohérent",
  blurb:
    "Chapitre de cas concret : repérer les erreurs les plus fréquentes autour du retour négatif dans un schéma existant.",
  intro: [
    "Le retour négatif est souvent la partie la moins soignée d'un schéma, précisément parce qu'elle semble moins spectaculaire que le positif. C'est pourtant là que se cachent beaucoup d'incohérences silencieuses.",
  ],
  sections: [
    {
      title: "Des masses qui ne se rejoignent jamais clairement",
      paragraphs: [
        "Si plusieurs négatifs partent dans des directions différentes sans jamais converger vers un point commun identifiable, c'est un signal à prendre au sérieux, même si chaque circuit semble fonctionner isolément.",
      ],
    },
    {
      title: "Un négatif dessiné plus léger que le positif",
      paragraphs: [
        "Beaucoup de schémas soignent le tracé du positif et traitent le négatif comme une formalité. Un négatif esquissé rapidement, sans le même niveau de rigueur que le reste, cache souvent un vrai flou de conception, pas seulement un flou de dessin.",
      ],
    },
    {
      title: "Une confusion entre négatif 12V et masse châssis",
      paragraphs: [
        "Un point sensible déjà vu plus tôt dans ce livre : un schéma qui traite le négatif 12V et la masse châssis comme une seule et même chose sans le préciser peut cacher une vraie question de sécurité, pas uniquement une question de lisibilité.",
      ],
      bullets: [
        "Négatifs multiples sans point de convergence clair.",
        "Négatif dessiné avec moins de soin que le positif.",
        "Confusion possible entre négatif 12V et masse châssis.",
      ],
    },
  ],
  calloutTitle: "Le négatif mérite la même rigueur que le positif",
  calloutBody:
    "Un schéma qui néglige visuellement son retour négatif envoie un mauvais signal, même quand l'installation réelle reste correcte.",
  summaryTitle: "À retenir avant le chapitre 61",
  summary: [
    "Des négatifs qui ne convergent jamais clairement doivent être questionnés.",
    "Un négatif dessiné avec moins de soin que le positif cache souvent un vrai flou de conception.",
    "Négatif 12V et masse châssis ne doivent jamais être confondus sans le préciser.",
  ],
  exerciseTitle: "Mini exercice du retour négatif",
  exercise: [
    "Isolé uniquement les liaisons négatives d'un de tes schémas.",
    "Vérifie qu'elles convergent vers un point identifiable.",
    "Vérifie qu'aucune confusion n'existe entre négatif 12V et masse châssis.",
  ],
};

const sixtyFirstChapter = {
  label: "Chapitre 61",
  title: "Détecter une distribution confuse",
  blurb:
    "Chapitre de cas concret : reconnaître les symptômes d'une distribution qui a perdu sa logique au fil des ajouts.",
  intro: [
    "La distribution est souvent la partie d'un schéma qui se dégrade le plus vite avec le temps, à mesure que des circuits s'y ajoutent sans plan d'ensemble. Ce chapitre aide à repérer ce glissement avant qu'il ne devienne ingérable.",
  ],
  sections: [
    {
      title: "Des départs qui ne partent plus du même point",
      paragraphs: [
        "Quand certains circuits partent du tableau principal et que d'autres se raccordent directement sur une source ou sur un autre circuit, la distribution perd sa cohérence. Ce genre de raccourci est souvent invisible tant que le nombre de circuits reste faible, puis devient flagrant en grandissant.",
      ],
    },
    {
      title: "Des fils qui se croisent sans raison de lecture",
      paragraphs: [
        "Un croisement de liaisons n'est pas un problème en soi, mais un excès de croisements sans logique de lecture indique presque toujours une distribution qui a grandi par ajouts successifs plutôt que par une vraie réorganisation.",
      ],
    },
    {
      title: "Une distribution sans hiérarchie visuelle",
      paragraphs: [
        "Un bon tableau de distribution laisse deviner ses circuits principaux avant ses circuits secondaires. Quand tout apparaît au même niveau visuel, la distribution devient difficile à prioriser, même pour son propre concepteur.",
      ],
      bullets: [
        "Des circuits raccordés directement plutôt que depuis le tableau principal.",
        "Un excès de croisements sans logique de lecture.",
        "Aucune hiérarchie visuelle entre circuits principaux et secondaires.",
      ],
    },
  ],
  calloutTitle: "Une distribution confuse se reconnaît avant de se comprendre",
  calloutBody:
    "Tu n'as pas besoin de tout comprendre du premier coup d'œil pour repérer une distribution confuse : le simple inconfort de lecture est déjà une information.",
  summaryTitle: "À retenir avant le chapitre 62",
  summary: [
    "Des circuits raccordés en dehors du tableau principal cassent la cohérence de la distribution.",
    "Un excès de croisements sans logique révèle souvent une distribution construite par ajouts successifs.",
    "Une distribution lisible laisse deviner ses circuits principaux avant les secondaires.",
  ],
  exerciseTitle: "Mini exercice de diagnostic de distribution",
  exercise: [
    "Repère tous les circuits d'un schéma qui ne partent pas du tableau principal.",
    "Compte les croisements de liaisons qui te semblent injustifiés.",
    "Identifie si les circuits principaux se distinguent visuellement des secondaires.",
  ],
};

const sixtySecondChapter = {
  label: "Chapitre 62",
  title: "Reprendre un schéma trop chargé et le rendre lisible",
  blurb:
    "Clôture de la partie 11 : appliquer toute la méthode de relecture à un schéma concret pour le remettre en état.",
  intro: [
    "Ce chapitre rassemble les trois diagnostics précédents dans une seule démarche de reprise, pour transformer un schéma surchargé en document réellement exploitable.",
  ],
  sections: [
    {
      title: "Diagnostiquer avant de redessiner",
      paragraphs: [
        "La première étape n'est jamais de redessiner. C'est d'appliquer la grille de relecture du chapitre 58 et de lister tous les points suspects trouvés grâce aux chapitres 59, 60 et 61, sans encore rien modifier.",
      ],
    },
    {
      title: "Reprendre dans l'ordre : source, protection, distribution",
      paragraphs: [
        "Une fois le diagnostic posé, la reprise suit le même ordre que la construction initiale d'un schéma. Corriger la distribution avant d'avoir validé les protections revient à reconstruire sur des bases encore fragiles.",
      ],
    },
    {
      title: "Accepter de simplifier plutôt que de tout garder",
      paragraphs: [
        "Reprendre un schéma chargé demande souvent d'accepter de retirer des informations, ou de les déplacer en légende, plutôt que de chercher à tout faire tenir en corrigeant juste la mise en page. La discipline vue à la partie 10 s'applique pleinement ici.",
      ],
      bullets: [
        "Diagnostic complet avant toute correction.",
        "Reprise dans l'ordre : source, protection, distribution, consommateurs.",
        "Simplification acceptée plutôt que sauvegarde de tout le contenu existant.",
      ],
    },
  ],
  calloutTitle: "Reprendre un schéma, c'est le reconstruire, pas le retoucher",
  calloutBody:
    "Un schéma vraiment surchargé ne se sauve pas avec quelques ajustements. Il se reconstruit avec la même méthode que s'il était neuf.",
  summaryTitle: "À retenir avant la partie 12",
  summary: [
    "Le diagnostic complet précède toujours la correction.",
    "La reprise suit le même ordre que la construction initiale d'un schéma.",
    "Simplifier et déplacer en légende vaut souvent mieux que tout garder sur le dessin.",
  ],
  exerciseTitle: "Mini exercice de reprise complète",
  exercise: [
    "Choisis un schéma que tu trouves trop chargé.",
    "Applique le diagnostic complet des chapitres 58 à 61.",
    "Reprends-le dans l'ordre, en acceptant de simplifier ce qui doit l'être.",
  ],
};

const sixtyThirdChapter = {
  label: "Chapitre 63",
  title: "Ce qu'il faut vérifier avant export",
  blurb:
    "Ouverture de la partie 12 : passer un schéma terminé par une dernière série de vérifications avant qu'il ne quitte l'éditeur.",
  intro: [
    "Un schéma peut être juste sur le fond et encore mal préparé pour sortir de l'éditeur. Ce chapitre liste les derniers points à vérifier avant d'exporter, imprimer ou transmettre un document.",
  ],
  sections: [
    {
      title: "Relire une dernière fois avec la grille complète",
      paragraphs: [
        "Avant d'exporter, la grille de relecture vue à la partie 11 mérite un dernier passage : source, protection, distribution, consommateurs. Un export ne doit jamais être le premier moment où une incohérence est repérée.",
      ],
    },
    {
      title: "Vérifier la cohérence des annotations",
      paragraphs: [
        "Noms de circuits, sections de câble, calibres de fusibles : ce chapitre est l'occasion de vérifier que toutes ces annotations, vues en détail à la partie 10, respectent bien les mêmes conventions du début à la fin du document.",
      ],
    },
    {
      title: "Se relire comme un lecteur extérieur",
      paragraphs: [
        "Le meilleur réflexe avant export consiste à essayer de lire le schéma comme quelqu'un qui le découvre pour la première fois, sans connaître le projet. Ce changement de posture révèle souvent des évidences qui n'en sont que pour son propre auteur.",
      ],
      bullets: [
        "Relecture complète avec la grille source, protection, distribution, consommateurs.",
        "Vérification de la cohérence des noms, sections et calibres.",
        "Une dernière lecture avec le regard d'un lecteur extérieur au projet.",
      ],
    },
  ],
  calloutTitle: "L'export n'est pas une étape technique, c'est une étape de relecture",
  calloutBody:
    "Exporter un schéma ne consiste pas seulement à choisir un format. C'est le dernier moment simple pour repérer ce qui a échappé aux relectures précédentes.",
  summaryTitle: "À retenir avant le chapitre 64",
  summary: [
    "Un dernier passage avec la grille de relecture complète précède toujours l'export.",
    "Les annotations doivent rester cohérentes du premier au dernier circuit du document.",
    "Se relire comme un lecteur extérieur révèle des évidences invisibles pour l'auteur du schéma.",
  ],
  exerciseTitle: "Mini exercice de pré-export",
  exercise: [
    "Choisis un schéma que tu considères terminé.",
    "Relis-le une dernière fois avec la grille complète de la partie 11.",
    "Essaie de le lire comme si tu ne connaissais rien au projet.",
  ],
};

const sixtyFourthChapter = {
  label: "Chapitre 64",
  title: "Quel niveau de détail selon le lecteur",
  blurb:
    "Chapitre d'adaptation : ajuster le niveau de détail d'un schéma en fonction de la personne qui va le lire.",
  intro: [
    "Le même projet peut donner lieu à plusieurs versions d'un schéma, selon qui va le lire. Ce chapitre aide à choisir le bon niveau de détail pour chaque destinataire, plutôt que de transmettre systématiquement la version la plus complète.",
  ],
  sections: [
    {
      title: "Pour soi-même : tout garder",
      paragraphs: [
        "La version de travail personnelle peut rester dense, avec toutes les annotations utiles à la conception. C'est un document de pilotage, pas un document de communication.",
      ],
    },
    {
      title: "Pour un accompagnant ou un professionnel : l'essentiel structuré",
      paragraphs: [
        "Une personne qui va relire ou valider un projet a surtout besoin de l'architecture, des protections et des points sensibles, pas nécessairement de chaque détail de finition ou d'implantation.",
      ],
    },
    {
      title: "Pour un futur toi, dans six mois : la clarté avant tout",
      paragraphs: [
        "Un schéma destiné à être relu bien plus tard, par soi-même ayant oublié les détails du projet, gagne à privilégier la clarté générale plutôt que la densité d'information. C'est souvent la version la plus proche de celle destinée à un accompagnant.",
      ],
      bullets: [
        "Version personnelle : dense, complète, orientée pilotage du projet.",
        "Version accompagnant : architecture, protections, points sensibles.",
        "Version future : clarté générale privilégiée sur la densité.",
      ],
    },
  ],
  calloutTitle: "Le bon niveau de détail dépend de la question du lecteur",
  calloutBody:
    "Avant de choisir un niveau de détail, il vaut mieux se demander : quelle question ce lecteur précis va-t-il poser à ce schéma ?",
  summaryTitle: "À retenir avant le chapitre 65",
  summary: [
    "La version personnelle peut rester dense et complète.",
    "La version pour un accompagnant privilégie l'architecture et les points sensibles.",
    "La version pour soi-même dans le futur gagne à privilégier la clarté sur la densité.",
  ],
  exerciseTitle: "Mini exercice d'adaptation",
  exercise: [
    "Choisis un schéma personnel déjà dense.",
    "Imagine qu'il doit être transmis à un accompagnant qui découvre le projet.",
    "Liste ce que tu retirerais ou simplifierais pour cette version.",
  ],
};

const sixtyFifthChapter = {
  label: "Chapitre 65",
  title: "Comment imprimer sans perdre la lisibilité",
  blurb:
    "Chapitre pratique : préserver la lisibilité d'un schéma une fois passé du format écran au format papier.",
  intro: [
    "Un schéma parfaitement lisible à l'écran peut devenir confus une fois imprimé, si quelques précautions ne sont pas prises avant l'impression.",
  ],
  sections: [
    {
      title: "Penser au format avant de dessiner, pas après",
      paragraphs: [
        "Un schéma conçu en gardant en tête un format A4 ou A3 s'imprime naturellement mieux qu'un schéma pensé uniquement pour un grand écran. Les styles d'impression vus plus tôt dans ce livre existent justement pour cette raison.",
      ],
    },
    {
      title: "Vérifier les contrastes en noir et blanc",
      paragraphs: [
        "Beaucoup d'impressions restent en noir et blanc ou en niveaux de gris. Une couleur qui distingue deux éléments à l'écran peut devenir invisible une fois imprimée sans couleur. Un contrôle rapide en niveaux de gris avant impression évite cette mauvaise surprise.",
      ],
    },
    {
      title: "Ne pas trop réduire pour tout faire tenir",
      paragraphs: [
        "La tentation de réduire l'échelle pour faire tenir un grand schéma sur une seule page finit souvent par rendre les annotations illisibles. Il vaut mieux accepter plusieurs pages qu'un document réduit au point de perdre sa lisibilité.",
      ],
      bullets: [
        "Penser au format d'impression dès la conception du schéma.",
        "Vérifier la lisibilité en noir et blanc avant d'imprimer.",
        "Préférer plusieurs pages lisibles à une seule page trop réduite.",
      ],
    },
  ],
  calloutTitle: "Un schéma illisible imprimé n'est plus vraiment un schéma",
  calloutBody:
    "La lisibilité sur papier n'est pas un détail technique final : c'est une condition pour que tout le travail de clarté fait dans l'éditeur reste utile une fois sur le terrain.",
  summaryTitle: "À retenir avant le chapitre 66",
  summary: [
    "Penser au format d'impression pendant la conception facilite toujours le rendu final.",
    "Un contrôle en noir et blanc permet de repérer les contrastes qui disparaîtraient à l'impression.",
    "Plusieurs pages lisibles valent toujours mieux qu'une seule page trop réduite.",
  ],
  exerciseTitle: "Mini exercice d'impression",
  exercise: [
    "Prends un schéma terminé et imagine-le en noir et blanc.",
    "Repère les éléments qui deviendraient difficiles à distinguer sans couleur.",
    "Décide si une séparation en plusieurs pages serait plus lisible qu'une seule page réduite.",
  ],
};

const sixtySixthChapter = {
  label: "Chapitre 66",
  title: "Comment faire une version atelier et une version projet",
  blurb:
    "Clôture de la partie 12 : distinguer clairement un document de chantier d'un document de suivi de projet.",
  intro: [
    "Un schéma sert rarement à un seul usage. Ce chapitre clôt la partie 12 en distinguant deux versions complémentaires, plutôt que de chercher un seul document qui essaierait de tout faire à la fois.",
  ],
  sections: [
    {
      title: "La version atelier : robuste et immédiate",
      paragraphs: [
        "La version atelier doit pouvoir se consulter rapidement, les mains parfois occupées, avec les informations les plus utiles pendant le câblage bien visibles : protections, sections, noms de circuits.",
      ],
    },
    {
      title: "La version projet : complète et évolutive",
      paragraphs: [
        "La version projet garde vocation à évoluer avec le temps. Elle peut contenir davantage de contexte, de notes de décision et d'historique, utile pour comprendre pourquoi certains choix ont été faits, pas seulement ce qu'ils sont.",
      ],
    },
    {
      title: "Les faire cohabiter sans les confondre",
      paragraphs: [
        "Les deux versions doivent rester cohérentes entre elles, mais n'ont pas besoin d'être identiques. La version atelier peut naître comme une extraction simplifiée de la version projet, pensée uniquement pour le moment du câblage.",
      ],
      bullets: [
        "Version atelier : robuste, rapide à consulter, orientée câblage.",
        "Version projet : complète, évolutive, orientée compréhension et suivi.",
        "Les deux restent cohérentes, sans chercher à être identiques.",
      ],
    },
  ],
  calloutTitle: "Deux bons documents valent mieux qu'un document universel",
  calloutBody:
    "Chercher un seul schéma qui serve parfaitement à l'atelier et au suivi de projet mène souvent à un document qui ne sert bien ni l'un ni l'autre.",
  summaryTitle: "À retenir avant la partie 13",
  summary: [
    "La version atelier privilégie la rapidité de consultation pendant le câblage.",
    "La version projet privilégie le contexte et le suivi dans le temps.",
    "Les deux versions restent cohérentes entre elles sans avoir besoin d'être identiques.",
  ],
  exerciseTitle: "Mini exercice des deux versions",
  exercise: [
    "Reprends un schéma de projet complet.",
    "Extrais-en une version simplifiée pensée uniquement pour le câblage.",
    "Vérifie que les deux versions restent cohérentes sur les points essentiels.",
  ],
};

const sixtySeventhChapter = {
  label: "Chapitre 67",
  title: "Mini-projet van ultra simple",
  blurb:
    "Ouverture de la partie 13 : appliquer toute la méthode à un premier projet volontairement minimal.",
  intro: [
    "Ce mini-projet réunit le strict nécessaire : une batterie, une protection principale, un point de coupure, un tableau réduit à l'essentiel, et un unique circuit d'éclairage. L'objectif n'est pas la sophistication, c'est de vérifier que la méthode tient même sur le plus petit projet possible.",
  ],
  sections: [
    {
      title: "Le besoin réel derrière ce mini-projet",
      paragraphs: [
        "Ce cas correspond à un usage très ponctuel : un van peu équipé, avec un besoin d'éclairage fiable et rien d'autre pour l'instant. C'est un excellent point de départ pour quelqu'un qui veut avancer étape par étape plutôt que tout faire d'un coup.",
      ],
    },
    {
      title: "L'architecture retenue",
      paragraphs: [
        "La chaîne reste volontairement courte : batterie, fusible principal proche de la batterie, interrupteur de coupe-circuit, puis un unique départ protégé vers un circuit d'éclairage LED.",
      ],
      bullets: [
        "Batterie de service.",
        "Fusible principal, calibré selon la section du câble principal.",
        "Coupe-circuit pour isoler l'ensemble.",
        "Un unique départ protégé vers l'éclairage LED, environ 5 A.",
      ],
    },
    {
      title: "Pourquoi ce projet reste un vrai schéma, pas un raccourci",
      paragraphs: [
        "Même réduit à quatre éléments, ce projet respecte l'ordre complet vu depuis le premier chapitre : source, protection, distribution, consommateur. Un mini-projet n'est pas une excuse pour sauter une étape de la méthode.",
      ],
    },
  ],
  calloutTitle: "La méthode ne se simplifie jamais, seul le projet se simplifie",
  calloutBody:
    "Un projet minimal garde exactement la même structure qu'un projet complexe. C'est justement ce qui prouve que la méthode fonctionne à toutes les échelles.",
  summaryTitle: "À retenir avant le chapitre 68",
  summary: [
    "Un mini-projet peut se limiter à quatre éléments sans renoncer à la méthode complète.",
    "L'ordre source, protection, distribution, consommateur reste incontournable, même à petite échelle.",
    "Ce type de projet convient bien à une première étape avant d'ajouter des usages supplémentaires.",
  ],
  exerciseTitle: "Mini exercice de reproduction",
  exercise: [
    "Dessine ce mini-projet dans l'éditeur FabSystem avec seulement les quatre éléments listés.",
    "Vérifie que l'ordre de lecture reste immédiat, sans note complémentaire.",
    "Imagine quel serait le premier ajout logique si le besoin évoluait.",
  ],
};

const sixtyEighthChapter = {
  label: "Chapitre 68",
  title: "Mini-projet van avec frigo, pompe et solaire",
  blurb:
    "Chapitre de consolidation : monter d'un cran en ajoutant une vraie distribution et une chaîne de recharge solaire.",
  intro: [
    "Ce second mini-projet reprend la base du premier et l'enrichit avec les usages les plus courants d'un van habité au quotidien : un frigo, une pompe à eau, et une recharge solaire simple.",
  ],
  sections: [
    {
      title: "Le besoin réel derrière ce mini-projet",
      paragraphs: [
        "C'est le profil le plus fréquent chez un porteur de projet van : besoin d'autonomie pour le froid et l'eau, avec une recharge solaire qui limite la dépendance à la conduite ou au secteur.",
      ],
    },
    {
      title: "L'architecture retenue",
      paragraphs: [
        "La chaîne de charge et la chaîne de distribution restent bien séparées, comme vu à la partie 9 : le solaire rejoint la batterie via un régulateur, pendant que la distribution part de la même batterie vers un tableau à plusieurs départs.",
      ],
      bullets: [
        "Panneau solaire → régulateur MPPT → batterie.",
        "Batterie → protection principale → tableau de distribution.",
        "Départ frigo, environ 15 A.",
        "Départ pompe à eau, environ 10 A.",
        "Départ éclairage LED, environ 5 A.",
      ],
    },
    {
      title: "Ce que ce projet ajoute à la méthode",
      paragraphs: [
        "Ce mini-projet est le premier de la série à demander une vraie distribution à plusieurs départs, et une vraie chaîne de charge séparée. C'est l'occasion de vérifier que les deux logiques restent lisibles côte à côte, sans se mélanger.",
      ],
    },
  ],
  calloutTitle: "Le bon niveau pour la majorité des projets de van",
  calloutBody:
    "Ce mini-projet correspond au besoin réel de beaucoup de porteurs de projet : ni trop minimal, ni surdimensionné.",
  summaryTitle: "À retenir avant le chapitre 69",
  summary: [
    "Ce projet ajoute une vraie distribution multi-départs et une chaîne de charge solaire distincte.",
    "Frigo, pompe et éclairage gardent chacun leur propre départ protégé.",
    "La séparation entre chaîne de charge et chaîne de distribution reste la même règle que dans les parties précédentes.",
  ],
  exerciseTitle: "Mini exercice d'enrichissement",
  exercise: [
    "Pars du mini-projet du chapitre 67.",
    "Ajoute la chaîne solaire, puis les départs frigo et pompe.",
    "Vérifie que la lecture reste immédiate malgré l'ajout de plusieurs éléments.",
  ],
};

const sixtyNinthChapter = {
  label: "Chapitre 69",
  title: "Mini-projet station électrique avec quai, 12V et petit 230V",
  blurb:
    "Chapitre de consolidation : le troisième niveau de complexité, avec une station tout-en-un, une entrée de quai et un petit réseau 230V.",
  intro: [
    "Ce troisième mini-projet mobilise tout ce qui a été vu dans les parties 7, 8 et 9 : une station électrique comme cœur du système, une entrée de quai, une distribution 12V et un petit réseau 230V protégé.",
  ],
  sections: [
    {
      title: "Le besoin réel derrière ce mini-projet",
      paragraphs: [
        "Ce profil correspond à un projet qui veut regrouper la production, le stockage et la distribution dans un minimum de composants séparés, tout en gardant un vrai accès au 230V pour quelques usages ponctuels.",
      ],
    },
    {
      title: "L'architecture retenue",
      paragraphs: [
        "La station centralise la recharge et la sortie 12V, pendant qu'une entrée de quai et une sortie 230V restent traitées avec la même rigueur que dans le cas pratique de la partie 8.",
      ],
      bullets: [
        "Entrée de quai → entrée AC de la station.",
        "Sortie 12V de la station → protection principale → tableau 12V → frigo, pompe, USB, LED.",
        "Sortie AC de la station → tableau 230V avec disjoncteur et différentiel → deux prises fixes.",
      ],
    },
    {
      title: "Ce que ce projet vérifie une dernière fois",
      paragraphs: [
        "C'est l'occasion de vérifier une dernière fois la règle vue à la partie 8 : le quai et la sortie AC de la station ne doivent jamais être mis en parallèle sans réflexion, même dans un mini-projet.",
      ],
    },
  ],
  calloutTitle: "Le niveau le plus complet des trois, pas le plus compliqué à lire",
  calloutBody:
    "Ce mini-projet mobilise le plus d'éléments des trois, mais reste lisible s'il applique fidèlement tout ce qui a été vu jusqu'ici.",
  summaryTitle: "À retenir avant le chapitre 70",
  summary: [
    "Ce projet combine station, quai, distribution 12V et petit réseau 230V.",
    "L'entrée de quai et la sortie AC de la station restent deux chemins distincts, jamais mis en parallèle.",
    "La rigueur 230V vue à la partie 8 s'applique pleinement, même à cette échelle de projet.",
  ],
  exerciseTitle: "Mini exercice de synthèse",
  exercise: [
    "Dessine ce mini-projet dans l'éditeur, en réutilisant le gabarit station si besoin.",
    "Vérifie que le quai et la sortie AC restent deux chemins distincts.",
    "Compare ce schéma aux deux mini-projets précédents pour observer la progression.",
  ],
};

const seventiethChapter = {
  label: "Chapitre 70",
  title: "Comment choisir le bon niveau de complexité",
  blurb:
    "Clôture de la partie 13 : aider le lecteur à choisir, pour son propre projet, entre les trois niveaux vus dans cette partie.",
  intro: [
    "Les trois mini-projets précédents ne sont pas trois étapes obligatoires. Ce chapitre aide à choisir directement le niveau qui correspond au vrai besoin, sans viser par réflexe la version la plus complète.",
  ],
  sections: [
    {
      title: "Partir du besoin, pas de l'envie de tout prévoir",
      paragraphs: [
        "Le bon niveau de complexité se choisit à partir des usages réels du moment, pas des usages hypothétiques qui pourraient exister un jour. Un van utilisé quelques week-ends par an n'a pas les mêmes besoins qu'un van habité à l'année.",
      ],
    },
    {
      title: "Une architecture simple peut évoluer plus tard",
      paragraphs: [
        "Choisir le mini-projet le plus simple ne ferme pas la porte à une évolution future. La construction par couches vue tout au long de ce livre permet justement d'ajouter une chaîne solaire, une station ou un réseau 230V plus tard, sans repartir de zéro.",
      ],
    },
    {
      title: "Trois questions pour trancher",
      paragraphs: [
        "Face à une hésitation entre les trois niveaux, trois questions suffisent en général à orienter le choix.",
      ],
      bullets: [
        "Ai-je vraiment besoin d'autonomie prolongée, ou d'un éclairage fiable suffit-il pour l'instant ?",
        "Mon usage justifie-t-il une recharge solaire dès maintenant, ou puis-je l'ajouter plus tard ?",
        "Ai-je un vrai besoin de 230V fixe, ou des usages ponctuels via un petit convertisseur suffiraient-ils ?",
      ],
    },
  ],
  calloutTitle: "Le bon projet est celui qui correspond à l'usage réel, pas au plus complet",
  calloutBody:
    "Un mini-projet simple, bien construit et évolutif, vaut toujours mieux qu'un projet surdimensionné dès le départ pour des besoins qui n'existent pas encore.",
  summaryTitle: "À retenir avant la partie 14",
  summary: [
    "Le bon niveau de complexité part des usages réels, pas des usages hypothétiques.",
    "Une architecture simple peut évoluer plus tard grâce à la construction par couches.",
    "Trois questions simples suffisent en général à choisir entre les trois niveaux vus dans cette partie.",
  ],
  exerciseTitle: "Mini exercice de choix personnel",
  exercise: [
    "Réponds aux trois questions de ce chapitre pour ton propre projet.",
    "Identifie lequel des trois mini-projets se rapproche le plus de ton besoin réel.",
    "Note ce que tu ajouterais plus tard si ton usage évoluait.",
  ],
};

const seventyFirstChapter = {
  label: "Chapitre 71",
  title: "Ce qu'un bon schéma change vraiment dans un projet",
  blurb:
    "Ouverture de la partie 14 : prendre du recul sur tout le chemin parcouru depuis le premier chapitre.",
  intro: [
    "Ce livre a commencé par une idée simple : un schéma n'est pas un luxe, c'est un plan de circulation de l'énergie. Après quatorze parties, cette idée mérite d'être reprise une dernière fois, avec tout ce qu'elle recouvre désormais.",
  ],
  sections: [
    {
      title: "Un changement de posture, pas seulement un document",
      paragraphs: [
        "Le vrai changement apporté par un bon schéma n'est pas le document lui-même. C'est la façon de penser un projet qu'il impose : comprendre avant de dessiner, poser avant de relier, vérifier avant de corriger.",
      ],
    },
    {
      title: "Un gain qui dépasse le moment du câblage",
      paragraphs: [
        "Un bon schéma aide à acheter juste, à faire relire un projet, à le transmettre, à le corriger, et à le retrouver soi-même des mois plus tard. Le câblage n'est qu'un des moments où il sert, pas le seul.",
      ],
    },
    {
      title: "Une compétence qui reste, au-delà d'un seul projet",
      paragraphs: [
        "La méthode vue dans ce livre ne s'use pas avec un seul van ou un seul bateau. Elle reste valable pour le projet suivant, pour un projet plus complexe, ou pour aider quelqu'un d'autre à structurer le sien.",
      ],
      bullets: [
        "Un bon schéma change la façon de penser un projet, pas seulement sa présentation.",
        "Il sert bien au-delà du seul moment du câblage.",
        "La méthode reste valable pour tous les projets à venir, pas uniquement celui-ci.",
      ],
    },
  ],
  calloutTitle: "Le vrai résultat de ce livre n'est pas un schéma, c'est une méthode",
  calloutBody:
    "Si tu gardes une seule chose de ce livre, garde la méthode : comprendre, poser, relier, vérifier, corriger. Le reste en découle naturellement.",
  summaryTitle: "À retenir avant le chapitre 72",
  summary: [
    "Un bon schéma change la posture face à un projet, pas seulement son rendu final.",
    "Son utilité dépasse largement le seul moment du câblage.",
    "La méthode acquise reste valable bien au-delà d'un seul projet.",
  ],
  exerciseTitle: "Mini exercice de bilan",
  exercise: [
    "Repense à ton tout premier schéma, même approximatif.",
    "Compare-le à ce que tu serais capable de dessiner aujourd'hui.",
    "Note ce qui a le plus changé dans ta façon de penser un projet, pas seulement de le dessiner.",
  ],
};

const seventySecondChapter = {
  label: "Chapitre 72",
  title: "Ce que l'éditeur FabSystem aide à faire vite",
  blurb:
    "Chapitre de synthèse pratique : rappeler ce que l'éditeur accélère réellement, une fois la méthode acquise.",
  intro: [
    "La partie 4 t'a appris à utiliser l'éditeur comme un outil de méthode. Ce chapitre résume, une dernière fois, ce qu'il change concrètement une fois que la méthode est là pour le guider.",
  ],
  sections: [
    {
      title: "Construire par couches sans y penser",
      paragraphs: [
        "Une fois la méthode acquise, la bibliothèque de composants et le canvas de l'éditeur suivent naturellement la construction par couches vue depuis la partie 4 : architecture, protections, distribution, consommateurs, puis annotations.",
      ],
    },
    {
      title: "Corriger sans tout redessiner",
      paragraphs: [
        "Les outils de déplacement, de liaison et de propriétés permettent de reprendre un schéma comme vu à la partie 11, sans avoir à repartir d'une page blanche à chaque correction.",
      ],
    },
    {
      title: "Exporter des versions adaptées à chaque lecteur",
      paragraphs: [
        "Les fonctions de sauvegarde, d'export et d'impression rendent concrètes les distinctions vues à la partie 12 : une version atelier, une version projet, un niveau de détail choisi selon le lecteur.",
      ],
      bullets: [
        "La bibliothèque et le canvas accompagnent la construction par couches.",
        "Les outils de reprise évitent de tout redessiner à chaque correction.",
        "L'export permet d'adapter facilement le document à chaque lecteur.",
      ],
    },
  ],
  calloutTitle: "L'éditeur amplifie la méthode, il ne la remplace pas",
  calloutBody:
    "Un éditeur rapide entre de bonnes mains fait gagner beaucoup de temps. Entre des mains qui n'ont pas la méthode, il ne fait qu'accélérer la confusion.",
  summaryTitle: "À retenir avant le chapitre 73",
  summary: [
    "L'éditeur suit naturellement la logique de construction par couches une fois la méthode acquise.",
    "Il permet de corriger un schéma existant sans repartir de zéro.",
    "Il facilite l'adaptation d'un même projet à plusieurs lecteurs différents.",
  ],
  exerciseTitle: "Mini exercice de bilan outil",
  exercise: [
    "Liste les trois fonctions de l'éditeur que tu utilises le plus depuis le début de ce livre.",
    "Pour chacune, note ce qu'elle t'a fait gagner concrètement.",
    "Identifie une fonction que tu n'as pas encore essayée et prévois de la tester.",
  ],
};

const seventyThirdChapter = {
  label: "Chapitre 73",
  title: "Check-list de validation d'un schéma 12V",
  blurb:
    "Fiche pratique : une liste de vérification complète pour tout schéma 12V, à consulter avant chaque export.",
  intro: [
    "Cette check-list rassemble, dans l'ordre, tous les points vus au fil du livre pour un schéma 12V. Elle peut être utilisée telle quelle avant chaque export sérieux.",
  ],
  sections: [
    {
      title: "Source et protection",
      paragraphs: [
        "Les premiers points concernent toujours la source et sa protection immédiate, exactement comme au tout premier chapitre de ce livre.",
      ],
      bullets: [
        "La source principale est-elle clairement identifiable ?",
        "Le fusible principal apparaît-il tout près de la source ?",
        "Le calibre du fusible principal est-il cohérent avec la section du câble ?",
        "Un point de coupure existe-t-il pour isoler l'ensemble de l'installation ?",
      ],
    },
    {
      title: "Distribution et consommateurs",
      paragraphs: [
        "Les points suivants portent sur la façon dont l'énergie se répartit ensuite vers les usages.",
      ],
      bullets: [
        "Chaque circuit part-il bien du tableau principal, sans raccordement direct isolé ?",
        "Chaque circuit a-t-il son propre départ et son propre fusible ?",
        "Les noms de circuits décrivent-ils un usage, pas seulement un composant ?",
        "Le négatif converge-t-il vers un point clairement identifiable ?",
      ],
    },
    {
      title: "Lisibilité générale",
      paragraphs: [
        "Les derniers points concernent la lecture globale du document, au-delà de sa justesse technique.",
      ],
      bullets: [
        "Le schéma reste-t-il lisible en moins de quelques secondes pour retrouver un circuit ?",
        "Les annotations utilisent-elles une convention unique du début à la fin ?",
        "Le document reste-t-il lisible une fois imprimé en noir et blanc ?",
      ],
    },
  ],
  calloutTitle: "Une check-list vaut mieux qu'une impression de fini",
  calloutBody:
    "Se sentir prêt n'est pas la même chose que l'être. Une check-list parcourue point par point protège contre les oublis que la familiarité avec son propre projet finit par masquer.",
  summaryTitle: "À retenir avant le chapitre 74",
  summary: [
    "La check-list 12V couvre la source, la protection, la distribution et la lisibilité générale.",
    "Elle reprend, dans l'ordre, l'ensemble de la méthode vue depuis le premier chapitre.",
    "Elle peut être utilisée telle quelle avant chaque export d'un schéma 12V.",
  ],
  exerciseTitle: "Mini exercice de validation",
  exercise: [
    "Choisis un de tes schémas 12V terminés.",
    "Parcours chaque point de cette check-list sans en sauter aucun.",
    "Note tout point qui ne serait pas encore validé.",
  ],
};

const seventyFourthChapter = {
  label: "Chapitre 74",
  title: "Check-list de validation d'un schéma station électrique",
  blurb:
    "Fiche pratique : la même logique de check-list, adaptée cette fois à un projet construit autour d'une station électrique tout-en-un.",
  intro: [
    "Cette seconde check-list reprend les points spécifiques vus aux parties 7 et 8, pour un projet construit autour d'une station électrique plutôt que de composants séparés.",
  ],
  sections: [
    {
      title: "Entrées et sorties de la station",
      paragraphs: [
        "Une station tout-en-un multiplie les ports à vérifier. Chacun mérite sa propre attention avant export.",
      ],
      bullets: [
        "Chaque entrée porte-t-elle un nom de rôle, pas seulement un type de connecteur ?",
        "Les plafonds de courant annoncés par le fabricant apparaissent-ils quelque part dans le document ?",
        "Les différentes chaînes de recharge restent-elles visuellement distinctes malgré des connecteurs parfois identiques ?",
      ],
    },
    {
      title: "Distribution 12V derrière la station",
      paragraphs: [
        "La distribution qui suit la sortie 12V garde les mêmes exigences qu'un montage classique.",
      ],
      bullets: [
        "Une protection principale suit-elle directement la sortie 12V de la station ?",
        "Chaque usage garde-t-il son propre départ protégé ?",
        "La marge disponible sur la sortie 12V reste-t-elle visible dans le document ?",
      ],
    },
    {
      title: "Réseau 230V derrière la station",
      paragraphs: [
        "Le 230V d'une station reste une vraie installation fixe, avec ses propres exigences.",
      ],
      bullets: [
        "La sortie AC passe-t-elle par un tableau avec disjoncteur et différentiel avant les prises fixes ?",
        "Le quai et la sortie AC de la station restent-ils deux chemins clairement séparés ?",
        "Aucune liaison ne relie-t-elle directement le quai aux prises fixes ?",
      ],
    },
  ],
  calloutTitle: "Une station compacte ne réduit jamais la liste des vérifications",
  calloutBody:
    "Moins de boîtiers à câbler ne veut pas dire moins de points à vérifier. La compacité déplace la vigilance, elle ne la supprime pas.",
  summaryTitle: "À retenir avant le chapitre 75",
  summary: [
    "La check-list station couvre les entrées, la distribution 12V et le réseau 230V.",
    "Chaque port de la station doit porter un nom de rôle et respecter ses plafonds annoncés.",
    "Le quai et la sortie AC de la station doivent toujours rester deux chemins séparés.",
  ],
  exerciseTitle: "Mini exercice de validation station",
  exercise: [
    "Choisis un de tes schémas construits autour d'une station électrique.",
    "Parcours chaque point de cette check-list sans en sauter aucun.",
    "Corrige tout point qui ne serait pas encore validé avant de le considérer terminé.",
  ],
};

const seventyFifthChapter = {
  label: "Chapitre 75",
  title: "Glossaire simple des termes électriques",
  blurb:
    "Annexe de référence : les termes utilisés tout au long de ce livre, résumés en définitions courtes et concrètes.",
  intro: [
    "Ce glossaire ne remplace pas les chapitres qui expliquent chaque notion en détail. Il sert de mémo rapide pour retrouver une définition sans avoir à rouvrir tout un chapitre.",
  ],
  sections: [
    {
      title: "Source et énergie",
      paragraphs: [
        "Batterie : réserve d'énergie principale d'une installation de service. Panneau solaire : source de production d'énergie, régulée avant de rejoindre la batterie. MPPT : régulateur qui optimise et sécurise la charge venant du solaire.",
      ],
    },
    {
      title: "Protection et sécurité",
      paragraphs: [
        "Fusible : protection qui coupe un circuit en cas de surintensité, à placer au plus près de la source qu'il protège. Coupe-circuit : interrupteur qui permet d'isoler manuellement tout ou partie d'une installation. Différentiel : protection 230V qui coupe l'alimentation en cas de défaut électrique dangereux pour une personne.",
      ],
    },
    {
      title: "Distribution et retour",
      paragraphs: [
        "Busbar : barre commune qui distribue un positif ou un négatif vers plusieurs départs sans multiplier les raccords. Négatif : conducteur de retour du courant vers la source, en 12V. Masse : point de référence électrique lié au châssis dans un véhicule. Terre : conducteur de sécurité propre à la logique du 230V, à ne jamais confondre avec le négatif 12V.",
      ],
    },
  ],
  calloutTitle: "Un glossaire n'a de valeur que s'il reste court",
  calloutBody:
    "Ce glossaire reste volontairement bref : il doit se lire en quelques minutes, pas remplacer les chapitres qui expliquent chaque terme en profondeur.",
  summaryTitle: "À retenir avant le chapitre 76",
  summary: [
    "Ce glossaire regroupe les termes vus tout au long du livre, en définitions courtes.",
    "Il sert de mémo rapide, pas de remplacement aux chapitres explicatifs.",
    "Négatif, masse et terre restent trois notions distinctes à ne jamais confondre.",
  ],
  exerciseTitle: "Mini exercice de vocabulaire final",
  exercise: [
    "Relis chaque définition de ce glossaire sans regarder les chapitres correspondants.",
    "Note celles qui restent floues pour toi.",
    "Retourne relire le chapitre correspondant pour chaque définition encore incertaine.",
  ],
};

const seventySixthChapter = {
  label: "Chapitre 76",
  title: "Fiche ordre de construction d'un schéma",
  blurb:
    "Dernière annexe : la fiche récapitulative de l'ordre de construction d'un schéma, du premier trait à l'export final.",
  intro: [
    "Cette fiche ferme le livre en résumant, en une seule séquence, l'ordre de construction complet d'un schéma FabSystem, depuis la toute première idée jusqu'au document prêt à transmettre.",
  ],
  sections: [
    {
      title: "Les quatre premières étapes",
      paragraphs: [
        "Ces étapes correspondent à la logique posée dès le premier chapitre de ce livre.",
      ],
      bullets: [
        "1. Identifier la ou les sources d'énergie du projet.",
        "2. Placer les protections principales juste après chaque source.",
        "3. Construire la distribution vers les circuits, par familles séparées si nécessaire.",
        "4. Ajouter les consommateurs, nommés par leur usage plutôt que par leur seul type.",
      ],
    },
    {
      title: "Les trois étapes suivantes",
      paragraphs: [
        "Une fois l'architecture posée, ces étapes affinent et sécurisent le document.",
      ],
      bullets: [
        "5. Vérifier le retour négatif et sa cohérence sur tout le schéma.",
        "6. Ajouter les annotations utiles : sections, calibres, légende.",
        "7. Relire l'ensemble avec la grille complète : source, protection, distribution, consommateurs.",
      ],
    },
    {
      title: "La dernière étape",
      paragraphs: [
        "La construction se termine par la préparation du document pour sa vraie utilisation, qu'elle soit personnelle, professionnelle ou destinée au chantier.",
      ],
      bullets: [
        "8. Adapter et exporter la version utile au bon lecteur : atelier, projet, ou archive personnelle.",
      ],
    },
  ],
  calloutTitle: "Huit étapes, une seule méthode",
  calloutBody:
    "Ces huit étapes résument tout ce que ce livre a construit chapitre après chapitre. Elles restent valables pour le prochain projet, quel qu'il soit.",
  summaryTitle: "Fin du guide",
  summary: [
    "Un bon schéma se construit toujours dans le même ordre : source, protection, distribution, consommateurs.",
    "Le retour négatif et les annotations viennent renforcer une architecture déjà posée, pas la remplacer.",
    "La dernière étape reste toujours d'adapter le document à celui qui va le lire.",
  ],
  exerciseTitle: "Exercice final",
  exercise: [
    "Choisis un projet réel, le tien ou celui de quelqu'un que tu accompagnes.",
    "Reprends cette fiche et construis le schéma étape par étape, sans en sauter aucune.",
    "Compare le résultat à ton tout premier schéma du chapitre 1 : c'est la mesure la plus honnête de ce que ce livre t'a apporté.",
  ],
};

const draftedChapters: ChapterDraft[] = [
  thirdChapter,
  fourthChapter,
  fifthChapter,
  sixthChapter,
  seventhChapter,
  eighthChapter,
  ninthChapter,
  tenthChapter,
  eleventhChapter,
  twelfthChapter,
  thirteenthChapter,
  fourteenthChapter,
  fifteenthChapter,
  sixteenthChapter,
  seventeenthChapter,
  eighteenthChapter,
  nineteenthChapter,
  twentiethChapter,
  twentyFirstChapter,
  twentySecondChapter,
  twentyThirdChapter,
  twentyFourthChapter,
  twentyFifthChapter,
  twentySixthChapter,
  twentySeventhChapter,
  twentyEighthChapter,
  twentyNinthChapter,
  thirtiethChapter,
  thirtyFirstChapter,
  thirtySecondChapter,
  thirtyThirdChapter,
  thirtyFourthChapter,
  thirtyFifthChapter,
  thirtySixthChapter,
  thirtySeventhChapter,
  thirtyEighthChapter,
  thirtyNinthChapter,
  fortiethChapter,
  fortyFirstChapter,
  fortySecondChapter,
  fortyThirdChapter,
  fortyFourthChapter,
  fortyFifthChapter,
  fortySixthChapter,
  fortySeventhChapter,
  fortyEighthChapter,
  fortyNinthChapter,
  fiftiethChapter,
  fiftyFirstChapter,
  fiftySecondChapter,
  fiftyThirdChapter,
  fiftyFourthChapter,
  fiftyFifthChapter,
  fiftySixthChapter,
  fiftySeventhChapter,
  fiftyEighthChapter,
  fiftyNinthChapter,
  sixtiethChapter,
  sixtyFirstChapter,
  sixtySecondChapter,
  sixtyThirdChapter,
  sixtyFourthChapter,
  sixtyFifthChapter,
  sixtySixthChapter,
  sixtySeventhChapter,
  sixtyEighthChapter,
  sixtyNinthChapter,
  seventiethChapter,
  seventyFirstChapter,
  seventySecondChapter,
  seventyThirdChapter,
  seventyFourthChapter,
  seventyFifthChapter,
  seventySixthChapter,
];

const chapterAccents = [
  {
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    callout: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    body: "text-amber-950",
  },
  {
    badge: "border-sky-200 bg-sky-50 text-sky-900",
    callout: "border-sky-200 bg-sky-50",
    title: "text-sky-900",
    body: "text-sky-950",
  },
  {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-900",
    callout: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-900",
    body: "text-emerald-950",
  },
  {
    badge: "border-violet-200 bg-violet-50 text-violet-900",
    callout: "border-violet-200 bg-violet-50",
    title: "text-violet-900",
    body: "text-violet-950",
  },
  {
    badge: "border-rose-200 bg-rose-50 text-rose-900",
    callout: "border-rose-200 bg-rose-50",
    title: "text-rose-900",
    body: "text-rose-950",
  },
];

const manuscriptChapters: ChapterDraft[] = [firstChapter, secondChapter, ...draftedChapters];
// Les chapitres 1 à 40 sont tous illustrés. Au-delà, seuls certains le sont :
// les visuels générés pour 51, 57 et 76 contenaient du texte incohérent ou
// hors-sujet (voir audit du 22/08) et n'ont pas été retenus. On ne génère pas
// de chemin d'image pour ces chapitres plutôt que de pointer vers un fichier
// inexistant.
const UNILLUSTRATED_CHAPTERS = new Set([51, 57, 76]);

const chapterImageSources = Array.from({ length: manuscriptChapters.length }, (_, index) => {
  const chapterNumber = index + 1;

  if (UNILLUSTRATED_CHAPTERS.has(chapterNumber)) {
    return null;
  }

  return `/ebook/ebook-schema-fabsystem-images/chapitre-${String(chapterNumber).padStart(2, "0")}-ouverture-v1.png`;
});

function ChapterList({ items, startIndex = 0 }: { items: string[]; startIndex?: number }) {
  return (
    <ol className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-700">
      {items.map((item, index) => (
        <li key={item}>
          <a
            href={`#chapitre-${startIndex + index + 1}`}
            className="group flex gap-3 rounded-[18px] px-2 py-2 transition hover:bg-neutral-50"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-[11px] font-semibold text-neutral-600 transition group-hover:border-neutral-500 group-hover:text-neutral-900">
              {index + 1}
            </span>
            <span className="flex-1">{item}</span>
            <span className="text-neutral-400 transition group-hover:text-neutral-700" aria-hidden="true">
              →
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function ChapterManuscriptSection({
  chapter,
  accent,
  imageSrc,
  imageAlt,
  index,
}: {
  chapter: ChapterDraft;
  accent: (typeof chapterAccents)[number];
  imageSrc: string | null;
  imageAlt: string;
  index: number;
}) {
  const reverseLayout = index % 2 === 1;

  return (
    <section
      id={`chapitre-${index + 1}`}
      className="page-break-before scroll-mt-6 border-t border-neutral-200 px-6 py-10 sm:px-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{chapter.label}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{chapter.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">{chapter.blurb}</p>
        </div>
        {imageSrc ? (
          <div className={`rounded-full border px-4 py-2 text-sm font-medium ${accent.badge}`}>
            Chapitre illustré
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
        <div className="flow-root space-y-6 self-start text-[15px] leading-8 text-neutral-700">
          {imageSrc ? (
          <figure
            className={`avoid-break mb-8 max-w-[280px] overflow-hidden rounded-[26px] border border-neutral-200 bg-neutral-950 shadow-[0_14px_36px_rgba(15,23,42,0.10)] sm:max-w-[320px] ${
              reverseLayout
                ? "mx-auto xl:float-right xl:mb-6 xl:ml-8 xl:mr-0"
                : "mx-auto xl:float-left xl:mb-6 xl:ml-0 xl:mr-8"
            }`}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={640}
              height={960}
              quality={68}
              sizes="(min-width: 1280px) 320px, (min-width: 768px) 320px, 72vw"
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-white/10 bg-neutral-950/95 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              Ouverture visuelle du chapitre
            </figcaption>
          </figure>
          ) : null}

          {chapter.intro.map((paragraph, paragraphIndex) => (
            <p
              key={paragraph}
              className={paragraphIndex === 0 ? "text-lg leading-9 text-neutral-900 sm:text-[1.22rem]" : undefined}
            >
              {paragraph}
            </p>
          ))}

          {chapter.sections.map((section, sectionIndex) => (
            <section
              key={section.title}
              className={`avoid-break ${sectionIndex === 0 ? "pt-2" : "border-t border-neutral-200 pt-7"}`}
            >
              <h3 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[1.75rem]">
                {section.title}
              </h3>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-700">
                  {section.bullets.map((item) => (
                    <li key={item} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section className={`avoid-break rounded-[28px] border p-6 sm:p-7 ${accent.callout}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent.title}`}>
              {chapter.calloutTitle}
            </p>
            <p className={`mt-4 text-lg leading-8 ${accent.body}`}>{chapter.calloutBody}</p>
          </section>
        </div>

        <aside className="space-y-5 self-start">
          <section className="avoid-break rounded-[28px] border border-neutral-950 bg-neutral-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {chapter.summaryTitle}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-100">
              {chapter.summary.map((item) => (
                <li key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="avoid-break rounded-[28px] border border-neutral-200 bg-stone-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {chapter.exerciseTitle}
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
              {chapter.exercise.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-[18px] border border-neutral-200 bg-white px-4 py-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-[11px] font-semibold text-neutral-600">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default function EbookSchemaFabSystemPage() {
  return (
    <main className="min-h-screen bg-stone-100 text-neutral-950">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          html, body {
            background: #ffffff !important;
          }

          .print-shell {
            padding: 0 !important;
          }

          .print-book {
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
          }

          .print-hidden {
            display: none !important;
          }

          .page-break-before {
            break-before: page;
            page-break-before: always;
          }

          .page-break-after {
            break-after: page;
            page-break-after: always;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-shell mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <article className="print-book overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(17,24,39,0.08)]">
          <header className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.24),_transparent_32%)]" />
            <div className="relative grid gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                  Guide premium FabSystem
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Créer des schémas électriques clairs pour vos projets embarques
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-relaxed text-neutral-300 sm:text-xl">
                  Van, bateau, station électrique : une méthode visuelle pour comprendre, dessiner et faire relire
                  une installation sans se perdre dans les fils, les options ou les fausses bonnes idées.
                </p>
                <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                  {editionMarkers.map((marker) => (
                    <article
                      key={marker.label}
                      className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-left backdrop-blur-sm"
                    >
                      <p className="text-xl font-semibold tracking-tight text-white">{marker.value}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                        {marker.label}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="avoid-break rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  Ce que pose cette edition
                </p>
                <ul className="mt-4 space-y-4">
                  {guidePillars.slice(0, 3).map((pillar) => (
                    <li key={pillar.title} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-sm font-semibold text-white">{pillar.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-300">{pillar.body}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-relaxed text-neutral-200">
                  Vous n&apos;ouvrez pas l&apos;editeur pour dessiner beau. Vous l&apos;ouvrez pour decider juste.
                </p>
              </aside>
            </div>
          </header>

          <section className="border-b border-neutral-200 px-6 py-10 sm:px-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Pour qui ce guide à été ecrit
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  Un guide de lecture avant d&apos;être un guide de matériel
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-600 sm:text-lg">
                  Cette première edition à été pensée pour les personnes qui veulent retrouver une logique simple,
                  transmissible et robuste dans leurs schémas électriques, sans passer par une formation longue ni
                  par des heures de videos contradictoires.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {readerProfiles.map((profile) => (
                    <article key={profile.title} className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
                      <p className="text-sm font-semibold text-neutral-950">{profile.title}</p>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-700">{profile.body}</p>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="rounded-[28px] border border-neutral-200 bg-stone-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Univers couverts
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {coveredWorlds.map((world) => (
                    <span
                      key={world}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm leading-none text-neutral-700"
                    >
                      {world}
                    </span>
                  ))}
                </div>

                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Ce que vous allez y trouver
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
                  {openingPromises.map((item) => (
                    <li key={item} className="rounded-[18px] border border-neutral-200 bg-white px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </section>

          <section className="border-b border-neutral-200 bg-neutral-50/70 px-6 py-10 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Édition complète
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  Les 14 parties sont désormais pleinement lisibles
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
                Ce guide couvre désormais tout le parcours annoncé : la méthode, la lecture de schéma, les briques de
                base, la prise en main de l&apos;éditeur, un premier schéma guidé, le solaire, la station électrique,
                deux cas pratiques réels (AFERIY P280 et Victron léger), la correction de schémas existants, la
                préparation à l&apos;export, trois mini-projets complets, et une conclusion avec check-lists et
                glossaire.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {firstEditionParts.map((part, index) => {
                const range = partChapterRanges[index];

                return (
                  <article
                    key={part.id}
                    className="avoid-break rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{part.label}</p>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900">
                        Disponible
                      </span>
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">{part.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-700">{part.goal}</p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                      Chapitres {range.start} a {range.end}
                    </p>
                    <ChapterList items={part.chapters} startIndex={range.start - 1} />
                  </article>
                );
              })}
            </div>
          </section>

          <section className="border-t border-neutral-200 px-6 py-8 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Chapitres rédigés</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
                  Lecture intégrale disponible aujourd&apos;hui
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
                Les 76 chapitres qui suivent forment le manuscrit complet : comprendre, structurer, poser les
                briques essentielles, prendre l&apos;éditeur en main avec méthode, construire un premier schéma
                guidé, ouvrir le solaire et la station électrique, traiter deux cas pratiques réels, corriger un
                schéma existant, le préparer à l&apos;export, puis consolider avec trois mini-projets et une
                conclusion outillée.
              </p>
            </div>
          </section>

          <section className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-8">
              <section className="avoid-break">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Ce que cette première lecture vous donne déjà
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {guidePillars.map((pillar) => (
                    <article key={pillar.title} className="rounded-[24px] border border-neutral-200 bg-white p-5">
                      <p className="text-sm font-semibold text-neutral-950">{pillar.title}</p>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-700">{pillar.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="avoid-break rounded-[28px] border border-neutral-200 bg-stone-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Repère de lecture</p>
              <p className="mt-4 text-base leading-relaxed text-neutral-700">
                Un bon schéma se lit d&apos;abord comme une architecture, pas comme une liste de matériel.
              </p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Progression retenue
              </p>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
                <li className="rounded-[18px] border border-neutral-200 bg-white px-4 py-3">
                  Comprendre comment lire un schéma sans panique.
                </li>
                <li className="rounded-[18px] border border-neutral-200 bg-white px-4 py-3">
                  Poser les briques de base dans le bon ordre.
                </li>
                <li className="rounded-[18px] border border-neutral-200 bg-white px-4 py-3">
                  Aborder ensuite l&apos;editeur et les cas pratiques sur une base saine.
                </li>
              </ol>
            </aside>
          </section>

          {manuscriptChapters.map((chapter, index) => (
            <ChapterManuscriptSection
              key={chapter.title}
              chapter={chapter}
              accent={chapterAccents[index % chapterAccents.length]}
              imageSrc={chapterImageSources[index]}
              imageAlt={`Ouverture visuelle du ${chapter.label.toLowerCase()} : ${chapter.title}`}
              index={index}
            />
          ))}

          <section className="border-t border-neutral-200 bg-neutral-50 px-6 py-10 sm:px-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Fin du guide</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  Les 76 chapitres sont désormais réunis dans ce volume
                </h2>
                <p className="mt-4 text-base leading-relaxed text-neutral-700 sm:text-lg">
                  De la première méthode de lecture jusqu&apos;aux check-lists finales, en passant par les cas
                  concrets AFERIY P280 et Victron léger, la correction de schémas existants et trois mini-projets
                  complets : ce guide couvre maintenant tout le parcours annoncé en introduction.
                </p>
              </div>

              <aside className="rounded-[28px] border border-neutral-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">En bref</p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
                  <li className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3">14 parties</li>
                  <li className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3">76 chapitres</li>
                  <li className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3">
                    2 cas pratiques réels
                  </li>
                </ul>
              </aside>
            </div>
          </section>

          <footer className="border-t border-neutral-200 bg-neutral-50 px-6 py-6 sm:px-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">FabSystem</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700 sm:text-base">
                  Un bon schéma ne remplace ni le jugement ni la sécurité. En revanche, il remet l&apos;architecture au
                  centre du projet et transforme beaucoup de flou en decisions plus calmes, plus propres et plus
                  transmissibles.
                </p>
              </div>
              <div className="text-right text-xs leading-relaxed text-neutral-500">
                <p>Premiere edition illustree</p>
                <p>HTML imprimable</p>
                <p>Mise à jour du 18 aout 2026</p>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
