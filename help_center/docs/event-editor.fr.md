# Éditeur d'Événements

L'**Éditeur d'Événements** vous permet de concevoir, configurer et gérer des événements multi-courses. Dans Race Coordinator AI, un événement relie plusieurs configurations de courses distinctes au sein d'une progression séquentielle (telles que des manches qualificatives menant aux demi-finales et à la finale, ou des tournois à élimination directe).

## Présentation

L'Éditeur d'Événements propose une interface claire à deux volets pour structurer les compétitions par étapes :

- **Sélecteur d'Événement** : Situé dans l'en-tête supérieur à côté du titre, ce menu déroulant répertorie tous les événements enregistrés et permet de basculer rapidement entre eux grâce aux boutons précédent/suivant.
- **Mode Lecture Seule** : Par défaut, l'ouverture de l'éditeur affiche les paramètres et séquences de courses en mode lecture seule afin d'éviter toute modification involontaire.
- **Mode Édition** : Cliquer sur l'icône **Modifier** (crayon) dans la barre d'outils déverrouille les champs et les commandes de la séquence.
- **Enregistrement Automatique Continu** : Les modifications du nom, de la description, du délai d'avance automatique et de la progression sont enregistrées automatiquement en arrière-plan.
- **Quitter le Mode Édition** : Cliquer sur l'icône **Terminer** (coche) valide l'événement, s'assure de l'enregistrement de toutes les modifications et rétablit le mode lecture seule.

---

## Actions de la Barre d'Outils

La barre d'outils supérieure fournit les actions indispensables d'édition et de gestion :

- **Retour** : Revient à l'écran précédent ou à la Configuration du Jour de Course.
- **Ajouter un Événement (+)** : Crée un nouveau modèle d'événement avec les paramètres par défaut et passe en Mode Édition.
- **Dupliquer l'Événement** : Clone l'événement actuel sous un nouveau nom unique.
- **Modifier / Terminer** : Bascule entre le Mode Lecture Seule et le Mode Édition (raccourci clavier : `Cmd/Ctrl+E`).
- **Supprimer l'Événement** : Supprime définitivement l'événement sélectionné après confirmation.
- **Annuler / Rétablir** : Annule ou réapplique les dernières modifications apportées durant la session.
- **Aide (?)** : Démarre la visite guidée interactive détaillant chaque section de l'éditeur.

---

## Configuration de l'Événement {: #event-configuration }

Le panneau de gauche configure les métadonnées générales et le comportement d'avance automatique entre les étapes :

- **Nom de l'Événement** : Un nom d'affichage unique identifiant l'événement dans toute l'application et les classements.
- **Description** : Une zone de texte facultative pour des remarques, des règles particulières ou des consignes de tournoi.
- **Temps d'Avance Automatique** : Le délai de compte à rebours (en secondes) après la fin d'une course avant de charger et lancer automatiquement la course suivante. Définir cette valeur sur `0` désactive l'avance automatique.

---

## Séquence de Courses {: #race-sequence }

Le panneau de droite gère la progression ordonnée des courses constituant l'événement :

- **Ajouter une Course** : En Mode Édition, cliquez sur le bouton **+ Ajouter une Course** pour ouvrir la boîte de dialogue et ajouter des courses enregistrées à la séquence.
- **Ordre de Progression** : Les courses se déroulent dans l'ordre de haut en bas (Étape #1, Étape #2, etc.). En Mode Édition, utilisez la poignée de glissement (<span class="material-icons">drag_indicator</span>) pour réordonner les étapes.
- **Limites de Pilotes** : Chaque étape peut restreindre le nombre de participants :
  - **Illimité (Tous les Pilotes)** : Tous les pilotes qualifiés de l'étape précédente participent à cette course.
  - **Limite Numérique** : Spécifiez un nombre précis de meilleurs pilotes autorisés à accéder à cette étape (par exemple, les 8 premiers en demi-finales). Cliquez sur **Illimité** pour basculer entre une limite numérique et tous les pilotes.
- **Supprimer une Course** : En Mode Édition, cliquez sur l'icône corbeille (<span class="material-icons">delete</span>) pour retirer une étape. Chaque événement doit conserver au moins une course.

