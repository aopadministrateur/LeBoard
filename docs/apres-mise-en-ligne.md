# Après la mise en ligne

Points notés pendant la refonte UI v4, volontairement laissés pour après la mise en ligne. Aucun n'est codé.

## À faire

- **`firebase-messaging-sw.js`** : fichier gardé dans le dépôt. `index.html` ne l'enregistre plus, donc aucune notification push n'est active ; mais il peut rester installé sur des appareils ayant utilisé d'anciennes versions, et le supprimer les laisserait dans un état incertain. À trancher.
- **Bouton « Ajouter à mon agenda »** par chantier : lien Google Agenda prérempli (nom, dates, adresse). Remplace l'ancienne fausse synchronisation Google, retirée pendant la refonte.
- **Clés locales `lb_msg`** : plus écrites depuis la suppression de la messagerie, mais encore présentes sur certains appareils. Sans effet ; à nettoyer.
- **Un document par indispo, avec des droits par personne** : aujourd'hui, toutes les indispos sont dans un seul document (`indispo/data`) que tout membre peut modifier, y compris les indispos des autres. Les écrasements sont déjà évités (écriture conditionnelle), mais les règles Firestore ne peuvent pas limiter chacun à ses propres indispos. À prévoir : schéma `indispo/{id}` avec le membre, règles par personne, reprise des données existantes, lecture limitée aux indispos à venir (quota de lectures).
- **Types de chantier enregistrés en base** : aujourd'hui, un type ajouté n'est gardé que sur l'appareil qui l'a créé (`localStorage`), les autres ne le voient pas.

## Décisions : on laisse tel quel

- **Pas de « +N » dans le calendrier** : une case affiche tous ses événements et s'agrandit. Limiter l'affichage demanderait une logique nouvelle.
- **`addMbr`** : il était noté qu'un collaborateur qui l'appellerait verrait sa liste locale modifiée avant le refus de la base. Décision de ne pas y toucher. Depuis l'écriture conditionnelle des membres, la liste locale n'est plus modifiée avant la confirmation de la base : le cas ne se produit plus.
