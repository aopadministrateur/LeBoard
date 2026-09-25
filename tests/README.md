# Tests du Board

Tests locaux, sans aucun appel à la base de production : l'app est chargée dans Chrome sans interface avec un faux Firebase en mémoire (`mock.js`, Auth + Firestore REST). En mode strict, ce faux Firebase applique les mêmes règles que `firestore.rules`.

Prérequis : Node, Chrome, et `leads-seed.json` à la racine du dépôt (fichier local, **jamais versionné** : données de prospects). Les fichiers générés vont dans `tests/.out/` (ignoré par git).

## Logique du module Leads

    node tests/test-leads.js

## Scénarios dans le navigateur

    sh tests/run.sh logout                                 # module Leads de bout en bout
    sh tests/run.sh q429                                   # quota dépassé : données conservées
    BUDGET=45000 SCEN=auth-scenario.js sh tests/run.sh a_strict   # connexion + droits, règles strictes
    BUDGET=45000 SCEN=auth-scenario.js sh tests/run.sh a_open     # connexion, règles encore ouvertes
    SCEN=auth-scenario.js sh tests/run.sh a_reload         # réouverture : PIN direct
    SCEN=auth-scenario.js sh tests/run.sh a_revoked        # compte révoqué : retour à la connexion
    BUDGET=30000 SCEN=auth-scenario.js sh tests/run.sh a_reads    # lectures facturables par cycle

Ajouter une taille (ex. `1440,1500`) après le mode produit une capture d'écran dans `tests/.out/` au lieu du résultat. Si « PAS DE RESULTAT » s'affiche, augmenter `BUDGET`.

Les chemins de `run.sh` sont prévus pour Git Bash sous Windows (`cygpath`, Chrome dans Program Files ; variable `CHROME` pour un autre emplacement).
