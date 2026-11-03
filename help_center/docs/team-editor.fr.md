# Éditeur d'Équipe

L'**Éditeur d'Équipe** vous permet de créer, consulter et personnaliser les profils d'équipe, d'assigner des pilotes, de télécharger des logos et de gérer les effectifs d'équipe.

## Présentation

L'Éditeur d'Équipe intègre la sélection et l'édition d'équipes dans une interface unifiée :

- **Sélecteur d'Équipe** : Situé dans l'en-tête supérieur à côté du titre de la page, ce menu déroulant répertorie toutes les équipes existantes et permet de basculer rapidement de l'une à l'autre.
- **Mode Lecture Seule** : Par défaut, l'ouverture de l'éditeur affiche les détails de l'équipe et les pilotes assignés en mode lecture seule. Les champs du formulaire, la sélection du logo et les actions d'affectation sont verrouillés pour éviter toute modification accidentelle.
- **Mode Édition** : Cliquer sur l'icône **Modifier** (crayon) de la barre d'outils déverrouille les champs et les commandes d'affectation. En mode édition, le sélecteur d'équipe est verrouillé pour éviter de quitter accidentellement avec des modifications non enregistrées.
- **Sauvegarde Automatique Continue** : Au fur et à mesure de vos modifications (nom d'équipe, logo, réorganisation ou assignation de pilotes), vos changements sont automatiquement enregistrés en arrière-plan sans quitter le mode édition.
- **Terminer l'Édition** : Cliquer sur l'icône **Terminer l'édition** (coche) valide vos modifications, s'assure de leur enregistrement sur le serveur et rétablit le mode lecture seule.
- **Abandonner les Modifications** : Si vous tentez de quitter avec des modifications non enregistrées ou invalides, un dialogue de confirmation s'affiche. L'abandon réinitialise tous les champs à la dernière version enregistrée.

## Actions de la Barre d'Outils

La barre d'outils supérieure propose les actions suivantes :

- **Retour** : Revient à la vue précédente ou à la Configuration du Jour de Course.
- **Ajouter une Équipe (+)** : Crée un nouveau modèle d'équipe et passe en mode édition.
- **Dupliquer l'Équipe** : Crée une copie de l'équipe sélectionnée avec un nom unique.
- **Modifier / Terminer l'édition** : Bascule entre le mode lecture seule et le mode édition (raccourci clavier : Cmd/Ctrl+E).
- **Supprimer l'Équipe** : Supprime l'équipe sélectionnée après confirmation.
- **Annuler / Rétablir** : Annule ou réapplique les modifications récentes apportées pendant la session.
- **Aide (?)** : Ouvre le guide interactif présentant chaque section de l'éditeur.

## Profil de l'Équipe {: #team-profile }

Le panneau gauche rassemble les paramètres d'identité et de catégorisation essentiels de l'équipe :

- **Nom de l'Équipe** : Le nom unique de l'équipe affiché sur les classements, les tableaux des meneurs et les écrans de course.
- **Image / Logo de l'Équipe** : Choisissez une icône prédéfinie ou téléchargez un logo personnalisé pour représenter l'équipe.
- **Étiquettes d'Équipe** : Attribuez des étiquettes colorées (similaires aux étiquettes GitHub) pour organiser les équipes en groupes ou catégories personnalisés (comme « GT3 », « Pro » ou « Amateur »). Les équipes peuvent appartenir à plusieurs étiquettes. En mode édition, cliquez sur **Gérer les étiquettes** pour créer, modifier, recolorer, supprimer ou attribuer des étiquettes. Sur l'écran Configuration du Jour de Course, vous pouvez filtrer les équipes disponibles par étiquette pour composer rapidement les compositions d'équipes.

## Membres de l'Équipe & Alignement {: #team-members }

La partie supérieure du panneau droit affiche les pilotes actuellement assignés à cette équipe :

- **Gestion de l'Effectif** : En mode édition, vous pouvez faire glisser et déposer les pilotes à l'aide de la poignée (`☰`) pour réordonner l'ordre de passage, ou cliquer sur l'icône de suppression (<span class="material-icons">delete</span>) pour retirer un pilote de l'équipe.
- **Rotation Round-Robin** : Lorsqu'une équipe dispute une course, les pilotes assignés tournent automatiquement d'une manche à l'autre selon le principe du round-robin d'après cet ordre d'effectif.
- **Relais en Cours de Manche** : Selon la configuration de course de l'épreuve, les pilotes d'une équipe peuvent également se relayer en cours de manche, soit lors d'un arrêt aux stands, soit à n'importe quel moment sur la piste.
- **Étiquettes de Pilote** : Chaque pilote affiche ses étiquettes attribuées sous forme de badges à côté de son nom pour faciliter le contrôle des compétences et qualifications.

## Pilotes Disponibles {: #available-drivers }

La partie inférieure du panneau droit répertorie tous les pilotes enregistrés qui ne sont pas actuellement assignés à cette équipe :

- **Ajouter des Pilotes** : En mode édition, cliquez sur la fiche d'un pilote ou sur le bouton d'ajout (<span class="material-icons">add</span>) pour l'intégrer immédiatement à l'effectif de l'équipe.
- **Appartenance à Plusieurs Équipes** : Un pilote peut faire partie de plusieurs équipes différentes dans votre base de données.
- **Règle de Non-Cumul en Course** : Bien qu'un pilote puisse appartenir à plusieurs équipes, aucun pilote ne peut participer plusieurs fois à une même course, que ce soit au sein de deux équipes concurrentes ou en courant à la fois en individuel et en équipe.
