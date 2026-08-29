# Cahier des charges - Controles intelligents de l'editeur V2.1

## 1. Objectif

Faire evoluer le moteur existant `lib/electrical-components/checks.ts` de
l'editeur React Flow V2.1. Le rendu, les interactions et le format des
schemas sauvegardes (`nodes` / `edges`) restent inchanges.

Le moteur aide a concevoir et relire une installation electrique de van ou
de bateau. Il detecte les incoherences visibles dans le schema, explique le
risque et propose une action utile. Il ne produit jamais de certificat de
conformite et ne remplace ni la documentation des fabricants, ni la reception
ou le controle physique de l'installation.

Pour un van destine a une reception VASP autocaravane, l'editeur doit aussi
produire un dossier technique de preuve : schema, liste des circuits,
caracteristiques, protections, documents fabricants et proces-verbal de tests.
Ce dossier aide a constituer la demande de reception a titre isole (RTI), mais
la fiche officielle applicable, la DREAL/DRIEAT/DEAL competente et les
organismes de controle conservent la decision finale.

## 2. Referentiel et perimetre

### Bateau

- Reference principale : ISO 13297:2020 et son amendement 2022, pour les
  installations DC et AC monophasees des petites embarcations.
- Perimetre vise : DC jusqu'a 50 V et AC monophase jusqu'a 250 V, hors
  propulsion et hors installation triphasee.
- L'ABYC constitue le niveau de securite renforce pour le nautisme : E-11
  (installations AC/DC), E-10 (batteries), E-13 (batteries lithium), A-28
  (isolateurs galvaniques), A-31 (chargeurs/onduleurs), C-7
  (coupe-batteries) et E-2 (protection cathodique) selon le perimetre reel.

### Profils normatifs et regle de separation

L'utilisateur choisit un seul profil a la creation du projet : `Bateau` ou
`VASP terrestre`. Un schema ne peut pas appartenir aux deux profils.

- `Bateau` : ISO 13297 et, lorsque plus protectrices, les regles ABYC
  applicables. Les notices fabricant priment quand elles sont plus
  restrictives. Chaque regle ABYC archive norme, edition, clause et statut.
- `VASP terrestre` : exigences legales francaises, fiche RTI applicable,
  demandes ecrites de la DREAL/DRIEAT/DEAL, notices fabricant, puis
  referentiels ISO/EN/NF applicables au vehicule de loisirs.

Une regle ABYC ne s'execute jamais sur un projet VASP terrestre et n'apparait
jamais dans son export. Inversement, une exigence RTI/DREAL ne s'execute jamais
sur un projet Bateau. En cas de doute sur le profil, le moteur demande a
l'utilisateur de le choisir avant tout controle normatif.

Aucun seuil normatif ne peut etre recopie depuis un extrait non verifie ou une
source secondaire.

### Sources autorisees pour les regles normatives

| Profil | Sources autorisees | Sources exclues pour definir un seuil |
| --- | --- | --- |
| `VASP terrestre` | [Legifrance](https://www.legifrance.gouv.fr/), [Ministere charge des receptions](https://www.ecologie.gouv.fr/politiques-publiques/fiches-constitution-dossier-limmatriculation-mise-circulation-vehicules), fiche RTI a jour correspondant au vehicule, demande ecrite du service instructeur, notice fabricant officielle. | Blogs, forums, videos, fiches commerciales, resumes d'installateurs et anciennes fiches RTI non confirmees. |
| `Bateau` | [ISO](https://www.iso.org/standard/69551.html), bibliotheque [ABYC](https://abycinc.org/standards/), notice fabricant officielle et exigences de l'autorite maritime competente. | Blogs, forums, videos, extraits non dates et resumes commerciaux. |

Avant d'activer une nouvelle regle, l'equipe archive dans le depot prive la
preuve de la source primaire autorisee a etre conservee : URL officielle, date
de consultation, edition, clause, perimetre et interpretation retenue. Le
code ne contient aucun seuil lorsque cette preuve n'est pas disponible.

### Van et vehicule de loisirs

- Perimetre vise : installation auxiliaire DC 12/24/48 V, solaire, charge
  alternateur, charge secteur, onduleur et distribution AC 230 V.
- Le moteur utilise les principes de securite de l'installation basse tension
  applicable au vehicule de loisirs, sans annoncer une conformite a la
  reglementation francaise ou europeenne sans verification humaine du vehicule
  reel.
- Le mode `VASP / RTI` impose une tracabilite documentaire complete. Il ne
  peut etre marque « dossier pret a presenter » que lorsque les champs et
  pieces listes en section 7 sont renseignes ou explicitement declares hors
  perimetre.

### Ce que le schema ne peut pas verifier

- Qualite du sertissage, couple de serrage, cheminement reel, abrasion,
  ventilation, etancheite, IP, fixation mecanique et accessibilite.
- Etat du chassis, de la coque, de la prise de quai, des appareils reels et
  de leurs notices a jour.
- Mesures electriques reelles : continuite de terre, isolement, declenchement
  du differentiel, tension de charge, echauffement et chute de tension mesuree.

Ces elements sont presentes dans une checklist de reception, jamais comme des
erreurs calculables du graphe.

## 3. Principes de fonctionnement

1. Le moteur reste local et pur : `nodes` + `edges` en entree, liste de
   controles en sortie. Aucune API V3, aucune migration et aucun second format.
2. Une regle ne bloque pas l'edition. Seules les actions explicites de
   l'utilisateur modifient un schema.
3. Une valeur manquante ne devient jamais une valeur inventee. La regle renvoie
   une information `donnee manquante` quand elle ne peut pas conclure.
4. Chaque alerte cible un composant ou un cable deja selectionnable par le
   widget Volta.
5. Chaque calcul utilise les caracteristiques saisies ou le modele choisi ; un
   modele constructeur connu prime sur une valeur generique.
6. Les seuils sont centralises, versionnes et accompagnes de leur reference ou
   de leur justification produit. Aucun seuil ne doit etre duplique dans une
   regle.

## 4. Niveaux de resultat

| Niveau | Sens dans l'interface | Exemples |
| --- | --- | --- |
| Erreur | Incoherence dangereuse ou branchement impossible a ignorer. | `+` relie a `-`, AC relie directement au DC, cable sous-dimensionne avec donnees completes. |
| Avertissement | Risque important ou protection probablement absente. | Fusible principal non detecte, BMS trop faible, absence de PE. |
| Information | Controle incomplet ou conseil de conception. | Longueur de cable absente, donnees batterie insuffisantes, verification physique a effectuer. |

Le widget affiche les compteurs par niveau et permet de filtrer les
informations. Un schema sans erreur ne doit jamais afficher « conforme » ; il
affiche « aucune incoherence detectee dans le schema ».

## 5. Lots de regles

### Lot A - Integrite du graphe et compatibilite des connexions

- Bornes inexistantes, cable incomplet ou composant isole.
- Borne obligatoire non raccordee, sans signaler les bornes declarees
  facultatives.
- Polarite DC, domaine AC/DC, terre de protection et communication
  incompatible.
- Plus de quatre conducteurs sur une borne ordinaire ; exception explicite
  pour les repartiteurs et busbars.
- Sources mises directement en parallele sans dispositif de gestion identifie.

### Lot B - Protection DC et distribution

- Depart positif de batterie sans protection principale detectable.
- Protection de chaque branche source/charge : MPPT, PWM, DC-DC, chargeur
  secteur, alternateur, convertisseur et consommateurs.
- Calibre du fusible ou disjoncteur coherent avec le cable, le courant de
  conception et le courant maximal de l'appareil.
- Coupe-batterie et busbar calibres pour le courant potentiel du circuit.
- Branche principale batterie au moins aussi dimensionnee que la branche aval
  la plus exigeante, y compris avec conducteurs paralleles.

### Lot C - Cables et chute de tension

- Section renseignee, longueur renseignee et type de cable coherent avec le
  domaine DC, AC ou solaire.
- Courant de conception derive de la puissance, de la tension, du courant
  constructeur ou de la protection la plus proche, sans jamais choisir le plus
  faible par defaut.
- Ampacite corrigee selon le type de cable et les conditions declarables dans
  V2.1 : isolation, temperature ambiante et regroupement.
- Chute de tension calculee pour les cables DC lorsque tension, longueur,
  courant et section sont connus.
- Avertissement lorsque plusieurs conducteurs paralleles sont necessaires ou
  lorsqu'une preconisation constructeur impose une section superieure.
- Minimum pratique specifique aux liaisons solaires, configurable et documente.

### Lot D - Batterie, BMS et charge

- Tension nominale homogene entre batterie, chargeurs, DC-DC, MPPT,
  convertisseur et consommateurs declares.
- Courant de decharge potentiel inferieur ou egal a la limite batterie/BMS.
- Courant de charge cumule inferieur ou egal a la limite de charge batterie.
- Sortie MPPT/PWM compatible avec le courant de charge admissible.
- DC-DC compatible avec ses tensions d'entree et de sortie.
- Shunt place dans le retour negatif attendu et sans chemin de contournement.

### Lot E - Solaire et convertisseur

- Voc de la chaine solaire, avec marge de temperature, inferieure a la limite
  d'entree du regulateur.
- Courant PV inferieur a la limite d'entree du regulateur ; puissance et
  courant de sortie compatibles avec la tension batterie.
- Courant DC demande par l'onduleur compatible avec batterie, BMS, cable,
  coupe-batterie et protection.
- Puissance de pointe des consommateurs compatible avec la capacite de pointe
  declaree de l'onduleur.

### Lot F - AC 230 V, quai et terre

- Separation nette AC/DC et absence de raccordement direct entre les deux
  domaines hors appareil de conversion.
- Conducteur de protection raccorde lorsque le composant l'exige.
- Presence d'une protection differentielle et d'une protection contre les
  surintensites detectables sur les branches AC.
- Protection AC individuelle par branche ; signalement d'une protection
  partagee non justifiee.
- Calibre de l'isolateur galvanique coherent avec l'alimentation de quai.
- Distinction visuelle et logique entre neutre, terre de protection et masse
  DC : aucune equivalence implicite dans le moteur.
- En profil `Bateau`, comparaison des protections AC, separation des tableaux,
  coupe-batteries, chargeurs/onduleurs, lithium et isolateurs galvaniques avec
  les exigences ABYC applicables et les notices fabricants.

## 6. Donnees a ajouter progressivement aux composants

Les champs existants restent compatibles. Les nouveaux champs sont optionnels
et n'activent une regle precise que lorsqu'ils sont renseignes :

- Batterie/BMS : tension nominale, capacite, courant de charge/decharge
  continu maximal, courant de pointe et chimie.
- Chargeurs et MPPT : tensions compatibles, intensite maximale, Voc et courant
  PV admissibles.
- Onduleur : puissance continue, puissance de pointe, rendement et tension DC.
- Protections et distribution : calibre, nombre de poles, type de protection,
  courant admissible du busbar et du coupe-batterie.
- Cables : section, longueur aller simple, materiau, isolation, temperature,
  regroupement, nombre de conducteurs paralleles et fonction du circuit.
- AC : tension, courant nominal, differentiel/RCBO, disjoncteur, PE et source
  quai/groupe/onduleur.

## 7. Mode VASP / RTI - dossier technique et preuves

Le mode VASP est un niveau de preuve supplementaire, active par projet. Il ne
change pas les regles electriques ; il rend obligatoires les informations qui
permettent a un installateur, un organisme de controle ou au service de
reception de comprendre le montage et de retrouver chaque materiel.

### Informations projet obligatoires

- Identite du demandeur et de l'amenageur, date, version du dossier et auteur
  de la derniere modification.
- Vehicule de base : marque, modele, VIN, immatriculation, categorie, PTAC,
  tension auxiliaire et type d'amenagement.
- Perimetre declare : DC seul, DC + solaire, DC + AC 230 V, prise de quai,
  groupe, onduleur, charge alternateur, chauffage, gaz et eau.
- Declaration explicite des elements hors perimetre de l'editeur, notamment
  gaz, chauffage, eau, ventilation, structure, fixation et repartition de
  charge.

### Donnees obligatoires par circuit

- Identifiant unique, fonction, domaine (DC, PV, AC, communication, PE),
  tension nominale et origine/alimentation.
- Source, destination, puissance ou courant de calcul, courant maximal,
  longueur aller simple, section, type de cable, couleur ou repere physique.
- Protection associee : reference, type, calibre, position dans le circuit et
  raison du calibre.
- Appareil : marque, modele, reference exacte, notice ou fiche technique,
  tension compatible et courant/puissance maximum.
- Pour la batterie : chimie, capacite, BMS, courants de charge/decharge,
  coupe-batterie, fusible principal et emplacement physique.
- Pour l'AC : origine (quai, onduleur ou groupe), tableau, differentiel,
  disjoncteur de branche, neutre, PE et prises desservies.

### Pieces generees par l'editeur

1. Schema electrique unifilaire PDF, date, versionne et lisible, avec
   reperes uniques de composants, cables, protections et points de terre.
2. Plan d'implantation physique : emplacement batterie, protections, tableau,
   appareils, passages de cables, prises, masse/chassis et acces aux
   coupe-circuits.
3. Nomenclature complete : reference, quantite, caracteristiques nominales,
   lien vers notice/fiches constructeur et statut de verification.
4. Tableau des cables : repere, depart, arrivee, longueur, section, type,
   courant de calcul, chute de tension calculee et protection amont.
5. Tableau des protections : repere, fonction, type, calibre, pouvoir de
   coupure renseigne si applicable, cable protege et justification.
6. Tableau des controles intelligents : regle, severite, resultat, donnees
   utilisees, donnees manquantes, action corrective et statut de resolution.
7. Checklist de reception physique a imprimer, avec champs date, operateur,
   mesure, appareil de mesure et photo de preuve.

### Verification physique a consigner, jamais a simuler

- Concordance entre schema, implantation, etiquetage et montage reel.
- Photographies nettes des batteries, fusibles, coupe-batteries, tableau AC,
  prise de quai, cheminements et protections mecaniques des cables.
- Continuite du PE et de la liaison de masse declaree, mesuree avec
  l'instrument identifie.
- Essai de fonctionnement du differentiel et des protections AC, suivant les
  instructions du fabricant et le protocole de l'organisme de controle.
- Verification de polarite, serrage, absence de cable endommage, protection
  contre le frottement, acces aux coupures et lisibilite des etiquettes.
- Mesures de tension, charge, chute de tension et echauffement en charge si
  elles sont demandees par la notice, l'organisme de controle ou le dossier.

### Etat du dossier

| Etat | Condition |
| --- | --- |
| Incomplet | Informations, notices, circuits ou preuves manquants. |
| Pret pour revue technique | Schema et dossier complets, sans erreur de moteur non resolue ; les controles physiques restent a realiser. |
| Controle physique consigne | Checklist et preuves renseignees ; ne vaut pas approbation administrative. |

L'interface n'utilise jamais « homologue », « certifie », « conforme VASP » ou
« accepte DREAL ». Elle utilise uniquement les trois etats ci-dessus.

## 8. Architecture V2.1 cible

Le fichier `checks.ts` devient un point d'entree leger qui compose des modules
V2.1 par domaine :

```text
lib/electrical-components/checks.ts
lib/electrical-components/checks/
  topology.ts
  connection.ts
  dc-protection.ts
  cable-sizing.ts
  battery-charge.ts
  solar.ts
  inverter.ts
  ac-safety.ts
  monitoring.ts
  constants.ts
```

Tous les modules manipulent les types React Flow existants et retournent
`SchemaIssue`. `SchemaIssue` evolue avec `severity`, `category`,
`missingData` et `reference`, tout en conservant `targetKind`, `targetId`,
`message` et les actions existantes.

`reference` contient au minimum : profil, organisme emetteur, norme ou texte,
edition/version, clause/article, URL officielle, date de verification et
statut (`exigence`, `recommandation`, `notice fabricant`).

## 9. Plan d'implementation

1. Etendre `SchemaIssue` et le widget Volta avec les niveaux de severite,
   sans changer les regles existantes.
2. Extraire les regles actuelles en modules V2.1 et couvrir leur comportement
   actuel par des tests de non-regression.
3. Implementer les lots A et B, puis C, avec un test par cas dangereux et un
   test par donnees manquantes.
4. Implementer les lots D, E et F apres ajout des champs necessaires au
   catalogue de composants.
5. Ajouter le mode VASP / RTI, les champs de preuves et les exports du dossier
   technique avant les regles qui les utilisent.
6. Ajouter la checklist de reception physique et les sources documentaires.
7. Valider chaque lot sur les gabarits van, bateau, solaire et station deja
   disponibles dans l'editeur.

## 10. Criteres d'acceptation

- Aucune modification des schemas sauvegardes, de React Flow ou de l'UX V2.
- Toutes les regles existantes continuent de produire les memes alertes.
- Chaque nouvelle regle possede des tests : declenchement, absence de faux
  positif connu et donnee insuffisante.
- Les calculs n'utilisent que des donnees explicites ou des valeurs catalogue
  tracees.
- Chaque controle base sur ABYC indique son edition et sa clause dans le
  rapport exporte du profil `Bateau` uniquement.
- Le profil `VASP terrestre` n'exporte que ses propres referentiels ; il ne
  contient aucune regle ni reference ABYC.
- L'utilisateur peut localiser chaque alerte et comprendre ce qu'il doit
  renseigner ou verifier physiquement.
- Le mode VASP / RTI produit les six pieces de la section 7 et interdit le
  statut « pret pour revue technique » tant qu'une donnee obligatoire ou une
  erreur non resolue subsiste.
- Aucune mention « conforme aux normes » ou « installation certifiee » dans
  l'interface ou les exports.
