# Éditeur de Thèmes

L'**Éditeur de Thèmes** offre une interface dédiée et rationalisée pour gérer les drapeaux visuels, les séquences de feux de départ, les jauges de carburant, les annonces audio de la direction de course et les remplacements audio des pilotes pour Race Coordinator AI. Il partage la même barre d'outils unifiée, la sélection d'objets, la protection en lecture seule et le cycle de vie du mode d'édition que les éditeurs de Pilotes, Pistes, Courses et Dispositions.

---

## Vue d'ensemble & Navigation

L'Éditeur de Thèmes est accessible depuis plusieurs emplacements :

- **Barre d'outils de configuration du jour de course** : Sélectionnez **Config > Éditeur de Thèmes** (`/theme-editor` ou `/theme-manager`).
- **Menu d'options du jour de course** : Cliquez sur le menu d'engrenage sur la barre d'outils et sélectionnez **Éditeur de Thèmes** (`/theme-editor`). La navigation pendant une course active préserve la connexion et l'état.
- **Éditeur d'interface utilisateur (UI Editor)** : Cliquez sur **Ouvrir l'éditeur de thèmes** depuis la section Thèmes dans l'Éditeur d'UI (`/ui-editor`).

### Cycle de vie Lecture Seule et Mode Édition

- **Mode Lecture Seule (par défaut)** : Les propriétés du thème, les emplacements d'images, les paramètres audio et les remplacements audio des pilotes sont protégés contre les modifications accidentelles.
- **Mode Édition** : Cliquer sur l'icône **Modifier** (crayon) dans la barre d'outils déverrouille le thème pour modification.
- **Enregistrement automatique & Validation** : En quittant le mode édition, les modifications sont validées (nom unique et non vide) et enregistrées.
- **Ignorer les modifications** : Quitter ou naviguer avec des modifications non enregistrées affiche la boîte de dialogue standard de confirmation.
- **Annuler / Rétablir** : Entièrement intégré aux raccourcis clavier (<kbd>Ctrl</kbd>+<kbd>Z</kbd> et <kbd>Ctrl</kbd>+<kbd>Y</kbd>).

---

## Actions de la barre d'outils

- **Sélecteur de thèmes** : Liste déroulante pour sélectionner un thème système ou personnalisé.
- **Modifier / Terminer l'édition** : Bascule entre le mode Lecture Seule et le mode Édition.
- **Tout développer / réduire** : Ouvre ou ferme toutes les sections configurables simultanément.
- **Ajouter un thème** : Crée un nouveau modèle de thème basé sur le thème par défaut.
- **Copier un thème** : Duplique le thème sélectionné avec un nom unique.
- **Supprimer un thème** : Supprime le thème personnalisé actuel après confirmation.
- **Visite guidée** : Lance une visite guidée interactive.

