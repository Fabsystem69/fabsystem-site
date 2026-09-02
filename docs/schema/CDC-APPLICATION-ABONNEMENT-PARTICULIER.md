# Cahier des charges - Application FabSystem Van

## 1. Statut et decision produit

- Date : 2026-09-01
- Statut : cadrage produit et marketing, non implemente
- Cible : particulier qui amenage lui-meme un van, fourgon ou camping-car
- Modele vise : petite application par abonnement mensuel, sans vente de materiel

Ce document ne modifie pas le perimetre du MVP commerce actuel. Celui-ci ne
comprend pas encore les abonnements. Il fixe le produit a tester lorsque la
fondation commerce et l'espace client seront stabilises.

## 2. Probleme a resoudre

Un particulier ne paie pas durablement pour dessiner un schema. Un van courant
comporte souvent trois ou quatre consommateurs : une limite de consommateurs
ne correspond donc pas a une complexite reelle et ne doit pas servir de
paywall.

Le besoin payant potentiel est different : pendant plusieurs semaines, la
personne doit comprendre son installation, memoriser ce qu'elle a monte,
retrouver les references, suivre les etapes et pouvoir modifier son van sans
repartir de zero. L'application doit devenir la memoire fiable de son
installation reelle, pas un simple generateur de schema.

## 3. Positionnement

### Promesse

> FabSystem Van garde votre installation electrique claire, documentee et a
> jour, de la premiere idee aux evolutions de votre van.

### Ce que le produit ne promet pas

- Il ne certifie pas une installation, une conformite VASP/RTI ou une securite
  physique.
- Il ne remplace ni les notices constructeurs, ni les mesures sur le vehicule,
  ni un professionnel lorsque la situation le requiert.
- Il ne vend pas et ne recommande pas un materiel en fonction d'une commission.
- Il ne se presente pas comme une alternative magique a l'apprentissage ou a
  la verification sur le terrain.

### Difference face a une IA generaliste

Une IA peut repondre a une question isolee. FabSystem doit conserver le
contexte du projet : composants reels, connexions, photos, documents,
modifications et controles deja effectues. Sa valeur est la continuite, la
tracabilite et une methode adaptee a l'installation du client.

## 4. Public prioritaire

### Persona primaire : bricoleur autonome mais prudent

- Amenage son premier ou second van pour ses loisirs.
- Dispose d'un budget contraint et compare les prix.
- A besoin d'explications simples, sans jargon ni pression commerciale.
- Travaille par petites sessions sur plusieurs semaines ou mois.
- Veut pouvoir retrouver son montage lors d'une panne, d'une vente ou d'une
  evolution.

### Persona secondaire : bricoleur deja equipe

- A fini son installation et veut un dossier clair pour l'entretenir ou la
  transmettre.
- Peut revenir pour ajouter du solaire, un convertisseur ou un consommateur.

Le professionnel est explicitement hors cible de cette premiere offre. Il fera
l'objet d'un produit et d'un abonnement distincts, sans retirer de valeur au
particulier.

## 5. Offre et regles commerciales

### Offre unique de lancement

| Element | Proposition de lancement |
| --- | --- |
| Nom de travail | FabSystem Van |
| Prix a tester | 4,99 EUR TTC / mois |
| Engagement | Aucun, resiliable a tout moment |
| Essai | 7 jours sans carte bancaire ou 14 jours avec carte selon test |
| Annuel | Pas au lancement |
| Apres resiliation | Consultation et export des donnees conservees ; creation, edition, rappels et nouveaux controles suspendus |

Le produit ne doit pas faire croire qu'un particulier devra payer toute sa vie.
Il peut s'abonner le temps de son projet puis partir sans perdre son travail.
Une retention faible apres l'amenagement est acceptable si le cout d'acquisition
et le revenu par projet restent sains.

### Gratuit : decouverte utile, pas version frustree

Le gratuit permet :

- consulter des exemples et comprendre la methode ;
- creer un brouillon de projet ;
- essayer le parcours guide et l'editeur ;
- realiser un schema realiste sans limite artificielle de consommateurs ;
- voir les alertes de securite essentielles ;
- exporter un apercu simple du schema.

Le passage a l'abonnement intervient lorsque l'utilisateur veut faire de son
schema un dossier vivant : le conserver, le faire evoluer, documenter le
montage et suivre son projet dans le temps.

### Abonnement : valeur active

L'abonnement donne acces a :

- projets sauvegardes durablement et modification complete ;
- parcours guide personnalise selon les choix du projet ;
- controles intelligents, historique et actions a traiter ;
- journal de montage avec photos, notes et dates ;
- coffre de documents : notices, references, factures et garanties ;
- checklist de chantier et de verification physique ;
- fiches par composant et circuit : emplacement, fonction et reperes ;
- rappels configurables d'entretien et de verification ;
- historique des changements et version precedente du schema ;
- export complet de son dossier personnel.

## 6. MVP produit a construire

Le MVP doit prouver qu'un particulier accepte de payer pour garder son projet
organise pendant la realisation de son van. Il ne doit pas essayer de couvrir
toute la maintenance vehicule ou une procedure VASP complete.

### Fonctionnalites MVP

1. Un projet van avec profil electrique, schema et statut de progression.
2. Un parcours guide : besoins, batterie, recharge, distribution, schema,
   montage et verification.
3. Un journal de montage par element : note, photo, date, emplacement et
   statut « a faire / installe / a verifier ».
4. Un coffre de documents rattache a un composant ou au projet.
5. Une checklist generee a partir du projet, editable par l'utilisateur.
6. Un ecran « mon installation aujourd'hui » : schema, dernieres
   modifications, alertes et prochaine action.
7. Une gestion d'abonnement, une resiliation simple et un acces lecture seule
   apres resiliation.

### Hors MVP

- Vente, panier ou affiliation de materiel.
- Place de marche de professionnels ou mise en relation payante.
- Certification, signature, validation humaine incluse ou promesse VASP.
- Collaboration equipe, multi-utilisateur et white label.
- Application mobile native ; le web mobile doit etre excellent avant tout.
- IA conversationnelle payante. Elle pourra etre evaluee plus tard si elle
  apporte une aide contextualisee et fiable.

## 7. Parcours utilisateur et points de conversion

### 1. Page marketing

Objectif : faire comprendre que FabSystem n'est pas un outil de dessin de plus.

Structure :

```text
Titre : « Votre installation electrique, claire aujourd'hui et demain. »
Sous-titre : « Concevez, documentez et retrouvez votre installation de van. »
Preuve visuelle : schema -> journal de montage -> fiche composant -> checklist
CTA principal : « Essayer sur mon projet »
Reassurance : « Sans engagement. Vos donnees restent consultables si vous arretez. »
```

Ne pas ouvrir avec le prix. Montrer d'abord le probleme concret : apres deux
mois de chantier, on oublie pourquoi un fusible a ete choisi et ou passe un
cable.

### 2. Premiere session gratuite

Objectif : obtenir un premier resultat utile avant l'inscription ou juste apres.

```text
« Quel est votre projet ? »
Van / Fourgon / Camping-car
12 V / Je ne sais pas encore
Ce que je veux alimenter
        ↓
Premier schema et etapes recommandees
        ↓
« Votre projet est enregistre localement. Creez un compte pour le retrouver. »
```

Ne jamais demander carte bancaire avant que l'utilisateur ait vu son propre
schema ou sa propre feuille de route.

### 3. Moment de paywall

Le paywall apparait sur une intention positive, jamais apres une erreur ni au
milieu d'une action de securite :

- sauvegarder le projet dans l'espace personnel ;
- ajouter la premiere photo ou notice ;
- activer la checklist de montage ;
- demander le suivi des changements et des alertes.

Exemple :

> Votre schema est lance. Avec FabSystem Van, gardez aussi les photos,
> references et etapes de montage au meme endroit.

Boutons : `Commencer l'essai gratuit` et `Continuer avec le brouillon`.

### 4. Pendant l'abonnement

L'accueil doit toujours repondre a une question : « que dois-je faire
maintenant ? »

```text
Mon van : 62 % prepare
Prochaine action : verifier la protection du circuit frigo
Derniere modification : batterie ajoutee hier
Raccourcis : Schema | Journal | Checklist | Documents
```

### 5. Resiliation

La resiliation est accessible depuis le compte sans obligation de contacter le
support. Avant confirmation, expliquer factuellement :

```text
Vous gardez : consultation, export et vos documents jusqu'a la fin de la periode.
Vous perdez ensuite : edition, nouveaux controles, rappels et nouveaux projets.
```

Proposer une raison de resiliation facultative, une seule question, sans
culpabilisation ni labyrinthe de boutons.

## 8. Exigences de confiance

### Transparence produit

- Afficher le prix TTC, la periodicite et l'absence d'engagement avant le
  paiement.
- Rappeler la date de renouvellement dans l'espace compte et avant chaque
  renouvellement si la loi ou le contexte l'exige.
- Expliquer les limites de chaque controle : « aucune incoherence detectee »
  n'est jamais « installation conforme ».
- Distinguer clairement une donnee saisie, une recommandation calculee et une
  information manquante.
- Ne jamais inventer une valeur technique pour terminer un parcours.

### Respect des donnees

- Les photos, notices et notes restent la propriete du client.
- L'utilisateur peut exporter ses donnees dans un format utilisable.
- Politique de conservation et suppression lisible avant mise en production.
- Aucune revente de donnees de projet, aucune publicite ciblee basee sur les
  composants declares.

### Ton et contenu marketing

- Employer « vous aider a organiser » et « vous guider ».
- Eviter « installation certifiee », « 100 % conforme », « sans risque » ou
  toute pression fondee sur la peur.
- Montrer de vrais ecrans et de vrais cas d'usage, pas des promesses vagues.
- Afficher des temoignages uniquement s'ils sont authentifiables et autorises.

## 9. Acquisition marketing

### Canaux prioritaires

1. SEO sur les problemes concrets : bilan de consommation van, batterie,
   section de cable, schema 12 V, ajout solaire, depannage simple.
2. Contenu court demonstratif : une question pratique, une reponse, puis le
   resultat conserve dans un projet FabSystem.
3. Communautes vanlife : repondre utilement sans spamer un lien commercial.
4. Email d'activation, uniquement apres creation de projet ou consentement.

### Messages a tester

- « Ne perdez plus le fil de votre installation. »
- « Le schema est le debut : gardez aussi ce que vous avez vraiment monte. »
- « Retrouvez un fusible, une reference ou une photo, meme six mois plus tard. »
- « Votre projet reste accessible, meme si vous arretez l'abonnement. »

### Emails d'activation

| Declencheur | Objet / intention |
| --- | --- |
| Projet cree sans schema termine | « Reprenez votre installation la ou vous l'avez laissee » |
| Schema termine, journal vide | « Votre schema est pret : notez maintenant ce que vous montez » |
| Essai J+5 sans photo ni document | « Gardez les references qui comptent pour votre van » |
| Essai J+6 | « Votre essai se termine demain, sans perte de vos donnees » |

Maximum : trois emails pendant l'essai, sauf action explicite de l'utilisateur.

## 10. Mesure de la validation

### Evenements produits a instrumenter

- `project_started`
- `first_schema_saved`
- `first_component_documented`
- `first_photo_added`
- `checklist_opened`
- `trial_started`
- `subscription_started`
- `subscription_cancelled`
- `project_exported_after_cancellation`

### Indicateurs de decision

| Question | Indicateur initial |
| --- | --- |
| Le produit apporte-t-il un aha moment ? | part des projets qui atteignent schema + une action de journal |
| Le journal apporte-t-il une valeur percue ? | part des utilisateurs qui ajoutent une photo ou une note dans les 7 jours |
| Le prix est-il acceptable ? | conversion essai -> abonnement et annulation avant J+30 |
| Le produit tient-il pendant le chantier ? | nombre de semaines actives par abonne | 
| L'abonnement est-il honnete ? | motifs de resiliation et taux de reactivation |

Les seuils cibles doivent etre fixes apres une premiere cohorte de test. Ne
pas conclure sur quelques inscriptions organiques isolees.

## 11. Experiments prioritaires

1. Prix : 3,99 EUR vs 4,99 EUR vs 5,99 EUR / mois.
2. Essai : 7 jours sans carte vs 14 jours avec carte.
3. Promesse : « carnet de bord de mon installation » vs « projet electrique
   toujours a jour ».
4. Moment du paywall : premiere sauvegarde cloud vs premiere photo/document.
5. Retention : accueil centre sur la prochaine action vs accueil centre sur le
   schema.

Une seule variable majeure par test. Conserver une proposition de valeur
constante pendant la mesure du prix.

## 12. Criteres d'acceptation avant lancement

- Un visiteur comprend en moins de 30 secondes qu'il s'agit d'une application
  de suivi de projet, pas d'un vendeur de materiel.
- Il peut commencer un schema utile avant la demande de paiement.
- Le prix, le renouvellement et la resiliation sont comprehensibles avant
  Checkout.
- Aucune limite artificielle ne bloque un petit schema de van complet.
- Une resiliation laisse un acces lecture seule et un export des donnees.
- Les limitations techniques et de securite sont visibles pres des controles,
  pas cachees dans les conditions generales.
- Le parcours est utilisable sur mobile a 375 px de large.
- Les evenements de mesure definis en section 10 sont testes avant ouverture
  au public.

## 13. Etapes de delivery

### Phase 0 - Validation sans abonnement

Construire dans l'espace projet existant le journal, la checklist et l'ecran
« prochaine action ». Mesurer leur utilisation aupres des utilisateurs ayant
deja cree un schema. Cette phase prouve la valeur sans toucher au paiement.

### Phase 1 - Beta abonnee limitee

Activer Stripe Billing uniquement pour une cohorte volontaire. Prix unique,
pas de plan annuel, pas de codes promotionnels complexes. Recueillir les
motifs de paiement et de resiliation.

### Phase 2 - Lancement public

Ouvrir l'essai, la page marketing et les emails seulement si la beta confirme
que journal + checklist sont utilises pendant plusieurs sessions.

### Phase 3 - Produit Pro distinct

Repartir de besoins verifies d'installateurs. Ne pas convertir les limites de
l'offre particulier en faux forfait Pro. Les fonctions Pro devront etre liees a
la repetition de projets clients, aux dossiers et au temps gagne.

## 14. Decision demandee avant implementation

Avant toute implementation d'abonnement, valider ces trois points :

1. Le nom de l'offre : `FabSystem Van` est un nom de travail.
2. Le prix beta : recommandation `4,99 EUR TTC / mois`.
3. La valeur MVP : journal de montage, documents, checklist et accueil
   « prochaine action », avant toute fonctionnalite IA ou VASP avancee.
