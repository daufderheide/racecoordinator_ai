# Éditeur de Dispositions

L'**Éditeur de Dispositions** offre une interface canevas plein écran dédiée pour personnaliser, organiser et concevoir des dispositions d'écran visuelles pour Race Coordinator AI. Il partage la même barre d'outils unifiée, sélection d'objets, protection en lecture seule et cycle de vie du mode édition utilisés dans les éditeurs de Pilotes, Circuits et Courses.

---

## Vue d'Ensemble & Navigation

L'Éditeur de Dispositions est accessible depuis plusieurs emplacements dans l'application :

- **Barre d'outils Configuration Jour de Course** : Sélectionnez **Config > Éditeur de Dispositions** (`/layout-editor` ou `/layout-manager`).
- **Éditeur d'Interface** : Cliquez sur **Ouvrir l'Éditeur de Dispositions** depuis la section Dispositions d'IU dans l'Éditeur d'Interface (`/ui-editor`).

### Cycle de Vie Lecture Seule et Mode Édition

- **Mode Lecture Seule (Par défaut)** : Les propriétés de disposition, widgets de canevas, dimensions et champs de l'inspecteur sont protégés contre les modifications accidentelles.
- **Mode Édition** : Cliquer sur l'icône **Modifier** (crayon) dans la barre d'outils déverrouille le canevas de disposition, les commandes de zoom, le repositionnement/redimensionnement des widgets et l'édition dans l'inspecteur.
- **Enregistrement Automatique et Validation** : En quittant le mode édition, les modifications sont validées (par exemple, vérifier un nom unique et non vide) et enregistrées. Les configurations non valides affichent une alerte et maintiennent l'éditeur en mode édition.
- **Abandonner les Modifications** : Quitter ou naviguer vers une autre page avec des modifications non enregistrées affiche la boîte de dialogue standard de confirmation d'abandon, protégeant contre la perte de données.
- **Annuler / Rétablir** : Entièrement intégré avec les raccourcis standard (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> et <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Actions de la Barre d'Outils

La barre d'outils supérieure fournit des actions de gestion standardisées :

- **Sélecteur de Disposition** : Menu déroulant pour sélectionner n'importe quelle disposition système ou personnalisée, triée naturellement avec les noms par défaut traduits (*IU Jour de Course par Défaut*, *IU Entraînement par Défaut*, *IU Poste de Pilotage par Défaut*).
- **Modifier / Terminer** : Bascule entre le mode lecture seule et le mode édition.
- **Ajouter une Disposition (<span class="material-icons">add</span>)** : Crée un nouveau modèle de disposition basé sur la disposition système par défaut.
- **Copier la Disposition (<span class="material-icons">content_copy</span>)** : Duplique la disposition actuellement sélectionnée sous un nom unique (par exemple, *Nom de Disposition (Copie)*).
- **Supprimer la Disposition (<span class="material-icons">delete</span>)** : Supprime la disposition personnalisée actuelle après confirmation. Les dispositions système par défaut sont protégées et ne peuvent pas être supprimées.
- **Visite Guidée (<span class="material-icons">help_outline</span>)** : Lance une visite guidée interactive mettant en valeur le sélecteur de disposition, les actions de la barre d'outils, le canevas, la bibliothèque de widgets et l'inspecteur de widgets.

---

## Commandes de Canevas & Résolution

Situées dans la barre de commandes sous la barre d'outils :

### Préréglages de Format d'Image & Résolution
Sélectionnez un préréglage de format d'image (**16:9**, **16:10**, **4:3**, **21:9**, **Personnalisé**) pour ajuster automatiquement les dimensions de base du canevas (par exemple 1920×1080, 1920×1200, 1440×1080).

### Modes de Mise à l'Échelle
- **Ajustement Automatique (Échelle Uniforme)** : Préserve les proportions des widgets tout en s'adaptant à l'écran cible.
- **Étirer pour Remplir** : Étire les widgets indépendamment en largeur et hauteur.
- **Fixe / Mappage 1:1 Pixel** : Conserve les coordonnées exactes sans mise à l'échelle.

### Commandes de Zoom
- Ajustez le zoom en douceur de **25%** à **400%** à l'aide des boutons **-** et **+** ou en saisissant directement un pourcentage.
- Cliquez sur **Réinitialiser le Zoom** pour revenir à 100%.
- Les paramètres de zoom sont conservés dans le stockage local du navigateur par disposition.

### Aperçu du Compte à Rebours de Départ
- Cliquez sur **Aperçu des Feux** (<span class="material-icons">timer</span>) pour prévisualiser la séquence de feux de départ sur le canevas sans démarrer une vraie course.

### Bibliothèque de widgets & boîte à outils
- **Bibliothèque de widgets (<span class="material-icons">widgets</span>)** : Bascule la visibilité de la boîte à outils flottante. Un clic la restaure également si elle est réduite ou hors de l'écran visible.
- **Réinitialiser la position (<span class="material-icons">restart_alt</span>)** : Situé dans l'en-tête de la boîte à outils flottante pour la replacer instantanément à l'origine `(0, 0)` en haut à gauche.
- **Réduire (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)** : Replie la boîte à outils sous forme de barre de titre compacte pour libérer de l'espace sur le canevas.

---

## Canevas de Widgets & Inspecteur

- **Placement & Sélection** : Cliquez sur n'importe quel widget sur le canevas ou sélectionnez-le dans la liste déroulante des widgets.
- **Repositionnement & Redimensionnement** : Faites glisser librement les widgets dans les limites du canevas. Utilisez la barre latérale de l'Inspecteur pour saisir des valeurs numériques précises en **X**, **Y**, **Largeur** et **Hauteur**.
- **Déplacement au Clavier** :
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> : Déplace le widget sélectionné de 1px.
  - <kbd>Shift</kbd> + Touches fléchées : Déplace le widget sélectionné de 10px.
  - <kbd>Suppr</kbd> ou <kbd>Retour arrière</kbd> : Supprime le widget sélectionné.
- **Dupliquer les Voies** : Duplique une carte de colonne de voie sélectionnée sur toutes les voies actives, positions, classements généraux ou têtes de série.
- **Détection & Réparation des Colonnes Superposées** :
  - L'éditeur détecte automatiquement les colonnes dupliquées ou superposées dans les grilles de voies.
  - Une bannière d'alerte propose une **Correction Rapide** en un clic ou **Examiner les Problèmes** dans une boîte de dialogue interactive.

---

## Importation, Exportation & Migration

- **Importer une Disposition** : Importez un fichier JSON de disposition existant via le sélecteur de fichiers.
- **Exporter la Disposition** : Téléchargez la disposition active sous forme de fichier JSON autonome.
- **Sauvegardes Pré-Migration** : Pour les dispositions mises à niveau depuis d'anciennes versions, restaurez les instantanés de sauvegarde pré-migration ou exportez les diagnostics de migration pour le dépannage.
