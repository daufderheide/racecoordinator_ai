# Éditeur d'Interface

## Présentation

L'Éditeur d'Interface vous permet de concevoir des mises en page de jour de course personnalisées, de configurer les colonnes du classement des pilotes, de personnaliser les effets sonores et les images des thèmes et de charger des [Widgets personnalisés](custom-widgets.md) modulaires.

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
