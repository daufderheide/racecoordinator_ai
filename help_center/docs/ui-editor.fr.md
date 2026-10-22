# Éditeur d'Interface

## Présentation

L'Éditeur d'Interface vous permet de concevoir des mises en page de jour de course personnalisées, de configurer les colonnes du classement des pilotes, de personnaliser les effets sonores et les images des thèmes et de charger des [Widgets personnalisés](custom-widgets.md) modulaires.

## Widgets personnalisés et dossier de widgets

Des widgets personnalisés peuvent être ajoutés à vos dispositions d'interface personnalisées :
- **Dossier de widgets personnalisés** : Définissez votre dossier local de widgets dans la section **Interface personnalisée** au bas de l'éditeur.
- **Mettre à jour les widgets d'exemple** : Cliquez sur **Mettre à jour les widgets d'exemple** pour générer ou mettre à jour des widgets d'exemple prêts à l'emploi dans un dossier `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Groupes de la bibliothèque de widgets** : La bibliothèque de widgets organise les widgets en groupes (**Race Coordinator AI**, **Racine personnalisée** et dossiers personnalisés tels que **sample**) avec des sous-groupes imbriqués (comme **Actions** et **Données de manche** avec des sous-dossiers catégorisés) et un filtre de recherche instantané.
- **Configuration dynamique** : Lorsqu'un widget personnalisé est sélectionné sur le canevas, ses propriétés personnalisées (couleurs, seuils, bascules, champs de texte) apparaissent dynamiquement dans la Configuration de widgets.

Pour tous les détails sur le développement de widgets, consultez le [Guide des widgets personnalisés](custom-widgets.md).

## Configuration de la mise en page et des colonnes

- Glissez-déposez des widgets depuis la palette sur le canevas.
- Redimensionnez, repositionnez et alignez les widgets selon votre résolution. Tous les widgets restent délimités à l'intérieur du canevas.
- **Contrôles de la Configuration de Widgets** :
  - **Position & Taille** : Positionnez et dimensionnez avec précision le widget sélectionné à l'aide des entrées numériques **X**, **Y**, **Largeur** et **Hauteur**.
  - **Supprimer le widget** : Cliquez sur l'icône de corbeille dans l'en-tête de configuration.
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
- **Aperçu en direct** : Le panneau de configuration comprend un aperçu en direct immédiat montrant la mise en forme aux différents points de passage de la course (`> 1 hr`, `> 1 min`, `< 1 min` et `< 10s`).

> [!NOTE]
> Ces mêmes options de formatage horaire (préréglages de format d'affichage, modes de sous-secondes, seuil et curseur de décimales avec aperçu en direct) sont également prises en charge pour les widgets de **Temps Total** (Temps Total de Manche et Temps Total de Course/Général) ainsi que pour les colonnes de **Temps Total** dans la Vue des Voies. Dans la liste des colonnes de la Vue des Voies, cliquez sur l'icône des options de temps (<span class="material-icons">more_time</span>) à côté de toute colonne de Temps Total pour personnaliser son format.

## Configuration du widget de compte à rebours

Le widget **Compte à rebours** affiche les feux visuels de départ et déclenche les sons correspondants pendant la procédure de départ :

- **Nombre maximal de feux** : Définit le nombre maximal de feux à afficher (5 par défaut, plage de 1 à 10). Lorsque la durée du départ dépasse cette valeur (par exemple, un départ de 6 secondes avec 5 feux au maximum), tous les feux restent éteints/atténués pendant la différence initiale (1 seconde) avant de s'illuminer consécutivement.
- **Animation de fondu d'apparition** : Détermine si l'incrustation des feux et le flou d'arrière-plan apparaissent avec une transition progressive. Si désactivée, les feux et le fond s'affichent instantanément.
- **Orientation** : Basculez entre une disposition **Horizontale** et **Verticale**.
- **Effets de lueur et de flou** : Personnalisez le halo lumineux des lampes, l'agrandissement lors de l'activation des feux rouges/verts, ainsi que l'intensité et la zone du flou d'arrière-plan.

## Widgets de Colonne de Voie et Duplication

Le widget **Colonne de Voie** permet de positionner des colonnes individuelles de données provenant de la vue de voie (telles que les informations du pilote, le temps du dernier tour, le meilleur tour / record personnel, le niveau de carburant %, l'historique des tours, les vitesses de secteur, la position, etc.) n'importe où sur le canevas sous la forme de cartes modulaires indépendantes.

- **Pilote Cible et Cartes Individuelles** :
  - Les cartes placées hors grille sélectionnent le pilote à afficher : par **Voie de Piste** (Voie 1 à Voie 8), par **Position de Série** (1ère, 2e, etc.), par rang au **Classement Général** ou par **Tête de Série**.

### Sources de Données de Grille : Données de Série vs. Données Générales de Course

Chaque grille de données dans l'Éditeur d'Interface dispose d'un paramètre **Source de données** dans l'onglet Grille, qui définit quels pilotes alimentent les lignes :

- **Données de Série (`heat`)** :
  - **Portée des Pilotes** : Lié exclusivement aux participants en compétition dans la série en cours sur la piste (`heatDrivers`).
  - **Comportement d'Affichage** : Seuls les pilotes actuellement en piste dans la série active sont affichés. Les pilotes au repos ou programmés dans d'autres séries sont exclus.
  - **Pagination & Défilement** : Le nombre de lignes est strictement restreint aux pilotes de la série active et aux voies physiques. La grille ne défile jamais au-delà des participants actifs vers des lignes vides.
- **Données Générales de Course (`overall`)** :
  - **Portée des Pilotes** : Lié à **tous les participants inscrits** sur l'ensemble de l'épreuve ou du tournoi (`participants`).
  - **Comportement d'Affichage** : Tout pilote inscrit peut être affiché dans la grille, qu'il soit en piste dans la série active ou en pause aux stands.
  - **Pagination & Défilement** : Le décompte des lignes reflète l'ensemble des engagés du tournoi (ex. 16, 24 ou 32 pilotes répartis sur plusieurs séries). Si la grille comporte moins de lignes visibles que de participants au total, elle prend en charge le défilement automatique multipage pour faire défiler tout le classement général.
  - **Pilotes Hors Piste** : Pour les pilotes qui ne sont pas en piste, les statistiques cumulées de l'épreuve sont renseignées automatiquement.

### Widgets : Widgets de Données de Série vs. Widgets de Données Générales

La Boîte à outils organise les colonnes et cartes de données en groupes **Données de Série** et **Données Générales**. Le choix du widget détermine quelles statistiques sont calculées et présentées pour chaque ligne :

- **Widgets de Données de Série** (ex. *Compteur de Tours, Temps du Dernier Tour, Meilleur Tour de Série, Temps de Secteur, Temps de Réaction, Position / Rang de Série, Écarts de Série, Carburant / Télémétrie, Rythme Fantôme*) :
  - Extraient des métriques calculées strictement pour la **série active**.
  - **Dans une Grille de Données de Série** : Chaque ligne affiche la télémétrie en temps réel et les temps au tour des véhicules actuellement en course.
  - **Dans une Grille de Données Générales** : Les pilotes en piste affichent leur télémétrie en direct ; les pilotes au repos ou inactifs affichent des tirets (`--`) ou des zéros pour les métriques de série, car ils n'ont pas de données de série en cours.
- **Widgets de Données Générales de Course** (ex. *Rang Général, Tours Totaux, Tours Physiques Totaux, Temps Total Général, Meilleur Tour de Course, Moyenne Générale, Médiane Générale, Régularité Générale, Écarts Généraux, Probabilité de Victoire / Prédictions, Manches Disputées / Manches Restantes*) :
  - Extraient les performances cumulées sur **toutes les séries terminées** du tournoi.
  - **Dans une Grille de Données Générales** : Chaque ligne de pilote (qu'il soit en piste ou aux stands entre deux séries) affiche l'intégralité de ses statistiques globales, ses tours cumulés, son record de l'épreuve et son rang général.
  - **Dans une Grille de Données de Série** : Les pilotes actifs affichent leur rang général et leurs statistiques globales aux côtés de leurs tours de série en direct (ex. observer la position générale tout en suivant la course en cours).

#### Widget Manches Disputées & Restantes

Le widget **Manches Disputées** (`heatsRaced`) présente l'état d'avancement des manches pour chaque concurrent :

- **Manches Disputées (Mode par Défaut)** : Affiche le nombre de manches que le pilote a déjà disputées ou dispute actuellement dans l'épreuve.
- **Mode Manches Restantes** : Lorsque le paramètre **Mode d'affichage des manches** passe de *Manches disputées* à *Manches restantes*, la carte indique le nombre de manches programmées qu'il lui reste à courir. Sans étiquette d'en-tête personnalisée, l'intitulé passe automatiquement de `MANCHES DISPUTÉES` à `MANCHES RESTANTES`.
- Ce réglage est également disponible pour les encarts (insets) associés aux cartes de colonnes.

#### Widgets d'Écarts (Gaps et Intervalles)

Race Coordinator AI prend en charge **4 widgets d'écart distincts** aussi bien pour les Données de Série que pour les Données Générales :

1. **Écart avec le Meneur (`gapLeader` / `overallGapLeader`)** : Projection continue du retard chronométrique estimé par rapport au meneur (P1).
2. **Écart avec la Position Précédente (`gapPosition` / `overallGapPosition`)** : Projection continue du retard chronométrique estimé par rapport à la voiture immédiatement devant.
3. **Écart Formule 1 avec le Meneur (`gapLeaderF1` / `overallGapLeaderF1`)** : Différentiel exact sur la ligne d'arrivée dans le même tour ou retard en tours (`+1 Tour`, `+N Tours`) en cas de dépassement.
4. **Écart Formule 1 avec la Position Précédente (`gapPositionF1` / `overallGapPositionF1`)** : Différentiel exact sur la ligne d'arrivée par rapport à la voiture précédente dans le même tour ou retard en tours (`+1 Tour`, `+N Tours`).

Pour consulter les formules mathématiques complètes et les spécifications de chronométrage, reportez-vous au [Guide des Calculs d'Écarts](gap-calculations.md).

### Tri de Grille & Matrice d'Interaction

Le menu déroulant **Tri de la Grille** dans l'onglet Grille détermine l'ordre des lignes. Son comportement dépend directement du réglage de la **Source de données** (**Données de Série** ou **Données Générales**) :

| Option de Tri | Dans une Grille de Série (`gridType: heat`) | Dans une Grille Générale (`gridType: overall`) |
| :--- | :--- | :--- |
| **Voie de Piste** | Ordre statique par voie physique (Voie 1, Voie 2, ...). Chaque ligne est attachée à une voie spécifique et à son pilote en piste. | Les pilotes actifs en piste apparaissent en premier par numéro de voie (Voie 1, Voie 2, ...), suivis de tous les participants inactifs classés selon leur rang général. |
| **Position de Série** | Réordonnancement dynamique en temps réel selon la position dans la série en cours (1ère, 2e, 3e de la série). Les lignes permutent en direct lors des passages sur la ligne ou des dépassements. | Les pilotes actifs apparaissent en haut classés selon leur position dans la série (1er, 2e, ...), suivis de tous les participants inactifs triés selon le classement général. |
| **Classement Général** | Trie **uniquement les pilotes de la série active** selon leur classement général dans l'épreuve. (Par exemple, si les 2e, 5e, 8e et 14e au général courent ensemble, les 4 lignes les classent #2, #5, #8, #14). Aucun pilote extérieur n'apparaît et aucune ligne vide n'est générée. | Trie **l'ensemble des participants du tournoi** selon le classement général de l'épreuve (1er général, 2e général, 3e général, ...). L'ensemble du tableau se réorganise en direct lors des mises à jour de points et de tours. |
| **Tête de Série** | Trie les pilotes de la série active selon leur numéro initial de qualification/classement (plus petit numéro en premier). | Trie tous les participants de l'épreuve par leur numéro initial de tête de série (1, 2, 3, ...) sur l'ensemble du plateau. |
- **Orientation** : Prend en charge les dispositions **Verticale** (en-tête au-dessus de la valeur) et **Horizontale** (en-tête et valeur côte à côte).
- **Style et Personnalisation de la Barre de Titre** :
  - La barre de titre reprend par défaut l'apparence exacte de l'en-tête de colonne de la vue de voie (arrière-plan sombre semi-transparent `rgba(68, 68, 68, 0.7)`, texte blanc en gras, coins supérieurs arrondis et bordure de séparation).
  - **Afficher l'En-tête** : Active ou désactive la barre de titre. Lorsqu'elle est désactivée, elle est totalement retirée de la carte afin de maximiser l'espace dédié aux valeurs principales et aux incrustations.
  - **En-tête Personnalisé** : Remplace le nom du champ de données par défaut par un titre sur mesure.
  - **Typographie et Alignement** : Personnalisez la police, la taille du texte et son alignement (Gauche, Centré, Droite).
  - **Couleur du Texte et d'Arrière-plan** : Modifiez la couleur de fond et la couleur du texte de l'en-tête avec des sélecteurs dédiés et un bouton de réinitialisation instantanée.
- **Héritage des Couleurs et Personnalisation** : Par défaut, les cartes héritent des couleurs de fond et de texte de la voie attribuée (`Utiliser les Couleurs de Voie`), ou peuvent être personnalisées avec des couleurs d'arrière-plan, de texte et de bordure spécifiques.
- **Dupliquer sur les Voies / Positions** :
  - Au lieu de créer et d'aligner manuellement les cartes pour chaque voie, configurez un ensemble pour une seule voie ou position et cliquez sur **Dupliquer sur les Voies / Positions...** dans le panneau de configuration.
  - Choisissez la direction (**Horizontale** côte à côte ou **Verticale** superposée), le nombre total de voies/positions cibles (par défaut le nombre maximal de voies de tous les circuits de la base de données), le mode d'espacement (**Ajuster au Canevas** ou **Conserver l'Espacement**) et le remplacement facultatif des widgets existants.
  - **Mode de Réplication en Temps Réel** : Lors de la duplication, l'éditeur bascule dans un mode de modèle interactif avec repères visuels de voie et alignement magnétique. Dans ce mode, vous placez, redimensionnez et personnalisez les widgets directement sur la Voie 1 (Maître), et les modifications sont immédiatement répercutées en temps réel sur l'ensemble des voies. Les widgets clonés sur les voies 2..N sont des aperçus en direct non modifiables ; cliquer sur un widget cloné renvoie la sélection sur le maître de la Voie 1.
  - **Zone Intelligente et Redimensionnement** : L'espace de réplication s'agrandit automatiquement dans les quatre directions pour occuper l'espace disponible sur le canevas jusqu'à rencontrer les limites d'un widget extérieur à la grille. Vous pouvez ajuster la zone globale à l'aide des 8 poignées de redimensionnement périmétriques de la superposition.
  - Cliquez sur **Terminé** pour figer la grille en widgets indépendants.
  - **Modifier le Modèle et Détacher** : En sélectionnant ultérieurement un widget de la grille, la Configuration de widgets propose un panneau permettant de cliquer sur **Modifier le Modèle de Grille** (pour réactiver à tout moment le mode de réplication en temps réel) ou **Détacher de la Grille** (pour rompre définitivement le lien).

### Synchronisation de Grille : Refléter les colonnes vs. Refléter les lignes

Une grille dans Race Coordinator AI est une matrice à deux dimensions articulée autour d'emplacements de concurrents et de métriques de données :

- **Orientation Verticale (Par défaut)** :
  - **Lignes (Emplacements des Concurrents)** : Représentent chaque voie physique du circuit (**Voie 1, Voie 2, ...**) ou chaque position de course (**Position 1, Position 2, ...**).
  - **Colonnes (Champs de Données)** : Représentent chaque métrique de données affichée dans un emplacement (par exemple, *Nom du Pilote, Nombre de Tours, Dernier Tour, Meilleur Tour, Écart, Image du Véhicule*).
  - **Refléter les colonnes** : Régit la synchronisation du style visuel sur toutes les colonnes de données.
  - **Refléter les lignes** : Pilote la réplication de ligne à ligne et la géométrie depuis la **Ligne Maître (Voie 1 / Position 1)** vers l'ensemble des autres lignes (**Voies 2..N**).
- **Orientation Horizontale** :
  - **Colonnes (Emplacements des Concurrents)** : Représentent chaque voie physique du circuit (**Voie 1, Voie 2, ...**) ou chaque position de course (**Position 1, Position 2, ...**). Chaque voie dans une vue de manche est une colonne.
  - **Lignes (Champs de Données)** : Représentent les métriques de données empilées verticalement au sein de chaque voie.
  - **Refléter les colonnes** : Pilote la réplication de colonne à colonne, la géométrie et le style depuis la **Colonne Maître (Voie 1 / Position 1)** vers l'ensemble des autres colonnes (**Voies 2..N**). Lorsque décoché, les colonnes (voies) deviennent indépendantes et le bouton **Refléter à nouveau sur toutes les colonnes** apparaît.
  - **Refléter les lignes** : Régit la synchronisation du style visuel sur l'ensemble des lignes de données (métriques).

L'Inspecteur de grille met à disposition deux commandes clés dans la section **Structure et disposition de la grille** : **Refléter les colonnes** et **Refléter les lignes**.

#### Refléter les colonnes

**Refléter les colonnes** synchronise les colonnes sur l'ensemble de la grille :
- En **Orientation Verticale**, les colonnes représentent différents champs/métriques de données. Refléter les colonnes harmonise le style visuel entre ces colonnes métriques.
- En **Orientation Horizontale**, les colonnes représentent les voies ou positions individuelles du circuit. Refléter les colonnes régit la réplication, le dimensionnement et le style depuis la **Colonne Maître (Voie 1 / Position 1)** vers l'ensemble des voies concurrentes.

- **Coché (Par défaut)** :
  - Les colonnes partagent des styles liés (en orientation verticale) ou une réplication complète du modèle maître (en orientation horizontale).
  - Toute modification apportée au maître se propage instantanément à toutes les colonnes.
  - **Propriétés Synchronisées** :
    - **Style d'En-tête** : Police, taille du texte, couleur du texte, couleur de fond, alignement du texte et dimensions de l'en-tête.
    - **Style de Cellule de Données** : Police, taille du texte, couleur du texte, couleur d'arrière-plan, bascule des couleurs de voie (`useLaneColors`) et alignement des valeurs.
    - **Style de Bordure** : Affichage de la bordure, couleur, épaisseur et rayon des coins.
    - **Format de Temps** : Nombre de décimales, format d'affichage et seuils de précision sub-seconde.
    - **Mise en Valeur Télémétrique** : Surbrillance lors du passage de tour.
- **Décoché** :
  - Dissocie la synchronisation des colonnes.
  - En orientation verticale, chaque colonne de données peut avoir ses propres polices, couleurs et bordures, et des boutons permettent d'appliquer manuellement les styles à toutes les colonnes.
  - En orientation horizontale, chaque colonne de voie devient indépendante, les widgets affichent le badge **Indépendant** (par exemple, `Voie 2 (Indépendant)`), et le bouton **Refléter à nouveau sur toutes les colonnes** apparaît.
- **Comportement lors du Recochage** :
  - Réactive la synchronisation des colonnes. En orientation horizontale, recocher la case ou cliquer sur **Refléter à nouveau sur toutes les colonnes** synchronise immédiatement toutes les colonnes avec la voie maître.

#### Refléter les lignes

**Refléter les lignes** synchronise les lignes sur l'ensemble de la grille :
- En **Orientation Verticale**, les lignes représentent les voies ou positions individuelles du circuit. Refléter les lignes régit la réplication et la géométrie de ligne à ligne depuis la **Ligne Maître (Voie 1 / Position 1)** vers toutes les autres lignes (**Voies 2..N**).
- En **Orientation Horizontale**, les lignes représentent les différents champs ou métriques empilés dans chaque voie. Refléter les lignes régit la synchronisation du style visuel entre les lignes métriques.

- **Coché (Par défaut)** :
  - Les lignes suivent strictement le modèle maître (en orientation verticale) ou partagent des styles synchronisés (en orientation horizontale).
  - Tout déplacement, redimensionnement ou modification apportée à la cellule maître se répercute instantanément en direct sur l'ensemble des autres voies ou positions.
  - En orientation verticale, les widgets non-maîtres affichent le badge **Cloné** (par exemple, `Voie 2 (Cloné)`).
- **Décoché** :
  - Désolidarise les lignes.
  - En orientation verticale, les lignes non-maîtres affichent le badge **Indépendant** (par exemple, `Voie 2 (Indépendant)`), les voies peuvent être personnalisées individuellement, et le bouton **Refléter à nouveau sur toutes les lignes** apparaît.
  - En orientation horizontale, chaque ligne métrique peut avoir ses propres styles sans affecter les autres lignes.
- **Comportement lors du Recochage** :
  - Réactive la réplication et la synchronisation des lignes. En orientation verticale, cliquer sur **Refléter à nouveau sur toutes les lignes** ou recocher la case réaligne instantanément toutes les lignes sur la ligne maître.

#### Tableau Récapitulatif

| Contrôle | Orientation | Portée | Éléments Synchronisés | Comportement lorsque Décoché | Comportement lors du Recochage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Refléter les colonnes** | Verticale | Colonnes (Métriques de Données) | Style visuel : polices, tailles, couleurs, bordures, en-têtes, formats horaires | Les colonnes deviennent indépendantes ; les styles actuels sont conservés ; boutons « Appliquer à toutes » affichés | Réactive la synchronisation automatique pour les futures éditions |
| **Refléter les colonnes** | Horizontale | Colonnes (Voies / Concurrents) | Géométrie, réplication et styles depuis la Voie 1 Maître vers toutes les colonnes de voies | Les colonnes de voies deviennent indépendantes ; badge `Indépendant` affiché ; bouton `Refléter à nouveau sur toutes les colonnes` affiché | Rétablit la réplication maître ; réaligne toutes les colonnes sur le Maître |
| **Refléter les lignes** | Verticale | Lignes (Voies / Concurrents) | Géométrie, réplication et réglages depuis la Voie 1 Maître vers toutes les lignes de voies | Les lignes de voies deviennent indépendantes ; badge `Indépendant` affiché ; bouton `Refléter à nouveau sur toutes les lignes` affiché | Rétablit la réplication maître ; réaligne toutes les lignes sur le Maître |
| **Refléter les lignes** | Horizontale | Lignes (Métriques de Données) | Style visuel : polices, tailles, couleurs, bordures entre lignes de métriques | Les lignes de métriques deviennent indépendantes ; les styles actuels sont conservés | Réactive la synchronisation automatique pour les futures éditions |


