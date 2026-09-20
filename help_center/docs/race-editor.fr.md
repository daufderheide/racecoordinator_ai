# Éditeur de Course

L'**Éditeur de Course** est l'interface complète de configuration pour concevoir, configurer et tester vos formats de course de slot cars, règles de score, rotations de manches, simulations de carburant et paramètres de chronométrage.

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

## Configuration de la Course & Options

### Nom de Course & Association de Piste
- **Nom de Course** : Nom unique identifiant le format de course.
- **Piste** : La piste physique associée détermine la disponibilité de la simulation de carburant analogique ou numérique.
- **Thème** : Thème visuel d'interface appliqué pendant la course.

### Format de Rotation des Manches
- **Type de Rotation** : Rotations standards (**Round Robin**, **Échelle**, **Tournoi**) ou séquences personnalisées.
- **Passages de Manches** : Nombre de fois que chaque pilote effectue la rotation complète des manches.
- **Manches Inversées** : Inverse l'ordre de la séquence des manches.

### Options de Score
- **Score de Manche** : Fin par nombre de tours ou durée limite, méthode de classement et départages.
- **Score Général** : Méthode de classement général, règles de départage et manches retirées.
- **Score de Saison** : Distribution des points par position pour les championnats.

### Paramètres de Chronométrage
- **Délai de Départ / Reprise** : Compte à rebours avant le départ ou la reprise.
- **Temps de Tour Minimum** : Temps minimum de tour pour filtrer les faux déclenchements de capteurs.
- **Temps de Dérive** : Fenêtre de déclenchement pour les voitures en glisse sur la ligne d'arrivée.
- **Démarrer Derrière le Capteur** : Impose le départ des voitures derrière le capteur au tour zéro.

## Paramètres de carburant

Race Coordinator AI prend en charge une simulation complète du carburant pour les pistes analogiques et numériques, comprenant la capacité du réservoir, le niveau initial, les délais d'arrêt aux stands, les taux de ravitaillement, les pénalités de panne sèche et les modèles d'utilisation du carburant.

### Compatibilité de la piste et sélection du système de carburant

L'éditeur de course propose deux sections dédiées à la configuration du carburant : **Carburant analogique** et **Carburant numérique**. Le système disponible et actif est déterminé automatiquement par la piste sélectionnée pour la course :

- **Pistes analogiques** : Pistes de slot traditionnelles où les voitures sont alimentées directement par les rails, sans décodeurs numériques ni télémétrie embarquée. Lorsqu'une piste analogique est sélectionnée, la section **Carburant analogique** est activée et la case à cocher **Carburant numérique** est automatiquement désactivée (survoler la case désactivée affiche une infobulle explicative).
- **Pistes numériques** : Systèmes de slot numériques (tels que Carrera Digital, Scalextric Digital, Scorpius ou oXigen) où l'interface communique une télémétrie numérique (identifiant de la voiture, pourcentage d'accélérateur, capteurs de voie des stands). Lorsqu'une piste numérique est sélectionnée, la section **Carburant numérique** est activée et la case à cocher **Carburant analogique** est automatiquement désactivée (survoler la case désactivée affiche une infobulle explicative).

---

### Simulation de carburant analogique

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

### Simulation de carburant numérique

Le carburant numérique simule la consommation **en continu et en temps réel** à partir de la télémétrie d'accélération transmise par les poignées et décodeurs numériques.

#### Consommation continue selon l'accélérateur

Contrairement à l'analogique (qui déduit le carburant sur la ligne d'arrivée), le numérique recalcule la consommation à chaque paquet de télémétrie reçu :

$$\text{Carburant consommé} = \text{Consommation par seconde} \times \Delta t$$

Les pilotes souples qui relâchent l'accélérateur en virage consomment nettement moins que ceux qui restent plein gaz en permanence.

#### Options de configuration

- **Activer le carburant numérique** : Interrupteur principal du suivi numérique.
- **Type d'utilisation du carburant** : Modèle mathématique appliqué à la position de l'accélérateur ($0\,\%$ à $100\,\%$) :
    - **Linéaire** : La consommation est strictement proportionnelle à la pression sur la gâchette.
    - **Quadratique** : La consommation progresse modérément à mi-régime et s'accélère vers le plein gaz.
    - **Cubique** : Les fortes accélérations consomment exponentiellement plus que la conduite sur un filet de gaz.
    - **Courbe personnalisée** : Permet de définir une réponse personnalisée accélérateur-consommation de 0 % à 100 % de gaz.
- **Taux d'utilisation** : Consommation maximale en unités par seconde à **100 % plein régime**.
- **Capacité**, **Niveau initial (%)**, **Taux de ravitaillement (%/s)**, **Délai d'arrêt aux stands (s)**, **Réinitialiser le carburant au début de la manche** : Fonctionnement identique au carburant analogique.
- **Action en cas de panne sèche** :
    - **Ne pas compter les tours** : La voiture reste pilotable mais les tours franchis à sec ne sont pas validés.
    - **Terminer la manche** : Le pilote est immédiatement éliminé de la manche dès que le réservoir est vide.

#### Aperçus graphiques (Numérique)

- **Comparaison multi-modèles simultanée** : Trace simultanément les courbes de réponse linéaire, quadratique et cubique, avec le modèle actif mis en évidence et les autres modèles visibles en arrière-plan.
- **Utilisation du carburant numérique** : Graphique reliant le pourcentage d'accélérateur ($0\,\%$ à $100\,\%$) à la consommation par seconde pour tous les modèles.
- **Temps jusqu'à épuisement** : Graphique reliant le pourcentage d'accélérateur aux secondes de pilotage continu avant la panne sèche.
- **Légende interactive et mise à l'échelle dynamique** : Activez ou masquez les courbes en cliquant sur la légende pour adapter automatiquement l'échelle des axes.
- **Cartes de survol comparatives** : Balayer le graphique affiche les valeurs en temps réel de chaque courbe visible pour ce pourcentage d'accélération.

---

### Modification interactive de la courbe personnalisée

Lorsque **Courbe personnalisée** est sélectionnée comme type d'utilisation (en analogique ou en numérique), des poignées de contrôle interactives apparaissent directement sur la courbe SVG :

- **Génération initiale de la courbe** : Lors du premier basculement vers la Courbe personnalisée, les 5 points initiaux sont échantillonnés directement à partir du préréglage actif (Linéaire, Quadratique ou Cubique) sans saut visuel.
- **Glisser-déposer interactif** : Cliquez et faites glisser n'importe quel point vers le haut, le bas, la gauche ou la droite pour remodeler la courbe.
- **Monotonie stricte** :
    - *Carburant analogique* : Les tours plus rapides consomment toujours plus ou autant de carburant que les tours plus lents (courbe monotone décroissante). Le glissement est verrouillé pour empêcher les inversions.
    - *Carburant numérique* : Les niveaux d'accélération plus élevés consomment toujours plus ou autant de carburant que les niveaux plus faibles (courbe monotone croissante).
- **Ajout de points** : Cliquez sur la courbe pour insérer un nouveau point de contrôle à la position interpolée exacte.
- **Suppression de points** : Cliquez avec le bouton droit sur un point intermédiaire pour le supprimer (les 2 extrémités sont préservées).
- **Boutons de réinitialisation** : Réinitialisez rapidement la courbe sur les modèles Linéaire, Quadratique ou Cubique grâce aux boutons au-dessus du graphique.
- **Persistance en arrière-plan** : Si vous quittez la courbe personnalisée pour un préréglage puis revenez, vos points personnalisés sont conservés.
- **Calculs serveur faisant autorité** : Le serveur calcule la consommation pendant les courses avec le même algorithme d'interpolation linéaire par morceaux, garantissant une cohérence parfaite entre l'aperçu UI et la course.
