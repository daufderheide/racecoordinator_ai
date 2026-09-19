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
  - Choisissez la direction (**Horizontale** côte à côte ou **Verticale** superposée), le nombre total de voies/positions cibles (2 à 8), le mode d'espacement (**Ajuster au Canevas** ou **Conserver l'Espacement**) et le remplacement facultatif des widgets existants.
  - L'éditeur de disposition duplique, repositionne, renumérote et relie automatiquement les cartes sur l'ensemble des voies ou positions sélectionnées en un seul clic.

