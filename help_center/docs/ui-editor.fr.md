# Éditeur d'Interface

## Présentation

L'Éditeur d'Interface vous permet de concevoir des mises en page de jour de course personnalisées, de configurer les colonnes du classement des pilotes, de personnaliser les effets sonores et les images des thèmes et de charger des [Widgets personnalisés](custom-widgets.md) modulaires.

## Configuration de la mise en page et des colonnes

- Glissez-déposez des widgets depuis la palette sur le canevas.
- Redimensionnez, repositionnez et alignez les widgets selon votre résolution. Tous les widgets restent délimités à l'intérieur du canevas.
- **Contrôles de l'Inspecteur de Widgets** :
  - **Position & Taille** : Positionnez et dimensionnez avec précision le widget sélectionné à l'aide des entrées numériques **X**, **Y**, **Largeur** et **Hauteur**.
  - **Supprimer le widget** : Cliquez sur l'icône de corbeille dans l'en-tête de l'inspecteur.
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
  - **Jamais** : Limite le minuteur uniquement aux secondes entières.
- **Aperçu en direct** : L'inspecteur comprend un aperçu en direct immédiat montrant la mise en forme aux différents points de passage de la course (`> 1 hr`, `> 1 min`, `< 1 min` et `< 10s`).

## Configuration du widget de compte à rebours

Le widget **Compte à rebours** affiche les feux visuels de départ et déclenche les sons correspondants pendant la procédure de départ :

- **Nombre maximal de feux** : Définit le nombre maximal de feux à afficher (5 par défaut, plage de 1 à 10). Lorsque la durée du départ dépasse cette valeur (par exemple, un départ de 6 secondes avec 5 feux au maximum), tous les feux restent éteints/atténués pendant la différence initiale (1 seconde) avant de s'illuminer consécutivement.
- **Animation de fondu d'apparition** : Détermine si l'incrustation des feux et le flou d'arrière-plan apparaissent avec une transition progressive. Si désactivée, les feux et le fond s'affichent instantanément.
- **Orientation** : Basculez entre une disposition **Horizontale** et **Verticale**.
- **Effets de lueur et de flou** : Personnalisez le halo lumineux des lampes, l'agrandissement lors de l'activation des feux rouges/verts, ainsi que l'intensité et la zone du flou d'arrière-plan.

