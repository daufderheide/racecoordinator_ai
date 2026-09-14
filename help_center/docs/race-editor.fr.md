# Éditeur de Course

## Paramètres de carburant

Race Coordinator AI prend en charge une simulation complète du carburant pour les pistes analogiques et numériques, comprenant la capacité du réservoir, le niveau initial, les délais d'arrêt aux stands, les taux de ravitaillement, les pénalités de panne sèche et les modèles d'utilisation du carburant.

### Modèles d'utilisation du carburant

La consommation de carburant par tour (analogique) ou par seconde (numérique) peut être régie par des modèles mathématiques prédéfinis ou par un profil personnalisé interactif :

- **Linéaire** : La consommation de carburant évolue proportionnellement à la vitesse ou à l'accélérateur.
- **Quadratique** : La consommation augmente de manière quadratique pour les tours plus rapides ou les accélérations plus fortes.
- **Cubique** : La consommation augmente fortement pour les vitesses extrêmes et le plein régime.
- **Courbe personnalisée** : Permet un contrôle très fin de la courbe de consommation en faisant glisser des points de contrôle interactifs directement sur le graphique d'utilisation.

### Modification interactive de la courbe personnalisée

Lorsque **Courbe personnalisée** est sélectionnée comme type d'utilisation, des poignées de contrôle apparaissent directement sur la courbe SVG :

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
