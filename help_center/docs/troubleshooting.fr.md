# Dépannage

## Problèmes de Connexion

### Mise en Veille de l'Interface USB et Déconnexions Entre les Manches (Suspension Sélective et Économie d'Énergie) {: #usb-sleep-prevention }
- **Symptôme** : Pendant les pauses entre les manches, lors des rotations de pistes ou après quelques minutes d'inactivité, la connexion avec l'interface (Phidget, Arduino, Trackmate ou adaptateur USB-Série) est coupée. Dès que la manche suivante démarre ou qu'une voiture franchit les capteurs, l'interface se reconnecte et une notification s'affiche : *"Interface Connectée : La connexion avec l'interface a été rétablie."*
- **Cause** : Les systèmes d'exploitation modernes (Windows, macOS et Linux) appliquent des règles agressives d'économie d'énergie sur les contrôleurs USB et les périphériques d'interface utilisateur (HID). Même si Race Coordinator AI empêche la mise en veille globale de l'ordinateur, le système d'exploitation coupe indépendamment l'alimentation des ports USB, des concentrateurs racine USB et des contrôleurs HID inactifs (Suspension sélective USB) en l'absence de données de capteurs pendant un court laps de temps.
- **Pourquoi cela ne peut pas être désactivé automatiquement par le logiciel** : La gestion d'énergie au niveau matériel est gérée directement par le noyau du système d'exploitation et les pilotes. Sous Windows, la modification des paramètres d'alimentation des périphériques requiert des privilèges Administrateur (UAC) et modifie des clés protégées du Registre (`HKLM`), ce qu'une application standard ne peut ni ne doit faire sans risquer de perturber d'autres périphériques essentiels (souris, claviers ou adaptateurs Bluetooth).
- **Résolution par Système d'Exploitation** :

#### Windows 10 et Windows 11 (Solution Permanente Recommandée)

##### 1. Désactiver l'économie d'énergie pour les périphériques USB et HID dans le Gestionnaire de périphériques
1. Faites un clic droit sur le bouton **Démarrer** (ou appuyez sur `Win + X`) et sélectionnez **Gestionnaire de périphériques**.
2. Développez **Périphériques d'interface utilisateur (Human Interface Devices)** :
    - Recherchez les entrées **Périphérique d'entrée USB** associées à votre interface.
    - Faites un clic droit sur chaque entrée, sélectionnez **Propriétés**, puis allez sur l'onglet **Gestion de l'alimentation**.
    - **Décochez** *"Autoriser l'ordinateur à éteindre ce périphérique pour économiser l'énergie"*, puis cliquez sur **OK**.
3. Développez **Contrôleurs de bus USB (Universal Serial Bus controllers)** :
    - Faites un clic droit sur chaque **Concentrateur USB racine** et **Generic USB Hub**, sélectionnez **Propriétés**, puis l'onglet **Gestion de l'alimentation**.
    - **Décochez** *"Autoriser l'ordinateur à éteindre ce périphérique pour économiser l'énergie"*, puis cliquez sur **OK**.
4. (Pour Arduino / Série) : Développez **Ports (COM et LPT)** :
    - Faites un clic droit sur votre port série USB (ex. *Arduino Uno*, *Port série USB*), sélectionnez **Propriétés**, et si l'onglet **Gestion de l'alimentation** est présent, **décochez** *"Autoriser l'ordinateur à éteindre ce périphérique pour économiser l'énergie"*.

##### 2. Désactiver la suspension sélective USB dans les Options d'alimentation
1. Ouvrez le **Panneau de configuration** Windows et allez dans les **Options d'alimentation** (ou appuyez sur `Win + R`, tapez `powercfg.cpl` et appuyez sur Entrée).
2. Cliquez sur **Modifier les paramètres du mode** à côté de votre mode actif.
3. Cliquez sur **Modifier les paramètres d'alimentation avancés**.
4. Développez **Paramètres USB** -> **Paramètre de la suspension sélective USB**.
5. Réglez les options **Sur batterie** et **Sur secteur** sur **Désactivé**.
6. Cliquez sur **Appliquer** puis sur **OK**.

---

#### Linux et Raspberry Pi OS

##### 1. Désactiver la suspension automatique USB dans le noyau
Par défaut, le noyau Linux suspend les périphériques USB inactifs après 2 secondes :
- **Sur Ubuntu, Debian ou Linux Mint (GRUB)** :
    1. Modifiez la configuration de GRUB : `sudo nano /etc/default/grub`.
    2. Ajoutez `usbcore.autosuspend=-1` à `GRUB_CMDLINE_LINUX_DEFAULT`.
    3. Mettez à jour GRUB et redémarrez : `sudo update-grub && sudo reboot`.
- **Sur Raspberry Pi OS** :
    1. Ouvrez le fichier de commande de démarrage : `sudo nano /boot/firmware/cmdline.txt` (ou `/boot/cmdline.txt`).
    2. Ajoutez `usbcore.autosuspend=-1` à la fin de la ligne (tous les arguments doivent rester sur une seule ligne).
    3. Enregistrez et redémarrez : `sudo reboot`.

##### 2. Désactiver la suspension via une règle Udev (Alternative)
1. Créez un fichier de règles : `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Ajoutez la règle suivante :
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Rechargez les règles : `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Réglages Économiseur d'énergie / Écran** : Ouvrez les **Réglages Système** -> **Écrans** -> **Avancé...** (ou **Économiseur d'énergie**) et cochez **"Empêcher la suspension d'activité automatique lorsque l'écran est éteint"**.
- **Utiliser des hubs USB alimentés** : macOS peut couper l'alimentation des ports USB passifs lorsque la consommation fluctue. Raccordez toujours l'interface à un hub USB muni de son propre adaptateur secteur dédié.

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
