# Dépannage

## Problèmes d'Affichage

### Compatibilité du Navigateur et Écran Noir/Blanc sur les Anciens Appareils (Android < 9, Anciennes Tablettes)
- **Symptôme** : Lors de l'ouverture de Race Coordinator AI sur une ancienne tablette (telle qu'Android 4.4 KitKat jusqu'à Android 8 Oreo) ou un navigateur obsolète, l'écran reste entièrement vide ou affiche l'avertissement « Navigateur non pris en charge ».
- **Cause** : Race Coordinator AI est développé avec Angular moderne et ECMAScript (ES2022+), exploitant CSS Grid, les variables CSS, les modules ES et des API JavaScript modernes. Google a définitivement arrêté les mises à jour de Google Chrome et System WebView pour Android 8 et les versions antérieures. Android 4.4 KitKat (sorti en 2013) est figé sur Chromium 30–33 (ou Chrome 66 au maximum) et ne peut pas exécuter d'applications web modernes.
- **Résolution** :
  - **Utiliser un navigateur moderne pris en charge** : Connectez-vous avec Google Chrome, Microsoft Edge, Mozilla Firefox ou Apple Safari sur un système d'exploitation pris en charge (Android 9.0+, iOS 14+, Windows 10+, macOS ou Linux).
  - **Tablettes modernes économiques** : Les tablettes abordables récentes (ex. Amazon Fire HD 8/10 ou tablettes Android sous Android 11–14) prennent en charge les versions récentes de Chrome et offrent d'excellentes performances.
  - **Duplication d'écran / Bureau à distance** : Pour les anciennes tablettes, vous pouvez afficher l'écran du navigateur de l'ordinateur hôte via une application VNC ou bureau à distance légère (telle que bVNC ou AnyDesk).
