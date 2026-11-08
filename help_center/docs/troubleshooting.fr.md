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

### Réinitialisations et Baisses de Tension du Microcontrôleur {: #microcontroller-brownout-resets }

- **Symptôme** : Pendant une course ou une séance d'essais, une bannière d'alerte apparaît sur l'écran du jour de course : *"Réinitialisation du microcontrôleur détectée : Le microcontrôleur de l'interface s'est réinitialisé de manière inattendue pendant le fonctionnement."* Un clic sur **Détails** ouvre une boîte de dialogue affichant le nom de l'interface, le nombre de réinitialisations et l'horodatage de la dernière réinitialisation. Si plusieurs réinitialisations surviennent au cours de la même session, une note signale que des réinitialisations fréquentes se produisent.
- **Ce qui est signalé** : L'interface de chronométrage (telle qu'un Arduino Uno, Nano, Mega ou microcontrôleur USB compatible) a subi une réinitialisation matérielle inattendue ou une baisse de tension (brownout) alors qu'elle était connectée à Race Coordinator AI. Cela indique que le processeur embarqué a subi une baisse momentanée de tension ou un parasite électrique ayant déclenché sa ligne de réinitialisation matérielle ou son circuit de détection de sous-tension (BOD).

#### Ce qui se passe dans Race Coordinator AI (RMS)
Lorsqu'un microcontrôleur se réinitialise de manière inattendue pendant la course :
1. **Séquence de démarrage et négociation** : Le microcontrôleur redémarre et transmet un message d'identification et des pings d'état à Race Coordinator AI.
2. **Rétablissement automatique de l'état** : Race Coordinator AI détecte que la carte était déjà connectée et active. Au lieu d'annuler la course, le RMS reconfigure immédiatement le microcontrôleur : réaffectation des broches d'entrée, polarités (niveau haut/bas actif), durées d'antirebond et rétablissement de l'état des relais selon l'état actuel de la manche (par exemple, alimentation de piste ACTIVÉE).
3. **Fenêtre de bouclier de protection (250 ms)** : Lors du démarrage d'un Arduino, les entrées numériques peuvent momentanément flotter ou renvoyer des états de rappel par défaut avant de se stabiliser. Race Coordinator AI active un bouclier de protection de 250 ms immédiatement après une réinitialisation inattendue. Durant cette fenêtre, les diffusions statiques d'état des broches sont filtrées pour éviter les faux comptages de tours, temps fantômes ou interruptions de piste accidentelles provoqués par les parasites de démarrage.
4. **Impact sur la course — Risque de tours manqués** :
    - Bien que Race Coordinator AI rétablisse automatiquement la connexion et l'alimentation de la piste sans interrompre la manche, le microcontrôleur est **physiquement aveugle aux signaux des capteurs** durant son redémarrage matériel, l'exécution du chargeur d'amorçage et la négociation (généralement de 200 à 500 millisecondes).
    - **Toute voiture franchissant un capteur optique, un rail mort (dead strip) ou un capteur reed pendant cette fenêtre de réinitialisation NE SERA PAS enregistrée, entraînant des tours manqués.**
    - Si les réinitialisations surviennent de façon répétée, le comptage des tours et les classements de la manche seront faussés, et les pilotes pourront constater de brèves coupures de courant.

#### Causes Fréquentes
*Remarque : Bien que les causes détaillées ci-dessous représentent la majorité des problèmes rencontrés sur les pistes de slot car, chaque installation physique est unique et d'autres facteurs électriques ou mécaniques peuvent entrer en jeu.*

1. **Rupture Inductive des Relais (Pics de Force Contre-Électromotrice - Back-EMF)** :
    - **La cause n°1 des baisses de tension de microcontrôleur en slot racing.**
    - Les relais contrôlant l'alimentation de piste comportent des bobines électromagnétiques. Lorsqu'un relais se désactive (lors d'un arrêt de course ou en fin de manche), l'effondrement du champ magnétique dans la bobine génère une surtension inverse massive (plusieurs centaines de volts de force contre-électromotrice).
    - Si la carte de relais ne possède pas de diodes de roue libre adéquates ou partage sa masse/alimentation avec l'Arduino, ce pic haute tension se propage directement au microcontrôleur, déclenchant son circuit de protection BOD ou plantant le processeur.
2. **Câblage des Boutons d'Interruption & Longs Câbles Faisant Antenne** :
    - Les boutons d'interruption disposés autour du circuit nécessitent souvent de longues longueurs de fil non blindé (de 3 à plus de 15 mètres).
    - Ces longs fils agissent comme des antennes captant de fortes interférences électromagnétiques (EMI) issues des moteurs des voitures, des étincelles de tresses et des raccords de rails.
    - Actionner ou relâcher un bouton-poussoir mécanique sans résistances de rappel externes ni filtrage RC antirebond peut induire des pointes de tension directement sur les broches d'entrée.
3. **Chute de Tension sur le Bus USB 5V** :
    - Les microcontrôleurs nécessitent une tension stable de 4,5 V à 5,2 V pour fonctionner de manière fiable.
    - Si l'Arduino est branché sur un hub USB passif, un port USB avant de PC avec un long câble interne ou un port USB partagé fortement sollicité, la tension peut chuter brièvement sous le seuil de détection BOD (généralement 2,7 V ou 4,3 V), provoquant un redémarrage instantané.
4. **Interférences Électromagnétiques (EMI) de la Puissance Piste** :
    - Les moteurs de slot car consomment des courants élevés et créent des arcs électriques constants entre les balais, les tresses et les conducteurs de piste.
    - Si les câbles de capteurs, les câbles de boutons ou le microcontrôleur cheminent parallèlement et très près du câblage de piste ou de l'alimentation DC, un couplage inductif induit des pointes de tension dans l'électronique de chronométrage.
5. **Circuits Secteur Partagés & Défaut d'Isolement** :
    - Brancher l'ordinateur de course, l'alimentation DC de la piste, les tours à pneus ou des outils sur la même multiprise sans filtre antiparasite peut transmettre des perturbations réseau à travers l'alimentation du PC jusqu'au bus USB.
6. **Décharges Électrostatiques (ESD)** :
    - En atmosphère sèche, le frottement continu des voitures sur la piste plastique accumule de l'électricité statique. Lorsqu'un ramasseur ou un pilote touche un bouton métallique ou un rail, la décharge statique peut réinitialiser la carte.

#### Solutions Possibles pour Résoudre le Problème

- **Installer des Diodes de Roue Libre sur Toutes les Bobines de Relais** :
    - Soudez une diode de redressement standard (telle qu'une **1N4001**, **1N4004** ou **1N4007**) en polarisation inverse directement aux bornes DC de chaque bobine de relais (cathode/bague blanche sur le +DC, anode sur la masse/-DC). Cela dissipe en toute sécurité l'énergie de contre-fem lors de l'ouverture du relais.
- **Utiliser des Modules Relais Optocouplés avec Alimentation Indépendante** :
    - De nombreux modules relais 5V possèdent un cavalier d'isolement repéré **JD-VCC / VCC / GND**.
    - Retirez le cavalier `JD-VCC`. Raccordez le 5V et les signaux de commande de l'Arduino, mais alimentez les bobines des relais indépendamment en branchant un adaptateur secteur 5V DC distinct entre `JD-VCC` et la masse `GND` de la carte relais. Cela sépare totalement le circuit inductif bruyant du bus d'alimentation de l'Arduino.
- **Ajouter des Résistances de Rappel Externes et Condensateurs sur les Boutons** :
    - Ne comptez pas uniquement sur les résistances de rappel internes faibles de l'Arduino (~20 kΩ–50 kΩ) sur de longs câbles. Installez des **résistances de rappel externes de 1 kΩ à 4,7 kΩ** entre chaque broche d'entrée et le +5V au niveau du bornier de l'Arduino.
    - Ajoutez un petit **condensateur céramique de 0,1 µF (100 nF)** entre chaque broche de bouton et la masse pour filtrer les parasites haute fréquence et les rebonds de contact.
- **Utiliser un Hub USB Dédié avec Alimentation Secteur** :
    - Raccordez le microcontrôleur à un concentrateur USB alimenté par son propre adaptateur secteur 230V, plutôt que directement sur un port de PC ou d'ordinateur portable. Un hub alimenté garantit un courant 5V parfaitement stable indépendamment de la charge de l'ordinateur.
- **Séparer Physiquement les Câbles de Signaux de la Puissance Piste** :
    - Acheminez les câbles des capteurs (infrarouge, optique, reed) et des boutons à au moins 15 à 30 cm des conducteurs de piste et des câbles d'alimentation.
    - Lorsque des câbles de signaux doivent croiser des conducteurs de puissance, faites-les se croiser à **angle droit (90 degrés)** et jamais en parallèle.
- **Employer du Câble Paires Torsadées Blindé** :
    - Pour les longues liaisons, utilisez du câble réseau blindé (Cat5e/Cat6 STP) ou du câble d'instrumentation blindé. Reliez le drain de blindage à la masse uniquement du côté de l'Arduino.
- **Lignes Secteur Dédiées** :
    - Branchez l'alimentation de la piste et l'ordinateur de chronométrage sur des prises murales distinctes ou utilisez un parafoudre avec filtre de ligne de qualité.

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
