# Dépannage

## Problèmes d'Affichage

### Compatibilité du Navigateur et Écran Vide sur les Anciens Appareils (Android < 9, Anciens Systèmes Windows et Tablettes) {: #browser-compatibility }
- **Symptôme** : Lors de l'ouverture de Race Coordinator AI sur une ancienne tablette (telle qu'Android 4.4 KitKat jusqu'à Android 8 Oreo), un ancien PC ou un navigateur obsolète, l'écran reste entièrement vide ou affiche la bannière d'avertissement « Navigateur non pris en charge ».
- **Cause** : Race Coordinator AI est développé avec Angular moderne et ECMAScript (ES2020+), exploitant CSS Grid, les variables CSS (`var(--...)`), les modules ES et des API JavaScript modernes (notamment `BigInt`, `globalThis`, `queueMicrotask`, le chaînage optionnel `?.`, la coalescence des valeurs nulles `??` et les champs de classe privés `#x`). Les navigateurs dépourvus de ces fonctionnalités ne peuvent pas compiler ni exécuter le client web.
- **Prise en charge des systèmes d'exploitation et navigateurs** :

| Plateforme | Versions prises en charge et navigateurs minimaux | État | Remarques |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Versions actuelles de Google Chrome, Microsoft Edge, Mozilla Firefox | **Entièrement pris en charge** | Prêt à l'emploi avec mises à jour automatiques du navigateur. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 ou Mozilla Firefox 115 ESR | **Pris en charge** | Doit utiliser les dernières versions de navigateur publiées (Chrome 109 / Firefox 115 ESR). Internet Explorer n'est pas pris en charge. |
| **Windows XP / Vista** | Navigateurs officiels d'origine (Chrome 49, Firefox 52 ESR) | **Serveur uniquement** | Les navigateurs d'origine ne prennent pas en charge ES2020+ et ne peuvent pas exécuter l'interface client localement. Cependant, le serveur Java Race Coordinator AI (JRE 8) fonctionne en mode sans tête (headless) sur XP/Vista pour héberger des courses pour des tablettes distantes ou des PC modernes. |
| **Android** | Android 9.0+ avec Google Chrome moderne ou System WebView | **Pris en charge** | Google a définitivement arrêté les mises à jour de Chrome/WebView pour Android 8 et les versions antérieures. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Pris en charge** | Moteur Apple WebKit avec prise en charge moderne d'ECMAScript. |
| **macOS** | macOS 10.15 (Catalina) jusqu'à macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Pris en charge** | Entièrement compatible sur Mac Intel et Apple Silicon. |
| **Linux** | Toute distribution moderne avec Chrome, Chromium ou Firefox | **Pris en charge** | Comprend Raspberry Pi OS 64 bits et les ordinateurs monocartes ARM64. |

- **Résolution et recommandations** :
  - **Utiliser un navigateur moderne pris en charge** : Connectez-vous avec Google Chrome, Microsoft Edge, Mozilla Firefox ou Apple Safari sur un système d'exploitation pris en charge (Android 9.0+, iOS 14+, Windows 7+, macOS ou Linux).
  - **Configuration des anciens systèmes Windows (Win 7 / 8 / 8.1)** : Si vous utilisez Windows 7 ou 8, assurez-vous d'installer **Google Chrome 109** ou **Mozilla Firefox 115 ESR** plutôt qu'Internet Explorer qui est obsolète.
  - **Tablettes modernes économiques** : Les tablettes récentes et abordables (ex. Amazon Fire HD 8/10 ou tablettes Android sous Android 11–14) prennent en charge Chrome moderne et offrent d'excellentes performances à faible coût.
  - **Affichage distant / Duplication d'écran** : Pour les anciennes tablettes ou terminaux existants, vous pouvez exécuter le serveur Race Coordinator AI sur la machine hôte et dupliquer l'écran à l'aide d'outils VNC ou de bureau à distance légers (tels que bVNC ou AnyDesk).
