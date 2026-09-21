# Gestionnaire de Ressources

Le **Gestionnaire de Ressources** vous permet de télécharger, d'organiser et de gérer toutes vos ressources numériques de course, notamment les fichiers audio, les images personnalisées, les ensembles d'images et les schémas de rotation.

## Aperçu

Les ressources sont des fichiers personnalisés utilisés dans toute l'application pour personnaliser l'expérience de course :

- **Fichiers sonores :** Annonces sonores personnalisées, bips de départ, klaxons d'arrivée et clips de commentaires.
- **Ensembles audio :** Collections groupées de fichiers audio ou d'annonces de synthèse vocale (TTS) associées à des valeurs de déclenchement spécifiques (temps en secondes, tours restants ou pourcentage de carburant).
- **Images :** Graphiques de voitures, avatars de pilotes, drapeaux personnalisés, logos de sponsors et images de fond.
- **Ensembles d'images :** Collections d'images associées (telles que les jauges de carburant ou les comptes à rebours).
- **Rotations personnalisées :** Schémas de rotation des manches définis par l'utilisateur pour les formats complexes.

## Télécharger des ressources

Pour télécharger de nouvelles ressources dans votre bibliothèque :

1. Ouvrez le **Gestionnaire de Ressources** depuis le menu principal ou la barre d'outils de configuration.
2. Glissez-déposez un ou plusieurs fichiers dans la zone **Télécharger des ressources**, ou cliquez pour parcourir votre ordinateur.
3. Les formats pris en charge incluent `.wav`, `.mp3`, `.ogg` pour l'audio et `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` pour les images.

## Ensembles Audio et Valeurs de Déclenchement

Un **Ensemble Audio** vous permet de configurer une séquence de sons ou de phrases parlées déclenchées à des seuils numériques précis. Selon l'endroit où l'ensemble audio est assigné dans Race Coordinator AI, ses valeurs représentent différentes unités :

*   **Temps en Secondes :** Utilisé dans les paramètres de Thème pour le **Compte à rebours de départ**, les **Secondes restantes**, le **Démarrage automatique** et l'**Avancement automatique** (par exemple, entrées à `5`, `4`, `3`, `2`, `1` et `0` secondes).
*   **Nombre de Tours :** Utilisé dans les paramètres de Thème pour les annonces des **Tours restants**. Les entrées définissent des annonces lorsque le meneur atteint un nombre de tours restants spécifique (par exemple, `10`, `5`, `1` et `0` tours restants).
*   **Pourcentage de Carburant (%) :** Utilisé dans les paramètres de Pilote pour les **Sons de niveau de carburant**. Les entrées définissent des annonces lorsque le niveau atteint des seuils d'avertissement, critique ou plein (par exemple, `20%`, `10%`, `0%` vide ou `100%` plein).

Dans l'**Éditeur d'Ensembles Audio**, vous pouvez ajouter des entrées, choisir des fichiers audio ou rédiger des phrases TTS (avec variables de modèle comme `{driver.nickname}`), définir les valeurs et utiliser le bouton **Extraire automatiquement les valeurs des noms** pour préremplir automatiquement les valeurs depuis des fichiers numérotés (ex. `10.mp3`, `5.mp3`).

### Modes de déclenchement doubles : Restant vs Écoulé

Chaque entrée d'un Ensemble Audio peut être configurée avec un **Mode de déclenchement** :

*   **Restant (Compte à rebours) :** Se déclenche à l'approche de zéro ou de l'arrivée (par exemple, quand il reste 10 tours ou 30 secondes dans la manche). C'est le mode par défaut pour les comptes à rebours.
*   **Écoulé (Compte progressif) :** Se déclenche à mesure que la course progresse depuis le départ (par exemple, quand le meneur a bouclé 10 tours ou que 30 secondes se sont écoulées).

#### Deux annonces avec la même valeur numérique
Race Coordinator AI prend en charge deux entrées ayant exactement la même valeur numérique (par exemple, la valeur `10`) :
- Une entrée configurée en **Écoulé** retentira lorsque le meneur franchira ce cap initial (ex. 10 tours parcourus).
- Une autre entrée configurée en **Restant** retentira à l'approche de la fin de course (ex. lorsqu'il ne reste que 10 tours).

#### Aperçu dans l'ordre naturel de course
Lors de la prévisualisation ou lecture automatique d'un Ensemble Audio dans le Gestionnaire de Ressources ou le Sélecteur Audio, les sons sont joués dans l'ordre chronologique de course :
1. Toutes les entrées **Écoulé** retentissent d'abord par ordre croissant (0 → N).
2. Toutes les entrées **Restant** retentissent ensuite par ordre décroissant de compte à rebours (N → 0).
