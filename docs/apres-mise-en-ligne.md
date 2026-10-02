# Après la mise en ligne

Points notés pendant la refonte UI v4, volontairement laissés pour après la mise en ligne. Aucun n'est codé.

## À faire

- **`firebase-messaging-sw.js`** : fichier gardé dans le dépôt. `index.html` ne l'enregistre plus, donc aucune notification push n'est active ; mais il peut rester installé sur des appareils ayant utilisé d'anciennes versions, et le supprimer les laisserait dans un état incertain. À trancher.
- **Bouton « Ajouter à mon agenda »** par chantier : lien Google Agenda prérempli (nom, dates, adresse). Remplace l'ancienne fausse synchronisation Google, retirée pendant la refonte.
- **Clés locales `lb_msg`** : plus écrites depuis la suppression de la messagerie, mais encore présentes sur certains appareils. Sans effet ; à nettoyer.
- **Un document par indispo, avec des droits par personne** : aujourd'hui, toutes les indispos sont dans un seul document (`indispo/data`) que tout membre peut modifier, y compris les indispos des autres. Les écrasements sont déjà évités (écriture conditionnelle), mais les règles Firestore ne peuvent pas limiter chacun à ses propres indispos. À prévoir : schéma `indispo/{id}` avec le membre, règles par personne, reprise des données existantes, lecture limitée aux indispos à venir (quota de lectures). Droits décidés : un référent peut créer et supprimer les indispos de tout le monde, un collaborateur seulement les siennes.
- **Types de chantier enregistrés en base** : aujourd'hui, un type ajouté n'est gardé que sur l'appareil qui l'a créé (`localStorage`), les autres ne le voient pas.
- **Collection « conges » (ancienne, encore présente en production)** : le code actuel ne la lit ni ne l'écrit plus. Elle a servi deux jours : ajoutée le 18/05/2026 (commit `b85a4f7`, lecture et écriture de `conges/data`), abandonnée le 19/05/2026 au profit de `indispo/data` (lecture retirée par `30432d5`, écriture par `ce982a5`). Les règles actuelles ne la mentionnent pas : elle tombe sous « tout le reste est fermé », donc personne ne peut plus la lire ni l'écrire depuis l'app. Son contenu date de mai 2026 et peut contenir des indispos saisies ces deux jours-là. Lors du chantier « un document par indispo » : 1) l'exporter depuis la console et la comparer à `indispo/data` ; 2) reprendre dans la nouvelle collection les indispos qui n'existeraient que là (si elles sont encore à venir) ; 3) la supprimer seulement après cette vérification, avec accord. Les anciennes clés locales `lb_conges` et `lb_conges_fb` restent peut-être sur d'anciens appareils, sans effet.
- **Sauvegardes (priorité haute, avant le chantier indispos)** : les sauvegardes planifiées Firestore sont désactivées ; aujourd'hui, une suppression ou un écrasement est définitif.
  - **a) Sauvegardes Firestore planifiées** (quotidiennes ou hebdomadaires, conservées jusqu'à 14 semaines, restauration complète dans une nouvelle base) : nécessitent l'offre Blaze (paiement à l'usage, carte bancaire). Notre volume est de l'ordre de quelques mégaoctets (photos de profil comprises) ; le stockage des sauvegardes est facturé au Go et par mois, soit quelques centimes par mois au plus, et les quotas gratuits de Firestore restent acquis. Tarifs à vérifier sur la page de Google avant activation. Précaution : alerte de budget à 1 € dans la console Google Cloud. Avantages : automatique, rien à penser, couvre toutes les collections, restauration fiable. Inconvénient : passage en Blaze.
  - **b) Bouton « Exporter les données »** (référents) : un fichier JSON téléchargé avec chantiers, membres, indispos, profils et leads. Gratuit, environ 30 lignes. Inconvénients : manuel (dépend de la discipline), pas de restauration automatique (il faudrait un import à coder), et le fichier contient les données personnelles des prospects : il doit être rangé dans un espace protégé, hors du dépôt, et supprimé au-delà de la durée de conservation.
  - **Recommandation** : a) comme vraie sauvegarde, avec l'alerte de budget ; b) en complément, utile avant toute migration (dont le chantier indispos) et pour les demandes d'accès RGPD. Si Blaze n'est pas accepté, b) au minimum, avec un export avant chaque mise en ligne qui touche aux données.

## Leads v2

- **Champ « Nature de la demande »** : Demande d'information / Demande de devis / Visite à planifier. Badge dans le tableau et filtre. Ne touche ni aux points ni à la rotation.
- **Valeur du lead (Petit / Moyen / Gros)** :
  - **A.** « Non évalué » par défaut ; valeur obligatoire seulement à la signature ;
  - **B.** valeur calculée automatiquement à partir du montant signé, seuils à voter en AG.

  Recommandation : A tout de suite, B après le vote en AG.
- **À vérifier avant** : comment la rotation compte aujourd'hui un lead signé « Non évalué ».

## Décisions : on laisse tel quel

- **Pas de « +N » dans le calendrier** : une case affiche tous ses événements et s'agrandit. Limiter l'affichage demanderait une logique nouvelle.
- **`addMbr`** : il était noté qu'un collaborateur qui l'appellerait verrait sa liste locale modifiée avant le refus de la base. Décision de ne pas y toucher. Depuis l'écriture conditionnelle des membres, la liste locale n'est plus modifiée avant la confirmation de la base : le cas ne se produit plus.
