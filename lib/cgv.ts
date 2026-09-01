export const CGV_TITLE = "CONDITIONS GÉNÉRALES DE VENTE - FabSystem";

export const CGV_VERSION = "2026-09-01";
export const CGV_VERSION_LABEL = "1er septembre 2026";

export function sanitize(text: string) {
  return text
    .replace(/\u00AD/g, "")
    .replace(/\u2060/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFFF9-\uFFFB\uFFFD]/g, "");
}

const RAW_CGV_PARAGRAPHS = [
  `Article 1 - Identité et champ d'application
Les présentes Conditions Générales de Vente (CGV) s'appliquent aux offres proposées sous la marque FabSystem par Fabien Lages, entrepreneur individuel, 48E rue Rey Loras, 69250 Neuville-sur-Saône, SIRET 100 271 980 00011.
Elles encadrent les contenus numériques vendus en ligne, notamment les ebooks, fichiers et accès associés, les accompagnements à distance commandés en ligne, ainsi que les prestations, interventions et installations réalisées sur devis.`,
  `Article 2 - Informations précontractuelles et formation du contrat
Avant la commande, le client peut consulter la description de l'offre, son prix et les présentes CGV. Pour une commande en ligne, le contrat est formé après acceptation des CGV, validation de la commande et confirmation du paiement.
Pour une intervention, une installation ou toute prestation nécessitant un chiffrage préalable, le contrat est formé à réception du devis signé avec la mention « Bon pour accord » et, le cas échéant, de l'acompte prévu.`,
  `Article 3 - Prix et paiement
Les prix sont exprimés en euros. TVA non applicable - article 293 B du CGI.
Le paiement des commandes en ligne est réalisé par le moyen de paiement proposé lors du checkout sécurisé. Les modalités de paiement, acompte et solde applicables aux prestations sur devis sont indiquées dans le devis ou la facture concernés.`,
  `Article 4 - Compte client
Un compte FabSystem peut être requis pour commander une offre numérique, retrouver les achats, accéder aux téléchargements ou sauvegarder des projets dans l'éditeur. Le client est responsable de la confidentialité de ses identifiants et doit signaler sans délai toute utilisation non autorisée de son compte.`,
  `Article 5 - Contenus numériques, accès et droit de rétractation
Les ebooks, fichiers et accès numériques sont mis à disposition selon les modalités annoncées sur la fiche produit ou dans l'espace client, après confirmation du paiement lorsque celle-ci est requise.
Lorsque le client demande l'exécution immédiate d'un contrat portant sur un contenu numérique non fourni sur support matériel, il donne son accord exprès avant paiement et reconnaît perdre son droit de rétractation une fois l'accès au contenu numérique fourni. Cette règle ne s'applique qu'aux contenus ou accès numériques concernés et ne prive pas le client des garanties légales applicables.
En dehors de ce cas, le droit de rétractation et ses exceptions s'appliquent conformément aux dispositions légales en vigueur.`,
  `Article 6 - Accompagnement à distance, interventions et installations
L'accompagnement à distance repose sur les informations, photos, documents et schémas transmis par le client. Il aide à clarifier un projet, à préparer des choix et à faire relire une architecture, mais ne constitue ni un contrôle sur site ni une certification de conformité de l'installation.
Les interventions et installations sont réalisées dans le périmètre décrit au devis. Les délais communiqués sont indicatifs, sauf engagement écrit contraire.`,
  `Article 7 - Sécurité et obligations du client
Le client s'engage à communiquer des informations exactes, à signaler les installations existantes et à garantir un accès sécurisé au bateau ou véhicule lors d'une intervention.
Les contenus, calculateurs et schémas FabSystem sont des aides à la compréhension et à la préparation. Ils ne remplacent pas la vérification d'une installation réelle par un professionnel qualifié lorsque la sécurité, les normes applicables ou le contexte technique l'exigent.`,
  `Article 8 - Responsabilité et garanties légales
FabSystem répond de l'exécution de ses obligations dans les conditions prévues par la loi. Aucune stipulation des présentes CGV ne limite les garanties légales dont bénéficie le consommateur.
FabSystem ne peut pas être tenu responsable des conséquences d'informations inexactes ou incomplètes fournies par le client, d'installations préexistantes, d'un matériel choisi ou fourni par le client, d'une utilisation non conforme ou d'une modification ultérieure par un tiers.`,
  `Article 9 - Propriété intellectuelle
Les contenus, schémas, plans, rapports et documents remis au client sont protégés par le droit de la propriété intellectuelle. Sauf mention contraire ou droit légal applicable, ils sont destinés à l'usage personnel du client et ne peuvent être reproduits, diffusés, revendus ou partagés publiquement sans autorisation écrite préalable de FabSystem.`,
  `Article 10 - Données personnelles
Les données personnelles sont traitées pour la relation commerciale, la fourniture des services, les commandes, les téléchargements, les devis, les factures et le suivi client. Elles ne sont ni vendues ni louées. Les modalités et droits applicables sont détaillés dans la Politique de confidentialité disponible sur le site FabSystem.`,
  `Article 11 - Force majeure
FabSystem ne pourra être tenu responsable d'un retard ou d'une inexécution résultant d'un événement de force majeure tel que défini par la loi et la jurisprudence.`,
  `Article 12 - Réclamations et médiation de la consommation
Toute réclamation doit d'abord être adressée à FabSystem par écrit à contact@fabsystem.fr afin qu'une solution amiable puisse être recherchée.
Conformément aux dispositions du Code de la consommation concernant le processus de médiation des litiges de la consommation, après nous avoir sollicités et à défaut de réponse vous satisfaisant, vous avez la possibilité de recourir gratuitement à une procédure de médiation de la consommation auprès de :
CM2C, 49 rue de Ponthieu, 75008 Paris.
Téléphone : 01 89 47 00 14.
Site internet : https://www.cm2c.net/declarer-un-litige.php.
Email : litiges@cm2c.net.
Le recours à la médiation ne prive pas le consommateur de la possibilité de saisir les juridictions compétentes.`,
] as const;

export const CGV_PARAGRAPHS = RAW_CGV_PARAGRAPHS.map(sanitize);
