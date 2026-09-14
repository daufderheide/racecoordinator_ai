# Éditeur de Course

## Paramètres de carburant

Race Coordinator AI prend en charge une simulation complète du carburant pour les pistes analogiques et numériques, comprenant la capacité du réservoir, le niveau initial, les délais d'arrêt aux stands, les taux de ravitaillement, les pénalités de panne sèche et les modèles d'utilisation du carburant.

### Compatibilité de la piste et sélection du système de carburant

L'éditeur de course propose deux sections dédiées à la configuration du carburant : **Carburant analogique** et **Carburant numérique**. Le système disponible et actif est déterminé automatiquement par la piste sélectionnée pour la course :

- **Pistes analogiques** : Pistes de slot traditionnelles où les voitures sont alimentées directement par les rails, sans décodeurs numériques ni télémétrie embarquée. Lorsqu'une piste analogique est sélectionnée, la section **Carburant analogique** est activée et la section **Carburant numérique** est automatiquement désactivée.
- **Pistes numériques** : Systèmes de slot numériques (tels que Carrera Digital, Scalextric Digital, Scorpius ou oXigen) où l'interface communique une télémétrie numérique (identifiant de la voiture, pourcentage d'accélérateur, capteurs de voie des stands). Lorsqu'une piste numérique est sélectionnée, la section **Carburant numérique** est activée et la section **Carburant analogique** est automatiquement désactivée.

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
- **Taux d'utilisation** : Quantité de base d'unités de carburant consommées par tour lorsqu'un pilote égale le **Temps de référence**.
- **Temps de référence (s)** : Temps au tour de référence pour la piste et la catégorie de voiture (en secondes).
    - Les tours plus rapides (inférieurs au temps de référence) brûlent plus de carburant.
    - Les tours plus lents (supérieurs au temps de référence) brûlent moins de carburant.
    - La plage de calcul active s'étend de $0,5 \times \text{Temps de référence}$ à $1,5 \times \text{Temps de référence}$.
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

- **Utilisation de carburant par tour** : Affiche les unités exactes consommées sur le spectre des temps au tour ($0,5 \times \text{ref}$ à $1,5 \times \text{ref}$). En mode Courbe personnalisée, les poignées déplaçables et les boutons de réinitialisation permettent un remodelage instantané.
- **Temps avant arrêt au stand** : Estime le temps total de course (ou nombre de tours) avant la panne sèche à un rythme de tour régulier.

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

- **Utilisation du carburant numérique** : Graphique reliant le pourcentage d'accélérateur ($0\,\%$ à $100\,\%$) à la consommation par seconde.
- **Temps jusqu'à épuisement** : Graphique reliant le pourcentage d'accélérateur aux secondes de pilotage continu avant la panne sèche.

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
