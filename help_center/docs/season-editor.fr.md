# Éditeur de Saison

L'**Éditeur de Saison** vous permet de créer, gérer et examiner des saisons de championnat. Une saison suit les classements sur plusieurs courses et événements au fil du temps, cumule les points de championnat pour les pilotes, applique les règles de courses décomptées et calcule les positions en direct.

## Présentation

L'Éditeur de Saison offre une interface complète pour la gestion du championnat :

- **Sélecteur de Saison** : Situé dans l'en-tête supérieur à côté du titre, ce menu déroulant répertorie toutes les saisons enregistrées et permet de basculer rapidement entre elles grâce aux boutons précédent/suivant.
- **Mode Lecture Seule** : Par défaut, l'ouverture de l'éditeur affiche les paramètres, classements et courses en mode lecture seule pour éviter toute altération involontaire.
- **Mode Édition** : Cliquer sur l'icône **Modifier** (crayon) dans la barre d'outils déverrouille les champs et active l'ajout ou la suppression de courses.
- **Enregistrement Automatique Continu** : Les modifications de noms, décomptes et affectations de courses sont enregistrées automatiquement en arrière-plan.
- **Quitter le Mode Édition** : Cliquer sur l'icône **Terminer** (coche) valide la saison, enregistre les modifications et rétablit le mode lecture seule.

---

## Actions de la Barre d'Outils

La barre d'outils supérieure fournit les actions indispensables d'édition et de gestion :

- **Retour** : Revient à l'écran précédent ou à la Configuration du Jour de Course.
- **Ajouter une Saison (+)** : Crée un nouveau modèle de saison avec les paramètres par défaut et passe en Mode Édition.
- **Dupliquer la Saison** : Clone la saison actuelle sous un nouveau nom unique.
- **Modifier / Terminer** : Bascule entre le Mode Lecture Seule et le Mode Édition (raccourci clavier : `Cmd/Ctrl+E`).
- **Supprimer la Saison** : Supprime définitivement la saison de championnat sélectionnée après confirmation.
- **Annuler / Rétablir** : Annule ou réapplique les dernières modifications apportées durant la session.
- **Aide (?)** : Démarre la visite guidée interactive détaillant chaque section de l'éditeur.

---

## Configuration de la Saison {: #season-configuration }

Le panneau de gauche configure les règles générales du championnat et les critères de classement :

- **Nom de la Saison** : Un nom unique de championnat affiché dans les classements, rapports et lors du Jour de Course.
- **Courses Décomptées (Drops)** : Le nombre des moins bons résultats de courses retirés du total de points de championnat de chaque pilote.

---

## Infos de Saison et Gestion des Courses {: #season-info-bar }

Le bandeau situé au-dessus du panneau droit fournit des indicateurs d'état et des commandes d'ajout :

- **Courses Disputées** : Affiche le total de courses et événements terminés inclus dans la saison.
- **Indicateur de Courses Démo** : Indique si des courses de démonstration ou d'entraînement font partie de la saison.
- **Ajouter une Course** : En Mode Édition, cliquez sur **+ Ajouter une Course** pour sélectionner des courses terminées dans votre historique et les intégrer à la saison.

---

## Classement de la Saison {: #season-standings }

La section classement calcule et présente les positions du championnat en temps réel :

- **Rang et Podium** : Les pilotes sont triés par points totaux ; les médailles d'or, d'argent et de bronze mettent en valeur les trois premiers.
- **Nom du Pilote** : Nom complet de chaque pilote participant.
- **Points Nets** : Le score officiel utilisé pour le classement (points bruts moins déductions des courses décomptées).
- **Points Décomptés** : La somme des points retirés selon la règle des courses décomptées.
- **Points Bruts** : Le total des points bruts obtenus sur l'ensemble des courses disputées.
- **Courses Disputées** : Nombre de courses auxquelles le pilote a pris part.

---

## Détail des Courses {: #race-breakdowns }

La section de détail fournit des cartes pour chaque course incluse dans la saison :

- **Cartes de Course Dépliables** : Cliquez sur une carte pour afficher le tableau des résultats par pilote avec points de position et bonus.
- **Retirer des Courses** : En Mode Édition, cliquez sur l'icône corbeille (<span class="material-icons">delete</span>) pour retirer une course de la saison.

