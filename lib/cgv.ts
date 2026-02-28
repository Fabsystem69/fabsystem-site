export const CGV_TITLE = "CONDITIONS GÉNÉRALES DE VENTE – FabSystem";

export function sanitize(text: string) {
  return text
    .replace(/\u00AD/g, "")
    .replace(/\u2060/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\uFFF9-\uFFFB\uFFFD]/g, "");
}

const RAW_CGV_PARAGRAPHS = [
  `Article 1 – Champ d’application
Les présentes Conditions Générales de Vente (CGV) s’appliquent à l’ensemble des prestations d’audit, de conseil, d’installation, de maintenance et d’optimisation d’équipements électriques embarqués (12V / 24V / 230V) réalisées par FabSystem, entreprise individuelle exploitée par Fabien Lages.`,
  `Article 2 – Formation du contrat
Toute prestation donne lieu à l’établissement préalable d’un devis détaillé.
Le contrat est réputé formé à réception du devis signé par le client avec la mention « Bon pour accord » et, le cas échéant, du versement de l’acompte prévu.
Les CGV sont réputées acceptées sans réserve.`,
  `Article 3 – Prix – Modalités de paiement
Les prix sont exprimés en euros.
TVA non applicable – article 293 B du CGI.
Un acompte peut être exigé à la commande.
Le solde est payable à réception de facture sauf stipulation particulière.
Tout retard de paiement entraîne :
– l’application de pénalités calculées au taux légal en vigueur,
– une indemnité forfaitaire pour frais de recouvrement conformément à la législation.`,
  `Article 4 – Délais d’exécution
Les délais sont fournis à titre indicatif.
Aucun retard ne peut donner lieu à annulation de commande, pénalité ou indemnité, sauf engagement écrit spécifique.`,
  `Article 5 – Obligations du client
Le client s’engage à :
– Garantir l’accès sécurisé au bateau ou véhicule.
– Informer l’entreprise de toute modification ou installation préexistante.
– Maintenir une assurance couvrant le bien pendant toute la durée d’intervention.
– Ne pas modifier l’installation sans validation technique écrite.`,
  `Article 6 – Biens confiés
Le client demeure responsable de l’assurance de son bateau ou véhicule.
FabSystem est assuré en Responsabilité Civile Professionnelle pour ses interventions.`,
  `Article 7 – Responsabilité
La responsabilité de FabSystem est strictement limitée au montant de la prestation concernée.
Sont expressément exclus :
– Les défauts ou non-conformités liés aux installations préexistantes.
– Les dommages résultant d’un matériel fourni par le client.
– Les conséquences d’une utilisation non conforme.
– Toute modification ou intervention ultérieure par un tiers.`,
  `Article 8 – Installations Lithium et 230V
Les installations impliquant batteries lithium ou courant 230V sont réalisées selon les règles de l’art et bonnes pratiques techniques en vigueur.
Toute modification ultérieure non validée par écrit entraîne la perte de garantie sur la partie concernée.`,
  `Article 9 – Conformité réglementaire
Lorsque spécifié au devis, les prestations peuvent être réalisées en référence aux exigences Division 240 / 245.
La conformité globale du navire ou véhicule demeure de la responsabilité du propriétaire.`,
  `Article 10 – Garantie
La main d’œuvre est garantie 12 mois à compter de la réception.
Les équipements installés bénéficient exclusivement de la garantie constructeur.
La garantie est exclue en cas d’usage anormal, défaut d’entretien ou modification ultérieure.`,
  `Article 11 – Réserve de propriété
Le matériel fourni demeure la propriété de FabSystem jusqu’au paiement intégral des sommes dues.`,
  `Article 12 – Propriété intellectuelle
Les schémas, plans, rapports et documents techniques remis au client restent la propriété intellectuelle de FabSystem.
Toute reproduction ou diffusion sans autorisation écrite est interdite.`,
  `Article 13 – Données personnelles
Les données collectées sont utilisées exclusivement dans le cadre de la relation commerciale.
Elles ne sont ni revendues ni cédées à des tiers.`,
  `Article 14 – Force majeure
La responsabilité de l’entreprise ne pourra être engagée en cas d’événement imprévisible, irrésistible et indépendant de sa volonté.`,
  `Article 15 – Litiges
Une solution amiable sera recherchée en priorité.
À défaut, compétence exclusive des tribunaux du ressort du siège de l’entreprise.`,
] as const;

export const CGV_PARAGRAPHS = RAW_CGV_PARAGRAPHS.map(sanitize);
