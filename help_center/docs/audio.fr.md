# Système Audio

Race Coordinator AI intègre un moteur audio intelligent à double canal, conçu pour délivrer des effets sonores immersifs, des commentaires vocaux dynamiques et des annonces de direction de course essentielles, sans chevauchement chaotique ni signaux manqués.

---

## Architecture Audio à Double Canal

Le moteur sépare les sons en deux canaux distincts :

```
                      ┌────────────────────────────────────────┐
                      │          Répartiteur Audio             │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   Effets Sonores (SFX) │                      │     Annonces Vocales   │
     │  (Bips & Sons Courts)  │                      │    (TTS & Commentaires)│
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
         Lecture Polyphonique                         Voix Unique Prioritaire
      (Sons joués simultanément)                     ("Jouer, Remplacer ou    
                  │                                         Ignorer")         
                  │◄──────── Atténuation Automatique (Ducking) ───┤
                  │  (Les SFX passent automatiquement à 20%       │
                  │   du volume lorsqu'une voix s'exprime)        │
```

### 1. Effets Sonores (SFX)
- **Ce qui est inclus :** Tonalités courtes non verbales telles que les bips de passage de ligne (`default_beep`), les bruits de passage (`default_driveby`) ou les carillons.
- **Lecture Polyphonique :** Les effets se déclenchent immédiatement via les éléments audio HTML5. Si plusieurs voitures franchissent la ligne d'arrivée au même instant, chaque son de tour se joue en parallèle sans coupure.
- **Atténuation Automatique (Audio Ducking) :** Dès qu'une annonce vocale commence, le volume des effets sonores simultanés est automatiquement réduit à **20%**. À la fin de la voix, le volume des SFX revient instantanément à 100%.

### 2. Annonces Vocales Parlées
- **Ce qui est inclus :** Synthèse vocale (TTS) et fichiers audio préenregistrés (commentaires, sirènes de drapeau jaune, alertes de ravitaillement et comptes à rebours).
- **Moteur à Voix Unique :** Géré selon la règle **"Jouer, Remplacer ou Ignorer"** afin que plusieurs voix ne parlent jamais en même temps.

---

## Le Système de Priorités

Face à la multiplicité des événements de course simultanés, Race Coordinator AI applique une hiérarchie à 4 niveaux de priorité :

### Niveaux de Priorité

| Niveau | Poids | Événements Types | Comportement en Conflit |
| :--- | :---: | :--- | :--- |
| **`urgent`** (Urgent) | 4 | Drapeau jaune, manche terminée, course terminée, faux départ, temps au tour minimum, tour de drift, arrêt aux stands, alertes de carburant (alerte, critique, vide), compte à rebours vert / PARTEZ (`audio.countdown`), **Drapeau blanc / Dernier tour** (`audio.laps_left` avec tours restants <= 1, ex. "Dernier tour" ou 0 restant "Meneur terminé") et **Temps critique restant** (`audio.seconds_left` avec secondes restantes <= 5s, ex. "3 secondes restantes / Drapeau blanc - terminez votre tour"). | **Interrompt** immédiatement toute annonce de priorité inférieure. Si une autre annonce urgente parle déjà, les nouvelles annonces urgentes sont placées dans la **File d'Attente Urgente** au lieu d'être ignorées. Ignore immédiatement la pause de cadence. |
| **`high`** (Élevé) | 3 | Record absolu de piste, record absolu de voie, nouveau meneur de course, meilleur tour de course, **Temps de manche / Secondes restantes** (`audio.seconds_left` avec secondes restantes > 5s ou écoulées, ex. 15s, 30s, 60s), **Mi-manche** (`audio.seconds_left.halfway`). | **Interrompt** les annonces de priorité `normal` ou `low`. Franchit la pause de cadence si le canal est libre. En cas de file d'attente, si une annonce de priorité égale ou supérieure est en cours, entre dans la **File d'Attente Séquentielle** pour être jouée après la voix active plutôt que d'être ignorée. |
| **`normal`** (Normal) | 2 | Tours du meneur / Tours restants (`audio.laps_left` avec tours restants > 1 ou écoulés, ex. "10 tours restants"), Secondes restantes avant démarrage automatique (`audio.auto_start`, ex. "La manche commence dans 30 secondes"), Secondes restantes avant passage automatique (`audio.auto_advance`), meilleur tour de manche, meilleur tour de voie en course, nouveau meneur de manche, record personnel du pilote (en mode TTS). | **Interrompt** les annonces de priorité `low`. Peut être placé dans la file d'attente séquentielle, ou ignoré si une annonce non mise en file arrive pendant qu'une annonce `urgent`, `high` ou une autre annonce `normal` est active. |
| **`low`** (Faible) | 1 | Son de tour régulier du pilote (en mode TTS). | Ne se joue que si le canal vocal est totalement libre. Peut être mis en file d'attente avec déduplication automatique par pilote/voie afin d'annoncer uniquement le temps le plus récent lors de tours rapides. Est **interrompu** immédiatement à l'arrivée d'une annonce de niveau supérieur. |

### Règles de Gestion des Conflits

1. **Remplacement (Preemption) :** Si un événement possède une priorité supérieure à l'annonce vocale en cours, cette dernière est arrêtée immédiatement pour laisser place à la nouvelle annonce plus prioritaire.
2. **Percée Urgente et File d'Attente :** Contrairement aux niveaux inférieurs, les alertes `urgent` sont critiques pour la sécurité et la direction de course. Une alerte `urgent` franchit immédiatement la pause de cadence de 500 ms et interrompt toute annonce de priorité inférieure. Si une alerte urgente survient pendant qu'une autre annonce urgente est jouée, elle entre dans la **File d'Attente Urgente** et se déclenche dès la fin de l'annonce en cours.
3. **Percée de Haute Priorité sur Canal Libre :** Si le canal vocal est libre mais que la pause de cadence de 500 ms est active, les annonces de priorité `high` (paliers, mi-manche, secondes restantes) franchissent immédiatement la pause de cadence pour éviter tout retard d'annonce.
4. **File d'Attente Séquentielle vs Rejet Direct :** Les annonces vocales non urgentes (annonces de temps, commentaires de tours en file, temps de tours réguliers) utilisent la **File d'Attente Séquentielle**. Si une voix est en train de parler, les annonces en file attendent leur tour et se jouent dès que la voix active et la pause de cadence se terminent, évitant ainsi la perte de messages pendant une prise de parole.
5. **Déduplication en File d'Attente :** Pour maintenir des commentaires réactifs et clairs sans accumulation de messages :
   - **Annonces de chronomètre et de compte à rebours** (`widgetType: "timer"`, `widgetType: "countdown"`) remplacent automatiquement les annonces de temps antérieures en attente dans la file (par exemple, "10 secondes restantes" remplace un "15 secondes restantes" en attente).
   - **Annonces de temps au tour du pilote** (`widgetType: "lane-view"`) remplacent automatiquement les temps au tour antérieurs en attente pour le même pilote ou la même voie.
6. **Drapeau Blanc et Urgence du Dernier Tour :** En course compétitive, le drapeau blanc (1 tour restant ou <= 5 secondes restantes) est crucial. Même si un pilote boucle un tour déclenchant un palier (comme un record du tour ou un changement de meneur), la priorité `urgent` du drapeau blanc garantit qu'il l'emporte sur les paliers et interrompt tout commentaire de tour standard.
7. **Pause de Cadence (Callout Spacing) :** À la fin de chaque annonce parlée, un court silence est intercalé avant d'autoriser la prochaine annonce non urgente, assurant une élocution aérée et intelligible. Les alertes `urgent` ignorent immédiatement cette pause.

### Priorité des Paliers & Repli Automatique (Milestone Priority & Fallback)

Lorsqu'un pilote réalise un tour déclenchant un ou plusieurs paliers (record de piste, meilleur tour de manche ou changement de leader) :

1. **Cascade de priorité lors d'événements simultanés :** Les annonces candidates sont évaluées selon un ordre de priorité strict (Record général -> Record général de voie -> Nouveau leader de course -> Nouveau leader de manche -> Meilleur tour de course -> Meilleur tour de voie de course -> Meilleur tour de manche -> Meilleur tour personnel). Si le son de plus haute priorité est réglé sur `none` (ou non configuré), le système passe au son suivant le plus prioritaire déclenché lors de ce tour et le joue s'il est configuré.
2. **Annonces ignorées si canal occupé :** Si une annonce vocale sélectionnée est **ignorée** parce qu'une annonce de priorité supérieure est en cours (ou pendant une pause de cadence), aucune autre annonce vocale ne sera tentée sur ce tour. Le système bascule directement sur le son de **meilleur tour personnel** (si tour PB) ou le son de **tour standard**.
3. **Repli polyphonique SFX :** Si ce son de secours est un effet sonore (SFX), il est joué de manière polyphonique, garantissant au pilote un retour acoustique immédiat à chaque passage de ligne.

---

## Paramètres de Configuration Audio

Ces paramètres sont ajustables dans l'**Éditeur d'Interface**, section **Paramètres Audio** :

### Volume Général (Master Volume)
- **Plage :** 0% à 100% (Par défaut : `100%`)
- **Description :** Règle le niveau de sortie audio global de l'application pour les effets sonores et la synthèse vocale.

### Délai d'Expiration de la File Urgente (TTL)
- **Options :** `3 secondes`, `5 secondes (Par défaut)`, `10 secondes`
- **Description :** Durée maximale pendant laquelle une alerte urgente peut attendre dans la file d'attente. Les alertes expirées sont abandonnées pour éviter d'annoncer des situations obsolètes.

### Espacement des Annonces (Pause de Cadence)
- **Options :** `Aucun (0s)`, `Court (500ms - Par défaut)`, `Normal (1000ms)`, `Détendu (1500ms)`
- **Description :** Silence minimal imposé entre deux annonces vocales successives. Les alertes urgentes ignorent immédiatement ce délai.

---

## Configuration de la Synthèse Vocale (TTS)

Race Coordinator AI s'appuie sur l'API native Web Speech des navigateurs modernes pour offrir une synthèse vocale sans latence, sans dépendance à des services cloud et sans connexion internet requise.

### Paramètres Vocaux TTS

| Paramètre | Options / Plage | Valeur par défaut | Description |
| :--- | :--- | :---: | :--- |
| **Voix TTS** | Voix du navigateur / OS | `-- Voix par défaut --` | Sélectionne la voix utilisée (avec code langue tel que `fr-FR`, `en-US`). |
| **Vitesse (Rate)** | `0.1x` à `2.0x` | `1.0x` | Ajuste la rapidité d'élocution. Une vitesse légèrement accrue (`1.1x`–`1.3x`) convient aux circuits très rapides. |
| **Hauteur (Pitch)** | `0.0x` à `2.0x` | `1.0x` | Règle la hauteur tonale de la voix. |
| **Volume TTS** | `0%` à `100%` | `100%` | Volume propre à la voix avant application du Volume Général (`masterVolume * ttsVolume`). |
| **Tester la voix** | Bouton | — | Déclenche une phrase de test avec vos réglages actuels. |

### Variables Dynamiques TTS

Les chaînes TTS prennent en charge les balises dynamiques entre accolades `{...}` ou `${...}` :
- `{driver.name}`, `{driver.nickname}` : Nom et surnom du pilote.
- `{driver.lastLapTime}`, `{driver.bestLapTime}` : Temps au tour (arrondis à 3 décimales).
- `{driver.totalLaps}` / `{driver.lapCount}` : Nombre total de tours.
- `{driver.gapLeader}`, `{driver.gapPosition}` : Écarts avec le meneur ou le concurrent précédent.
- `{race.name}`, `{track.name}`, `{heat.number}` : Informations sur l'épreuve.

Consultez le [Guide de Synthèse Vocale (TTS)](tts.md) pour la liste exhaustive des variables.

---

## Pertinence Audio et Filtrage Multi-Écrans

Dans les configurations à plusieurs écrans (écran principal, postes de pilotage individuels, affichage des stands), la **Pertinence Audio** empêche la cacophonie générale.

### 1. Associations Audio (Audio Associations)
Chaque son diffusé porte des métadonnées de contexte :
- **`widgetType`** : Type de widget (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`** : Numéro de voie (indexé à 0).
- **`driverId`** : Identifiant unique du pilote.

### 2. Filtrage selon la Mise en Page sur l'Écran Principal
- **Vue des Voies (`lane-view`) :** Si aucun widget de voie n'est présent sur l'écran, les sons de tour des pilotes sont coupés.
- **Compte à Rebours (`countdown`) :** Si le compte à rebours est omis, les bips de départ sont coupés.
- **Minuteur (`timer`) :** Si aucun chronomètre n'est affiché, les annonces de mi-course et de temps restant sont coupées.
- **Drapeaux (`flag`) :** En l'absence de widget drapeau, les alertes de drapeau jaune et de fin de course sont coupées.

### 3. Postes de Pilotage Isolés (`scoped`)
Sur l'écran d'un poste de pilotage (`/driver-station/:lane`) :
- Le système fonctionne en mode délimité (**`scoped`**).
- Seuls les sons, records et alertes de carburant du **pilote de cette voie** sont diffusés.
- Les sons des concurrents sont filtrés pour ne pas distraire le pilote.
- Les annonces générales (compte à rebours, drapeau jaune, fin de manche) restent actives.

### 4. Isolation des Moteurs Audio par Page
Chaque onglet ou fenêtre exécute une instance dédiée d'`AudioService` (`providers: [AudioService]`). Un son sur un poste pilote ne bloque jamais la régie de course.

---

---

## Catalogue Complet des Ressources Audio

Les tableaux suivants répertorient tous les événements audio dans Race Coordinator AI, leur type de son (SFX non verbal vs. annonce vocale), niveau de priorité et portée d'affichage.

### Événements Audio du Pilote (Configurés dans l'Éditeur de Pilotes)

| Événement Audio du Pilote | Quand le son est joué | Fichier / Ressource par Défaut | Type de Son | Niveau de Priorité | Pertinence et Affichage |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Son de Tour** | Joué à chaque tour régulier franchi (ou en secours si un son d'étape est ignoré ou indisponible). | `default_beep` | **SFX** (Prédéfini) / **Annonce Vocale** (TTS) | `low` (Poids 1 en TTS; Polyphonique en SFX) | `lane-view`: Joué sur l'Écran Principal (si widget de voie présent) et sur le Poste Pilote de cette voie/pilote. |
| **Son de Meilleur Tour Personnel** | Joué lorsque le pilote réalise son tour le plus rapide de la manche ou séance en cours. | `default_driveby` | **SFX** (Prédéfini) / **Annonce Vocale** (TTS) | `normal` (Poids 2 en TTS; Polyphonique en SFX) | `lane-view`: Joué sur l'Écran Principal (si widget de voie présent) et sur le Poste Pilote de cette voie/pilote. |
| **Son du Meilleur Tour de Course** | Joué lors de l'établissement du tour le plus rapide de toute la course, toutes manches et voies confondues. | `default_best_race_lap` | **Annonce Vocale** | `high` (Poids 3) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son du Meilleur Tour de Voie de Course** | Joué lors du tour le plus rapide sur cette voie spécifique durant la course actuelle. | `default_best_race_lane_lap` | **Annonce Vocale** | `normal` (Poids 2) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son du Meilleur Tour de Manche** | Joué lors du tour le plus rapide parmi tous les pilotes de la manche active. | `default_best_heat_lap` | **Annonce Vocale** | `normal` (Poids 2) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son de nouveau leader de course** | Joué lorsqu'un pilote prend la première place du classement général de la course. | `default_new_race_leader` | **Annonce Vocale** | `high` (Poids 3) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son de nouveau leader de manche** | Joué lorsqu'un pilote prend la tête de la manche active. | `default_new_heat_leader` | **Annonce Vocale** | `normal` (Poids 2) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son du Record de Tour Général** | Joué lorsque le record historique absolu de la piste est battu sur l'ensemble des voies. | `default_record_lap` | **Annonce Vocale** | `high` (Poids 3) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son du Record de Tour de Voie Général** | Joué lorsque le record historique de la piste sur cette voie spécifique est battu. | `default_record_lane_lap` | **Annonce Vocale** | `high` (Poids 3) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son d'Entrée aux Stands** | Joué lorsque la voiture entre dans la voie des stands ou la zone de ravitaillement. | `default_pit_in` | **Annonce Vocale** | `urgent` (Poids 4) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Sons de Niveau de Carburant** | Joué lorsque le carburant descend aux seuils d'avertissement, critique ou vide. | `default_fuel_level` (Ensemble Audio) | **Annonce Vocale** | `urgent` (Poids 4) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son de Faux Départ** | Joué lorsqu'un faux départ ou une infraction au départ est détecté. | `default_penalty` | **Annonce Vocale** | `urgent` (Poids 4) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |
| **Son de tour de drift** | Joué lorsqu'une voiture franchit la ligne en roue libre hors tension dans la fenêtre de temps de dérive. | TTS (`Drift lap for {driver.nickname}`) | **Annonce Vocale** | `urgent` (Poids 4) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |

### Événements Audio de Thème (Configurés dans l'Éditeur de Thèmes)

| Emplacement Audio | Clé par Défaut | Type de Son | Niveau de Priorité | Pertinence et Affichage |
| :--- | :--- | :--- | :---: | :--- |
| **Compte à Rebours de Départ** | `audio.countdown` | **Annonce Vocale** / Ensemble Audio | `urgent` | `countdown`: Joué sur l'Écran Principal (si widget compte à rebours présent) et sur tous les Postes Pilote. |
| **Feu Vert / PARTEZ** | `audio.countdown.green` | **Annonce Vocale** / Bip Prédéfini | `urgent` | `countdown`: Joué sur l'Écran Principal (si widget compte à rebours présent) et sur tous les Postes Pilote. |
| **Drapeau Jaune** | `audio.yellowflag` | **Annonce Vocale** (Sirène d'Alerte) | `urgent` (Poids 4) | `flag`: Joué sur l'Écran Principal (si widget drapeau présent) et sur tous les Postes Pilote. |
| **Secondes Restantes avant Démarrage Automatique** | `audio.auto_start` | **Annonce Vocale** / Ensemble Audio (Par défaut : TTS) | `normal` (Poids 2) | `timer`: Joué sur l'Écran Principal (si widget chronomètre présent) et sur tous les Postes Pilote. |
| **Temps de Manche / Secondes Restantes** | `audio.seconds_left` | **Annonce Vocale** / Ensemble Audio | `urgent` (Poids 4, <= 5s restantes / Drapeau blanc) ; `high` (Poids 3, > 5s restantes ou écoulées) | `timer`: Joué sur l'Écran Principal (si widget chronomètre présent) et sur tous les Postes Pilote. Annonce les secondes restantes ou écoulées de la manche ; les durées restantes <= 5s sont traitées comme urgentes pour garantir l'annonce du drapeau blanc / fin de manche. |
| **Tours du Meneur / Tours Restants** | `audio.laps_left` | **Annonce Vocale** / Ensemble Audio | `urgent` (Poids 4, <= 1 tour restant / Drapeau blanc / Meneur terminé) ; `normal` (Poids 2, > 1 tour restant ou écoulé) | `timer`: Joué sur l'Écran Principal (si widget chronomètre présent) et sur tous les Postes Pilote. Annonce les tours restants pour le meneur ; une valeur de 1 annonce le drapeau blanc (urgent) et 0 annonce lorsque le meneur atteint le nombre de tours (par ex. « Meneur terminé » dans les courses autorisant la fin de manche). |
| **Mi-Manche** | `audio.seconds_left.halfway` | **Annonce Vocale** | `high` (Poids 3) | `timer`: Joué sur l'Écran Principal (si widget chronomètre présent) et sur tous les Postes Pilote à la mi-course (au temps écoulé ou lorsque le meneur franchit la moitié des tours). |
| **Manche Terminée** | `audio.heat_over` | **Annonce Vocale** | `urgent` (Poids 4) | `flag`: Joué sur l'Écran Principal (si widget drapeau présent) et sur tous les Postes Pilote. |
| **Secondes Restantes avant Passage Automatique** | `audio.auto_advance` | **Annonce Vocale** / Ensemble Audio (Par défaut : TTS) | `normal` (Poids 2) | `timer`: Joué sur l'Écran Principal (si widget chronomètre présent) et sur tous les Postes Pilote. |
| **Course Terminée** | `audio.race_over` | **Annonce Vocale** | `urgent` (Poids 4) | `flag`: Joué sur l'Écran Principal (si widget drapeau présent) et sur tous les Postes Pilote. |
| **Temps au Tour Minimum** | `audio.min_lap_time` | **Annonce Vocale** | `urgent` (Poids 4) | `lane-view`: Joué sur l'Écran Principal et sur le Poste Pilote de cette voie/pilote. |

---

## Ensembles Audio et Modes de Déclenchement

Un **Ensemble Audio** est une ressource composite regroupant une collection de fichiers audio ou d'annonces de synthèse vocale associées à des seuils numériques de déclenchement. Les ensembles audio sont utilisés dans 5 emplacements de thème ainsi que pour le carburant :

1. **Compte à rebours de départ (`audio.countdown`) :** Bips et avertisseurs avant le départ.
2. **Secondes restantes avant démarrage automatique (`audio.auto_start`) :** Annonces avant le lancement d'une manche.
3. **Temps de manche / Secondes restantes (`audio.seconds_left`) :** Annonces de temps pendant les manches au temps.
4. **Tours du meneur / Tours restants (`audio.laps_left`) :** Annonces de tours pendant les manches au tour.
5. **Secondes restantes avant passage automatique (`audio.auto_advance`) :** Annonces entre les manches avant l'enchaînement.
6. **Sons de niveau de carburant (`fuelLevelAudio`) :** Alertes de réserve, niveau critique et plein selon le pourcentage.

### Modes de déclenchement : Restant vs Écoulé
Chaque entrée d'un Ensemble Audio définit un **Mode de déclenchement** :

*   **Restant (Compte à rebours) :** Se déclenche à l'approche de la fin ou de la limite de temps (ex. 10 tours restants, 30 secondes restantes). C'est le mode par défaut pour les comptes à rebours.
*   **Écoulé (Compte progressif) :** Se déclenche à mesure que la course progresse depuis le départ (ex. 10 tours accomplis, 30 secondes écoulées).

### Signaux doubles avec valeurs numériques identiques
Race Coordinator AI permet de configurer deux entrées dans le même Ensemble Audio avec exactement la même valeur numérique (ex. valeur `10`) :
- Une entrée configurée en **Écoulé** retentira lorsque le meneur atteint 10 tours / secondes depuis le départ.
- Une entrée configurée en **Restant** retentira lorsqu'il ne reste plus que 10 tours / secondes avant l'arrivée.

### Aperçu dans l'ordre naturel de course
Lors de la prévisualisation d'un Ensemble Audio dans le Gestionnaire de Ressources ou le Sélecteur Audio, les entrées se succèdent dans l'ordre chronologique de la course :
1. Toutes les entrées **Écoulé** retentissent d'abord par ordre croissant (0 → N).
2. Toutes les entrées **Restant** retentissent ensuite par ordre décroissant (N → 0).

---

## Emplacements de Configuration Audio

| Emplacement | Éléments Configurables |
| :--- | :--- |
| **Éditeur d'Interface -> Paramètres Audio** | Volume général, délai d'attente urgent, espacement des annonces, voix TTS, vitesse, tonalité, volume TTS et essai de voix. |
| **Éditeur de Thèmes** | Événements généraux : bips de départ, feu vert, sirène de drapeau jaune, temps restant, mi-manche, fin de manche, fin de course et tour minimum. |
| **Éditeur de Pilotes** | Sons spécifiques au pilote : Son de Tour, Son de Meilleur Tour Personnel, Son du Meilleur Tour de Course, Son du Meilleur Tour de Voie de Course, Son du Meilleur Tour de Manche, Son de nouveau leader de course, Son de nouveau leader de manche, Son du Record de Tour Général, Son du Record de Tour de Voie Général, Son d'Entrée aux Stands, Sons de Niveau de Carburant, Son de Faux Départ et Son de tour de drift. |
| **Gestionnaire de Ressources** | Téléchargement et gestion des fichiers WAV, MP3 et OGG, et configuration d'ensembles audio avec valeurs de déclenchement selon le contexte (secondes, tours ou pourcentage), avec écoute immédiate. |
