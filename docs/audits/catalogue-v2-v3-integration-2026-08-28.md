# Audit catalogue V2/V3 et integration dans l'editeur

Date : 2026-08-28
Perimetre : comparaison V2/V3, export V3 brut et code de l'editeur du projet principal.
Sources non modifiees :
- `/Users/fabienlages/Desktop/fabsystem-site-v3/docs/_local/V3/comparaison-catalogue-v2-v3.csv`
- [catalogue-complet-recap.csv](/Users/fabienlages/Desktop/fabsystem-site/docs/_local/catalogue-complet-recap.csv)
- [brand-models.ts](/Users/fabienlages/Desktop/fabsystem-site/lib/electrical-components/brand-models.ts)
- [definitions.ts](/Users/fabienlages/Desktop/fabsystem-site/lib/electrical-components/definitions.ts)

## Conclusion

**Strategie recommandee : V2 comme base active, V3 comme enrichissement selectif.**
Une fusion complete ou un import direct V3 serait aujourd'hui trompeur et
introduirait des doublons. Le CSV V3 brut contient deja les 155 modeles V2
actuels, plus 951 lignes V3 non verifiees. Il ne contient ni photo produit
(`maPhoto` est vide sur 1 106 lignes), ni proprietes techniques exploitables
dans son export. La comparaison V2/V3 confirme que 146/155 correspondances
referencees ont `0/51` proprietes V3 renseignees.

L'experience cible doit donc etre : **type de composant -> famille visuelle ->
variante technique -> valeurs par defaut**. La carte est la famille visuelle,
pas un SKU, ni une categorie trop large.

## Constats factuels

| Indicateur | Resultat | Consequence |
|---|---:|---|
| Lignes V3 brutes | 1 106 | Trop volumineux pour une bibliotheque directe |
| Lignes sourcees V2 dans V3 | 155 | Deja presentes, a ne pas reimporter |
| Lignes `catalogue-fr-v3-import` | 951 | Candidats V3 non verifies |
| `verified=oui` | 155 | Ce sont les lignes V2 reprises, pas une validation des 951 |
| Photos `maPhoto` | 0 / 1 106 | Aucune illustration produit V3 reutilisable |
| Types V3 distincts | 42 | 29 intersections directes avec les types de l'editeur |
| Types V3 sans type editor | 13 | Demandent mapping ou nouveau composant metier |
| Types editor non couverts par V3 | 14 | V2/code a conserver |
| Correspondances V2/V3 exactes | 20 / 155 | Reutilisables comme controles d'identite |
| Correspondances partielles | 34 / 155 | A revoir, jamais a fusionner automatiquement |
| V2 absents de la comparaison V3 | 101 / 155 | V2 reste indispensable |
| Icônes de modele V2 referencees | 146 refs, 131 fichiers uniques | Toutes les references existent localement |
| Chemins icone V3 manquants | 3 chemins + 246 `AUCUNE` | Ne pas les traiter comme une couverture visuelle |

Le code consomme actuellement `BRAND_MODELS`, puis applique les valeurs au
noeud lors de la selection de modele. Il ne charge aucun des deux CSV. Voir
[useSchemaStore.ts](/Users/fabienlages/Desktop/fabsystem-site/features/schemas/store/useSchemaStore.ts:769)
et [ItemPropertiesPopup.tsx](/Users/fabienlages/Desktop/fabsystem-site/components/schema-editor/ItemPropertiesPopup.tsx:30).
Une importation CSV brute ne produirait donc pas de comportement dans l'editeur.

## Audit des donnees

### Correspondances fiables

Les 20 correspondances `exact` sont des candidats a la deduplication par
identite constructeur, avec revue de leur fiche avant de remplacer une valeur :
- Victron AGM Super Cycle 12V/100Ah, GEL 12V/110Ah, GEL 12V/220Ah.
- Renogy Smart Lithium 12V/200Ah et Rover Elite 40A.
- Victron Orion XS 12/12-50A, Blue Smart IP67 12/7 et 12/25.
- Victron MultiPlus-II 12/3000/120-32.
- Victron SmartShunt 300A et 500A.
- Victron Smart BatteryProtect 65A, 100A et 220A.
- Cerbo GX MK2, Color Control GX, Venus GX, Ekrano GX, GX Touch 50 et GX Touch 70.

Meme ici, le rapprochement ne constitue pas une preuve de valeurs techniques :
la comparaison donne `0/51` champs V3 pour la plupart de ces lignes. Les
valeurs V2 existantes restent donc prioritaires tant qu'une source constructeur
n'est pas rattachee au modele.

### Correspondances ambiguës

Les 34 lignes `partial` ne doivent jamais alimenter automatiquement le meme
`modelId`. Exemple structurel : plusieurs batteries Victron Lithium Smart
sont rapproches de la categorie V3 **Cyrix Battery Combiner**, qui n'est ni la
bonne famille produit ni le bon type metier. C'est une alerte de qualite de la
matrice, pas une correspondance produit.

Autres causes d'ambiguite a conserver en revue :
- une gamme au lieu d'un SKU exact;
- une tension, un nombre de sorties ou une generation differente;
- des libelles semblables mais boitiers ou topologies distincts;
- des variantes dont seule la couleur/categorie est connue, sans fiche.

### Doublons et incoherences

Le fichier V3 brut comporte au moins 14 doublons exacts par
`brand + modelName + archetypeId`, avec deux identifiants differents. Exemples :
- Blue Smart IP67 12/7 et 12/25;
- AGM Super Cycle 12V/100Ah, GEL 12V/110Ah et 12V/220Ah;
- Orion XS 12/12-50A;
- MultiPlus-II 12/3000/120-32;
- Rover Elite 40A;
- Cerbo GX MK2, Venus GX, Color Control GX, Ekrano GX et GX Touch 50/70.

Le probleme n'est pas seulement le doublon : les IDs divergent entre
`blue-smart-ip67-12-7` et `victron-blue-smart-ip67-12-7`, par exemple.
Il faut un identifiant canonique immuable et des aliases de provenance, jamais
deux variantes visibles pour le meme produit.

### Couverture des proprietes

Le CSV V3 brut ne contient que :
`archetypeId, archetypeLabelFr, brand, familyDisplayName, modelId, modelName,
verified, active, source, cheminIconeArchetype, maPhoto`.

Il ne porte ni tension, ni courant, ni puissance, ni capacite, ni connectique,
ni topologie. Le fichier de comparaison annonce 51 colonnes de specs attendues,
mais seules 9 lignes ont entre 2 et 6 valeurs renseignees; 146 ont `0/51`.
La donnee V3 ne peut donc pas preconfigurer un schema aujourd'hui.

## Compatibilite metier par categorie

| Categorie V3 | Lignes | Etat editor | Decision |
|---|---:|---|---|
| battery | 155 | `battery` | Utilisable apres deduplication et specs completees |
| solar-panel | 59 | `solar-panel` | Utilisable apres normalisation Voc/Vmp/Isc et dimensions |
| mppt / pwm | 51 | `mppt`, `pwm` | Utilisable apres normalisation tension PV max, courant, systeme |
| dcdc | 58 | `dcdc` | Utilisable apres topologie, courant entree/sortie, D+/remote |
| ac-charger | 101 | `ac-charger` | Utilisable apres tension, courant, sorties, profil batterie |
| inverter / inverter-charger / easysolar | 160 | Types presents | Utilisable apres puissance continue/pic, tension, charge et AC |
| system-monitor / shunt | 106 | Types presents | Utilisable apres ports, shunt inclus, ecran/boitier, fonctions |
| battery-switch / combiner / isolator | 44 | Types presents | Utilisable apres intensite, poles, technologie et sorties |
| fuse / circuit-breaker / fuse-block / busbar / relay | 92 | Types presents partiellement | Normaliser calibre, poles, sorties et disposition |
| shore-power / ac-panel / ac-transfer-switch / socket | 21 | Types presents | Normaliser courant, poles, terre/neutre, entree/sortie |
| galvanic-isolator | 9 | `galvanic-isolator` | Candidat correct, mais distinguer isolateur galvanique et transformateur |
| wind-turbine / alternator | 7 | Types presents | Completer tension, puissance, courant et regulation |
| dc-fridge | 122 | Pas de type dedie | Mapper provisoirement vers `consumer` seulement apres puissance/voltage; sinon hors catalogue |
| dc-electronics | 66 | Pas de type dedie | Trop large : GPS, radar, VHF et audio n'ont pas les memes ports ni defaults |
| dc-fuse-box | 23 | Proche `fuse-block` | Normaliser nombre de sorties et positif/negatif |
| ac-dc-distribution-panel | 8 | Aucun type compose | Nouveau type ou composition AC panel + fuse block |
| fused-busbar | 2 | Proche `busbar` | Nouveau type ou variante a handles fusibles |
| connector-strip / wago | 11 | Proche `splice` | Mapping possible si seulement jonction; nouveau type si bornes visibles |
| split-charge-diode | 4 | Proche `battery-isolator` | Mapping uniquement apres confirmation de la topologie |
| alternator-regulator | 4 | Absent | Nouveau composant metier, non importable maintenant |
| integrated-power-system | 4 | Ambigu | Revue humaine : peut etre power-station ou easysolar, jamais auto |
| actuator / lighting-controller / sensor | 7 | Absents ou trop generiques | Nouveaux types seulement si usages et connexions definis |

Les types editor sans representation V3 doivent etre conserves dans la base
V2/code : `solar-router`, BMS dedies, modules Lynx, masse, pompe de cale,
jauges de niveau et consommateur generique. Ils ont une vraie semantique de
schema et ne doivent pas disparaitre au motif qu'ils ne sont pas dans le CSV V3.

## Lacunes metier par type

| Type editor | Champs minimaux absents ou incomplets dans V3 |
|---|---|
| Batterie | technologie, tension nominale, Ah, courant BMS charge/decharge, dimensions, bornes, IP, chauffage, serie/parallele autorise |
| Panneau | W, Voc, Vmp, Isc, Imp, dimensions, technologie, connecteurs, type rigide/flexible |
| MPPT/PWM | tension PV max, courant sortie, tension batterie, puissance PV max, nombre de trackers, communication |
| DC-DC | tension/courant entree et sortie, isole/non isole, limite entree, D+/remote, MPPT integre |
| Chargeur AC | tension AC entree, tension DC, courant, sorties, chimies supportees, IP |
| Onduleur/Multi | puissance continue/pic, tension DC, chargeur, transfert, AC-in/out, neutre/terre, communication |
| Protection/distribution | courant, tension DC/AC, poles, nombre de voies, disposition et type de borne |
| Monitoring | ecran/boitier, shunt inclus, ports, protocole, nombre d'entrees et compatibilites |
| Consommateurs | tension, W/A nominal et pic, demarrage, priorite, connecteurs, environnement/IP |

Le contrat actuel de l'editeur n'accepte que les champs declares dans
[definitions.ts](/Users/fabienlages/Desktop/fabsystem-site/lib/electrical-components/definitions.ts:281).
Une variante ne doit remplir que ces clefs. Un champ inconnu serait conserve dans
les donnees de noeud mais n'aurait ni UI, ni validation, ni effet de calcul.

## Audit visuel

### Reutilisable immediatement

Les 131 fichiers d'icones V2 references existent. Les regroupements suivants
sont visuellement defendables, car ils correspondent a une meme gamme ou a un
boitier de meme nature :
- EPEVER Tracer 10/20/30/40A : une illustration de famille.
- Victron BMV-700/702/712 : un boitier shunt et une illustration ecran separee.
- BougeRV Arch Pro et Yuma flexibles : une illustration flexible de famille,
  mais Arch Pro et Yuma restent deux familles selectionnables.
- Victron BlueSolar 115W et 175W rigides : illustration rigide commune.
- EcoWorthy LiFePO4 100/200Ah : illustration commune **a valider**; les
  dimensions de boitier peuvent differer.
- BougeRV rigide 400W bifacial et 200W ShadePower : illustration rigide
  commune **a valider**, pas une identite de gamme prouvee.

### Non reutilisable ou a corriger

- `maPhoto` est vide sur les 1 106 lignes : V3 n'apporte aucune photo SKU.
- 246 lignes portent `AUCUNE` comme chemin d'icone.
- Trois chemins V3 references n'existent pas dans le projet :
  `/schema-icons/pro/v3-icons/lynx-distributor.webp`,
  `/schema-icons/pro/v3-icons/argofet-2-bat.webp` et la pseudo-valeur
  `AUCUNE`.
- Les chemins V3 restants sont majoritairement des icones d'archetype. Ils
  expliquent le type mais ne distinguent pas une famille ni un boitier.
- Ne jamais regrouper les frigos, radars, VHF, ecrans, relais ou protections
  seulement par categorie. Il faut le meme boitier ou une gamme explicitement
  documentee.
- MultiPlus et MultiPlus-II, Blue Smart IP22 et IP65/IP67, Orion-Tr et Orion XS
  doivent rester des familles visuelles distinctes : boitiers et fonctionnalites
  differentes.

## Architecture cible

```ts
type DataConfidence = "verified" | "review-needed" | "unverified";
type CatalogSource = "v2" | "v3" | "manufacturer" | "manual-review";

type TechnicalModel = {
  id: string;                    // ID canonique stable
  aliases: string[];              // IDs V2/V3 historiques dedupliques
  brand: string;
  componentType: ComponentType;   // uniquement un type supporte par definitions.ts
  familyId: string;
  label: string;
  defaults: Record<string, unknown>; // seulement clefs declarees par le type
  technical: Record<string, unknown>; // donnees brutes normalisees, pas toutes exposees
  documentationUrl?: string;
  sourceClaims: CatalogClaim[];
  status: "active" | "review-needed" | "excluded";
};

type VisualCatalogFamily = {
  id: string;
  brand: string;
  componentType: ComponentType;
  label: string;
  imageSourceModelId?: string;   // un modele dont l'image est approuvee
  imagePath?: string;
  visualConfidence: DataConfidence;
  variants: string[];            // IDs TechnicalModel
};

type CatalogClaim = {
  source: CatalogSource;
  sourceRecordId: string;
  fetchedAt?: string;
  confidence: DataConfidence;
  fields: string[];
  note?: string;
};
```

Parcours UI :
1. L'utilisateur choisit le `componentType` editor.
2. Il voit des cartes de `VisualCatalogFamily` filtrees par ce type.
3. Il choisit une `TechnicalModel` de la famille.
4. L'editeur applique `defaults`, puis propose les champs a completer.
5. Les variantes `review-needed` sont visuellement identifiables et ne
   remplacent jamais les valeurs deja verifiees.

Les profils de connexions ne doivent pas etre une simple donnee de catalogue :
si un produit demande des handles differents, il faut un type editor ou une
variante de definition explicitement geree. Cela protege les calculs et les
regles de validation.

## Familles visuelles a creer en premier

| Famille | Variantes associees | Etat |
|---|---|---|
| Victron SmartSolar MPPT | 75/15, 100/20, 100/30, 100/50, 150/35 | V2 exploitable |
| Victron Orion XS | 12/12-30, 12/12-50, 12/24-17 | V2 exploitable, photo 12/24 a ajouter |
| Victron Orion-Tr Smart | 9A, 18A, 30A | V2 exploitable |
| Victron Blue Smart IP22 | 12/20, 12/30 et variantes V3 revues | V2 de base, enrichissement selectif |
| Victron Blue Smart IP65/IP67 | 12/7, 12/25 et variantes exactes | Famille distincte IP22 |
| Victron MultiPlus | 500/20, 800/35, 1200/50, 1600/70 | V2 de base |
| Victron MultiPlus-II | 12/3000/120-32 et variantes revues | V2 + V3 exact selectif |
| Victron GX | Cerbo, Cerbo MK2, CCGX, Venus, Ekrano | Familles boitier/ecran a distinguer |
| Victron BMV | BMV-700, 702, 712 plus ecran associe | Deux visuels : shunt et ecran |
| EPEVER Tracer | 10/20/30/40A | Une image de famille justifiee |
| BougeRV flexible | Arch Pro 100/200 et Yuma SKU | Deux sous-familles, image flexible partagee |
| Blue Sea 187 breaker | variantes calibrees | Import V3 seulement apres valeurs de calibre |
| Isotherm Cruise | variantes de volume | Nouvelle famille consommateur apres type frigo ou profil consumer |

## Feuille de route

### Phase 1 - Quick wins

1. Ne pas importer les 951 lignes V3.
2. Ajouter une couche de mapping et un registre d'aliases aux 155 modeles V2.
3. Supprimer les doublons exacts V3 de la file d'enrichissement.
4. Reparer ou retirer les trois chemins d'icone V3 manquants; ne jamais rendre
   `AUCUNE` comme une URL.
5. Creer les cartes de familles V2 deja justifiees visuellement.
6. Exposer la provenance et le statut `review-needed` dans l'outil interne,
   sans polluer le choix client.

### Phase 2 - Normalisation

1. Construire une table de staging, jamais branchee directement au picker.
2. Normaliser marque, SKU, tension, intensite, puissance, topologie et URLs.
3. Definir un dedupe deterministe : marque normalisee + SKU fabricant +
   componentType; les rapprochements texte restent en revue humaine.
4. Completer les champs metier critiques depuis sources constructeur.
5. Rattacher chaque modele a une famille visuelle seulement apres validation
   du boitier/image.
6. Promouvoir seulement les variantes ayant defaults et image ou icone valide.

### Phase 3 - Extensions metier

1. Decider les nouveaux types : alternator-regulator, fused-busbar,
   ac-dc-distribution-panel et, si necessaire, frigo DC/electronique marine.
2. Ajouter handles, champs, calculs et regles de securite avant tout catalogue.
3. Implementer les profils de connexion par famille quand ils changent la
   topologie reelle.
4. Ajouter les consommateurs specialises seulement lorsque puissance,
   tension, connecteurs et priorite sont connus.
5. Mettre en place une revue humaine de visuels et des donnees de provenance.

## Decision

Le meilleur resultat pour l'editeur est une **fusion logique**, pas une fusion
de fichiers : V2 est le noyau technique et visuel actuellement operationnel;
V3 est une source de decouverte, de familles candidates et de variantes a
verifier. Cette approche conserve une carte simple par vraie famille visuelle,
evite les 951 faux choix non renseignes et protege les calculs electriques.
