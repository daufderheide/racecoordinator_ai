# Calculs d'Écarts & Widgets d'Intervalle (Gaps)

Race Coordinator AI intègre un moteur automatisé côté serveur pour le calcul des écarts (`GapCalculator`), déterminant en temps réel les intervalles chronométriques et les différentiels de tours entre les concurrents. Tous les calculs sont exécutés de façon continue sur le serveur et synchronisés avec l'affichage client, les widgets d'interface personnalisés, les annonces vocales (TTS) et les exports tableurs.

---

## Vue d'Ensemble des Calculs d'Écarts

À chaque mise à jour du classement de la course, le moteur trie les concurrents selon leur position courante d'après le système de pointage actif (Nombre de tours, Temps total le plus rapide ou Points). Les écarts sont ensuite calculés par rapport à deux repères distincts :

- **Écart avec le Meneur (`gapLeader` / `overallGapLeader`)** : L'intervalle de temps entre un pilote et la 1re place de la course (P1). L'écart du meneur avec lui-même est toujours de `0.0` (affiché sous forme de tirets `--`).
- **Écart avec la Position Précédente (`gapPosition` / `overallGapPosition`)** : L'intervalle de temps entre un pilote et la voiture immédiatement devant dans le classement (par exemple, P3 par rapport à P2). L'écart du 1er est toujours de `0.0` (affiché sous forme de tirets `--`).

### Portées des Données : Écarts de Manche vs. Écarts Généraux

Race Coordinator AI prend en charge l'évaluation des écarts sur deux portées distinctes :

| Portée | Clés de Colonnes | Description | Cas d'Usage |
| :--- | :--- | :--- | :--- |
| **Données de Manche (Heat Data)** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Évalue les écarts strictement entre les voitures actuellement en piste dans la manche active. Les pilotes au repos affichent des tirets (`--`). | Course en direct, fiches de piste, tableaux de bord de manche. |
| **Données Générales (Overall Data)** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Évalue les écarts cumulés du tournoi entre tous les participants inscrits, sur l'ensemble des manches disputées. | Tableaux de classement général, suivi du championnat. |

---

## Les 4 Widgets d'Écart Pris en Charge

Race Coordinator AI propose **4 widgets d'écart spécifiques** (disponibles sous forme de colonnes de grille, de fiches de piste indépendantes ou d'encarts personnalisés) :

```
                          ┌──────────────────────────────────────────────┐
                          │           WIDGETS D'ÉCART DE COURSE          │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │     ÉCARTS STANDARDS    │                                 │     ÉCARTS FORMULE 1    │
      │  Projection de Rythme   │                                 │ Passage Ligne d'Arrivée │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │ (Meneur P1) │     │ (Voiture Av)│                         │ (Meneur P1) │     │ (Voiture Av)│
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Écart avec le Meneur (Standard)
- **Clés de Boîte à Outils** : `gapLeader` (Manche) / `overallGapLeader` (Général)
- **Groupe de Boîte à Outils** : *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Libellés par Défaut** : `HEAT GAP LEADER`, `OVERALL GAP LEADER` ou `GAP LEADER`
- **Modèle de Mesure** : Projection mathématique continue du rythme.
- **Affichage** : Formaté en `+X.XXX` secondes avec décimales configurables (1 à 3 décimales). Le meneur affiche `--`.
- **Objectif** : Offre une estimation en direct du retard par rapport au meneur. Même si le meneur a bouclé plus de tours, le widget projette l'écart selon le temps au tour moyen du poursuivant.

### 2. Écart avec la Position Précédente (Standard)
- **Clés de Boîte à Outils** : `gapPosition` (Manche) / `overallGapPosition` (Général)
- **Groupe de Boîte à Outils** : *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Libellés par Défaut** : `HEAT GAP POSITION`, `OVERALL GAP POSITION` ou `GAP POSITION`
- **Modèle de Mesure** : Projection mathématique continue du rythme.
- **Affichage** : Formaté en `+X.XXX` secondes. La 1re place affiche `--`.
- **Objectif** : Affiche le temps nécessaire pour doubler le concurrent qui précède. Idéal pour les duels en piste.

### 3. Écart Formule 1 avec le Meneur (`F1`)
- **Clés de Boîte à Outils** : `gapLeaderF1` (Manche) / `overallGapLeaderF1` (Général)
- **Groupe de Boîte à Outils** : *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Libellés par Défaut** : `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP` ou `GAP LEADER`
- **Modèle de Mesure** : Mesure physique exacte lors du passage sur la ligne d'arrivée.
- **Affichage** :
  - **Dans le même tour** : `+X.XXX` secondes d'écart physique réel au franchissement de la ligne.
  - **Pilotes avec un tour de retard** : Remplace l'écart temporel par `+1 Tour` ou `+N Tours` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Meneur** : Affiche `--`.
- **Objectif** : Reproduit la présentation télévisée de la Formule 1. Évite d'afficher des temps d'écart disproportionnés pour les retardataires.

### 4. Écart Formule 1 avec la Position Précédente (`F1`)
- **Clés de Boîte à Outils** : `gapPositionF1` (Manche) / `overallGapPositionF1` (Général)
- **Groupe de Boîte à Outils** : *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Libellés par Défaut** : `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP` ou `GAP POSITION`
- **Modèle de Mesure** : Mesure physique exacte lors du passage sur la ligne d'arrivée.
- **Affichage** :
  - **Dans le même tour** : Formaté en `+X.XXX` secondes derrière le concurrent précédent.
  - **Doublé par la voiture précédente** : Affiche `+1 Tour` ou `+N Tours`.
  - **Meneur** : Affiche `--`.
- **Objectif** : Fournit une indication précise des écarts lors des batailles rapprochées, marquant immédiatement le nombre de tours de retard le cas échéant.

---

## Formules de Calcul Détaillées

Tous les calculs sont centralisés dans `com.antigravity.race.GapCalculator` sur le serveur Java.

Soit `leadParticipant` le pilote qui précède et `curParticipant` le pilote poursuivant.

### Mathématiques des Écarts Standards

Trois situations sont gérées :

#### Situation A : Même Nombre de Tours
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Situation B : Aucun Tour Complet Réalisé
Si le poursuivant n'a pas encore validé de tour complet (`hasNoFullLaps()`) :
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Situation C : Nombre de Tours Différent
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

La projection s'adapte au **Mode de Fin de Manche (Finish Method)** :

1. **Course au Temps (Timed Finish)** :
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Course aux Tours (Lap Finish)** :
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Si des ajustements ou anomalies de timing rendent $\text{ProjectedGap}$ négatif, le système bascule automatiquement sur $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$.

---

### Mathématiques des Écarts Formule 1

#### 1. Tours de Retard (Laps Down)
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Si $\text{LapsDown} > 0$ : Le poursuivant a un ou plusieurs tours de retard. L'écart chronométrique est fixé à `0.0` et l'interface affiche `+X Tours`.
- Si $\text{LapsDown} \le 0$ : Le poursuivant est dans le tour du meneur ($\text{LapsDown} = 0$).

#### 2. Écart dans le Même Tour
- **Même Nombre de Tours Physiques** :
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Le Meneur a Bouclé un Tour Supplémentaire** : L'écart est calculé au moment précis où le meneur a franchi la ligne lors de ce même tour :
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> Si la valeur calculée est négative, elle est plafonnée à `0.0`.

---

## Comparatif : Écarts Standards vs. Écarts Formule 1

| Caractéristique | Écarts Standards (`gapLeader`, `gapPosition`) | Écarts Formule 1 (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Méthode** | Projection continue de rythme | Comparaison exacte au franchissement de la ligne |
| **Voitures avec Tour de Retard** | Secondes projetées (ex. `+14.820`) | Tours de retard (ex. `+1 Tour`, `+2 Tours`) |
| **Dans le Même Tour** | Écart de temps en secondes (`+1.450`) | Différentiel exact au franchissement de la ligne (`+1.450`) |
| **Type de Fin de Course** | Différencie les courses au temps et aux tours | Basé sur le franchissement de la ligne d'arrivée |
| **Usage Idéal** | Contrôle régulier du rythme en slot racing | Affichage type retransmission TV, écrans spectateurs |

---

## Utilisation des Widgets d'Écart dans l'Éditeur d'Interface

### 1. Dans les Grilles et Tableaux
Dans l'Éditeur d'Interface, sélectionnez le widget Grille et ouvrez l'onglet **Colonnes**. Dans les sous-groupes **Gaps & Intervals** ou **Overall Gaps & Intervals**, cochez les colonnes d'écart souhaitées.

### 2. Fiches de Piste Indépendantes
Glissez-déposez un widget d'écart depuis la Boîte à Outils sur le canevas. Liez la fiche à une **Piste Spécifique**, une **Position en Manche** ou au **Classement Général**.

### 3. Encarts (Insets) sur d'Autres Fiches
Ajoutez un sous-indicateur d'écart sur n'importe quelle fiche (ex. avatar ou compteurs de tours) via les 8 ancres disponibles dans la section **Card Insets**.

---

## Intégration TTS, Audio & Exportations

- **Synthèse Vocale (TTS)** :
  - `{driver.gapLeader}` : Écart avec le meneur vocalisé en secondes.
  - `{driver.gapPosition}` : Écart avec la voiture précédente en secondes.
- **Widgets HTML/JS Personnalisés** : `driver.gap_leader` et `driver.gap_position`.
- **Modèles Excel (XLS)** :
  - `${driver.gapLeader}` et `${driver.gapPosition}` (Classement général).
  - `${heatDriver.gapLeader}` et `${heatDriver.gapPosition}` (Résultats de manche).
