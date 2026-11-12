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
   - **Tours de Manches Complets :** Répète la séquence complète de rotation personnalisée $N$ fois.
   - **Inverser les Manches :** Inverse l'ordre des manches pour courir la séquence à l'envers.
5. Utilisez le curseur d'**Aperçu du Nombre de Pilotes** et examinez l'**Aperçu des Manches en Direct** dans le panneau de droite pour vérifier les affectations avant le jour de course.
