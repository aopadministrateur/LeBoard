# Brief technique : module « Leads » pour Le Board (AOP)

Document à donner à Claude Code pour développer un module de suivi et de répartition des leads dans l'application existante « Le Board ».

---

## Contexte

Le Board est la PWA de planning de l'AOP (Alliance des Opérateurs Professionnels), sur Firebase et GitHub Pages. Elle gère aujourd'hui la planification des chantiers, les rôles d'équipe, les indisponibilités et la détection de conflits entre les six membres fondateurs.

On veut y ajouter un **module Leads** qui couvre l'amont : capturer les prospects issus des salons et des canaux communs AOP, les répartir équitablement entre les six selon une rotation par points, et suivre chaque lead jusqu'à sa signature. Une fois un lead signé, il devient un chantier dans le système existant du Board.

**Avant de coder :** commence par lire le dépôt existant pour reprendre ses conventions (structure Firebase, système d'auth des six membres, composants UI, routing, style). Le module Leads doit s'intégrer visuellement et techniquement au Board, pas vivre à côté.

Les six membres (pour l'auth et la liste déroulante) :

| Membre | Société |
|---|---|
| Florian | POLYDRONES |
| Henri | KGiR Drones |
| Franck | Flight Drone Service |
| Frédéric | W-Drones |
| Yoan | Drone Opérations |
| Thomas | OrizonDrone |

---

## Modèle de données

Collection Firebase `leads`, un document par lead. Champs :

| Champ | Type | Rôle |
|---|---|---|
| `id` | string | Identifiant (ex. `L001`). Réutiliser la convention d'ID du Board si elle existe. |
| `contact` | string | Nom du contact |
| `societe` | string | Société du prospect |
| `telephone` | string | |
| `email` | string | Sert aussi de clé de dédoublonnage à l'import |
| `besoin` | string | Type de chantier / besoin exprimé |
| `zone` | string | Zone géographique (peut être vide) |
| `saisiPar` | string | Qui a rapporté le lead au salon |
| `notes` | string | |
| `type` | enum | `Lead client` ou `Société utile` (fournisseur/partenaire, hors rotation) |
| `membre` | string | Membre attribué (un des six, ou vide) |
| `statut` | enum | `Nouveau`, `Attribué`, `En cours`, `Signé`, `Perdu` (et `Contact` pour les sociétés utiles) |
| `valeur` | enum | `Petit`, `Moyen`, `Gros` ou vide |
| `mode` | enum | `Seul` ou `Groupement` ou vide |
| `source` | string | Salon ou canal d'origine (ex. `SEPEM Toulouse 2026`) |
| `montant` | number | Montant réel du chantier, rempli à la signature (sert au recalage de valeur) |
| `chantierId` | string | Référence vers le chantier créé dans Le Board une fois signé |
| `dateCreation` | timestamp | |
| `dateSignature` | timestamp | Rempli au passage en `Signé` (sert au calcul « 12 mois glissants ») |
| `participants` | array | Pour un mode `Groupement` : liste `{membre, prorata}` des sociétés qui interviennent |

Les données de départ (23 documents, dont les 22 leads du salon SEPEM déjà classés + 1 société utile) sont fournies dans `leads-seed.json`, à importer tel quel comme état initial de la collection.

---

## La logique de rotation (le cœur du module)

C'est le système de répartition validé par le collège AOP. Il doit être implémenté fidèlement.

**Pondération des leads.** Chaque lead a une valeur : Petit = 1 point, Moyen = 2 points, Gros = 3 points.

**Compteur par membre.** Pour chaque membre, on somme les points des leads qui lui sont attribués **et qui sont signés**, sur les **12 mois glissants** (basé sur `dateSignature`). Un lead non signé ne compte pas encore : c'est le comptage à la conversion.

**Suggestion du prochain.** Le prochain lead est suggéré au membre au compteur le plus bas. En cas d'égalité, ordre stable (par exemple ordre de la liste des membres). Important : l'outil **suggère**, il n'impose pas. L'attribution reste manuelle, pour tenir compte de la disponibilité réelle et de la capacité technique, que le code ne connaît pas.

**Plafond d'écart.** Si un membre dépasse de +3 points le compteur le plus bas, il est signalé comme « en plafond » et passe momentanément en fin de rotation (il n'est plus suggéré tant qu'il est au plafond).

**Alerte de rééquilibrage.** Si l'écart de points entre le plus haut et le plus bas dépasse 30 %, afficher une alerte « à rééquilibrer en AG ».

**Recalage à la conversion.** Au passage en `Signé`, on saisit le `montant` réel. La valeur en points peut alors être ajustée sur ce montant réel plutôt que sur l'estimation initiale. Prévoir soit un ajustement manuel de `valeur`, soit un barème montant → valeur configurable.

**Échange volontaire.** Deux membres peuvent s'échanger un lead (par exemple pour une raison de proximité géographique), à valeur équivalente. Prévoir une action « réattribuer » simple.

**Cas des petits chantiers faisables seuls.** Un lead `Petit` en mode `Seul` peut être attribué directement au membre le plus proche géographiquement plutôt que par la rotation, car l'enjeu financier est faible. Il compte quand même dans le compteur (1 point). Ce comportement peut être une suggestion basée sur `zone`, pas une automatisation stricte.

---

## Lien lead → chantier

Quand un lead passe en `Signé` :

- proposer de **créer (ou lier) un chantier** dans le système existant du Board ;
- le **maître d'œuvre** du chantier est le `membre` attribué ;
- si `mode` = `Groupement`, permettre d'ajouter les autres membres participants (`participants`), avec leur prorata ;
- stocker la référence croisée (`chantierId` côté lead, et l'inverse côté chantier si pertinent), pour ne pas ressaisir les infos.

C'est le point de jonction entre le module Leads (amont) et le module Chantiers (aval) du Board.

---

## Interface

Le module doit exposer, en cohérence avec le reste du Board :

**Vue Leads** (principale). Un tableau filtrable et triable : contact/société, besoin, zone, statut, membre, valeur, mode, coordonnées. Édition en ligne des champs statut, membre, valeur, mode. Recherche plein texte. Filtres par statut, membre, valeur. Les sociétés utiles sont visuellement distinctes et hors rotation.

**Tableau de bord Rotation.** Une carte par membre : points signés, nombre de leads attribués et en cours, barre de progression, marquage du « prochain » suggéré, signalement du plafond. Les alertes plafond et écart 30 % s'affichent automatiquement.

**Répartition.** Deux visuels simples : leads par membre, et répartition par valeur (Petit/Moyen/Gros).

**Ajout et import.** Un formulaire d'ajout manuel d'un lead (pour les prochains salons). Un import CSV depuis l'export du formulaire Google (colonnes du fichier SEPEM), avec dédoublonnage sur l'email et fusion des champs.

**Indicateurs clés.** En tête : nombre de leads clients, attribués, signés, taux de conversion.

---

## Permissions

Les six membres, authentifiés, peuvent tous consulter et modifier les leads (attribution, statut, valeur). Reprendre le système d'auth existant du Board. Un utilisateur non authentifié n'a pas accès.

---

## Barème de valeur (référence pour classer un lead)

- **Petit (1 pt)** : chantier ponctuel, faisable en une intervention par une seule société (petite façade, inspection simple).
- **Moyen (2 pts)** : chantier avec plus d'ampleur ou plusieurs prestations, mais faisable seul (toiture complète, bâtiment de taille moyenne).
- **Gros (3 pts)** : site industriel, grand groupe, collectivité, multi-bâtiments, contrat récurrent, ou tout ce qui n'est pas faisable seul, donc en groupement.

---

## Hors périmètre du module (important)

L'argent ne transite jamais par l'AOP. Le module **ne gère aucun flux financier** : ni facturation, ni commission, ni redistribution. Le remboursement des salons et le partage des revenus de groupement se règlent hors outil, par convention directe entre les sociétés. Le module peut au plus stocker un `montant` de chantier à titre indicatif (pour le recalage de valeur et le suivi), jamais orchestrer un paiement.

---

## Critères de recette

- [ ] La collection `leads` est initialisée à partir de `leads-seed.json` (23 documents).
- [ ] Les six membres authentifiés peuvent lire et modifier ; les modifs sont visibles par tous en temps réel.
- [ ] Les compteurs de points se calculent sur les leads signés, 12 mois glissants, et se mettent à jour à chaque changement.
- [ ] Le « prochain » suggéré est le compteur le plus bas ; le plafond +3 et l'alerte 30 % fonctionnent.
- [ ] L'attribution reste manuelle (suggestion, pas automatisation).
- [ ] Le passage en `Signé` propose la création/liaison d'un chantier dans Le Board.
- [ ] Le mode `Groupement` gère une liste de participants avec prorata.
- [ ] Ajout manuel d'un lead et import CSV avec dédoublonnage sur email fonctionnent.
- [ ] Le module reprend le style, l'auth et les conventions du Board existant.
- [ ] Aucun flux financier n'est géré par l'outil.

---

## Ressource de référence

Une maquette fonctionnelle complète existe déjà (fichier `aop-leads.html`) : elle implémente la table, la rotation en points, les compteurs, les alertes et la distinction seul/groupement, sur une base de données partagée. Sa logique JavaScript est directement réutilisable comme référence pour le calcul de rotation et le rendu. À adapter à la stack du Board (Firebase + framework du dépôt).
