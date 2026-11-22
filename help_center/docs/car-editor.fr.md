# Éditeur de voitures slot

L'**éditeur de voitures slot** tient la liste de vos voitures slot : ce qu'elles sont, la catégorie dans laquelle elles roulent, leur échelle et leurs réglages. Ouvrez-le depuis Race Day Setup avec **Gérer → Voitures slot**.

!!! note
    C'est la première étape de la prise en charge des voitures. Les voitures ne sont pas encore liées aux pilotes ni aux courses ; rien ne change le jour de course.

    Le badge **Aperçu** à côté du titre signifie que cette fonction est encore en cours d'élaboration. Elle peut encore beaucoup changer, voire être retirée, pendant que nous recueillons vos retours. Donnez-nous votre avis sur GitHub ou SlotForum.

## Vue d'ensemble

L'éditeur de voitures slot fonctionne comme l'éditeur d'équipes :

- **Sélecteur de voiture** : la liste à côté du titre de la page affiche toutes vos voitures, triées par nom.
- **Mode lecture seule** : à l'ouverture, la voiture choisie s'affiche avec tous les champs verrouillés.
- **Mode édition** : cliquez sur l'icône **Modifier** (crayon) pour déverrouiller les champs. Pendant l'édition, le sélecteur est verrouillé.
- **Enregistrement automatique** : les modifications sont enregistrées en arrière-plan au fur et à mesure.
- **Abandon des modifications** : si vous quittez avec des modifications non enregistrées ou non valides, une confirmation est demandée. Abandonner rétablit la dernière version enregistrée.

## Actions de la barre d'outils

- **Retour** : revient à Race Day Setup.
- **Ajouter une voiture (+)** : crée une nouvelle voiture et l'ouvre en édition.
- **Dupliquer** : copie la voiture choisie sous un nouveau nom unique. Pratique pour une deuxième voiture du même type.
- **Modifier / Terminé** : bascule entre lecture seule et édition.
- **Supprimer** : supprime la voiture choisie après confirmation.
- **Annuler / Rétablir** : revient en arrière ou en avant dans vos modifications récentes.
- **Aide (?)** : lance la visite guidée.

## La voiture {: #car-profile }

Le panneau de gauche indique ce qu'est la voiture :

- **Photo** : choisissez une image ou téléversez une photo de la voiture.
- **Nom** : obligatoire et unique parmi vos voitures (par exemple « Porsche 911 RSR #92 »).
- **Marque / fabricant** : par exemple Scalextric, Carrera, Slot.it ou NSR.
- **Catégorie** : la catégorie dans laquelle roule la voiture, comme GT3 ou Classic. Pendant la saisie, les catégories de vos autres voitures sont proposées, pour garder toujours la même orthographe.
- **Échelle** : 1/24, 1/32, 1/43, 1/64 (HO), Autre ou Non défini.

## Réglages {: #car-setup }

Le panneau de droite indique comment la voiture est réglée. Chaque champ est un texte libre, à décrire comme le fait votre club :

- **Moteur** : par exemple « Slot.it V12/4 21.5k », ou pancake / inline en HO.
- **Aimant** : type et force, ou « aucun » pour les courses sans aimant.
- **Châssis**, **Rapport** (par exemple 9/27) et **Pneus**.
- **Modifiée** : cochez si la voiture a été modifiée par rapport à sa version d'origine ; laissez vide pour une voiture de série.
- **Notes** : tout autre détail sur la voiture.
