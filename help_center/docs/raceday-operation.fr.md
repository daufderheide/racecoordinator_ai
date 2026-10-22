# Exploitation le Jour de Course

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
