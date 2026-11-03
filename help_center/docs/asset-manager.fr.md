# Gestionnaire de Ressources

## Présentation {: #overview }

Le **Gestionnaire de Ressources** vous permet de téléverser, d'organiser et de gérer l'ensemble de vos fichiers multimédias de course, notamment les fichiers audio, les images personnalisées, les ensembles d'images et les schémas de rotation dans Race Coordinator AI.

Les ressources sont des fichiers personnalisés utilisés pour enrichir l'expérience de course :

- **Fichiers audio :** Annonces vocales personnalisées, bips de départ, signaux de fin de course et commentaires.
- **Ensembles audio :** Collections regroupées de fichiers sonores ou de phrases de synthèse vocale (TTS) associées à des seuils précis (secondes restantes, tours restants ou niveau de carburant).
- **Images :** Graphismes de véhicules, avatars de pilotes, drapeaux, logos de sponsors et arrière-plans.
- **Ensembles d'images :** Séries d'images séquentielles (jauges de carburant ou feux de départ).
- **Rotations personnalisées :** Schémas de rotation de voies définis par l'utilisateur pour des formats de course spécifiques.

---

## Ajouter des ressources {: #adding-assets }

Le panneau latéral gauche propose quatre commandes pour enrichir votre bibliothèque, individuellement ou par lot :

1. **Zone de téléversement :** Glissez-déposez des fichiers dans la zone en pointillés ou cliquez dessus pour ouvrir l'explorateur de fichiers. Vous pouvez téléverser plusieurs fichiers en une seule opération.
   - Formats d'image acceptés : `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Formats audio acceptés : `.wav`, `.mp3`, `.ogg`.
2. **Nouvel ensemble d'images :** Ouvre l'éditeur d'ensembles d'images pour regrouper plusieurs images séquentielles en animations ou jauges d'état.
3. **Nouvel ensemble audio :** Ouvre l'éditeur d'ensembles audio pour programmer des séquences sonores selon le temps, les tours restants ou le carburant.
4. **Nouvelle rotation personnalisée :** Ouvre l'éditeur de rotation pour concevoir des alternances de voies personnalisées.

---

## Bibliothèque de ressources & Actions {: #asset-library }

Le panneau principal affiche l'ensemble des ressources visuelles et audio enregistrées dans votre base de données.

Survoler une vignette de ressource fait apparaître des commandes rapides :
- **Lecture audio :** Cliquez sur le bouton de lecture d'une carte audio pour écouter immédiatement le son sans ouvrir d'éditeur.
- **Aperçu d'image :** Affiche l'image en pleine résolution et détaille les étapes d'un ensemble d'images.
- **Renommage direct :** Cliquez sur le nom de l'élément pour le renommer directement dans la grille.
- **Supprimer :** Cliquez sur l'icône de corbeille pour retirer une ressource inutile de la base de données.

Vous pouvez aussi cliquer sur les ressources pour les sélectionner. Avec des éléments sélectionnés, la barre d'outils supérieure permet l'édition et la suppression groupées.

---

## Filtres et modes d'affichage {: #filter-tabs }

Le Gestionnaire de Ressources met à disposition des outils pour retrouver vos éléments facilement :

- **Onglets de filtrage :** Filtrez la bibliothèque par type de ressource :
  - **Tous :** Présente l'intégralité des ressources enregistrées.
  - **Images :** Fichiers images statiques (`.png`, `.jpg`, `.svg`, etc.).
  - **Ensembles d'images :** Animations et jauges composées de plusieurs images.
  - **Sons :** Fichiers audio individuels (`.wav`, `.mp3`, `.ogg`).
  - **Ensembles audio :** Collections sonores liées à des seuils numériques.
  - **Rotations personnalisées :** Schémas de rotation de voies des manches.
- **Disposition d'affichage :** Basculez entre **Vue en liste**, **Petites miniatures**, **Miniatures moyennes** et **Grandes miniatures**.
- **Filtrer par nom :** Champ de recherche en temps réel filtrant instantanément la liste à la saisie.

---

## Ensembles audio et valeurs de déclenchement

Un **Ensemble audio** permet de programmer des sons ou annonces vocales déclenchés à des seuils précis :

*   **Temps en secondes :** Utilisé dans les thèmes pour les comptes à rebours et annonces de temps restant.
*   **Nombre de tours :** Utilisé dans les thèmes pour annoncer les tours restants du leader.
*   **Pourcentage de carburant (%) :** Utilisé dans le profil des pilotes pour les alertes de réserve et de ravitaillement.

### Modes double déclencheur : Restant vs Écoulé

Chaque élément peut être configuré selon deux modes :
*   **Restant (Compte à rebours) :** Se déclenche à l'approche de la fin de manche ou du zéro.
*   **Écoulé (Compte ascendant) :** Se déclenche au fur et à mesure que la course progresse depuis le départ.

---

## Utilisation des ressources dans l'application

Vos ressources créées ou téléversées sont exploitables dans tous les modules :

- Sélectionnez des sons dans l'[Éditeur de thèmes](themes.fr.md) pour les tours rapides et signaux de départ/arrivée.
- Associez des visuels dans l'[Éditeur de pilotes](driver-editor.fr.md) pour les photos de véhicules et avatars.
- Configurez des widgets graphiques dans l'[Éditeur de mise en page](layout-editor.fr.md).
- Liez des fichiers de rotation dans l'[Éditeur de courses](race-editor.fr.md).
