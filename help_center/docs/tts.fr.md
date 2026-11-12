# Interpolation de Variables en Synthèse Vocale (TTS)

Race Coordinator AI prend en charge la substitution dynamique de variables dans les textes de synthèse vocale pour créer des annonces personnalisées pour les pilotes, les chronos et les statistiques de course.

## Syntaxe

Les variables TTS utilisent une syntaxe unifiée entre accolades : `{variable.path}` ou `${variable.path}`. Cette syntaxe est identique à celle des **Modèles d'Exportation Excel** et des **Widgets d'Interface Personnalisés**.

L'interpolation est **insensible à la casse** (par exemple, `{driver.lastLapTime}` et `{DRIVER.LASTLAPTIME}`). Les espaces à l'intérieur des accolades sont également acceptés (ex. `{ driver.nickname }` ou `${ driver.nickname }`).

## Variables Disponibles

| Chemin de la Variable | Description |
| :--- | :--- |
| `{driver.name}` | Nom complet du pilote. |
| `{driver.nickname}` | Surnom du pilote (ou nom s'il n'est pas défini). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Nombre total de tours effectués par le pilote. |
| `{driver.totalTime}` | Temps total écoulé en secondes. |
| `{driver.lastLapTime}` | Temps du tour venant d'être bouclé. |
| `{driver.bestLapTime}` | Tour le plus rapide du pilote dans la manche. |
| `{driver.averageLapTime}` | Temps moyen au tour du pilote dans la manche. |
| `{driver.medianLapTime}` | Temps médian au tour du pilote dans la manche. |
| `{driver.gapLeader}` | Écart en secondes avec le meneur de la course. |
| `{driver.gapPosition}` | Écart en secondes avec le pilote qui précède. |
| `{race.name}` | Nom de la course active. |
| `{track.name}` | Nom du circuit actuel. |
| `{heat.number}` | Numéro de la manche active. |

## Règles de Formatage

### Nombres
*   **Nombres entiers** : Énoncés tels quels (ex. `10`).
*   **Nombres décimaux** : Automatiquement arrondis à **3 décimales** (ex. `5.432`).

## Intégration avec le Système Audio

Les annonces TTS sont gérées par le [Système Audio](audio.md) centralisé :

*   **Voix, Vitesse et Hauteur** : Choisissez la voix, la vitesse (`0.1x`–`2.0x`), la tonalité et le volume dans **Éditeur d'Interface -> Paramètres Audio**.
*   **Niveaux de Priorité** : Les alertes urgentes (drapeau jaune, fin de manche) interrompent les commentaires réguliers pour éviter toute cacophonie.
*   **Pertinence Audio** : Sur les postes de pilotage et écrans annexes, les annonces TTS sont filtrées pour ne diffuser que ce qui concerne le pilote concerné.

## Navigateurs Mobiles et Postes de Pilotage

Lorsque vous affichez un poste de pilotage ou un affichage de jour de course sur un téléphone mobile ou une tablette (par exemple, en scannant le code QR du poste de pilotage avec un iPhone ou un appareil Android) :

*   **Activation au premier toucher** : Les systèmes d'exploitation mobiles (iOS et Android) nécessitent une interaction physique avec l'écran avant d'autoriser la lecture de l'audio Web ou de la synthèse vocale. Touchez l'écran une fois (ou touchez le message **Touchez l'écran pour activer l'audio**) lors de l'ouverture de la page. Une fois activé, Race Coordinator AI maintient une session audio active afin que vous n'ayez à toucher qu'une seule fois pour bénéficier d'annonces TTS continues tout au long de la course.
*   **Bouton Silence Physique (iOS / iPhone)** : Les iPhone acheminent la synthèse vocale Web via le canal audio ambiant de l'appareil. Si votre iPhone dispose d'un interrupteur physique Sonnerie/Silence, assurez-vous qu'il est désactivé (pas en mode silencieux), sinon la sortie vocale sera coupée.
