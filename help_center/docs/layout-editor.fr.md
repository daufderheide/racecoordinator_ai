# Éditeur de Dispositions

L'**Éditeur de Dispositions** offre une interface canevas plein écran dédiée pour personnaliser, organiser et concevoir des dispositions d'écran visuelles pour Race Coordinator AI. Il partage la même barre d'outils unifiée, sélection d'objets, protection en lecture seule et cycle de vie du mode édition utilisés dans les éditeurs de Pilotes, Circuits et Courses.

---

## Vue d'Ensemble & Navigation

L'Éditeur de Dispositions est accessible depuis plusieurs emplacements dans l'application :

- **Barre d'outils Configuration Jour de Course** : Sélectionnez **Config > Éditeur de Dispositions** (`/layout-editor` ou `/layout-manager`).
- **Menu de gestion du jour de course** : Sélectionnez **Gérer > Éditeur de Dispositions** (`/layout-editor`). La navigation pendant une course active préserve la connexion et l'état.
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
- **Ajouter une Disposition (<span class="material-icons">add</span>)** : Ouvre une boîte de dialogue de sélection de modèle vous permettant de créer une nouvelle disposition à partir de n'importe quelle disposition par défaut de Race Coordinator AI (*RC AI*, *Entraînement*, *Carburant*, *Poste de Pilotage*) ou de démarrer avec une disposition entièrement vide.
- **Copier la Disposition (<span class="material-icons">content_copy</span>)** : Duplique la disposition actuellement sélectionnée sous un nom unique (par exemple, *Nom de Disposition (Copie)*).
- **Supprimer la Disposition (<span class="material-icons">delete</span>)** : Supprime la disposition personnalisée actuelle après confirmation. Les dispositions système par défaut sont protégées et ne peuvent pas être supprimées.
- **Visite Guidée (<span class="material-icons">help_outline</span>)** : Lance une visite guidée interactive mettant en valeur le sélecteur de disposition, les actions de la barre d'outils, le canevas, la bibliothèque de widgets et l'inspecteur de widgets.

---

## Commandes de Canevas & Résolution {: #layout-controls }

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

### Bibliothèque de widgets & contrôles de configuration {: #widget-panels }
- **Bibliothèque de widgets (<span class="material-icons">widgets</span>)** : Bascule la visibilité de la boîte à outils flottante. Un clic la restaure également si elle est réduite ou hors de l'écran visible.
- **Configuration de widgets (<span class="material-icons">tune</span>)** : Bascule la visibilité du panneau latéral de configuration des widgets. Lorsqu'il est masqué, le canevas peut s'étendre sur toute la largeur de la page si les proportions de la disposition le permettent (comme en mode lecture seule).
- **Réinitialiser la position (<span class="material-icons">restart_alt</span>)** : Situé dans l'en-tête de la boîte à outils flottante pour la replacer instantanément à l'origine `(0, 0)` en haut à gauche.
- **Réduire (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)** : Replie la boîte à outils sous forme de barre de titre compacte pour libérer de l'espace sur le canevas.

---

## Canevas de Widgets & Inspecteur {: #canvas-and-widgets }

Le canevas sert d'authentique aperçu en direct de votre disposition exactement telle que les pilotes et spectateurs la verront pendant une course. En **Mode Édition**, vous pouvez ajouter, supprimer, repositionner, redimensionner et configurer les widgets composant la disposition.

### Interactions sur le Canevas
- **Placement & Sélection** : Cliquez sur n'importe quel widget directement sur le canevas ou sélectionnez-le dans la liste déroulante de la barre de commandes supérieure.
- **Repositionnement & Redimensionnement** : Faites glisser librement les widgets dans les limites du canevas. Utilisez l'Inspecteur pour saisir des coordonnées numériques précises en **X**, **Y**, **Largeur** et **Hauteur**.
- **Déplacement au Clavier** :
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> : Déplace le widget sélectionné de 1px.
  - <kbd>Shift</kbd> + Touches fléchées : Déplace le widget sélectionné de 10px.
  - <kbd>Suppr</kbd> ou <kbd>Retour arrière</kbd> : Supprime le widget sélectionné.
- **Dupliquer les Voies** : Duplique une carte de colonne de voie sélectionnée sur toutes les voies actives, positions, classements généraux ou têtes de série.
- **Détection & Réparation des Colonnes Superposées** : L'éditeur détecte automatiquement les colonnes dupliquées ou superposées dans les grilles de voies. Une bannière d'alerte propose une **Correction Rapide** en un clic ou **Examiner les Problèmes** dans une boîte de dialogue interactive.

### Widgets Disponibles & Options de Configuration

Race Coordinator AI comprend une collection complète de widgets intégrés :

1. **Tableau des Scores / Grille (Leaderboard / Grid)** :
   - **Rôle** : Affiche un classement en direct sous forme de tableau des pilotes, positions, tours, métriques et écarts.
   - **Options de Configuration** : Source des données (**Données de Manche** vs. **Données Générales de Course**), ordre et visibilité des colonnes, hauteur des lignes, règles de tri, défilement automatique et typographie.
2. **Colonne de Voie (Lane Column - Cartes Modulaires)** :
   - **Rôle** : Présente les données d'une voie, position ou classement général sous forme de carte modulaire indépendante.
   - **Options de Configuration** : Voie cible (**Voie 1–8**, **Position en Manche**, **Classement Général** ou **Tête de Série**), jusqu'à 8 **Emplacements d'Encart (Insets)** pour photos ou badges, alignement et échelle de police.
3. **Chronomètre & Temps Total (Timer & Total Time)** :
   - **Rôle** : Affiche le temps restant ou écoulé de la manche ou la durée totale de l'événement.
   - **Options de Configuration** : Formats d'affichage (**Dynamique**, **Minutes & Secondes**, **Horloge Complète**, **Secondes Totales**), seuils de précision sous la seconde et aperçu de mise en forme.
4. **Feux de Départ (Countdown)** :
   - **Rôle** : Feux de départ visuels avec signaux sonores synchronisés.
   - **Options de Configuration** : Nombre de feux (1 à 10), orientation horizontale ou verticale, fondu d'apparition, flou d'arrière-plan et halos lumineux.
5. **Boutons d'Action (Action Buttons)** :
   - **Rôle** : Commandes tactiles ou cliquables pour la direction de course.
   - **Options de Configuration** : Actions déclenchées (**Départ/Pause**, **Drapeau Jaune**, **Annonce Vocale**, **Réinitialisation**, **Changement de Disposition**), texte, icônes Material Icons et couleurs.
6. **Widget des Records (Records)** :
   - **Rôle** : Affiche les records de la piste et de la session (meilleur tour absolu, record par voie, record de tours) et les exploits des pilotes.
   - **Options de Configuration** : Types de métriques de record, mise en forme des titres, typographie et arrière-plan.
7. **Widget d'Image (Image)** :
   - **Rôle** : Affiche les tracés de circuit, bannières publicitaires, logos de clubs et éléments graphiques.
   - **Options de Configuration** : Emplacement de l'image, mode de mise à l'échelle (**Ajuster**, **Remplir**, **Étirer**), opacité et coins arrondis.
8. **Widget d'Information Texte** :
   - **Rôle** : Affiche des textes statiques ou des métadonnées de course dynamiques (Nom de la Course, Manche Actuelle, Nom de la Piste).
   - **Options de Configuration** : Modèle de texte avec interpolation de variables (`{race_name}`, `{heat_number}`), taille de police, alignement et couleurs.
9. **Widget de Menu** :
   - **Rôle** : Menu compact en surimpression pour accéder aux réglages audio, au changement de disposition et aux commandes de course.
   - **Options de Configuration** : Style d'icône, éléments visibles et position d'ancrage.
10. **Manches à Venir (On Deck)** :
    - **Rôle** : Informe les pilotes des prochaines manches programmées et des rotations de voies.
    - **Options de Configuration** : Nombre de manches affichées, format des noms et espacement.
11. **Widgets Personnalisés (Custom Widgets)** :
    - **Rôle** : Charge dynamiquement des composants web externes et jauges de télémétrie depuis votre dossier de widgets personnalisés.
    - **Options de Configuration** : Propriétés personnalisées (couleurs, seuils, bascules, libellés) définies dans le manifeste.

Pour plus de détails sur le style des widgets et la création de widgets personnalisés, consultez le [Guide de l'Éditeur d'Interface](ui-editor.fr.md) et le [Guide des Widgets Personnalisés](custom-widgets.fr.md).

---

## Importation, Exportation & Migration

- **Importer une Disposition** : Importez un fichier JSON de disposition existant via le sélecteur de fichiers.
- **Exporter la Disposition** : Téléchargez la disposition active sous forme de fichier JSON autonome.
- **Sauvegardes Pré-Migration** : Pour les dispositions mises à niveau depuis d'anciennes versions, restaurez les instantanés de sauvegarde pré-migration ou exportez les diagnostics de migration pour le dépannage.
