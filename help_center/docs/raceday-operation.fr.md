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

---

## Opérations Crash and Learn {: #crash-and-learn-operations }

Lorsqu'une course est disputée avec **Crash and Learn (CNL)** activé, Race Coordinator AI suit en temps réel les sorties de piste (crashs), applique les limites d'accidents, affecte les pénalités et gère les disqualifications.

### Détection des Sorties de Piste & Boutons d'Appel
- **Détection Automatique des Crashs** : Si configurée, lorsque le temps au tour dépasse le seuil de **Temps Automatique de Crash**, le système détecte un incident et comptabilise un crash pour ce pilote.
- **Drapeaux Jaunes Automatiques** : Si **Mettre la manche en pause lors d'un crash** est activé, un crash automatique déclenche immédiatement une interruption de course (drapeau jaune) et coupe l'alimentation de la piste.
- **Crashs Multiples par Tour** : Si **Autoriser plusieurs crashs par tour** est activé, une voiture immobilisée hors-piste cumulera un crash supplémentaire chaque fois que le seuil de temps s'écoule sans franchir la ligne.
- **Boutons d'Appel par Voie** : Sur les pistes équipées de boutons d'appel par voie, appuyer sur le bouton met la manche en pause et crédite un crash à la voie correspondante. Appuyer sur un autre bouton pendant la pause ne crédite aucun crash supplémentaire.

### Mécanisme de Disqualification (DQ)
Lorsqu'un pilote dépasse le nombre **Maximum de Crashs** configuré (ex. 4 crashs pour une limite fixée à 3) :
- **Drapeau Noir** : Le statut de la voie bascule immédiatement au drapeau noir (`flag.disqualified`).
- **Coupure d'Alimentation de la Voie** : Si des relais par voie sont installés, l'alimentation électrique de cette voie est coupée instantanément.
- **Arrêt des Tours** : Les impulsions du capteur et les tours ne sont plus comptabilisés pour le pilote disqualifié pendant le reste de la manche.
- **Zéro segment automatique** : Dans les courses à segments automatiques (`NoneAutoSegments` ou `SingleLapAutoSegments`), un pilote disqualifié reçoit $0$ segment automatique. Puisqu'un crash ou une sortie de piste automatique immobilise le pilote sur la piste, attribuer des segments automatiques récompenserait artificiellement un pilote disqualifié de jusqu'à $0,99$ tour.
- **Position au Classement** : Un pilote disqualifié ne peut pas être classé devant un pilote non disqualifié dans la manche. Si plusieurs pilotes sont disqualifiés, ils sont ordonnés selon leur score ajusté du **Pourcentage de Score de Manche après Disqualification**.

### Révision et Ajustement des Crashs et Pénalités
Les directeurs de course conservent un contrôle manuel total :
- **Widgets de Compteur de Crashs** : Les colonnes de voie affichent le nombre de crashs de la manche en cours.
- **Ajustements Manuels** : À l'aide des commandes de crash ou du dialogue **Ajuster les sections de tour / temps**, il est possible d'ajouter ou de retirer des crashs.
- **Annulation d'une Disqualification** : Réduire le nombre de crashs au niveau ou en dessous de la limite annule immédiatement la disqualification : le drapeau repasse au vert, l'alimentation est rétablie et les pénalités sont recalculées.
- **Visibilité des Pénalités** : Les tours et le temps de pénalité sont affichés dans le dialogue d'ajustement à côté des champs de réglage.
