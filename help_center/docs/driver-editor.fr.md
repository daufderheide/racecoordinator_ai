# Éditeur de Pilotes

L'**Éditeur de Pilotes** vous permet de créer, afficher et personnaliser les profils de pilotes, surnoms, avatars et annonces audio personnalisées.

## Vue d'ensemble

L'Éditeur de Pilotes regroupe la sélection et la modification des pilotes dans une interface unifiée :

- **Sélecteur de Pilote** : Situé dans l'en-tête supérieur à côté du titre, ce menu déroulant répertorie tous les pilotes existants et permet d'alterner rapidement entre eux.
- **Mode Lecture Seule** : Par défaut, l'éditeur affiche les détails en mode lecture seule. Les champs sont verrouillés pour empêcher toute modification accidentelle, tout en permettant d'écouter les fichiers audio.
- **Mode Édition** : En cliquant sur l'icône **Modifier** (crayon) de la barre d'outils, les champs deviennent modifiables. En mode édition, le sélecteur de pilote est verrouillé pour éviter de perdre les données non enregistrées.
- **Enregistrer les modifications** : En cliquant sur l'icône **Fin de modification** (coche), les modifications sont validées, enregistrées sur le serveur et l'éditeur repasse en mode lecture seule.
- **Abandonner les modifications** : Si vous tentez de quitter l'éditeur avec des modifications non enregistrées, une boîte de dialogue vous demande confirmation. En cas d'abandon, toutes les modifications reviennent à la version précédente.

## Actions de la barre d'outils

La barre d'outils supérieure offre les actions suivantes :

- **Retour** : Revient à la vue précédente ou à la configuration de la journée de course.
- **Ajouter un pilote (+)** : Crée un nouveau profil et bascule en mode édition.
- **Copier le pilote** : Duplique le profil du pilote sélectionné.
- **Modifier / Terminer** : Alterne entre le mode lecture seule et le mode édition (raccourci clavier : Cmd/Ctrl+E).
- **Importer des pilotes** : Ouvre la boîte de dialogue pour importer des profils de pilotes, des avatars et des configurations audio à partir de fichiers externes.
- **Tout développer / réduire** : Développe ou réduit toutes les sections accordéon en une seule fois.
- **Supprimer le pilote** : Supprime le profil après confirmation.
- **Aide (?)** : Ouvre le guide interactif présentant les différentes sections.

## Détails du pilote

- **Nom** : Le nom complet du pilote affiché sur les classements et rapports.
- **Surnom** : Un nom court ou phonétique utilisé pour la synthèse vocale (TTS).
- **Lier Nom et Surnom** : Lorsque cette option est activée, la saisie du nom se répercute automatiquement sur le surnom.
- **Avatar** : Choisissez une image ou une icône personnalisée pour le pilote.

## Annonces audio et effets sonores

Configurez des effets sonores ou des annonces vocales personnalisés pour ce pilote :

- **Audio de tour** : Joué lors de la réalisation d'un tour standard.
- **Meilleur tour personnel** : Joué lorsque le pilote réalise son meilleur tour.
- **Records et jalons** : Sons personnalisés pour les records de piste, de manche et prises de tête.
- **Écoute des sons** : Le bouton de lecture audio reste fonctionnel dans les deux modes pour prévisualiser les sons.

## Importer des pilotes

Race Coordinator AI prend en charge l'importation par lot de pilotes à partir de fichiers externes, comprenant la création en bloc, la résolution des conflits, la gestion des médias personnalisés et la définition des valeurs par défaut pour les emplacements audio vides.

### Formats de fichiers pris en charge

- **CSV (`.csv`)** : Fichiers texte délimités par des virgules, points-virgules ou tabulations. Les en-têtes de colonnes sont mis en correspondance de manière flexible (insensible à la casse, aux espaces et aux traits de soulignement).
- **Excel (`.xlsx`, `.xls`)** : Feuilles de calcul Microsoft Excel. La première feuille est traitée à l'aide des noms de colonnes.
- **JSON (`.json`)** : Un tableau d'objets pilote ou un objet contenant un tableau `"drivers"`.
- **Archive ZIP (`.zip`)** : Une archive ZIP contenant un fichier de données (`drivers.csv`, `drivers.xlsx` ou `drivers.json`) ainsi que les fichiers audio (`.wav`, `.mp3`, `.ogg`) et d'images d'avatars (`.png`, `.jpg`, `.jpeg`) référencés.

### Mappage des colonnes et des champs

Les colonnes et champs JSON suivants sont reconnus :

| Champ | Alias de colonnes reconnus | Description | Valeur par défaut / Secours |
| :--- | :--- | :--- | :--- |
| **Nom** | `Name`, `Driver`, `Driver Name`, `Full Name` | Nom complet du pilote (obligatoire). | Aucun (erreur si vide) |
| **Surnom** | `Nickname`, `Nick`, `Callout`, `Display Name` | Surnom ou nom d'annonce vocale. | Prend le **Nom** si vide. Validé contre les doublons. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Nom de fichier relatif (ex. `john.png`), ressource ou URL. | Aucun |
| **Audio par défaut** | `Default Audio`, `Blank Audio`, `Audio Default` | Directive pour emplacements vides : `none` / `muted` ou `system` / `default`. | Directive du fichier ou sélecteur modal |
| **Audio de tour** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Son joué lors d'un tour standard. | Selon le mode audio |
| **Meilleur tour personnel** | `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Son joué lors d'un record personnel. | Selon le mode audio |
| **Record de piste** | `Track Record Audio`, `Track Record`, `Record Audio` | Son joué lors du battement du record de piste. | Selon le mode audio |
| **En tête de course** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Son joué lors de la prise de tête de la course. | Selon le mode audio |
| **Temps au tour minimal** | `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Son joué sous le temps au tour minimal. | Selon le mode audio |
| **Tour de drift** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Son joué pendant un tour de drift. | Selon le mode audio |
| **Faux départ** | `False Start Audio`, `False Start`, `Penalty Audio` | Son joué lors d'un faux départ ou d'une pénalité. | Selon le mode audio |
| **Entrée aux stands** | `Pit In Audio`, `Pit In`, `Pit Stop` | Son joué lors de l'entrée dans la voie des stands. | Selon le mode audio |
| **Alerte carburant** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Son joué lors du niveau de carburant bas. | Selon le mode audio |
| **Panne de carburant** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Son joué lors d'une panne de carburant. | Selon le mode audio |

### Syntaxe des emplacements audio

Les valeurs audio acceptent les formats suivants :
- **`none`** ou **`off`** / **`mute`** : L'emplacement est muet (aucun son).
- **`tts:<texte>`** ou **`${nickname} prend la tête`** : Annonce Text-to-Speech (TTS). Les accolades `{nickname}` et `${driver}` sont prises en charge.
- **`preset:<son>`** : Utilise un son système intégré (ex. `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Nom de fichier (ex. `cheer.wav`, `v8_rev.mp3`)** : Fichier média compagnon inclus lors de l'importation ou dans l'archive ZIP.

### Directives de fichier pour l'audio vide

Vous pouvez déclarer la gestion des emplacements vides directement dans le fichier :
- En CSV : `# default-audio: none` ou `# default-audio: system` dans les lignes d'en-tête de commentaire.
- En JSON : `"default_audio": "none"` au niveau de l'objet racine.
- En Excel/CSV : Spécifiez une colonne `Default Audio` par ligne de pilote.
- Dans l'interface : Utilisez la liste déroulante **Emplacements audio vides** dans la boîte de dialogue d'importation.

### Importation automatique des médias et ressources

Lors de l'importation de pilotes avec des avatars ou des sons personnalisés :
1. **Glisser-déposer multiple** : Déposez votre fichier `.csv` ou `.xlsx` en même temps que vos fichiers `.wav`, `.mp3`, `.png` ou `.jpg` dans la zone de dépôt.
2. **Archive ZIP** : Regroupez votre fichier de données et vos fichiers médias dans une archive `.zip` et téléversez-la.
3. **Enregistrement automatique** : Le serveur intègre les médias dans le Gestionnaire de Ressources, calcule les empreintes SHA-256 et lie automatiquement les ressources créées aux avatars et emplacements audio respectifs.

### Résolution des conflits

Lorsqu'un pilote du fichier correspond à un nom ou surnom existant dans la base de données, la table de prévisualisation interactive détecte le conflit et propose trois options :
- **Renommer automatiquement** : Renomme le pilote entrant (ex. `Alice Walker (1)`) pour laisser le profil existant intact.
- **Écraser l'existant** : Met à jour le profil existant avec les nouveaux attributs, avatars et configurations audio importés.
- **Ignorer** : Ignore la ligne en conflit lors de l'importation.

Vous pouvez définir la résolution individuellement par ligne, l'appliquer à tous les conflits en bloc ou modifier directement le nom et le surnom dans le tableau.
