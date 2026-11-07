# Exploitation le Jour de Course

## Démarrage et Pause de Course

Le jour de course, les opérations en piste passent par des états automatisés gérés par la direction de course via les raccourcis clavier, la barre d'outils ou des boutons d'arrêt d'urgence :

### Démarrage des Manches
- **Grille de Départ et Compte à Rebours** : Au lancement d'une manche, Race Coordinator AI déclenche un compte à rebours automatique (configuré via les options de départ automatique du configurateur de course). Des tonalités sonores et feux visuels préparent les pilotes.
- **Drapeau Vert** : Lorsque le compte à rebours atteint zéro, l'alimentation électrique s'enclenche et la manche entre dans l'état `Racing`.
- **Temps de Réaction** : Si « Partir derrière le capteur » est activé, le premier passage de chaque voiture enregistre son temps de réaction au départ plutôt qu'un tour complet.

### Pauses et Drapeaux Jaunes
- **Déclenchement d'une Pause** : En appuyant sur la barre d'espace, en cliquant sur l'icône de **Pause** ou via un bouton poussoir externe, le drapeau jaune est immédiatement déployé (`Paused`).
- **Coupure Immédiate du Courant** : Les relais d'alimentation de la piste coupent instantanément le courant pour stopper les voitures.
- **Capture des Temps Partiels** : À la même milliseconde, l'interface matérielle fige le temps partiel de chaque voiture en piste et l'enregistre en temps d'attente.
- **Passage de la Ligne en Roue Libre (Tours de Dérive)** : Si une voiture s'approchait de la ligne au moment de la coupure, son élan peut la faire franchir le capteur.
    - Si le capteur est activé pendant la fenêtre de **Temps de dérive**, le passage est validé comme **Tour de Dérive** (`isDrift: true`). Le badge **`DRIFT`** apparaît dans la voie, une annonce vocale urgente retentit et le tour est crédité au pilote.
    - Si l'activation a lieu après expiration du délai, elle est ignorée pour éviter les faux tours causés par les ramasseurs.
    - Pour plus d'informations, consultez [Configurateur de Course : Mécanique de Dérive et Chronométrage du Drift](race-editor.fr.md#drifting-and-drift-timing).

### Reprise de la Course
- **Redémarrage sous Drapeau Vert** : La libération de la pause relance le compte à rebours. Au drapeau vert, le courant revient et les compteurs matériels redémarrent de zéro.
- **Validation du Tour (Tours avec Dérive)** : Lorsqu'une voiture immobilisée en piste repart et franchit la ligne d'arrivée sous tension, son temps au tour totalise le partiel avant la pause et le temps après reprise. C'est un **Tour avec Dérive**. Si « Exclure les tours avec dérive des records » est coché, le tour est crédité au classement mais exclu des records.

## Ajustements de Tours et de Temps

Les directeurs de course peuvent ajuster manuellement le nombre de tours et les temps de manche des pilotes directement depuis l'écran de course pour résoudre les incidents de piste, déclenchements manqués ou pénalités :

### Ouvrir le dialogue d'ajustement
- **Clic sur une cellule** : Cliquez avec le bouton gauche sur n'importe quelle cellule ou carte de **Nombre de Tours** (`lapCount`, `physicalLapCount`) ou de **Temps Total** (`totalTime`, `overallTotalTime`) pour cette voie.
- **Menu Directeur de Course** : Ouvrez le **Menu Directeur de Course** et sélectionnez **Ajuster les sections de tour/temps** pour modifier n'importe quel pilote sur une manche en cours, passée ou à venir par lot.
- **Écrans de Résultats** : Également accessible depuis les écrans **Résultats de Manche** et **Résultats de Course** pour modifier les manches enregistrées après course.

### Raccourcis rapides (Tours)
Lors du clic sur une cellule de tours interactive :
- **`Shift + Clic Gauche`** : Ajoute immédiatement +0,25 tour (+1/4 de tour) sans ouvrir le dialogue.
- **`Alt + Clic Gauche`** : Retire immédiatement -0,25 tour (-1/4 de tour) sans ouvrir le dialogue.

### Contrôles du Dialogue
1. **Sections de Tour** : Saisissez les sections de piste (par exemple sur 100 sections par tour) pour ajuster les tours. Un aperçu indique la fraction de tour équivalente (ex. 25 sections = 0,25 tour).
2. **Ajustement de Temps** : Saisissez des secondes positives (pénalité, ex. `+5.000`) ou négatives (compensation de temps, ex. `-2.500`) avec une précision à la milliseconde (`0.001s`).
3. **Aperçu du Temps Total** : Le dialogue calcule et affiche en temps réel le temps total ajusté du pilote avant application.

### Effet sur les Classements et Métriques
- **Tours Ajustés** : Modifie directement la position dans les classements au **Plus Grand Nombre de Tours** et met à jour les écarts en tours (`gapLeader`, `gapPosition`). Ne modifie pas les tours physiques réels, le meilleur tour, le tour médian ni le rythme moyen physique.
- **Temps Total Ajusté** : Modifie la position dans les classements au **Temps Total le Plus Rapide**, sert de critère de départage pour les pilotes à égalité de tours, et met à jour le **Temps au Tour Moyen** ($\text{Temps Total Ajusté} / \text{Tours Physiques}$) ainsi que les écarts de temps.
- **Métriques Protégées** : Le **Meilleur Tour** et le **Tour Médian** sont strictement préservés d'après les tours physiques réels et ne sont jamais modifiés par les ajustements de temps.
