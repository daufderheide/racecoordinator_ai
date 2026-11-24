# Éditeur de voitures slot

L'**éditeur de voitures slot** tient la liste de vos voitures slot : ce qu'elles sont, la catégorie dans laquelle elles roulent, leur échelle et leurs réglages. Ouvrez-le depuis Race Day Setup avec **Gérer → Voitures slot**.

!!! note
    Choisissez une voiture pour chaque pilote dans Race Day Setup et échangez les voitures entre les séries. Chaque série enregistre la voiture telle qu'elle était sur la piste : les résultats gardent la bonne voiture, même après une modification.

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

## Vos champs {: #car-custom-fields }

Sous les réglages, vous pouvez ajouter vos propres champs, pour tout ce que suit votre club (par exemple le poids, le pignon ou le guide). En mode édition, cliquez sur **Gérer les champs** :

- **Nouveau champ** : donnez-lui un nom et choisissez un type : **Texte**, **Nombre**, **Oui / non** ou **Choix dans une liste** (un choix par ligne).
- **Modifier** : renommez un champ ou changez ses choix. Le type ne peut plus être modifié une fois le champ ajouté.
- **Monter / descendre** : change l'ordre des champs.
- **Supprimer** : retire le champ, et sa valeur de chaque voiture, après confirmation.

Chaque voiture a les mêmes champs et garde ses propres valeurs. Un champ laissé vide reste vide.

## Voitures slot en course {: #car-in-race }

- **Race Day Setup** : dans la liste des pilotes qui courent, cliquez sur l'icône de voiture d'une ligne pour choisir une voiture slot. Une équipe choisit **Une voiture pour l'équipe** ou **Une voiture par pilote**. RC AI retient votre choix pour la course suivante.
- **Échanger entre les séries** : le jour de course, ouvrez **Directeur de Course → Voitures slot…**. La série suivante y figure voie par voie ; choisissez une autre voiture et elle est échangée tout de suite. Pendant une série, les listes sont verrouillées.
- **Modifier les séries** : l'icône de voiture d'un pilote change sa voiture pour toutes les séries pas encore courues.
- **Résultats** : chaque série garde une copie de la voiture telle qu'elle a couru ; modifier ou supprimer une voiture plus tard ne change pas les anciens résultats.

L'icône de voiture et l'élément Voitures slot… n'apparaissent que lorsqu'il y a des voitures slot dans la base de données.

## Les voitures restent dans leur voie (IROC) {: #cars-in-lanes }

Dans une course IROC, les voitures restent dans leur voie toute la course et les pilotes tournent sur les voies : chaque pilote court avec chaque voiture.

- **Éditeur de course** : cochez **Les voitures restent dans leur voie (IROC)** dans la section **Manches**.
- **Configuration du Jour de Course** : un encadré **Voitures par voie** apparaît sous la liste **Pilotes en Course**. Cliquez dessus pour choisir la voiture de chaque voie. RC AI retient les voitures par circuit. Les icônes de voiture des pilotes sont masquées, car la voiture va avec la voie.
- **Échanger entre les séries** : **Directeur de Course → Voitures slot…** affiche chaque voie avec sa voiture. Une nouvelle voiture compte à partir de la prochaine série pas encore courue.
- **Résultats** : chaque série enregistre la voiture de chaque voie, vous voyez donc quel pilote a couru avec quelle voiture.

## Les voitures dans les résultats {: #cars-in-results }

Les résultats montrent la voiture de chaque pilote, telle qu'elle était dans cette manche. Modifier une voiture plus tard ne change pas les résultats passés.

- **Résultats de manche** et la page de résultats d'un pilote : chaque carte de manche affiche la voiture à côté de la voie. Survolez-la pour voir la classe, l'échelle et le réglage.
- **Résultats de course** : chaque pilote affiche sa voiture sous son nom. S'il a couru avec plusieurs voitures (course IROC ou échange), le nombre est indiqué ; survolez-le pour voir la liste.

## Statistiques des voitures {: #car-stats }

**Statistiques des voitures** montre les résultats de vos voitures slot dans vos courses enregistrées. Ouvrez-le avec le bouton graphique en haut de l'Éditeur de voitures slot ; il commence avec la voiture affichée.

- **Regrouper par** : une ligne par voiture, classe, champ de réglage (marque, échelle, moteur, aimant, châssis, rapport, pneus), un de vos propres champs, piste ou pilote. Choisissez une voiture et regroupez par piste ou par pilote pour voir où et avec qui elle a été la plus rapide.
- **Filtres** : limitez les résultats à une voiture, une classe, une piste ou un pilote.
- **Courses démo** : cochez-le pour voir les résultats des courses démo.
- Les chiffres utilisent la voiture de chaque manche telle qu'elle a couru ; modifier une voiture plus tard ne les change pas. Les tours sous le temps de tour minimum de la course et les tours exclus des records ne comptent pas.
