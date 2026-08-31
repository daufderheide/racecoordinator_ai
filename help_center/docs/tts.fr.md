# Interpolation des variables texte-parole (TTS)

Race Coordinator AI prend en charge la substitution dynamique de variables dans les chaînes de synthèse vocale pour des annonces audio personnalisées.

## Syntaxe

Les variables TTS prennent en charge les accolades simples ou doubles : `{variable.path}` ou `{{variable.path}}`.

L'interpolation est **insensible à la casse** (par exemple, `{driver.lastLapTime}` et `{DRIVER.LASTLAPTIME}`). Les espaces à l'intérieur des accolades (par exemple, `{{ driver.nickname }}`) sont également pris en charge.

## Variables disponibles

Les variables suivantes sont disponibles dans le contexte TTS :

| Chemin de la variable | Description |
| :--- | :--- |
| `{driver.name}` | Nom complet du pilote. |
| `{driver.nickname}` | Surnom du pilote (utilise le nom complet s'il n'est pas défini). |
| `{driver.lastLapTime}` | Temps du dernier tour complété. |
| `{driver.bestLapTime}` | Meilleur tour du pilote dans la manche actuelle. |
| `{driver.averageLapTime}` | Temps moyen au tour du pilote dans la manche. |
| `{driver.lapCount}` | Nombre total de tours complétés dans la manche. |

## Règles de formatage

*   **Entiers** : Prononcés tels quels.
*   **Décimaux** : Automatiquement arrondis à **3 décimales**.
