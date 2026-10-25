# Calculs d'Écarts et Widgets d'Écart (Gaps)

Race Coordinator AI intègre un moteur automatisé de calcul d'écarts côté serveur (`GapCalculator`) qui détermine en temps réel les écarts chronométriques et les intervalles en tours entre les concurrents. Tous les calculs s'effectuent en continu sur le serveur et sont synchronisés avec les affichages clients, les widgets personnalisés, les annonces vocales et les exports tableurs.

---

## Vue d'Ensemble des Calculs d'Écarts

À chaque mise à jour du classement, le moteur ordonne tous les concurrents selon les règles de scoring actives (Plus grand nombre de tours, Meilleur temps total ou Points). Les métriques d'écart sont ensuite évaluées par rapport à deux référentiels distincts :

- **Écart avec le Meneur (`leader`)** : L'intervalle entre un concurrent et le leader actuel de la course (P1). L'écart du leader avec lui-même est toujours `0.0` (affiché sous forme de tirets `--`).
- **Écart avec la Position Précédente (`position`)** : L'intervalle entre un concurrent et la voiture qui le précède immédiatement au classement (ex. P3 par rapport à P2). L'écart du leader est toujours `0.0` (affiché sous forme de tirets `--`).

### Portées de Données : Écarts de Manche vs Écarts Généraux

Race Coordinator AI prend en charge l'évaluation des écarts sur deux portées distinctes :

| Portée | Clé de Colonne | Description | Cas d'Usage |
| :--- | :--- | :--- | :--- |
| **Données de Manche (Heat Data)** | `gap` | Évalue les écarts strictement entre les voitures actuellement en piste dans la manche active. Les pilotes au repos affichent des tirets (`--`). | Course en direct, fiches de piste, classements de manche en direct. |
| **Données Générales (Overall Data)** | `overallGap` | Évalue les écarts cumulés sur l'ensemble des participants du tournoi, à travers toutes les manches disputées. | Grille de classement général, suivi de championnat. |

> [!NOTE]
> Les mises en page existantes utilisant d'anciennes clés (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, etc.) sont automatiquement migrées vers `gap` ou `overallGap` avec les paramètres de cible et de mode de calcul correspondants.

---

## Les 2 Widgets d'Écart Configurables

Race Coordinator AI propose **2 widgets d'écart configurables** (disponibles sous forme de colonnes de grille, de cartes de piste individuelles et d'encarts personnalisés) :

```
                          ┌──────────────────────────────────────────────┐
                          │            WIDGETS D'ÉCART DE COURSE         │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │  ÉCART DE MANCHE (`gap`)│                                 │ÉCART GÉNÉRAL(`overallGap)│
      │ Pilotes Manche Active   │                                 │Tous les Participants    │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │  SÉLECTEUR DE CIBLE   │           │    MODE DE CALCUL     │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Leader (P1)         │           │ • Toujours temps      │
                   │ • Position précédente │           │ • Tours et temps (F1) │
                   │                       │           │ • Toujours tours      │
                   └───────────────────────┘           └───────────────────────┘
```

### Sélection de la Cible
- **Leader (`leader`)** : Écart par rapport au leader actuel de la course (P1). Le leader affiche des tirets (`--`).
- **Position précédente (`position`)** : Écart par rapport au concurrent immédiatement devant (ex. P3 vs P2). Le leader affiche des tirets (`--`).

### Modes de Calcul
1. **Toujours temps (`always_time`)** :
   - Projection continue du rythme chronométrique en secondes.
   - Formaté en `+X.XXX` avec décimales configurables (1 à 3 décimales).
2. **Tours et temps (`laps_and_time`)** :
   - Affichage type retransmission Formule 1.
   - Affiche des secondes (`+X.XXX`) pour les voitures dans le tour du leader.
   - Affiche le retard en tours (`+1 Tour`, `+N Tours`) en cas de dépassement.
3. **Toujours tours (`always_laps`)** :
   - Différence exacte en tours calculée chaque fois qu'un concurrent franchit la ligne d'arrivée.
   - Intègre la progression partielle du pilote cible à ce moment précis.
   - Formaté avec décimales de tours configurables (0 à 3 décimales).

---

## Formules de Calcul Détaillées

Tous les calculs sont effectués dans `com.antigravity.race.GapCalculator` sur le serveur Java.

Soit `leadParticipant` le pilote qui précède (leader ou position $N-1$) et `curParticipant` le pilote poursuivant.

### 1. Formule : Toujours Temps (`always_time`)

Les écarts chronométriques évaluent trois scénarios :

#### Scénario A : Même Nombre de Tours
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Scénario B : Aucun Tour Réalisé
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Scénario C : Nombre de Tours Différent
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

La formule de projection s'adapte à la **Méthode d'Arrivée** :
1. **Courses au Temps** :
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$
2. **Courses aux Tours** :
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

---

### 2. Formule : Formule 1 (`laps_and_time`)

#### 1. Évaluation du Retard en Tours
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$
- Si $\text{LapsDown} > 0$ : Le pilote est dépassé (`+X Tours`).
- Si $\text{LapsDown} \le 0$ : Le pilote est dans le tour du leader.

#### 2. Écart dans le Tour du Leader
- **Même nombre de tours franchis** :
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Le leader compte un tour supplémentaire** :
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

---

### 3. Formule : Toujours Tours (`always_laps`)

Ce mode mesure l'écart exact en tours à chaque franchissement de la ligne :

#### 1. Déclenchement du Franchissement
Quand un concurrent boucle un tour, le serveur enregistre ses tours ajustés et identifie le pilote de référence.

#### 2. Calcul du Tour Partiel
Pour assurer une comparaison juste, la progression partielle du pilote de référence est calculée en fonction du temps écoulé depuis son propre dernier tour :
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> Si le pilote de référence n'a pas encore de temps médian valide ($\le 0$) ou si $\text{TimeSinceLastLap} \le 0$, le tour partiel vaut $0.0$. La progression est plafonnée à $0.99$ pour éviter d'incrémenter un tour complet avant le franchissement physique.

#### 3. Écart Effectif en Tours
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

Le concurrent conserve cette valeur jusqu'au franchissement de son propre tour suivant.

---

## Comparaison des Modes de Calcul

| Caractéristique | Toujours temps (`always_time`) | Tours et temps (`laps_and_time`) | Toujours tours (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Approche** | Projection continue du rythme | Comparaisons exactes sur la ligne | Écart en tours avec progression partielle |
| **Voitures Dépassées**| Secondes projetées (ex. `+14.820`) | Texte d'écart en tours (`+1 Tour`) | Écart décimal en tours (ex. `+2.45`) |
| **Dans le Tour du Leader**| Écart en secondes (`+1.450`) | Différence exacte sur la ligne (`+1.450`) | Écart décimal en tours (ex. `+0.28`) |
| **Base Décimale** | Décimales de temps (1 à 3) | Décimales de temps (1 à 3) | Décimales de tours (0 à 3) |
| **Moment de Mise à Jour**| Mises à jour continues | Franchissement de la ligne | Franchissement de tour personnel |
| **Application Idéale**| Gestion du rythme, essais | Tableaux de chronométrage F1 | Épreuves d'endurance aux tours |

---

## Utilisation des Widgets d'Écart dans l'Éditeur d'Interface

### 1. Dans les Grilles et Tableaux
Dans l'Éditeur d'Interface, sélectionnez le widget Grille et ouvrez l'onglet **Colonnes**. Dans **Gaps et Intervalles**, cochez **Écart de Manche** (`gap`) ou **Écart Général** (`overallGap`) :
- Sélectionnez la colonne pour ouvrir l'**Inspecteur de Colonne**.
- Dans **Configuration d'écart**, choisissez la **Cible** (*Leader* ou *Position précédente*) et le **Mode de calcul** (*Toujours temps*, *Tours et temps* ou *Toujours tours*).
- Plusieurs colonnes d'écart avec des cibles ou modes distincts peuvent être ajoutées simultanément à la même grille.

### 2. Cartes de Piste Individuelles
Faites glisser les widgets d'écart directement depuis la barre d'outils sur le canevas et configurez cible et mode dans l'inspecteur.

### 3. Encarts (Insets)
Les écarts peuvent être intégrés en sous-badges dans les cartes de piste en assignant `gap` ou `overallGap` à l'une des 8 positions d'ancrage.

---

## Intégration avec la Synthèse Vocale (TTS), l'Audio et l'Export

- **Synthèse Vocale (TTS)** : `{driver.gapLeader}` et `{driver.gapPosition}`.
- **Widgets personnalisés HTML/JS** : `driver.gap_leader` et `driver.gap_position`.
- **Exports Excel** : `${driver.gapLeader}` et `${driver.gapPosition}`.
