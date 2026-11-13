# Ensembles de Rotations Personnalisées

## Aperçu {: #overview }

L'**Éditeur d'Ensembles de Rotations Personnalisées** vous permet de concevoir, modifier et organiser des schémas de rotation de manches sur mesure pour votre circuit. Alors que Race Coordinator AI propose des rotations algorithmiques standard telles que **Round Robin**, **Round Robin Européen**, **Manche Unique** et **Courses Step Up**, les ensembles de rotations personnalisées offrent aux directeurs de course un contrôle manuel intégral, voie par voie, sur la planification des pilotes, l'ordre des manches et l'attribution des voies.

Un **Actif d'Ensemble de Rotations Personnalisées** représente une collection (ou un ensemble) de configurations de rotation individuelles spécifiquement adaptées au nombre de voies physiques d'un circuit (par exemple 2, 4, 6 ou 8 voies). Au sein d'un même actif d'ensemble de rotations personnalisées, vous pouvez définir plusieurs modèles de rotation optimisés pour différents nombres de participants.

Les ensembles de rotations personnalisées sont idéaux pour :

- **Configurations de Circuits Particulières :** Pistes avec des caractéristiques de voie spécifiques, des configurations à handicap ou des exigences de voie des stands.
- **Formats de Club et Règles Locales :** Calendriers de rotation traditionnels de clubs où certains appariements de pilotes ou certaines séquences de voies doivent être scrupuleusement respectés.
- **Séquences d'Étapes et de Relais Fixes :** Courses d'exhibition spéciales, derbys ou formats d'équipe où les séquences algorithmiques Round Robin ne correspondent pas au règlement de l'épreuve.

---

## Fonctionnement des Ensembles de Rotations Personnalisées {: #how-custom-rotations-work }

### Capacité Maximale de Pilotes par Rotation {: #maximum-driver-capacity }

Un actif d'ensemble de rotations personnalisées ne définit pas un calendrier statique unique ; il contient un **ensemble de rotations**, où **chaque rotation spécifie une rotation pour un nombre maximal de pilotes** (`numDrivers`).

Au sein de chaque rotation :

- **Têtes de Série Virtuelles :** Les pilotes sont identifiés par des numéros de tête de série : `Pilote 1`, `Pilote 2`, ... jusqu'à `Pilote N` (où `N` est la capacité maximale de pilotes de la rotation).
- **Attributions de Voies :** Pour chaque manche, chaque voie physique se voit attribuer une tête de série virtuelle spécifique (par exemple Voie 1 : Pilote 1, Voie 2 : Pilote 2), ou reste vide/non attribuée.
- **Placement des Participants :** Au début d'une course, les pilotes inscrits sont affectés aux têtes de série 1 à $M$ selon leur ordre de qualification dans la course (ou un tirage au sort).

Par exemple, un actif « Sprint de Club 4 Voies » peut contenir :

- Une **Rotation à 4 Pilotes :** Un calendrier de 4 manches où 4 pilotes courent chacun une fois sur chacune des 4 voies.
- Une **Rotation à 5 Pilotes :** Un calendrier de 5 manches où 5 pilotes tournent sur les 4 voies, un pilote étant au repos lors de chaque manche.
- Une **Rotation à 6 Pilotes :** Un calendrier de 6 manches assurant un temps de piste équilibré.
- Une **Rotation à 8 Pilotes :** Un calendrier de 8 manches adapté aux pelotons plus nombreux.

---

### Algorithme de Sélection de Rotation {: #rotation-selection-algorithm }

Lorsqu'une course configurée avec un format de rotation personnalisée démarre (ou lors de la génération de l'aperçu en direct des manches dans l'éditeur de course), Race Coordinator AI détermine automatiquement quelle rotation de l'actif utiliser.

Le système compte le nombre de pilotes actifs et participants (`driverCount`) et sélectionne la rotation optimale selon une **stratégie de priorisation stricte à trois niveaux** :

#### 1. Niveau 1 : Correspondance Exacte {: #selection-tier-1 }
Le système recherche d'abord une rotation dont le nombre maximal de pilotes configuré (`numDrivers`) **correspond exactement** au nombre de pilotes actifs (`numDrivers == driverCount`).

- **Résultat :** La rotation exacte est sélectionnée.
- **Mappage des Voies :** Chaque pilote participant correspond 1:1 à sa tête de série virtuelle (le Pilote 1 court en tant que Tête de série 1, le Pilote 2 en tant que Tête de série 2, etc.). Il n'y a aucune voie vide, sauf si la rotation a été explicitement conçue avec des voies inoccupées.

#### 2. Niveau 2 : La Plus Proche au-dessus (Plus Petite Rotation Supérieure au Nombre de Pilotes) {: #selection-tier-2 }
Si aucune rotation ne correspond au nombre exact de pilotes, le système recherche toutes les rotations de l'ensemble dont la capacité est **supérieure** au nombre de pilotes actifs (`numDrivers > driverCount`). Parmi celles-ci, il sélectionne la rotation ayant la **plus petite différence** :

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Résultat :** La rotation supérieure la plus proche est sélectionnée pour garantir que tous les pilotes participants puissent courir.
- **Gestion des Voies Vides :** Comme il y a moins de pilotes présents que prévu lors de la conception de la rotation, tout créneau de voie attribué à une tête de série virtuelle supérieure au nombre de pilotes actifs (`Tête de série > driverCount`) est automatiquement pourvu d'un **emplacement de pilote vide** (`Driver.EMPTY_DRIVER`). Cette voie restera inoccupée pour cette manche, tandis que tous les pilotes participants courront à leurs positions prévues.

#### 3. Niveau 3 : La Plus Proche au-dessous (Plus Grande Rotation Inférieure au Nombre de Pilotes) {: #selection-tier-3 }
Si le nombre de pilotes actifs dépasse la capacité maximale de **toutes** les rotations définies dans l'ensemble (par exemple si 9 pilotes s'inscrivent alors que la plus grande rotation de l'actif n'en accueille que 8), le système utilise la rotation ayant la **plus grande capacité inférieure au nombre de pilotes actifs** :

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Résultat :** La rotation inférieure la plus proche est sélectionnée.
- **Limite de Capacité :** Seuls les pilotes dont la tête de série entre dans la capacité de la rotation choisie (Pilotes 1 à `numDrivers`) seront programmés dans les manches. Les pilotes ayant un indice de tête de série supérieur à `numDrivers` ne recevront aucune affectation de manche.

!!! tip "Conseil de Conception : Couvrez Toutes les Tailles de Peloton"
    Pour vous assurer que tous les pilotes courent sans participants non programmés ni voies vides imprévues, créez une rotation pour chaque taille de peloton attendue (par exemple 4, 5, 6, 7 et 8 pilotes) au sein du même actif d'ensemble de rotations personnalisées.

---

### Exemples Pratiques de Sélection {: #selection-examples }

Supposons que votre actif contienne trois rotations définies : **4 Pilotes**, **6 Pilotes** et **8 Pilotes**. Le tableau ci-dessous illustre la rotation choisie par Race Coordinator AI selon le nombre d'inscrits :

| Pilotes Inscrits | Disponibles dans l'Ensemble | Rotation Sélectionnée | Règle de Sélection | Comportement en Piste et Voies Vides |
| :---: | :---: | :---: | :---: | :--- |
| **4 Pilotes** | 4, 6, 8 | **Rotation 4 Pilotes** | **Niveau 1 (Correspondance Exacte)** | Ajustement parfait. Toutes les voies occupées ; les 4 pilotes courent. |
| **5 Pilotes** | 4, 6, 8 | **Rotation 6 Pilotes** | **Niveau 2 (Plus Proche au-dessus)** | Les créneaux de tête de série 6 sont vides. Les pilotes 1 à 5 courent. |
| **6 Pilotes** | 4, 6, 8 | **Rotation 6 Pilotes** | **Niveau 1 (Correspondance Exacte)** | Ajustement parfait. Toutes les voies occupées ; les 6 pilotes courent. |
| **7 Pilotes** | 4, 6, 8 | **Rotation 8 Pilotes** | **Niveau 2 (Plus Proche au-dessus)** | Les créneaux de tête de série 8 sont vides. Les pilotes 1 à 7 courent. |
| **8 Pilotes** | 4, 6, 8 | **Rotation 8 Pilotes** | **Niveau 1 (Correspondance Exacte)** | Ajustement parfait. Toutes les voies occupées ; les 8 pilotes courent. |
| **9 Pilotes** | 4, 6, 8 | **Rotation 8 Pilotes** | **Niveau 3 (Plus Proche au-dessous)** | Les pilotes 1 à 8 courent. Le pilote 9 n'est pas programmé. |

---

## Création d'un Ensemble de Rotations Personnalisées {: #creating-custom-rotations }

Pour créer un nouvel actif d'ensemble de rotations personnalisées :

1. Ouvrez le **Gestionnaire d'Actifs** depuis le menu principal ou l'écran d'accueil.
2. Dans le panneau de gauche, cliquez sur le bouton **Nouvel Ensemble de Rotations Personnalisées** (ou filtrez par **Ensembles de Rotations Personnalisées** et cliquez sur une carte existante pour la modifier).
3. L'**Éditeur de Rotations** s'ouvre :
   - Lors de la création d'un nouvel actif, l'éditeur affiche initialement une carte d'état vide avec des conseils et un lien **En savoir plus sur les ensembles de rotations personnalisées** renvoyant à cette documentation.
   - Saisissez un **Nom d'Actif** unique dans le panneau de configuration.
   - Sélectionnez votre **Piste** cible. La sélection de la piste configure automatiquement le nombre de voies pour toutes les rotations de l'ensemble.

---

## Conception des Manches et des Voies {: #designing-heats }

### Ajout de Rotations à l'Ensemble {: #adding-rotations }

1. Cliquez sur le bouton **Ajouter une Rotation** (`+`) dans la barre d'outils supérieure pour créer votre première carte de rotation.
2. Renseignez le champ **Nombre de Pilotes** dans l'en-tête de la carte. Cela définit la capacité maximale de pilotes pour cette rotation spécifique.
3. Saisissez éventuellement une **Description** (étiquette) dans l'en-tête pour identifier la rotation (par exemple, `EURO D18 G3-666 X>1`, `Format Sprint` ou `Exhibition`). Lors de la création d'une nouvelle rotation, ce champ est initialement vide ; lors de l'importation d'un fichier, il adopte par défaut le nom du fichier importé.
4. La carte se remplit automatiquement avec une manche initiale contenant les emplacements de voies pour votre circuit.

### Ajout et Réorganisation des Manches {: #adding-heats }

- **Ajouter une Manche :** Cliquez sur l'icône `+` dans l'en-tête de la rotation pour ajouter des manches supplémentaires.
- **Réorganiser les Manches :** Glissez-déposez les cartes de manches dans la grille pour modifier la séquence de course.
- **Supprimer une Manche :** Cliquez sur l'icône de corbeille d'une carte de manche pour la supprimer.

### Attribution des Pilotes aux Voies {: #assigning-drivers }

- **Bassin de Pilotes Virtuels :** Le panneau de gauche propose un réservoir de pilotes virtuels (`Pilote 1`, `Pilote 2`, etc.). Vous pouvez ajuster le nombre de pilotes du bassin pour générer autant de têtes de série que nécessaire.
- **Réserve de Pilotes de Montée :** Située juste en dessous du bassin des pilotes virtuels, fournissant des jetons de qualification dynamique pour les courses Step Up (voir [Courses Step Up & Paliers de Progression](#step-up-races) ci-dessous).
- **Glisser-Déposer :** Faites glisser les jetons de pilotes depuis le bassin directement vers les créneaux de voie d'une manche.
- **Échange de Voies :** Faites glisser un jeton de pilote d'une voie à une autre pour échanger leurs affectations.
- **Vider une Voie :** Retirez un pilote d'une voie pour la laisser inoccupée (vide).

### Affectation des Groupes {: #group-assignments }

Chaque carte de manche comporte un champ de saisie pour le **Groupe** :

- Attribuez des manches à différents numéros de groupe (par exemple Groupe 1, Groupe 2) lors de courses par étapes ou par groupes.
- Les pilotes de groupes distincts courent indépendamment, et les classements peuvent être séparés par groupe dans la configuration de course.

### Validation de l'Équité des Voies {: #lane-equality-validation }

L'équité est primordiale en slot racing. Race Coordinator AI valide en permanence la répartition des voies pour chaque rotation :

- **Badge de Validation (Vert) :** Indique que chaque pilote court un nombre égal de fois sur chaque voie au cours de la rotation.
- **Badge d'Avertissement (Orange) :** Indique que les attributions de voies sont déséquilibrées (par exemple, le Pilote 1 court deux fois sur la Voie 1 mais jamais sur la Voie 4).
- **Rapport d'Équité :** Cliquez sur le badge d'équité pour ouvrir le **Rapport Détaillé d'Équité des Voies**, affichant une matrice du nombre précis de passages de chaque pilote sur chaque voie.

### Tri des Rotations {: #sorting-rotations }

Cliquez sur le bouton **Trier les Rotations** (`swap_vert`) dans la barre de titre pour organiser automatiquement toutes les cartes de rotation par ordre croissant selon leur capacité maximale de pilotes.

---

## Courses Step Up & Paliers de Progression {: #step-up-races }

Race Coordinator AI prend pleinement en charge les **courses Step Up** (également appelées courses à échelle, progression par finales ou bump-up) au sein des ensembles de rotations personnalisées. Dans un format step up, l'événement est divisé en plusieurs paliers ou tours ascendants—tels que **Finale D $\rightarrow$ Finale C $\rightarrow$ Finale B $\rightarrow$ Finale A**. Les concurrents les moins bien classés s'affrontent lors des premiers paliers, et les meilleurs pilotes sont promus ("Step Up") vers les paliers suivants pour y défier les têtes de série directement qualifiées dans ces niveaux supérieurs.

### Réserve de Pilotes de Montée {: #step-up-driver-pool }

Le panneau latéral gauche comprend un réservoir dédié à la **Montée** situé directement sous la liste des pilotes virtuels :

- **Configuration du Nombre de Montées :** Saisissez le nombre de places de montée souhaité dans le champ **Nombre de pilotes**. Par défaut, cette valeur s'initialise au nombre de voies de la piste moins une ($\text{numLanes} - 1$), mais peut être ajustée librement entre 1 et 99.
- **Jetons de Montée :** Les pilotes virtuels de montée sont identifiés par une icône de flèche vers le haut (`arrow_upward`) et des libellés numérotés (`Montée 1`, `Montée 2`, etc.).
- **Attribution aux Voies :** Glissez-déposez les jetons de montée sur les voies des manches appartenant au Palier 2 ou supérieur. Pendant la course, ces emplacements temporaires seront automatiquement remplis par les pilotes qualifiés issus du palier précédent.

### Frontières de Montée et Paliers {: #step-up-boundaries }

La progression entre les niveaux est encadrée par des **Frontières de Montée** :

- **Activation des Frontières :** L'en-tête de chaque carte de manche comprend un bouton **Frontière de montée**. Cliquez sur ce bouton pour désigner la manche comme la manche finale décisive de ce palier.
- **Style Visuel :** Les manches frontières sont mises en évidence par un badge actif et une bordure colorée distinctive afin de repérer immédiatement les étapes charnières du programme.
- **Calcul Automatique des Paliers :** Définir une manche comme frontière fait automatiquement passer toutes les manches suivantes de ce groupe au palier supérieur de l'échelle (par exemple, les manches du Palier 1 basculent au **Palier 2**, puis au **Palier 3**, etc.). Le palier actif s'affiche dans le badge de titre de la manche (`- Palier N`).
- **Promotion Dynamique le Jour de la Course :** Dès que la manche frontière se termine lors de la journée de course, le moteur calcule le classement cumulé du palier et place instantanément les pilotes les mieux classés sur les positions `Montée 1`, `Montée 2`, etc. du palier suivant.

### Nombre Variable de Montées par Palier {: #variable-step-ups }

Contrairement aux courses step up algorithmiques standard qui imposent un nombre fixe et uniforme de montées à chaque niveau (par exemple, 2 pilotes promus à chaque étape), les ensembles de rotations personnalisées autorisent des **montées variables par palier** :

- **Schémas de Progression Personnalisés :** Vous pouvez déterminer des quotas de montée distincts pour chaque palier. Par exemple :
  - **Palier 1 (Finale D) :** Les 2 meilleurs pilotes montent au Palier 2 (`Montée 1` et `Montée 2`).
  - **Palier 2 (Finale C) :** Les 3 meilleurs pilotes montent au Palier 3 (`Montée 1`, `Montée 2` et `Montée 3`).
  - **Palier 3 (Finale B) :** Seul le 1 meilleur pilote monte en Finale A (`Montée 1`).
- Le moteur de course examine les jetons de montée assignés dans chaque palier et qualifie avec exactitude le nombre de pilotes requis.

### Règles et Validation des Montées {: #step-up-validation }

L'éditeur applique des règles de contrôle fondamentales :

- **Aucun Pilote de Montée au Palier 1 :** Le Palier 1 est la manche inaugurale où tous les concurrents doivent être des pilotes réguliers inscrits. Assigner un pilote de montée au Palier 1 est interdit puisqu'aucun tour préalable n'existe pour générer des qualifiés. L'éditeur affiche une icône d'avertissement (`warning`) précisant *"Le palier 1 ne peut pas contenir de pilotes de montée."*, et le serveur refusera l'enregistrement de configurations non conformes au palier 1.
- **Groupes Indépendants :** Lorsque plusieurs groupes sont configurés (par exemple Groupe 1 et Groupe 2), les échelles de progression et les montées sont calculées de façon totalement indépendante au sein de chaque groupe.
- **Protection de l'Ordre Séquentiel :** Les courses step up requièrent un déroulement chronologique rigoureux afin d'établir les qualifiés avant d'engager le palier suivant. De ce fait, les options telles que **Tours de Manches Complets** ($> 1$) et **Inverser les Manches** sont automatiquement désactivées pour les courses comportant des montées afin de préserver la hiérarchie.

---

## Importation et Exportation de Rotations {: #importing-exporting }

Vous pouvez partager des rotations entre différents systèmes ou les archiver :

- **Exporter l'Actif Complet :** Cliquez sur le bouton **Exporter** dans la barre d'outils supérieure pour télécharger l'ensemble de l'actif d'ensemble de rotations personnalisées au format `.json`.
- **Exporter une Rotation Individuelle :** Cliquez sur l'icône d'exportation (`upload`) d'une carte de rotation pour exporter uniquement cette configuration de pilotes.
- **Importer des Rotations :** Cliquez sur **Importer** pour charger des fichiers `.json` ou d'anciens fichiers Race Coordinator (`.txt` au format RC1) dans votre actif. La description de la rotation reprend automatiquement par défaut le nom du fichier importé.

---

## Utilisation des Ensembles de Rotations Personnalisées en Course {: #using-in-races }

Une fois votre actif d'ensemble de rotations personnalisées enregistré :

1. Ouvrez l'[Éditeur de Course](race-editor.md).
2. Dans la section **Configuration de Course** du panneau de gauche, réglez le **Format de Rotation des Manches** sur **Ensemble de rotations personnalisées**.
3. Sélectionnez votre actif d'ensemble de rotations personnalisées dans le menu déroulant **Ensemble de rotations personnalisées**.
4. Ajustez les paramètres de course selon vos besoins :
   - **Tours de Manches Complets :** Répète la séquence complète de rotation personnalisée $N$ fois (désactivé si des montées sont présentes).
   - **Inverser les Manches :** Inverse l'ordre des manches pour courir la séquence à l'envers (désactivé si des montées sont présentes).
5. **Intégration Step Up :** Si votre rotation personnalisée comporte des frontières et des pilotes de montée, Race Coordinator AI gère automatiquement la promotion des pilotes tout au long de la compétition. Dans l'**Aperçu des Manches en Direct**, les paliers initiaux affichent les pilotes assignés tandis que les paliers supérieurs présentent des jetons d'attente qui se complèteront le jour de la course.
6. Utilisez le curseur d'**Aperçu du Nombre de Pilotes** et examinez l'**Aperçu des Manches en Direct** dans le panneau de droite pour vérifier les affectations avant le jour de course.
