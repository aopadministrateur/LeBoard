# Tests du Board

Tests locaux, sans aucun appel à la base de production : l'app est chargée dans Chrome sans interface avec un faux Firebase en mémoire (`mock.js`, Auth + Firestore REST). En mode strict, ce faux Firebase applique les mêmes règles que `firestore.rules`.

Prérequis : Node et Chrome. Les tests n'utilisent que des données fictives : les leads viennent de `tests/fixtures/leads-fictifs.json` (noms inventés, emails `@exemple.test`, numéros de la plage réservée à la fiction par l'ARCEP). Aucun test ne lit `leads-seed.json` ni aucune donnée réelle de prospect. Les fichiers générés vont dans `tests/.out/` (ignoré par git).

## Logique du module Leads

    node tests/test-leads.js

## Semaines du calendrier (numéro ISO 8601, période affichée)

    node tests/test-cal.js

## Conflits entre chantiers (dates inclusives)

    node tests/test-conflits.js

## Scénarios dans le navigateur

    sh tests/run.sh logout                                 # module Leads de bout en bout
    sh tests/run.sh q429                                   # quota dépassé : données conservées
    BUDGET=45000 SCEN=auth-scenario.js sh tests/run.sh a_strict   # connexion + droits, règles strictes
    BUDGET=45000 SCEN=auth-scenario.js sh tests/run.sh a_open     # connexion, règles encore ouvertes
    SCEN=auth-scenario.js sh tests/run.sh a_reload         # réouverture : PIN direct
    SCEN=auth-scenario.js sh tests/run.sh a_revoked        # compte révoqué : retour à la connexion
    BUDGET=30000 SCEN=auth-scenario.js sh tests/run.sh a_reads    # lectures facturables par cycle
    BUDGET=30000 SCEN=modch-scenario.js sh tests/run.sh m_reset  # creation de chantier apres une edition : champs vides
    BUDGET=40000 SCEN=dates-scenario.js sh tests/run.sh d_dates   # fin avant debut refusee, fin = debut acceptee
    BUDGET=60000 SCEN=ecritures-scenario.js sh tests/run.sh e_indispo_strict   # indispos : copie perimee, ecriture concurrente, echec apres 3 essais
    BUDGET=90000 SCEN=ecritures-scenario.js sh tests/run.sh e_membres_strict   # membres et maitres d'oeuvre : memes cas + chantier sans ecriture des membres
    BUDGET=90000 SCEN=ecritures-scenario.js sh tests/run.sh e_chantiers_strict # chantiers : seuls les champs modifies, memes cas, creation confirmee par la base (echec reseau, double appui), chantier supprime entre-temps

## Deux appareils sur la même base fictive

    node tests/deux-appareils.js

Deux pages Chrome isolées (stockage local séparé, comme deux téléphones : Florian et Henri) dont les appels Firebase sont relayés vers une page « base » unique qui porte `mock.js` en règles strictes. Chaque appareil garde sa copie sans relecture périodique ; on vérifie qu'aucune écriture de l'un n'efface celle de l'autre, y compris quand elles sont simultanées. Sort en erreur (code 1) si un seul point n'est pas vert.

Ajouter une taille (ex. `1440,1500`) après le mode produit une capture d'écran dans `tests/.out/` au lieu du résultat. Si « PAS DE RESULTAT » s'affiche, augmenter `BUDGET`.

Les chemins de `run.sh` sont prévus pour Git Bash sous Windows (`cygpath`, Chrome dans Program Files ; variable `CHROME` pour un autre emplacement).
