# Prompts V3 - Installations de reference

Ces prompts sont des configurations de reference. Les longueurs, fusibles et sections
sont des valeurs de schema a recalculer avant un montage reel selon notices, pose,
temperature, longueur aller-retour et norme applicable.

## Regles communes

- Conserver les zones : SOURCES EXTERNES jaune, STOCKAGE ET PROTECTION DC bleu,
  CONVERSION ET CHARGE orange, DISTRIBUTION ET USAGES DC vert, RESEAU AC 230 V
  rouge, CONTROLE ET DONNEES gris.
- Agrandir uniquement les zones necessaires, avec 120 px de marge. Energie de
  gauche a droite. Ne pas dupliquer un appareil pour l'implantation : renseigner
  son champ emplacement physique et ajouter les chemins de cable.
- Etiqueter toute liaison : ID, tension, longueur, section, protection et fonction.
  Tracer les retours DC. Tous les retours mesures arrivent cote LOAD du shunt.
- Ajouter un cartouche HYPOTHESES A VALIDER pour les longueurs et references a
  confirmer. Les cables de donnees sont pointilles et distincts de la puissance.

## 1. Voilier 10 m - Refit complet Volvo Penta D2-60

```text
Creer le graphe "Voilier 10 m - Refit complet D2-60". Voilier 12 V DC et 230 V
AC, moteur Volvo Penta D2-60, parc lithium Victron, batterie moteur AGM,
batterie guindeau AGM, sanitaires et pompes de cale.

STOCKAGE : BAT-S1/BAT-S2 = 2 x Victron Lithium NG 12.8 V 200 Ah en parallele,
chacune MEGA 200 A, 50 mm2, 1 m; BMS-1 = Lynx Smart BMS NG 500 A; DIST-1 et
DIST-2 = 2 x Lynx Distributor. BAT-M = AGM demarrage 12 V 100 Ah >=900 CCA;
MON-M = BMV-712 Smart + shunt 500 A, mesure/alarme uniquement, jamais coupure.
BAT-G = AGM 12 V 100 Ah au coffre avant; MON-G = SmartShunt 500 A.

SOURCES/CHARGE : PV-1/PV-2 = 2 x Victron Mono 215 W/24 V en serie, PV 4 mm2,
12 m, sectionneur 15 A; MPPT-1 = SmartSolar 150/60, sortie 80 A, 25 mm2.
QUAI-1 = CEE 230 V/16 A -> VDI-16 galvanic isolator -> tableau AC. ALT-1 =
alternateur D2-60 115 A -> BAT-M uniquement. DCDC-1 = Orion XS 12/12-50,
regle 40 A, MEGA 60 A, 16 mm2, 3 m, commande moteur tournant. INV-1 =
MultiPlus 12/3000/120-16, MEGA 400 A, 70 mm2, 2 m. DCDC-2 = Orion-Tr Smart
12/12-30, service -> BAT-G, fusibles 40 A, 10 mm2, 8 m.

AC : MultiPlus -> differentiel bipolaire 30 mA -> prises cabine 10 A, cuisine
10 A, chauffe-eau 10 A. Ne pas ajouter un autre chargeur secteur servitude.
CHAU-1 est delestable.

DC : TAB-DC pour frigo, LED, eau douce, VHF ASN, GPS/traceur, sondeur, AIS,
pilote, feux et USB-C. POM-AV = pompe cale avant, 10 A, 2.5 mm2, 8 m,
flotteur auto + manuel, permanente et hors delestage. POM-AR = pompe cale
moteur, 10 A, 2.5 mm2, 6 m, hors delestage. ALM-AV/AR = alarmes haut niveau.
WC-1 = WC 12 V, 25 A, 6 mm2, 7 m; MAC-1 = macerateur cuve noire 80 L, 40 A,
10 mm2, 5 m; tous deux priorite basse. GIND-1 = guindeau 1000-1500 W depuis
BAT-G, disjoncteur 200 A, contacteur, 50 mm2, 2 m.

CONTROLE : Cerbo GX + GX Touch 50. Lynx en VE.Can, MultiPlus VE.Bus,
MPPT/Orion/BMV/SmartShunt VE.Direct, sortie VE.Can vers NMEA 2000 et interface
Volvo si compatible. Delestage : MultiPlus/chauffe-eau, puis WC/macerateur;
pompes jamais delestees. Implantation : PV portique/bimini, controle cabine,
coffre technique sec pres moteur, BAT-M compartiment moteur, BAT-G avant.
```

## 2. Mercedes Vito Marco Polo - 280 Ah compact

```text
Creer "Vito Marco Polo - 280 Ah Victron". L'installation auxiliaire est
independante du reseau Mercedes : ne pas modifier calculateurs, toit, faisceau
ou batterie moteur.

BAT-1 = Eco-Worthy EnergyRock LiFePO4 12 V 280 Ah, BMS 200 A, coffre ventile;
MEGA 200 A, coupe-batterie. SHUNT-1 = SmartShunt 500 A; barres DC compactes,
un seul lien chassis cote LOAD. PV-1 = panneau leger 175-200 W sur toit
relevable -> MPPT SmartSolar 100/30, PV 6 mm2/6 m/15 A, sortie 10 mm2/40 A.
DCDC-1 = Orion XS 12/12-50 regle 30-40 A, D+, fusibles 60 A, 16 mm2, 4 m,
sans parallele direct batterie Mercedes. QUAI-1 = CEE 16 A -> RCD 30 mA ->
disjoncteur 10 A. INV-1 = MultiPlus Compact 12/1200/50, 150 A, 35 mm2, 1.5 m,
unique chargeur quai.

TAB-DC : frigo compresseur, LED, pompe, USB-C, chauffage stationnaire, prises
12 V. BP-1 = Smart BatteryProtect 220 A pour confort; commande distante
MultiPlus coupee avant seuil BMS. TAB-AC : RCD 30 mA et prises 230 V.
GX-1 = Cerbo GX + GX Touch 50 : SmartShunt, MPPT, Orion, MultiPlus. Ajouter
jauge eau propre 0-180 ohm et jauge eaux grises 0-180 ohm, en litres avec
alarmes. Implantation : batterie/SmartShunt/barres/Cerbo coffre technique,
MultiPlus ventile, Touch dans meuble, MPPT pres batterie.
```

## 3. Camping-car 7 m - DS300, lithium et clim 12 V

```text
Creer "Camping-car 7 m - DS300 lithium clim". Ancien ensemble : DS300,
PC100/PC160, CB516-3 16 A et batterie acide 100 Ah. Conserver DS300/panneau
pour distribution cellule, frigo AES, marchepied et jauges. Afficher CB516-3
en "DEPOSE - NE PLUS RACCORDER" : 230 V, sortie B2 et cables isoles.
Neutraliser le parallele B1/B2 via R37 sur DS300 recent; B1 reste information
et D+. Deconnecter ancien regulateur solaire.

BAT-1 = Eco-Worthy LiFePO4 12 V 280 Ah BMS 200 A, MEGA 200 A, coupe-batterie,
SmartShunt 500 A et barres DC. DS300 B2 = barre + -> fusible 50 A -> B2;
negatif DS300 cote LOAD du shunt, un seul lien chassis cote LOAD. DCDC-1 =
Orion XS 12/12-50 limite 30 A, fusibles 40 A, 10 mm2, 5 m, D+. PV-1/PV-2 =
2 x 200 W serie -> SmartSolar 100/30, 6 mm2/8 m/15 A, sortie 40 A/10 mm2.
INV-1 = MultiPlus Compact 12/1200/50, 150 A, 35 mm2, 1.5 m, chargeur secteur
unique. CLIM-1 = Mestic RTA-2000 12 V, direct barre DC, fusible 100 A,
BatteryProtect 100 A, coupe-circuit, 25 mm2, 4 m; jamais via DS300/MultiPlus.

CCGX-1 = Color Control GX (pas Cerbo ni GX Touch) : MultiPlus VE.Bus,
SmartShunt et MPPT VE.Direct, Orion via VE.Direct-vers-USB. Conserver les
jauges sur panneau CBE. Delestage : MultiPlus puis clim avant BMS. Montrer
implantation : DS300 existant, CCGX tableau cellule, technique ventile,
solaire/clim toit et liaison moteur.
```

## 4. Petit yacht 8 m - Flybridge, installation 12 V simple

```text
Creer "Yacht 8 m - 12 V simple flybridge". Pas d'onduleur, pas de MultiPlus.
PV-1 = Victron Mono 215 W/24 V sur flybridge -> 4 mm2, 10 m, passe-toit,
sectionneur 10 A -> MPPT SmartSolar 100/20, sortie 30 A/6 mm2/1.5 m.
BAT-1 = Eco-Worthy LiFePO4 12 V 100 Ah BMS, coffre sec ventile contre cloison
moteur, jamais dans cale; fusible principal 100 A et coupe-batterie.
SHUNT-1 = SmartShunt 300 A. QUAI-1 = CEE 16 A -> RCD 30 mA -> prise interne
-> Blue Smart IP22 12/15, unique chargeur quai, sortie 20 A/6 mm2.
TAB-DC : frigo, LED, pompe eau, douchette, GPS/sondeur, VHF, feux, USB.
POM-1 = cale auto, 10 A, 2.5 mm2, flotteur + manuel, hors coupure confort;
ALM-1 haut niveau. Batterie moteur separee sans couplage direct.
Implantation : PV flybridge, MPPT cabine, batterie/shunt coffre sec, tableau
cabine. Etiqueter le trajet flybridge -> MPPT -> batterie.
```

## 5. VW T6 - AFERIY P280, DC060 et solaire

```text
Creer "VW T6 - AFERIY P280 tout-en-un". P280-1 est le seul stockage, onduleur,
chargeur et monitoring : ne pas ajouter batterie auxiliaire, MultiPlus ou MPPT
Victron. Installer P280 a l'arriere droit sur support rigide, ventilation libre.

BAT-M T6 -> MEGA 60 A -> coupe-circuit -> 16 mm2/3 m -> DCDC-1 AFERIY DC060,
commande D+; DC060 -> entree XT90 N°2 P280. PV-1/PV-2 = 2 x 200 W toit en
serie, Voc serie <=55 V a froid, MC4 4 mm2/6 m/sectionneur 15 A -> XT90 N°1.
QUAI-1 = CEE 16 A -> RCD 30 mA -> disjoncteur 10 A -> prise interne dediee ->
chargeur AFERIY d'origine -> P280, sans chargeur externe intercale.

DC-OUT = XT60 P280 12 V/25 A -> fusible tableau 25 A -> 6 mm2/2 m -> mini
tableau frigo, LED, pompe, USB-C, ventilateur et prises 12 V; WATT-1 entre
XT60 et tableau. AC-OUT P280 : prises d'appareils branches directement, aucun
tableau AC fixe sans etude terre/neutre. Monitoring ecran/application P280 et
WATT-1, pas de Cerbo/CCGX. Montrer les trois sources : quai, DC060 XT90-2,
solaire XT90-1.
```

## 6. Atelier mobile - Fiat Ducato L3H2, 230 V professionnel

```text
Creer "Atelier mobile - Ducato L3H2 230 V". Usage : chargeurs d'outillage,
compresseur ponctuel, LED et prises securisees. Interdire poste a souder,
chauffage resistance et outils >3000 W.

BAT-1/BAT-2 = 2 x Eco-Worthy LiFePO4 12 V 280 Ah en parallele, chacune MEGA
200 A/50 mm2/1 m; principal 400 A, coupe-batterie, SmartShunt 500 A, barres DC.
DCDC-1 = Orion XS 12/12-50, fusibles 60 A, 16 mm2/5 m, D+. PV-1/PV-2 =
2 x Victron 305 W -> MPPT 150/60, PV 6 mm2/8 m/20 A, sortie 80 A/25 mm2.
QUAI-1 CEE 16 A -> RCD 30 mA/disjoncteur 16 A. INV-1 MultiPlus 12/3000/120-16,
MEGA 400 A, 70 mm2/2 m -> tableau AC : prises etabli 16 A, chargeurs 10 A,
LED AC 6 A. TAB-DC : LED atelier, extracteur, pompe, USB-C, prises 12 V.
Ajouter arret urgence rouge : coupe onduleur/prises atelier mais conserve LED
securite. Cerbo GX + GX Touch 50, delestage onduleur a 25% SOC. Implantation :
batteries soute basse, Multi/MPPT cloison ventilee, tableau au-dessus etabli,
Touch pres porte laterale, PV toit.
```

## 7. Bateau de peche hors-bord 6,5 m - Trolling 24 V

```text
Creer "Bateau de peche 6,5 m - hors-bord et trolling 24 V". Separer sans
ambiguite demarrage, servitude et propulsion trolling. BAT-M = AGM 12 V 100 Ah
>=900 CCA pour hors-bord 150 hp, alternateur et coupe-batterie constructeur.
BAT-S = Eco-Worthy LiFePO4 12 V 100 Ah, fusible 100 A, SmartShunt 300 A.
BAT-T1/BAT-T2 = 2 x LiFePO4 12 V 100 Ah serie pour trolling 24 V, SmartShunt
500 A 24 V, coupe-batterie et disjoncteur suivant moteur. Interdire toute prise
12 V sur point milieu.

DCDC-1 Orion XS 12/12-50, BAT-M -> BAT-S, regle 30 A, 40 A, 10 mm2/3 m, D+.
PV-1 Victron Mono 215 W/24 V sur T-top -> MPPT 100/20 -> BAT-S, 4 mm2/5 m,
sectionneur 10 A. QUAI-1 CEE 16 A/RCD 30 mA; Blue Smart IP22 12/15 BAT-S et
Blue Smart IP22 24/16 banc trolling, sorties independantes. TAB-DC : VHF ASN,
GPS/traceur, sondeur, AIS si present, feux, LED pont, aerateur vivier, lavage,
USB et glaciere. POM-1 = cale auto 10 A/2.5 mm2/flotteur+manuel, hors
delestage; ALM-1 niveau haut. GIND-1 guindeau 700-1000 W = noeud A VALIDER,
ne pas raccorder arbitrairement au parc lithium.

Cerbo GX + GX Touch 50 : deux SmartShunt, MPPT, Orion et chargeurs; afficher
SOC servitude et trolling distincts, BAT-M en tension seulement. Implantation :
moteur/servitude arriere sec, trolling avant, electronique poste, PV T-top,
pompe en cale.
```

## Controle final

Verifier dans chaque graphe : aucun chargeur en parallele d'un MultiPlus; aucun
gros consommateur via DS300 ou XT60; aucun retour qui contourne un shunt; aucune
pompe de cale delestee; aucun parallele direct moteur/lithium; chaque appareil
a fusible, coupe maintenance et emplacement physique.
