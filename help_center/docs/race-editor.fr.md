# Éditeur de Course

L'**Éditeur de course** vous permet de créer, personnaliser et gérer les configurations de course. Vous pouvez y configurer les règles de pointage, les rotations de manches, les simulations de carburant et les options de course.

---

## Vue d'Ensemble & Sauvegarde Automatique

L'Éditeur de Course propose une interface unifiée pour sélectionner, afficher, configurer et tester vos formats de course :

- **Sélecteur de Course** : Situé dans l'en-tête supérieur à côté du titre de la page, ce menu déroulant liste toutes les courses configurées et vous permet de passer rapidement de l'une à l'autre.
- **Mode Lecture Seule** : Par défaut, l'éditeur affiche les propriétés de la course, les règles de score et la configuration en mode lecture seule. Les champs de saisie sont verrouillés pour éviter toute modification accidentelle, tandis que les sections accordéon et aperçus de manches restent interactifs.
- **Mode Édition** : Cliquer sur l'icône **Éditer** (crayon) de la barre d'outils déverrouille tous les contrôles. Durant l'édition, le sélecteur de course est verrouillé.
- **Sauvegarde Automatique Continue** : Toutes vos modifications sont enregistrées automatiquement en arrière-plan sur le serveur sans quitter le mode édition.
- **Quitter le Mode Édition** : Cliquer sur l'icône **Terminé** (coche) valide vos modifications et revient en mode lecture seule.
- **Abandonner les Modifications** : Cliquer sur Abandonner rétablit la dernière version enregistrée et quitte le mode édition.

L'espace de travail est divisé en deux panneaux synchronisés :

- **Panneau Gauche (Configuration de la Course)** : Propriétés générales, format de course, méthodes de score, type de rotation, options de groupe et simulation de carburant analogique/numérique.
- **Panneau Droit (Aperçu des Manches en Direct)** : Génère dynamiquement la liste complète des manches selon le type de rotation actif et le nombre de pilotes.

---

---

## Configuration de la course {: #race-setup }

Le panneau gauche configure le format de base et la piste associée pour votre course :

- **Nom de la course** : Nom unique identifiant le format lors du jour de course et dans les statistiques.
- **Piste** : La piste physique associée à cette course. Détermine si la simulation analogique ou numérique est disponible.
- **Thème** : Thème visuel appliqué à l'affichage le jour de la course.
- **Format de rotation des manches** : Choisissez entre rotations standard (**Round Robin**, **Échelle**, **Tournoi**) ou séquences personnalisées.
- **Passages de manche** : Nombre de fois où chaque pilote effectue la rotation complète des manches.
- **Manches inversées** : Inverse l'ordre des manches pour que les pilotes concourent dans l'ordre inverse.
- **Aperçu du nombre de pilotes** : Prévisualise dynamiquement la liste des manches selon le nombre de pilotes configuré.

Le panneau droit affiche l'**Aperçu des manches en direct**, générant dynamiquement la liste complète des manches, rotations de pilotes et attributions de voies en temps réel.

---

## Onglets de navigation {: #navigation-tabs }

La barre d'onglets supérieure fournit des raccourcis en un clic pour accéder directement à chaque section :

- **Général** : Thèmes, annonces vocales, filtres de temps au tour et préférences d'interface.
- **Manches** : Durée de manche, conditions d'arrivée, rotation des voies et fenêtres de ravitaillement.
- **Pointage** : Méthodes de classement, bris d'égalité, manches éliminées et ajustements manuels.
- **Groupes** : Étapes de tournoi, qualifications et qualification des pilotes.
- **Méthode de départ** : Départs automatiques/manuels, départs échelonnés et règles de faux départ.
- **Options d'équipe** : Endurance par équipe, changements de pilotes et limites de relais.
- **Carburant analogique** : Consommation par tour, capacité du réservoir et débits de ravitaillement.
- **Carburant numérique** : Consommation continue selon l'accélérateur et courbes personnalisées.
- **Points de saison** : Barème de points du championnat, points par manche et points bonus.

Cliquer sur un onglet fait défiler immédiatement l'accordéon jusqu'à cette section et la développe.

---

## Paramètres généraux {: #general-settings }

L'accordéon Paramètres généraux contrôle la présentation, les filtres de temps et le comportement de direction de course :

- **Sélection du thème** : Schémas de couleurs et dispositions de tableau d'affichage personnalisés.
- **Annonces vocales** : Annonces audio pour changements de meneur, tours rapides, arrêts aux stands et arrivées.
- **Temps au tour minimum (s)** : Temps au tour minimum pour éliminer les déclenchements parasites du capteur.
- **Temps de glisse (s)** : Fenêtre de détection pour gérer les voitures en dérapage sur la ligne d'arrivée.
- **Exclure les tours avec dérive des records** : Lorsqu'activé, les tours effectués avec dérive sont exclus des records de course, de manche et de pilote.
- **Règles de drapeau jaune** : Pauses automatiques ou manuelles sous drapeau jaune avec coupure d'alimentation.
- **Options d'interface personnalisée** : Classements spécialisés et widgets de télémétrie.

---

## Options de manche {: #heat-options }

L'accordéon Options de manche configure le rythme automatisé, les cycles et la séquence des manches :

- **Délai d'avancement automatique (s)** : Secondes d'attente après la fin d'une manche avant de passer automatiquement à la suivante.
- **Délai d'échauffement avant avancement (s)** : Intervalle d'attente avant l'avancement automatique.
- **Délai de départ automatique (s)** : Compte à rebours avant de démarrer automatiquement la manche suivante.
- **Délai d'échauffement avant départ (s)** : Durée d'échauffement avant le début du compte à rebours automatique.
- **Passages de manche** : Nombre de fois où chaque pilote effectue la rotation complète des manches.
- **Manches inversées** : Inverse l'ordre prévu des manches pour concourir dans l'ordre inverse.
---

## Règles de pointage {: #scoring-rules }

#### Ajustements de Tours et de Temps (Impact sur les Classements et Métriques)

- **Méthode de classement de manche** : Classement des pilotes dans chaque manche par **Plus de tours**, **Meilleur tour** ou **Temps total le plus rapide**, avec bris d'égalité configurables.
- **Méthode de fin** : Détermine comment la fin d'une manche est établie (par **Nombre de tours** ou **Temps** écoulé en secondes).
- **Autoriser l'arrivée** : Détermine comment les voitures finissent leurs tours lorsque le leader termine ou le temps expire (ex. fin immédiate, autoriser tous à finir, tour unique ou crédit de segments automatiques).
- **Méthode de classement général** : Classement général sur l'ensemble des manches avec bris d'égalité et manches éliminées configurables.

## Groupes et étapes {: #groups-and-stages }

L'accordéon Groupes et étapes sépare les pilotes en groupes distincts qui ne s'affrontent pas directement sur la piste :

- **Séparation des groupes** : Les pilotes sont organisés en groupes isolés et disputent leurs manches de manière autonome selon la rotation configurée.
- **Groupes maximaux** : Définit le nombre maximal de groupes autorisés pour la course.
- **Équilibrer les groupes** : Répartit automatiquement le nombre de pilotes de façon équitable entre tous les groupes.
- **Autoriser les voies vides** : Permet aux manches de se dérouler avec des voies libres lorsque les groupes ne correspondent pas exactement au nombre de voies.
- **Forcer un multiple du maximum** : Assure que le total des manches se déroule en multiples de la capacité maximale du groupe.
- **Alterner les manches de groupe** : Alterne les manches entre différents groupes au lieu de terminer entièrement un groupe avant d'entamer le suivant.
- **Qualifiés minimum** : Place automatiquement les meilleurs pilotes de chaque groupe au sommet du classement général.
- **Noms des groupes** : Attribue des noms personnalisés à chaque groupe (ex. Pro, Semi-Pro, Groupe A/B/C).
---

## Méthodes de départ {: #start-methods }

L'accordéon Méthodes de départ configure le début des manches, le positionnement sur la piste et les pénalités de départ :

- **Délai de départ / redémarrage (s)** : Durée du compte à rebours avant de démarrer ou relancer une manche.
- **Délai aléatoire (s)** : Intervalle aléatoire ajouté au compte à rebours pour éviter les départs anticipés.
- **Départ derrière le capteur** : Exige que les voitures soient placées derrière la ligne de détection au tour zéro.
- **Départ à la position actuelle** : Permet aux voitures de repartir de leur position physique après une pause.
- **Départs lancés** : Maintient l'alimentation de piste active au départ pour accélérer dès la fin du décompte.
- **Redémarrer en cas de faux départ** : Interrompt et redémarre automatiquement le décompte lors d'un faux départ.
- **Pénalités de faux départ** : Déductions de tours ou pénalités de temps appliquées en cas d'anticipation.
---

## Options de course en équipe {: #team-racing }

L'accordéon Options de course en équipe active les formats d'endurance avec plusieurs pilotes par équipe :

- **Mode course en équipe** : Active le classement par équipes où les pilotes partagent les manches.
- **Stratégie de relais** : Rotation automatique des pilotes en round-robin au fil des manches.
- **Relais en cours de manche** : Permet aux pilotes de se relayer aux stands ou à des tours clés.
- **Limites de relais** : Temps de conduite minimum et maximum par pilote.
- **Changements obligatoires** : Nombre minimum d'arrêts et de changements de pilote par manche ou course.

---

## Éditeur de course - Simulation de carburant analogique {: #analog-fuel-simulation }

Le carburant analogique simule la consommation **au tour**. Les pistes analogiques détectant les voitures lors du franchissement de la ligne de chronométrage départ/arrivée, le carburant est calculé et déduit à chaque tour complété.

#### Options de configuration

- **Activer le carburant analogique** : Interrupteur principal du suivi analogique. Lorsqu'il est décoché, la simulation de carburant est désactivée et les voitures roulent sans contrainte.
- **Type d'utilisation du carburant** : Détermine la courbe mathématique utilisée pour calculer la consommation en fonction du rythme au tour :
    - **Linéaire** : La consommation évolue proportionnellement au temps au tour. Les tours plus rapides consomment davantage, tandis que les tours deux fois plus lents consomment la moitié du carburant de base.
    - **Quadratique** : La consommation augmente avec l'inverse du carré du temps au tour, pénalisant fortement les tours très rapides.
    - **Cubique** : La consommation grimpe en flèche pour les tours ultra-rapides, sanctionnant sévèrement la recherche effrénée de records au tour.
    - **Courbe personnalisée** : Permet de modeler interactivement la courbe point par point directement sur le graphique SVG.
- **Temps le plus rapide (s)** : Temps au tour le plus rapide attendu pour la piste et la catégorie de voiture (en secondes).
- **Temps le plus lent (s)** : Temps au tour le plus lent (en secondes) pour la consommation minimale de carburant.
- **Consommation max. de carburant par tour le plus rapide** : Unités de carburant consommées par tour lors d'un tour égal ou plus rapide que le **Temps le plus rapide**.
- **Consommation min. de carburant par tour le plus lent** : Unités de carburant consommées par tour lors d'un tour égal ou plus lent que le **Temps le plus lent**.
    - Pour les temps au tour compris entre le temps le plus rapide et le plus lent, la consommation évolue de manière fluide selon le **Type d'utilisation** sélectionné (Linéaire, Quadratique, Cubique ou Courbe personnalisée).
- **Capacité** : Volume total du réservoir de carburant en unités arbitraires (par exemple, 100).
- **Niveau initial (%)** : Pourcentage de capacité de carburant disponible au début d'une manche (par exemple, 100 % pour un plein complet, ou moins pour les manches sprint/handicap).
- **Taux de ravitaillement (%/s)** : Vitesse de remplissage lors d'un arrêt aux stands, exprimée en pourcentage de la capacité totale du réservoir rechargé par seconde.
- **Délai d'arrêt aux stands (s)** : Temps d'attente stationnaire obligatoire en secondes avant le début du ravitaillement une fois la voiture dans la voie des stands.
- **Réinitialiser le carburant au début de la manche** :
    - **Coché** : Le niveau de carburant de chaque pilote est réinitialisé au **Niveau initial** configuré au départ de chaque manche.
    - **Décoché** : Le carburant restant est conservé d'une manche à l'autre tout au long des rotations, imposant une gestion stratégique globale.
- **Action en cas de panne sèche** : Pénalité infligée lorsqu'un pilote tombe à 0 unité de carburant :
    - **Ne pas compter les tours** : La voiture continue de rouler sous tension, mais aucun tour complété réservoir vide n'est comptabilisé jusqu'au ravitaillement aux stands.
    - **Terminer la manche** : La manche s'arrête immédiatement pour cette voiture, l'alimentation de la voie est coupée et le pilote est classé.
    - **Bégaiement de puissance (Power Stutter)** : Simule les ratés d'un moteur à sec en coupant et rétablissant rapidement le courant de la voie.
        - *Nécessite des relais de voie* : Disponible uniquement si l'interface de piste possède des relais de coupure indépendants par voie.
        - **Temps allumé (s)** : Durée de maintien du courant lors de chaque impulsion.
        - **Temps éteint (s)** : Durée de coupure du courant lors de chaque impulsion.

#### Arrêts aux stands et temps de course en analogique

Pour éviter que le temps d'arrêt aux stands ne soit assimilé à un tour anormalement lent (ce qui réduirait indûment la consommation calculée), Race Coordinator AI enregistre le **temps de ravitaillement accumulé**. Le temps passé à l'arrêt aux stands est soustrait de la durée totale du tour avant de calculer le carburant consommé :

$$\text{Temps de course} = \text{Temps au tour} - \text{Temps de ravitaillement accumulé}$$

#### Aperçus graphiques (Analogique)

- **Comparaison multi-modèles simultanée** : Les 3 modèles mathématiques prédéfinis (**Linéaire**, **Quadratique** et **Cubique**) sont tracés simultanément sur les deux graphiques. Le modèle sélectionné est mis en valeur en gras avec une lueur distinctive, tandis que les autres modèles restent visibles sous forme de courbes de référence atténuées (~40 % d'opacité).
- **Utilisation de carburant par tour** : Affiche les unités exactes consommées sur le spectre des temps au tour (du Temps le plus rapide au Temps le plus lent). En mode Courbe personnalisée, les poignées déplaçables et les boutons de réinitialisation permettent un remodelage instantané pendant que les 3 modèles de base restent visibles comme repères.
- **Temps avant arrêt au stand** : Estime le temps total de course (ou nombre de tours) avant la panne sèche à un rythme de tour régulier pour tous les modèles.
- **Légende interactive et visibilité** : Cliquez avec le bouton gauche sur n'importe quelle courbe dans la légende pour l'activer ou la masquer. Masquer une courbe réajuste automatiquement l'échelle des axes pour inspecter plus précisément les courbes restantes.
- **Cartes de survol comparatives** : Le survol de chaque graphique affiche la télémétrie comparative de toutes les courbes visibles au point pointé par le curseur, avec pastilles colorées, valeurs et indicateur `(Actif)` sur le modèle sélectionné.

---

---

## Éditeur de course - Simulation de carburant numérique {: #digital-fuel-simulation }

Le carburant numérique simule la consommation **en continu et en temps réel** à partir de la télémétrie d'accélération transmise par les poignées et décodeurs numériques.

#### Consommation continue selon l'accélérateur

Contrairement à l'analogique (qui déduit le carburant sur la ligne d'arrivée), le numérique recalcule la consommation à chaque paquet de télémétrie reçu :

$$\text{Carburant consommé} = \text{Consommation par seconde} \times \Delta t$$

Les pilotes souples qui relâchent l'accélérateur en virage consomment nettement moins que ceux qui restent plein ga

---

## Pointage de la saison {: #season-scoring }

L'accordéon Pointage de la saison définit l'attribution des points pour les championnats :

- **Tableau des points par position** : Points attribués à chaque place (ex. : 25 pour le 1er, 18 pour le 2e, etc.).
- **Points par manche** : Points supplémentaires accordés pour les résultats des manches individuelles.
- **Points bonus** :
    - *Meilleur tour* : Points additionnels accordés au pilote ayant réalisé le meilleur tour.
    - *Pole position* : Points bonus pour la première place aux qualifications.
    - *Plus de tours en tête* : Points bonus pour le pilote ayant mené le plus grand nombre de tours.
- **Cumul du championnat** : Cumul automatique des points de la saison avec prise en compte des manches décomptées.
