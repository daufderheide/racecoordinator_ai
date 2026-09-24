# Éditeur d'Interface

## Présentation

L'Éditeur d'Interface vous permet de concevoir des mises en page de jour de course personnalisées, de configurer les colonnes du classement des pilotes, de personnaliser les effets sonores et les images des thèmes et de charger des [Widgets personnalisés](custom-widgets.md) modulaires.

## Widgets personnalisés et dossier de widgets

Des widgets personnalisés peuvent être ajoutés à vos dispositions d'interface personnalisées :
- **Dossier de widgets personnalisés** : Définissez votre dossier local de widgets dans la section **Interface personnalisée** au bas de l'éditeur.
- **Mettre à jour les widgets d'exemple** : Cliquez sur **Mettre à jour les widgets d'exemple** pour générer ou mettre à jour des widgets d'exemple prêts à l'emploi dans un dossier `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Groupes de la boîte à outils de widgets** : La boîte à outils organise les widgets en groupes (**Race Coordinator AI**, **Racine personnalisée** et dossiers personnalisés tels que **sample**) avec des sous-groupes imbriqués (comme **Actions** et **Données de manche** avec des sous-dossiers catégorisés) et un filtre de recherche instantané.
- **Inspecteur dynamique** : Lorsqu'un widget personnalisé est sélectionné sur le canevas, ses propriétés personnalisées (couleurs, seuils, bascules, champs de texte) apparaissent dynamiquement dans l'Inspecteur de widgets.

Pour tous les détails sur le développement de widgets, consultez le [Guide des widgets personnalisés](custom-widgets.md).

## Configuration de la mise en page et des colonnes

- Glissez-déposez des widgets depuis la palette sur le canevas.
- Redimensionnez, repositionnez et alignez les widgets selon votre résolution. Tous les widgets restent délimités à l'intérieur du canevas.
- **Contrôles de l'Inspecteur de Widgets** :
  - **Position & Taille** : Positionnez et dimensionnez avec précision le widget sélectionné à l'aide des entrées numériques **X**, **Y**, **Largeur** et **Hauteur**.
  - **Supprimer le widget** : Cliquez sur l'icône de corbeille dans l'en-tête de l'inspecteur ou sur le bouton **Supprimer le widget** dans la barre latérale.
- **Raccourcis clavier** :
  - <kbd>Suppr</kbd> ou <kbd>Retour arrière</kbd> : Supprime le widget sélectionné de la mise en page.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> : Déplace le widget sélectionné de 1px (ou 10px en maintenant <kbd>Maj</kbd>).
  - <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> : Annuler l'action précédente.
  - <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Maj</kbd>+<kbd>Z</kbd> : Rétablir.
- Configurez l'ordre des colonnes, la visibilité, les ancres et les préférences de largeur.

## Configuration du Widget Minuteur

Le widget **Minuteur** affiche le temps écoulé ou restant de la manche/course avec des styles de présentation configurables :

- **Format d'affichage** :
  - **Dynamique (1:23 / 45s)** : Affichage compact qui omet les zéros non significatifs et supprime l'unité des minutes en dessous d'une minute.
  - **Minutes & secondes (01:23 / 00:45)** : Deux chiffres constants pour les minutes et les secondes, évitant les sauts de longueur et les redimensionnements brutaux de police en mode d'échelle automatique.
  - **Minutes & secondes (1:23 / 0:45)** : Conserve les minutes affichées en dessous d'une minute (`0:45`), avec un seul chiffre pour les minutes au-dessus d'une minute (`1:23`).
  - **Horloge complète (00:01:23 / 00:00:45)** : Horloge numérique fixe de huit caractères (`HH:MM:SS`), idéale pour les courses d'endurance.
  - **Secondes totales (83s / 45s)** : Affiche les secondes totales restantes ou écoulées sans subdivision en minutes ou en heures.
- **Sous-secondes** :
  - **Sous le seuil** : Affiche les fractions de seconde (1 à 3 décimales) dès que le temps passe sous le seuil configuré (par exemple, 10 dernières secondes).
  - **Toujours** : Affiche les fractions de seconde en continu pendant toute la manche.
- **Aperçu en direct** : L'inspecteur comprend un aperçu en direct immédiat montrant la mise en forme aux différents points de passage de la course (`> 1 hr`, `> 1 min`, `< 1 min` et `< 10s`).

## Widgets de Colonne de Voie et Duplication

Le widget **Colonne de Voie** permet de positionner des colonnes individuelles de données provenant de la vue de voie (telles que les informations du pilote, le temps du dernier tour, le meilleur tour / record personnel, le niveau de carburant %, l'historique des tours, les vitesses de secteur, la position, etc.) n'importe où sur le canevas sous la forme de cartes modulaires indépendantes.

- **Modes de Liaison** :
  - **Voie Physique** : Associe la carte à une voie spécifique du circuit (Voie 1 à Voie 8). La carte conserve les données de cette voie pendant toute la durée de la course.
  - **Position au Classement** : Associe la carte à un rang actuel du classement (1ère place, 2e place, etc.). La carte s'adapte dynamiquement aux dépassements et aux changements de position, tout en ajustant ses couleurs de fond et de texte à la voie du pilote occupant ce rang.
- **Orientation** : Prend en charge les dispositions **Verticale** (en-tête au-dessus de la valeur) et **Horizontale** (en-tête et valeur côte à côte).
- **Héritage des Couleurs et Personnalisation** : Par défaut, les cartes héritent des couleurs de fond et de texte de la voie attribuée (`Utiliser les Couleurs de Voie`), ou peuvent être personnalisées avec des couleurs d'arrière-plan, de texte et de bordure spécifiques.
- **Dupliquer sur les Voies / Positions** :
  - Au lieu de créer et d'aligner manuellement les cartes pour chaque voie, configurez un ensemble pour une seule voie ou position et cliquez sur **Dupliquer sur les Voies / Positions...** dans l'inspecteur.
  - Choisissez la direction (**Horizontale** côte à côte ou **Verticale** superposée), le nombre total de voies/positions cibles (par défaut le nombre maximal de voies de tous les circuits de la base de données), le mode d'espacement (**Ajuster au Canevas** ou **Conserver l'Espacement**) et le remplacement facultatif des widgets existants.
  - **Mode de Réplication en Temps Réel** : Lors de la duplication, l'éditeur bascule dans un mode de modèle interactif avec repères visuels de voie et alignement magnétique. Dans ce mode, vous placez, redimensionnez et personnalisez les widgets directement sur la Voie 1 (Maître), et les modifications sont immédiatement répercutées en temps réel sur l'ensemble des voies. Les widgets clonés sur les voies 2..N sont des aperçus en direct non modifiables ; cliquer sur un widget cloné renvoie la sélection sur le maître de la Voie 1.
  - **Zone Intelligente et Redimensionnement** : L'espace de réplication s'agrandit automatiquement dans les quatre directions pour occuper l'espace disponible sur le canevas jusqu'à rencontrer les limites d'un widget extérieur à la grille. Vous pouvez ajuster la zone globale à l'aide des 8 poignées de redimensionnement périmétriques de la superposition.
  - Cliquez sur **Terminé** pour figer la grille en widgets indépendants.
  - **Modifier le Modèle et Détacher** : En sélectionnant ultérieurement un widget de la grille, l'inspecteur propose un panneau permettant de cliquer sur **Modifier le Modèle de Grille** (pour réactiver à tout moment le mode de réplication en temps réel) ou **Détacher de la Grille** (pour rompre définitivement le lien).

