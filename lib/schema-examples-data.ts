const BASE_URL = "https://www.fabsystem.fr";

export type SchemaExample = {
  slug: string;
  templateId: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  thumbnailSrc: string;
  thumbnailAlt: string;
  audience: string;
  level: string;
  family: "van" | "bateau" | "camping-car" | "atelier";
  bestFor: string;
  quickTags: string[];
  context: string;
  flow: string[];
  vehicleScope: string;
  systemVoltage: string;
  chargeSources: string[];
  hasAc: boolean;
  chooseWhen: string[];
  avoidIf: string[];
  upgradePaths: string[];
  relatedSlugs: string[];
  highlights: string[];
  includes: string[];
  watchouts: string[];
};

export const FEATURED_SCHEMA_EXAMPLE_SLUG = "schema-vito-280ah-van";

export const SCHEMA_EXAMPLES: SchemaExample[] = [
  {
    slug: "schema-vito-280ah-van",
    templateId: "reference-v3-vito-280ah",
    title: "Schéma van lithium 280 Ah avec solaire et 230 V",
    metaTitle: "Schema van lithium 280 Ah : solaire, DC-DC, MultiPlus et supervision",
    metaDescription:
      "Exemple de schema electrique pour van avec batterie lithium 280 Ah, regulateur MPPT, DC-DC, MultiPlus, BatteryProtect et supervision, a ouvrir dans l'editeur FabSystem.",
    description:
      "Une base van aboutie mais encore lisible, avec une vraie batterie service lithium, une recharge solaire, une recharge alternateur, du 230 V et une supervision centralisee.",
    thumbnailSrc: "/schema-examples/schema-electrique-van-complet-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema van lithium 280 Ah avec solaire et 230 V",
    audience: "Intermediaire a avance",
    level: "Complet et evolutif",
    family: "van",
    bestFor: "Van ou fourgon avec lithium, solaire, recharge alternateur, 230 V embarque et vraie supervision.",
    quickTags: ["Van", "Lithium", "Solaire", "DC-DC", "230 V", "Victron"],
    vehicleScope: "Van et fourgon aménagé",
    systemVoltage: "12 V avec 230 V embarqué",
    chargeSources: ["Solaire", "Alternateur via DC-DC", "Quai / chargeur-convertisseur"],
    hasAc: true,
    chooseWhen: [
      "Vous cherchez une base sérieuse pour un van lithium avec plusieurs sources de charge.",
      "Vous voulez voir ensemble la distribution 12 V, le 230 V, les busbars et la supervision.",
      "Votre projet n'est plus un simple kit solaire mais une vraie architecture complète.",
    ],
    avoidIf: [
      "Vous cherchez seulement un premier schéma solaire très simple pour débuter.",
      "Votre installation n'a ni 230 V ni recharge alternateur structurée.",
      "Vous voulez copier tel quel sans recalculer sections, fusibles et implantation réelle.",
    ],
    upgradePaths: [
      "Adapter la base à votre capacité batterie réelle et à vos consommateurs quotidiens.",
      "Ajouter ou simplifier la partie 230 V selon votre convertisseur ou votre usage au quai.",
      "Affiner ensuite sections, fusibles et longueurs avec les calculateurs FabSystem.",
    ],
    relatedSlugs: [
      "schema-solaire-12v-simple",
      "schema-aferiy-p280-van",
      "schema-camping-car-autonome-clim",
    ],
    context:
      "Vito Marco Polo ou van equivalent qui veut une installation serieuse avec lithium, MPPT, DC-DC, MultiPlus, protections et reseau 12 V / 230 V clair.",
    flow: ["Panneau solaire", "MPPT", "Batterie lithium 280 Ah", "Busbars et protections", "MultiPlus", "Supervision"],
    highlights: [
      "Voir comment plusieurs sources de charge se rejoignent proprement autour d'une batterie lithium principale.",
      "Comprendre la place du MultiPlus, du BatteryProtect, du shunt et des protections principales dans un van vraiment equipe.",
      "Partir d'une base lisible avant d'adapter les consommateurs, la capacite ou les longueurs de cable a votre implantation reelle.",
    ],
    includes: [
      "Une batterie lithium 280 Ah avec recharge solaire et recharge alternateur via DC-DC.",
      "Une distribution 12 V structuree autour de busbars, protections et supervision.",
      "Un reseau 230 V embarque via MultiPlus pour garder une architecture claire entre DC et AC.",
    ],
    watchouts: [
      "Les sections, fusibles et longueurs affichees ne sont valables que pour ce montage precis et doivent etre reverifies sur votre van.",
      "Le 230 V fixe et la logique de protection ne se recopient jamais sans verification du materiel exact et de l'implantation.",
      "Le schema reste une base de travail serieuse, pas une validation electrique finale de l'installation.",
    ],
  },
  {
    slug: "schema-solaire-12v-simple",
    templateId: "solaire-simple",
    title: "Schéma solaire 12V simple",
    metaTitle: "Schéma solaire 12V simple : panneaux, MPPT, batterie",
    metaDescription:
      "Schéma solaire 12V simple avec deux panneaux, un MPPT et une batterie. Fiche claire pour débuter, à ouvrir directement dans l'éditeur ou à imprimer en PDF.",
    description:
      "Le schéma le plus simple pour comprendre la chaîne solaire sans se perdre dans toute une distribution complète dès le départ.",
    thumbnailSrc: "/schema-examples/schema-solaire-12v-simple-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma solaire 12V simple",
    audience: "Débutant",
    level: "Très accessible",
    family: "van",
    bestFor: "Premier panneau solaire sur van, bateau ou petite installation autonome 12 V.",
    quickTags: ["Debut", "Solaire", "MPPT", "12 V"],
    vehicleScope: "Van, bateau ou petite installation autonome",
    systemVoltage: "12 V",
    chargeSources: ["Solaire"],
    hasAc: false,
    chooseWhen: [
      "Vous voulez comprendre la chaîne panneaux → MPPT → batterie sans distribution complexe.",
      "Vous cherchez un point de départ pédagogique avant d'ajouter des usages 12 V.",
      "Vous avez besoin d'un schéma simple à modifier et imprimer rapidement.",
    ],
    avoidIf: [
      "Votre projet inclut déjà un convertisseur 230 V, un DC-DC ou plusieurs sous-ensembles.",
      "Vous devez représenter un van complet ou un bateau avec quai et distribution riche.",
      "Vous voulez valider un gros courant ou une architecture multi-sources directement.",
    ],
    upgradePaths: [
      "Ajouter ensuite une distribution 12 V structurée autour de protections et d'un tableau.",
      "Passer à un van plus complet comme le Vito 280 Ah si plusieurs sources arrivent.",
      "Vérifier le couple panneau / MPPT et les sections avant de figer le montage.",
    ],
    relatedSlugs: [
      "schema-vito-280ah-van",
      "schema-aferiy-p280-van",
      "schema-bateau-quai-chargeur",
    ],
    context: "Premier panneau solaire sur van, bateau ou petite installation autonome 12V.",
    flow: ["Panneaux solaires", "MPPT", "Fusible de sortie", "Batterie 12V", "Écran de contrôle"],
    highlights: [
      "Comprendre la logique panneaux vers régulateur puis batterie.",
      "Visualiser la protection côté sortie MPPT et le petit circuit de monitoring.",
      "Partir d'une base propre avant d'ajouter des consommateurs ou un tableau de distribution.",
    ],
    includes: [
      "Une lecture simple pour se repérer sans jargon inutile.",
      "Un excellent gabarit à ouvrir dans l'éditeur pour faire ses premiers essais.",
      "Un support pratique pour discuter d'un futur ajout de distribution 12V.",
    ],
    watchouts: [
      "Les sections et fusibles restent à confirmer selon la puissance réelle des panneaux et la distance.",
      "Le montage exact des panneaux en parallèle ou en série dépend du régulateur et des modules choisis.",
      "Ajoutez ensuite seulement la distribution 12V pour garder un schéma lisible.",
    ],
  },
  {
    slug: "schema-bateau-quai-chargeur",
    templateId: "quai-tranquille",
    title: "Schéma électrique bateau au quai",
    metaTitle: "Schéma électrique bateau au quai : chargeur, solaire et pompe",
    metaDescription:
      "Exemple de schéma électrique bateau avec alimentation de quai, chargeur secteur, appoint solaire et pompe de cale. Explications claires, impression PDF et ouverture dans l'éditeur.",
    description:
      "Une base pensée pour un bateau souvent au port, avec recharge secteur, appoint solaire et circuits 12V essentiels.",
    thumbnailSrc: "/schema-examples/schema-bateau-quai-chargeur-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma électrique bateau au quai",
    audience: "Débutant à intermédiaire",
    level: "Usage courant",
    family: "bateau",
    bestFor: "Bateau souvent au quai avec chargeur secteur, appoint solaire et circuits DC essentiels.",
    quickTags: ["Bateau", "Quai", "Chargeur", "12 V", "Pompe de cale"],
    vehicleScope: "Bateau au port ou au mouillage avec retour fréquent au quai",
    systemVoltage: "12 V avec arrivée quai",
    chargeSources: ["Quai / chargeur secteur", "Solaire d'appoint"],
    hasAc: true,
    chooseWhen: [
      "Votre bateau passe surtout du temps au quai et vous voulez une base simple et propre.",
      "Vous avez besoin de visualiser la séparation entre 230 V quai et distribution 12 V.",
      "La pompe de cale et les circuits essentiels doivent rester lisibles et prioritaires.",
    ],
    avoidIf: [
      "Vous cherchez un schéma de voilier autonome avec plusieurs sources et 230 V embarqué avancé.",
      "Votre bord est déjà très dense avec supervision complète et cœur DC plus structuré.",
      "Vous voulez transposer directement ce montage à un fourgon ou un camping-car.",
    ],
    upgradePaths: [
      "Élargir ensuite la distribution 12 V avec de nouveaux départs et protections.",
      "Passer vers le voilier autonome si le quai n'est plus votre source principale.",
      "Contrôler précisément les masses, terres et protections AC avant toute intervention réelle.",
    ],
    relatedSlugs: [
      "schema-voilier-autonome-12v-230v",
      "schema-solaire-12v-simple",
      "schema-vito-280ah-van",
    ],
    context: "Bateau qui passe beaucoup de temps au quai, avec besoin de garder une installation fiable et lisible.",
    flow: ["Prise de quai", "Tableau 220V", "Chargeur secteur", "Batterie 12V", "Busbar + consommateurs", "Pompe de cale"],
    highlights: [
      "Voir comment le quai, le chargeur et le solaire cohabitent sur une même batterie.",
      "Comprendre pourquoi la pompe de cale automatique garde sa propre alimentation protégée.",
      "Repérer la séparation entre le 230V de quai et la distribution 12V du bord.",
    ],
    includes: [
      "Une base utile pour fiabiliser un bateau simple sans refaire tout le bord.",
      "Une lecture claire de la logique de charge et des circuits prioritaires.",
      "Un bon support pour préparer un diagnostic ou une remise au propre.",
    ],
    watchouts: [
      "Le 230V et les mises à la terre demandent une attention particulière : ne pas improviser.",
      "La pompe de cale doit rester prioritaire et indépendante des coupures du reste de l'installation.",
      "La corrosion, les cosses et les retours négatifs sont souvent aussi importants que le schéma lui-même.",
    ],
  },
  {
    slug: "schema-atelier-mobile-ducato",
    templateId: "reference-v3-atelier-ducato",
    title: "Schema atelier mobile ou van d'intervention",
    metaTitle: "Schema atelier mobile Ducato : implantation electrique complete",
    metaDescription:
      "Exemple de schema d'implantation electrique pour atelier mobile ou van d'intervention, avec zones reelles, distribution DC, solaire, quai et supervision.",
    description:
      "Une base pensee non seulement comme schema de principe, mais aussi comme aide a l'implantation reelle dans un utilitaire ou un atelier mobile.",
    thumbnailSrc: "/schema-examples/schema-station-electrique-van-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema d'implantation pour atelier mobile ou van d'intervention",
    audience: "Intermediaire",
    level: "Implantation et lecture terrain",
    family: "atelier",
    bestFor: "Atelier mobile, utilitaire technique ou grand fourgon avec vraies zones physiques a organiser.",
    quickTags: ["Atelier", "Implantation", "Zones", "Quai", "Solaire"],
    vehicleScope: "Utilitaire technique, atelier mobile ou grand fourgon d'intervention",
    systemVoltage: "12 V avec zones d'implantation et éventuelle partie AC",
    chargeSources: ["Solaire", "Quai / AC", "Selon implantation moteur"],
    hasAc: true,
    chooseWhen: [
      "Vous devez organiser des zones physiques et pas seulement une logique électrique abstraite.",
      "Votre enjeu est autant l'implantation que le schéma de principe.",
      "Vous travaillez sur un utilitaire avec compartiments, passages et longueurs réelles à préparer.",
    ],
    avoidIf: [
      "Vous cherchez seulement un schéma très simple pour découvrir le solaire 12 V.",
      "Votre projet est un van compact sans vraie logique d'implantation par zones.",
      "Vous attendez une validation finale des passages et des distances sans relevé terrain.",
    ],
    upgradePaths: [
      "Transformer cette base en implantation détaillée selon ton véhicule réel.",
      "Simplifier certaines zones si le véhicule embarque moins de fonctions que prévu.",
      "Reprendre ensuite les longueurs réelles pour corriger sections et protections.",
    ],
    relatedSlugs: [
      "schema-vito-280ah-van",
      "schema-camping-car-autonome-clim",
      "schema-bateau-quai-chargeur",
    ],
    context: "Ducato, utilitaire ou atelier mobile avec besoin de reperer les zones techniques, les distances et les sous-ensembles dans un volume reel.",
    flow: ["Toit solaire", "Compartiment moteur", "Coeur DC", "Distribution 12 V", "Quai / AC", "Supervision"],
    highlights: [
      "Voir comment une implantation reelle modifie la lecture des longueurs de cable et des regroupements techniques.",
      "Comprendre pourquoi certaines zones doivent rester compactes pour eviter des allers-retours inutiles sur le schema.",
      "Utiliser cette base comme repere d'atelier, pas seulement comme schema abstrait.",
    ],
    includes: [
      "Une lecture par zones avec implantation plus physique des sous-ensembles.",
      "Un point de depart utile pour un vehicule d'intervention, un atelier mobile ou un grand fourgon technique.",
      "Une base pour discuter ensuite des vraies longueurs, des passages et des protections associees.",
    ],
    watchouts: [
      "Une implantation propre sur le papier ne remplace pas le releve reel des passages, des hauteurs et des distances.",
      "Les sections, protections et zones doivent rester coherentes avec le courant reel et le materiel installe.",
      "Ce schema aide a preparer une implantation, mais ne remplace pas un controle electrique final du vehicule.",
    ],
  },
  {
    slug: "schema-aferiy-p280-van",
    templateId: "reference-v3-aferiy-p280",
    title: "Schema van avec station AFERIY P280",
    metaTitle: "Schema van AFERIY P280 : solaire, quai, DC-DC et sorties AC",
    metaDescription:
      "Exemple de schema de van autour d'une AFERIY P280 avec solaire, recharge DC-DC, prise de quai, sortie XT60 12 V et prises AC, a ouvrir dans l'editeur FabSystem.",
    description:
      "Un exemple concret pour garder un van simple autour d'une station tout-en-un, sans reconstruire tout un systeme batterie, MPPT et convertisseur separes.",
    thumbnailSrc: "/schema-examples/schema-aferiy-p280-van-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema AFERIY P280 pour van",
    audience: "Debutant motive a intermediaire",
    level: "Compact mais structure",
    family: "van",
    bestFor: "Van simple autour d'une station tout-en-un avec solaire, quai et quelques usages 12 V / AC.",
    quickTags: ["Van", "AFERIY", "Station", "Solaire", "Quai"],
    vehicleScope: "Van simple avec station électrique tout-en-un",
    systemVoltage: "12 V et sorties AC via station",
    chargeSources: ["Solaire", "Recharge véhicule via DC-DC", "Quai"],
    hasAc: true,
    chooseWhen: [
      "Vous voulez garder une architecture compacte autour d'une station tout-en-un.",
      "Vous comparez une solution simple à une vraie installation lithium plus classique.",
      "Vous avez besoin d'un van fonctionnel sans reconstruire tout un cœur électrique séparé.",
    ],
    avoidIf: [
      "Vous avez besoin d'une grosse distribution DC ou de très gros courants continus.",
      "Vous cherchez une architecture Victron complète avec busbars, shunt et MultiPlus distincts.",
      "Votre projet dépend fortement d'une climatisation 12 V ou d'usages très énergivores.",
    ],
    upgradePaths: [
      "Faire évoluer la base vers un système lithium complet si la station devient limitante.",
      "Ajouter progressivement quelques départs 12 V fixes bien protégés.",
      "Comparer ensuite avec le Vito 280 Ah pour décider si un système séparé serait plus adapté.",
    ],
    relatedSlugs: [
      "schema-vito-280ah-van",
      "schema-solaire-12v-simple",
      "schema-camping-car-autonome-clim",
    ],
    context:
      "Van amenage qui veut rester simple: solaire, prise de quai, recharge vehicule optionnelle, petite distribution 12 V fixe et quelques usages AC.",
    flow: ["Panneau solaire", "Recharge DC-DC", "Prise de quai", "AFERIY P280", "XT60 12 V", "Prises AC"],
    highlights: [
      "Voir ce qu'une station tout-en-un simplifie reellement dans le schema et ce qu'elle laisse a gerer autour.",
      "Comprendre la separation entre les usages 12 V fixes, les protections et les sorties AC de la station.",
      "Partir d'un schema moderne et compact sans masquer les vraies limites de courant et de connectique.",
    ],
    includes: [
      "Une recharge solaire, une recharge vehicule via DC-DC et une prise de quai traitees comme trois chemins distincts.",
      "Un petit reseau 12 V fixe pour les usages quotidiens du van.",
      "Une base utile pour comparer station tout-en-un et architecture plus classique.",
    ],
    watchouts: [
      "La sortie XT60 12 V reste limitee et ne remplace pas une grosse distribution DC.",
      "Le 230 V fixe demande toujours une vraie logique de protection, neutre et terre.",
      "Les compatibilites de charge et les limites constructeur de la station doivent toujours etre reverifiees.",
    ],
  },
  {
    slug: "schema-camping-car-autonome-clim",
    templateId: "reference-v3-camping-car-ds300",
    title: "Schema camping-car autonome avec climatisation 12 V",
    metaTitle: "Schema camping-car autonome : lithium, solaire, 230 V et clim 12 V",
    metaDescription:
      "Exemple de schema electrique complet pour camping-car avec batterie lithium, solaire, DC-DC, MultiPlus et climatisation 12 V, a ouvrir dans l'editeur FabSystem.",
    description:
      "Un exemple de camping-car complet pour comprendre comment cohabitent lithium, solaire, recharge alternateur, 230 V et un depart fort courant pour la climatisation 12 V.",
    thumbnailSrc: "/articles/installation-electrique-van-guide.webp",
    thumbnailAlt: "Apercu d'un schema de camping-car autonome avec climatisation 12 V",
    audience: "Intermediaire a avance",
    level: "Systeme complet",
    family: "camping-car",
    bestFor: "Camping-car autonome avec vraie batterie service, 230 V embarque et depart dedie pour clim 12 V.",
    quickTags: ["Camping-car", "Lithium", "Clim 12 V", "Solaire", "230 V"],
    vehicleScope: "Camping-car autonome avec usages énergivores",
    systemVoltage: "12 V avec 230 V embarqué",
    chargeSources: ["Solaire", "Alternateur via DC-DC", "230 V embarqué / quai selon configuration"],
    hasAc: true,
    chooseWhen: [
      "Vous devez intégrer un départ puissant comme une climatisation 12 V dans un ensemble cohérent.",
      "Votre camping-car demande plus qu'un simple montage solaire ou une petite station.",
      "Vous voulez visualiser les gros courants et la cohabitation entre DC quotidien et 230 V.",
    ],
    avoidIf: [
      "Votre besoin réel est un van léger ou un petit système sans gros appel de courant.",
      "Vous cherchez un premier schéma pédagogique très simple.",
      "Vous n'avez pas encore validé vos consommations et votre autonomie cible.",
    ],
    upgradePaths: [
      "Valider d'abord le bilan de consommation avant de figer la batterie et les sections.",
      "Alléger la base si certains usages forts comme la clim ne sont finalement pas retenus.",
      "Comparer avec le Vito 280 Ah si tu veux une base complète mais moins orientée gros départ dédié.",
    ],
    relatedSlugs: [
      "schema-vito-280ah-van",
      "schema-aferiy-p280-van",
      "schema-atelier-mobile-ducato",
    ],
    context:
      "Camping-car equipe pour plus d'autonomie avec une vraie batterie service, des charges multiples, du 230 V et un besoin de gerer une climatisation 12 V separee.",
    flow: ["Solaire", "DC-DC", "Batterie lithium", "Busbars et protections", "MultiPlus", "Climatisation 12 V"],
    highlights: [
      "Voir comment un depart climatisation 12 V puissant s'isole du reste de la distribution classique.",
      "Comprendre la cohabitation entre reseau 12 V quotidien, recharge multiple et 230 V embarque.",
      "Utiliser une base complete sans perdre la lecture des sous-ensembles techniques.",
    ],
    includes: [
      "Une batterie lithium, un MPPT, un DC-DC et un MultiPlus dans une architecture de camping-car aboutie.",
      "Un depart fort courant dedie a la climatisation 12 V avec protection en amont.",
      "Une lecture claire des zones techniques principales avant adaptation a votre propre implantation.",
    ],
    watchouts: [
      "Une climatisation 12 V change fortement les intensites, les sections et les protections a retenir.",
      "Le schema aide a structurer le systeme mais ne remplace pas un dimensionnement final avec vos vraies longueurs et puissances.",
      "Le 230 V et les gros courants DC doivent etre verifies avec une logique de securite complete avant cablage.",
    ],
  },
  {
    slug: "schema-voilier-autonome-12v-230v",
    templateId: "reference-v3-voilier-10m",
    title: "Schema voilier autonome avec 12 V et 230 V",
    metaTitle: "Schema voilier autonome : solaire, DC-DC, quai, MultiPlus et distribution",
    metaDescription:
      "Exemple de schema electrique pour voilier ou bateau autonome avec solaire, alternateur ou DC-DC, quai, distribution 12 V, supervision et 230 V embarque.",
    description:
      "Le schema bateau le plus complet de cette selection, pense pour un voilier ou un bateau de croisiere qui doit rester lisible malgre plusieurs sources de charge et plusieurs sous-ensembles.",
    thumbnailSrc: "/schema-examples/schema-bateau-complet-lynx-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema de voilier autonome avec 12 V et 230 V",
    audience: "Intermediaire a avance",
    level: "Bateau autonome complet",
    family: "bateau",
    bestFor: "Voilier ou bateau de croisiere avec solaire, recharge moteur, quai et distribution 12 V / 230 V complete.",
    quickTags: ["Voilier", "Bateau", "Solaire", "Quai", "230 V", "Monitoring"],
    vehicleScope: "Voilier ou bateau de croisière avec autonomie renforcée",
    systemVoltage: "12 V avec 230 V embarqué",
    chargeSources: ["Solaire", "Alternateur / DC-DC", "Quai"],
    hasAc: true,
    chooseWhen: [
      "Vous cherchez une base bateau plus autonome qu'un simple montage de quai.",
      "Vous devez représenter plusieurs sources de charge sans perdre la lisibilité du bord.",
      "Le projet inclut distribution 12 V, supervision et usages AC embarqués.",
    ],
    avoidIf: [
      "Votre bateau a seulement un chargeur de quai et quelques circuits DC essentiels.",
      "Vous voulez un schéma minimaliste pour débuter sans réseau AC embarqué.",
      "Vous n'êtes pas prêt à vérifier sérieusement corrosion, retours négatifs et protections AC.",
    ],
    upgradePaths: [
      "Adapter la distribution aux usages réels du bord et à la recharge moteur réelle.",
      "Réduire ou étendre la partie AC selon l'usage au quai et le convertisseur retenu.",
      "Comparer avec le schéma bateau au quai si le projet réel est moins ambitieux qu'un refit autonome.",
    ],
    relatedSlugs: [
      "schema-bateau-quai-chargeur",
      "schema-vito-280ah-van",
      "schema-camping-car-autonome-clim",
    ],
    context:
      "Voilier ou bateau de croisiere avec solaire, recharge moteur, quai, distribution 12 V et besoins AC embarques, sans perdre la lisibilite du schema.",
    flow: ["Solaire", "Alternateur / DC-DC", "Quai", "Coeur DC", "Distribution 12 V", "Monitoring et AC"],
    highlights: [
      "Voir comment plusieurs sources de charge cohabitent sur un bateau sans rendre le schema illisible.",
      "Comprendre la separation entre coeur DC, distribution, monitoring et partie quai / 230 V.",
      "Partir d'une base de refit plus realiste qu'un schema trop abstrait ou trop minimal.",
    ],
    includes: [
      "Une architecture bateau avec solaire, recharge moteur, quai et reseau 12 V structure.",
      "Un exemple utile pour un refit de voilier ou une remise au propre d'un bord existant.",
      "Une base a ouvrir dans l'editeur avant d'ajouter vos propres circuits, protections et longueurs.",
    ],
    watchouts: [
      "Sur un bateau, le traitement du 230 V, des terres et des retours negatifs ne s'improvise pas.",
      "La corrosion, la qualite des sertissages et la logique de distribution comptent autant que le schema lui-meme.",
      "Le schema reste une base de travail et doit etre adapte a vos distances, puissances et materiels reels.",
    ],
  },
];

export const SCHEMA_EXAMPLE_COUNT = SCHEMA_EXAMPLES.length;
export const SCHEMA_EXAMPLE_SLUGS = SCHEMA_EXAMPLES.map((example) => example.slug);

export function getSchemaExampleBySlug(slug: string) {
  return SCHEMA_EXAMPLES.find((example) => example.slug === slug);
}

export function getSchemaExampleHref(slug: string) {
  return `/schemas-electriques/${slug}`;
}

export function getSchemaExampleAbsoluteUrl(slug: string) {
  return `${BASE_URL}${getSchemaExampleHref(slug)}`;
}

export function getSchemaExampleThumbnailSrc(slug: string) {
  return getSchemaExampleBySlug(slug)?.thumbnailSrc ?? null;
}

export function getSchemaExampleThumbnailAbsoluteUrl(slug: string) {
  const thumbnailSrc = getSchemaExampleThumbnailSrc(slug);
  return thumbnailSrc ? `${BASE_URL}${thumbnailSrc}` : null;
}

export function getSchemaEditorTemplateHref(templateId: string) {
  return `/outils/schema?template=${encodeURIComponent(templateId)}`;
}

export function getRelatedSchemaExamples(slug: string) {
  const example = getSchemaExampleBySlug(slug);
  if (!example) return [];

  const related = example.relatedSlugs
    .map((relatedSlug) => getSchemaExampleBySlug(relatedSlug))
    .filter((entry): entry is SchemaExample => Boolean(entry))
    .filter((entry) => entry.slug !== slug);

  if (related.length > 0) {
    return related;
  }

  return SCHEMA_EXAMPLES.filter((entry) => entry.family === example.family && entry.slug !== slug).slice(0, 3);
}
