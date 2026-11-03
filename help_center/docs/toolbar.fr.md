# Actions de la Barre d'Outils

La **Barre d'Outils de l'Éditeur** propose des contrôles harmonisés et standardisés sur tous les écrans d'administration de Race Coordinator AI (Pilotes, Équipes, Pistes, Courses, Dispositions, Thèmes et Bases de données).

## Aperçu {: #overview }

La barre d'outils standardise le cycle d'édition :

- **Mode Lecture Seule** : À l'ouverture d'un éditeur, les formulaires sont verrouillés pour éviter les fausses manipulations tout en autorisant l'exploration et les tests sonores.
- **Mode Édition** : Un clic sur l'icône **Modifier** (crayon) déverrouille les champs. Le sélecteur supérieur est verrouillé pour sécuriser les modifications en cours.
- **Enregistrer & Quitter** : Un clic sur **Terminé** (coche) valide et enregistre les données dans SQLite, puis rétablit le mode lecture seule.

## Référence des Icônes {: #icons }

Voici la description complète de chaque icône d'action de la barre d'outils :

### Modifier / Terminé {: #edit }
- **Icônes** : `edit` (crayon) / `check` (coche)
- **Raccourci** : `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Description** : Bascule entre le mode lecture seule et le mode édition.

### Créer Nouveau {: #add }
- **Icône** : `add` (plus)
- **Description** : Crée un nouvel élément vierge et bascule aussitôt en mode édition.

### Dupliquer {: #copy }
- **Icône** : `content_copy` (documents superposés)
- **Description** : Duplique l'élément sélectionné avec un nouveau nom unique.

### Supprimer {: #delete }
- **Icône** : `delete` (corbeille)
- **Description** : Supprime définitivement l'élément après confirmation.

### Annuler {: #undo }
- **Icône** : `undo` (flèche vers la gauche)
- **Raccourci** : `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Description** : Annule la dernière modification effectuée.

### Rétablir {: #redo }
- **Icône** : `redo` (flèche vers la droite)
- **Raccourci** : `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` ou `Ctrl+Y` (Windows/Linux)
- **Description** : Réapplique la modification précédemment annulée.

### Tout Développer / Réduire {: #expand-collapse }
- **Icône** : `unfold_more` / `unfold_less` (flèches verticales)
- **Description** : Développe ou réduit simultanément tous les accordéons de l'éditeur.

### Activer {: #activate }
- **Icône** : `check_circle` (coche cerclée)
- **Description** : Définit le thème sélectionné comme actif pour les courses.

### Importer {: #import }
- **Icône** : `download` / `file_upload` (flèche vers le bas)
- **Description** : Ouvre une boîte de dialogue pour importer des fichiers (`.json`, `.zip`, `.csv`).

### Exporter {: #export }
- **Icône** : `upload` / `file_download` (flèche vers le haut)
- **Description** : Exporte la configuration dans une archive (`.zip`, `.xlsx`, `.csv`).

### Rétablir Paramètres d'Usine {: #reset }
- **Icône** : `restart_alt` (flèche de réinitialisation)
- **Description** : Réinitialise la base de données aux valeurs d'origine.

### Effacer Disposition {: #clear }
- **Icône** : `delete_sweep` (balai)
- **Description** : Vide entièrement la zone de travail dans l'Éditeur de Dispositions.

### Régénérer Séries {: #regenerate }
- **Icône** : `sync` (flèches circulaires)
- **Description** : Recalcule la rotation des séries et l'attribution des voies.

### Vérification de l'Équité des Voies {: #lane-check }
- **Icône** : `check` (coche / balance)
- **Description** : Vérifie la répartition égale des voies sur l'ensemble des séries.

### Contrôle du Zoom {: #zoom }
- **Icônes** : `zoom_in` / `zoom_out` avec curseur
- **Description** : Ajuste le niveau de zoom de la zone de travail entre 50% et 150%.

### Télémétrie & Données d'Usage {: #analytics }
- **Icône** : `analytics` (graphique à barres)
- **Description** : Active ou désactive les statistiques d'utilisation anonymes.

### Visite Guidée (Aide) {: #help }
- **Icône** : `lightbulb` (ampoule)
- **Description** : Démarre un guide interactif étape par étape sur la page active.

