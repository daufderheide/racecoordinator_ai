# Guide de configuration de l'Arduino UNO Q

Ce guide explique comment configurer **Race Coordinator AI (RC AI)** sur la carte de développement hybride **Arduino UNO Q** en tant qu'appareil matériel autonome.

---

## Présentation du matériel et variantes de mémoire

L'**Arduino UNO Q** combine un nano-ordinateur Linux 64 bits (SBC) avec un microcontrôleur temps réel sur une seule carte :

- **MPU Linux (Qualcomm Cortex-A53 à 2,0 GHz)** : Exécute le serveur Race Coordinator AI, la base de données SQLite, le serveur client web et la mise à jour automatique.
- **MCU temps réel (STM32U585 Cortex-M33 à 160 MHz)** : Gère les interruptions des broches de capteurs de tour, les temps intermédiaires, les boutons d'appel et les relais d'alimentation de piste avec une précision inférieure à la milliseconde (remarque : les LED RVB adressables FastLED ne sont pas prises en charge sur cette architecture).
- **Sortie d'affichage** : La sortie DisplayPort USB-C se connecte directement à un moniteur, un téléviseur ou un écran tactile.

### Modèles 4 Go vs 2 Go

* **Arduino UNO Q 4 Go (Recommandé et pris en charge)** : Équipé de 4 Go de RAM et de 32 Go de stockage eMMC. Ce modèle est requis pour le **Mode affichage Kiosque** (contrôlant directement un téléviseur ou un moniteur HDMI/DisplayPort), car l'exécution simultanée du bureau Linux, du navigateur Chromium, de l'environnement Java et de la base de données SQLite nécessite plus de 2 Go de mémoire.
* **Arduino UNO Q 2 Go (Considérations pour le mode sans tête / Headless)** :
  * Bien que le modèle 2 Go ne dispose pas de la mémoire nécessaire pour faire fonctionner de manière fluide le bureau local et l'affichage kiosque Chromium, il dispose de suffisamment de mémoire pour exécuter le serveur principal en **Mode appareil sans tête (Headless)**.
  * **Statut actuel du support** : Le mode sans tête sur l'Uno Q n'est **pas actuellement pris en charge**, car des modifications supplémentaires du package de support et de la configuration de l'Uno Q sont nécessaires. Cependant, la prise en charge du mode sans tête sur le Q 2 Go **pourrait être ajoutée sur demande**, à condition que l'Uno Q dispose d'une connexion réseau active (Wi-Fi ou Ethernet) pour permettre aux directeurs de course et aux pilotes d'accéder à l'interface web depuis d'autres appareils du réseau.

---

## Modes de fonctionnement

1. **Mode affichage Kiosque (Modèle 4 Go)** : Branchez un moniteur ou un téléviseur HDMI/DisplayPort directement sur le port USB-C de l'Uno Q via un adaptateur multiport. La carte lance automatiquement Chromium en mode kiosque plein écran (`http://localhost:7070`) tout en autorisant simultanément les connexions réseau distantes.
2. **Mode appareil sans tête (Actuellement non pris en charge - Disponible sur demande)** : La carte exécute uniquement le serveur backend et se connecte au matériel de piste, sans qu'aucun moniteur ni navigateur local ne soit exécuté. Les utilisateurs accèdent à l'interface web via le réseau local (`http://<hostname>:7070` ou `http://<ADRESSE_IP>:7070`). Comme indiqué ci-dessus, le mode sans tête sur l'Uno Q n'est pas pris en charge par défaut, mais peut être ajouté sur demande si l'Uno Q dispose d'une connexion réseau.

---

## Installation étape par étape

### Étape 1 : Préparer la carte et se connecter via le réseau

1. **Démarrer la carte** *(Le flashage n'est généralement pas nécessaire)* :
   * Votre Arduino Uno Q est livré avec **Arduino Linux OS (Debian 12 arm64) préinstallé** sur sa mémoire flash eMMC interne de 32 Go. Connectez simplement la carte à l'alimentation pour démarrer le système d'exploitation.
   * *(Remarque : Flasher une image du système d'exploitation n'est nécessaire que si vous récupérez un système corrompu ou effectuez une réinitialisation d'usine complète).*

2. **Configuration de la connexion réseau** :
   > [!IMPORTANT]
   > **Accès Internet requis uniquement lors de la configuration initiale** : Une connexion réseau avec accès Internet est strictement requise lors de cette configuration initiale pour mettre à jour les paquets et télécharger les prérequis. Une fois la configuration terminée, Race Coordinator AI fonctionne à 100 % localement et hors ligne, sans nécessiter de connexion Internet. Cependant, laisser la carte connectée à votre réseau local offre des avantages constants majeurs :
   > - **Mises à jour logicielles automatiques** : Téléchargez et installez facilement les nouvelles versions de Race Coordinator AI et les mises à jour de micrologiciel directement depuis l'interface web.
   > - **Accès client à distance** : Les directeurs de course, pilotes et spectateurs peuvent connecter leurs smartphones, tablettes ou ordinateurs portables directement à l'interface web de la carte (`http://<hostname>:7070` ou `http://<ADRESSE_IP>:7070`) via votre réseau local.

   * **Configuration Wi-Fi via l'assistant à l'écran** : Lors du premier démarrage, l'assistant de configuration à l'écran vous invite à configurer le réseau sans fil. Sélectionnez votre réseau Wi-Fi et saisissez le mot de passe.
   * **Alternative : Configurer le Wi-Fi en ligne de commande** : Si vous n'avez pas configuré le Wi-Fi via l'assistant ou si vous devez le configurer manuellement dans le terminal :
     ```bash
     # Lister les réseaux sans fil disponibles :
     nmcli dev wifi list

     # Se connecter à votre réseau Wi-Fi :
     sudo nmcli dev wifi connect "Votre_SSID" password "Votre_MotDePasse"
     ```
   * **Alternative : Ethernet filaire** : Branchez simplement un câble Ethernet sur la carte (ou un adaptateur Ethernet USB-C). L'adaptateur réseau se configure automatiquement via DHCP.
   * **Remarque sur la première connexion** : La connexion Wi-Fi peut ne pas prendre effet immédiatement après la première saisie, ou les commandes manuelles `nmcli` peuvent afficher des erreurs temporaires au premier démarrage. Si cela se produit, exécutez simplement `sudo reboot`. Après le redémarrage, la carte réseau sans fil s'initialise correctement et se connecte automatiquement à votre réseau Wi-Fi configuré.
   * **Appliquer les mises à jour de la carte et du micrologiciel** : Lors du redémarrage (ou lorsque le système vous y invite), il peut vous être demandé si vous souhaitez mettre à jour divers packages et composants du micrologiciel sur la carte. Il est fortement recommandé d'accepter et d'effectuer toutes les mises à jour suggérées, car le micrologiciel d'origine en usine est souvent obsolète. Notez que cette mise à jour initiale peut prendre un certain temps (souvent 5 à 10+ minutes selon la vitesse du réseau et la taille des paquets) ; laissez le processus se terminer sans interruption.

3. **Activer SSH sur la carte et se connecter (Recommandé)** :
   * La configuration de la carte est plus simple via SSH depuis votre ordinateur, car vous pouvez copier et coller directement les commandes d'installation.
   * **Activer le service SSH** : Par défaut, le serveur SSH n'est pas actif sur la carte. Depuis le terminal local (à l'aide du clavier et de l'écran connectés à la carte), activez et démarrez le service SSH :
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Rechercher le nom d'hôte et l'adresse IP** : Exécutez `hostname` et `hostname -I` sur la carte pour découvrir le nom d'hôte attribué et l'adresse IP locale (la configuration d'usine attribue souvent un nom unique comme `allianora` plutôt que `uno-q`) :
     ```bash
     hostname
     hostname -I
     ```
     *(Remarque : `avahi-daemon` n'est pas préinstallé sur Arduino Linux OS, donc les noms de domaine mDNS `.local` comme `uno-q.local` n'existent pas par défaut à moins d'installer le paquet via `sudo apt-get install -y avahi-daemon`).*
   * **Se connecter depuis votre PC** :
     * **macOS** : Ouvrez l'application intégrée **Terminal** ou **iTerm2** ([iterm2.com](https://iterm2.com/)) et connectez-vous en ligne de commande :
       ```bash
       ssh arduino@<hostname>
       # Ou connectez-vous directement via l'adresse IP :
       ssh arduino@<ADRESSE_IP>
       ```
     * **Windows** : Vous pouvez utiliser PowerShell ou l'Invite de commandes intégrée (en exécutant `ssh arduino@<hostname>` ou `ssh arduino@<ADRESSE_IP>`) ou utiliser un client SSH graphique tel que **PuTTY** (téléchargeable sur [putty.org](https://www.putty.org/)). Si vous utilisez PuTTY :
       1. Saisissez le nom d'hôte ou l'adresse IP de la carte dans le champ **Host Name (or IP address)**.
       2. Vérifiez que le port est `22` et que le type de connexion est **SSH**.
       3. Cliquez sur **Open**, acceptez l'avertissement de clé d'hôte lors de la première connexion et connectez-vous en tant qu'utilisateur `arduino` avec votre mot de passe.

### Étape 2 : Installer les prérequis
Installez l'environnement d'exécution Java (`default-jre-headless`), les utilitaires audio (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium` et le gestionnaire de fenêtres (`wmctrl`) :
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Remarque : Sous Debian, le paquet du navigateur s'appelle `chromium` plutôt que `chromium-browser`, et `default-jre-headless` fournit l'environnement d'exécution OpenJDK standard. L'utilitaire `wmctrl` est utilisé par le service kiosque pour s'assurer que Race Coordinator AI conserve le focus de fenêtre face aux applications lancées au démarrage du bureau comme Arduino App Lab).*

Vérifiez qu'`arduino-cli` est installé :
```bash
arduino-cli version
```
*(Si `arduino-cli` n'est pas préinstallé sur votre carte, installez-le via : `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Étape 3 : Installer le package d'application et les services Systemd
Transférez `RaceCoordinatorAI-Linux-ARM64.tar.gz` de votre ordinateur vers la carte :
```bash
# Depuis le terminal de votre ordinateur portable :
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Choisissez l'une des méthodes d'installation suivantes :

#### Option A : Installation automatisée clé en main (Recommandé)
Le programme d'installation automatisé gère la vérification des prérequis, la configuration des répertoires, les autorisations de port série, l'enregistrement des services systemd, le téléversement du micrologiciel du microcontrôleur et le démarrage instantané avec gestion des erreurs :
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```
*(Remarque : Les avertissements tels que `tar: Ignoring unknown extended header...` sont des balises de métadonnées macOS inoffensives et peuvent être ignorés).*

##### Options en ligne de commande
L'installateur prend en charge des arguments facultatifs en ligne de commande pour personnaliser ou remplacer la configuration par défaut :

| Argument | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Définir explicitement le type de carte matérielle. | Détecté automatiquement (`unoq` sur Uno Q) |
| `--user=<username>` | Compte utilisateur Linux propriétaire des fichiers et exécutant les services systemd. | Détecté via `$SUDO_USER` (par défaut `arduino` sur Uno Q) |
| `--skip-sketch`, `--skip-mcu` | Ignorer la compilation et le téléversement du micrologiciel MCU. | Téléverser le micrologiciel (`false`) |
| `-v`, `--verbose` | Activer la journalisation détaillée du compilateur et de l'installation. | Sortie standard (`false`) |
| `-h`, `--help` | Afficher l'aide et les options disponibles. | - |

##### Résumé de configuration préalable à l'installation
Avant d'installer des paquets, de copier des fichiers ou de modifier les services, l'installateur affiche un récapitulatif détaillé montrant comment la plateforme matérielle, le compte de service et les actions de micrologiciel ont été résolus :
```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: unoq
   Resolution:      Auto-detected (/proc/device-tree/model: Qualcomm QRB2210...)
 Service Account:   arduino
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/arduino
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      COMPILE & UPLOAD to onboard Uno Q MCU (arduino:zephyr:unoq on 172.17.0.1)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

> [!NOTE] Téléchargement et durée du cœur de carte Zephyr (~5 à 10+ minutes)
> Lors de l'installation initiale, `arduino-cli` télécharge et décompresse le **cœur de carte Zephyr (`arduino:zephyr`)** pour le MCU intégré STM32U5 Cortex-M33. Ce paquet comprend le système d'exploitation temps réel Zephyr complet, la chaîne de compilation croisée ARM et les bibliothèques matérielles (~500 Mo+ à télécharger et des dizaines de milliers de fichiers).
>
> - **Temps estimé** : **5 à 10+ minutes** selon le débit de votre connexion Internet et la vitesse d'écriture de la mémoire flash eMMC. **Le moment parfait pour prendre un café !**
> - **Progression sur la console** : La progression du téléchargement et de l'extraction s'affiche directement dans le terminal. Si vous souhaitez obtenir une sortie plus verbeuse sur la compilation et l'extraction, lancez `sudo ./install.sh -v`.
> - **Vérification de l'avancement via une deuxième console / SSH** : Si vous craignez que l'installation soit figée, ouvrez une seconde session SSH (ou un nouvel onglet de terminal sur l'Uno Q) et exécutez :
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   Vous pourrez constater qu'`arduino-cli` utilise activement le processeur et les entrées/sorties pendant le téléchargement et l'extraction des paquets. Vous pouvez également surveiller l'expansion des fichiers temporaires :
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

#### Option B : Installation manuelle étape par étape (Alternative)
Si vous préférez un contrôle manuel ou devez personnaliser votre configuration :
1. **Extraire les fichiers d'application vers `/opt/racecoordinatorai`** :
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Configurer les autorisations et l'accès au groupe série** :
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout,audio arduino
   sudo loginctl enable-linger arduino
   systemctl --user enable --now speech-dispatcher.socket
   ```

3. **Installer et enregistrer les services systemd** :
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Étape 4 : Flasher le micrologiciel du microcontrôleur
Compilez et téléversez le sketch matériel sur la MCU intégrée :
```bash
# Vérifier les cartes et ports détectés
arduino-cli board list

# Installer le cœur de carte Zephyr dans arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Installer les bibliothèques Arduino requises (pont routeur Uno Q)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

# Compiler racecoordinatorai_sketch pour la MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Téléverser sur la MCU intégrée via le pont réseau interne
# (Saisir le mot de passe 'arduino' lorsque vous y êtes invité, ou passer --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Remarque : Comme vérifié via `arduino-cli board list`, le microcontrôleur Uno Q exécute Zephyr OS sur le pont réseau interne `172.17.0.1` avec la FQBN `arduino:zephyr:unoq`. La bibliothèque `Arduino_RouterBridge` est requise pour la communication série via le pont SoC. Notez que l'exécution de `arduino-cli core install arduino:zephyr` télécharge ~500 Mo+ et prend 5 à 10+ minutes pour décompresser sur le stockage eMMC (profitez-en pour prendre un café ; vous pouvez vérifier la progression avec `top -p $(pgrep arduino-cli)` dans un second terminal). Les bandeaux LED FastLED ne sont pas pris en charge actuellement sur l'architecture STM32U5 / Zephyr Cortex-M33 en raison des définitions de registres CMSIS 6, mais toutes les fonctionnalités principales de la piste—capteurs de tours, temps intermédiaires, boutons d'appel et relais de piste—sont parfaitement opérationnelles).*

### Étape 5 : Démarrer les services et lancer l'affichage kiosque
Démarrez le démon backend et activez le kiosque TV plein écran :
```bash
# Démarrer le serveur backend
sudo systemctl start racecoordinatorai

# Vous avez déjà activé le démon backend précédemment.
# Activez maintenant le service kiosque TV pour le démarrage graphique :
sudo systemctl enable racecoordinatorai-kiosk.service

# Démarrer l'affichage kiosque TV plein écran immédiatement
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Mettre à jour une installation existante { #updating-an-existing-installation }

Une fois Race Coordinator AI installé et opérationnel sur votre Arduino Uno Q, le maintenir à jour avec les dernières fonctionnalités, correctifs et améliorations de micrologiciel est très simple. Selon que votre carte est connectée au réseau ou fonctionne de manière totalement autonome sur le circuit, choisissez la méthode appropriée :

- **[Mise à jour avec connexion réseau (Recommandé)](#mise-a-jour-avec-connexion-reseau)** : Mises à jour automatiques transparentes en arrière-plan configurées directement depuis l'interface web.
- **[Mise à jour sans connexion réseau (Hors ligne via clé USB)](#mise-a-jour-sans-connexion-reseau)** : Copie d'une archive de mise à jour via une clé USB et application locale sur la carte.

---

### Mise à jour avec connexion réseau { #mise-a-jour-avec-connexion-reseau }

Si votre Arduino Uno Q est connecté à votre réseau local avec un accès Internet (via Wi-Fi ou Ethernet), vous pouvez utiliser les mises à jour automatiques directement depuis l'interface web de Race Coordinator AI :

1. **Activer les mises à jour automatiques dans l'interface web** :
   - Dans Race Coordinator AI, accédez à **Options → Mises à jour automatiques** depuis la Configuration du jour de course ou la barre de menu supérieure.
   - Choisissez votre canal de publication préféré :
     - **🟢 Versions officielles / de production** : Versions stables et entièrement validées, recommandées pour les opérations de course standard et les événements de club où la stabilité maximale est primordiale.
     - **🟡 Versions bêta** : Versions complètes publiées pendant les cycles de développement actif pour les tests communautaires et la vérification en conditions réelles de course. Recommandées pour tester de nouvelles fonctionnalités et faire des retours avant la sortie officielle.
     - **🔵 Builds quotidiens Alpha** : Versions compilées quotidiennement depuis la branche de développement actif avec les toutes dernières fonctionnalités expérimentales.
   - Pour une explication détaillée sur le fonctionnement des canaux de publication et la promotion des versions, consultez la section [Canaux de publication et mises à jour automatiques](downloads.fr.md#release-channels) dans le Centre d'aide.

2. **Fonctionnement des mises à jour automatiques sur l'Arduino Uno Q** :
   Lorsqu'une mise à jour est détectée pour votre canal configuré :
   - **Téléchargement en arrière-plan** : La carte télécharge le nouveau package Linux ARM64 (`RaceCoordinatorAI-Linux-ARM64*.tar.gz`) en arrière-plan sans interrompre les sessions de course actives.
   - **Redémarrage du service** : Le gestionnaire de mise à jour extrait les nouveaux fichiers sur `/opt/racecoordinatorai` et redémarre `racecoordinatorai.service` (ainsi que l'affichage kiosque) de manière transparente via `systemctl`.
   - **Synchronisation du sketch du microcontrôleur** : Si la nouvelle version inclut des modifications du micrologiciel temps réel (`racecoordinatorai_sketch.ino`), l'outil recompile automatiquement le sketch et re-flashe le microcontrôleur STM32 via le pont réseau interne avec `arduino-cli`.
   - L'historique des courses, les configurations de piste, les dispositions personnalisées, les listes de pilotes et votre base de données SQLite sont intégralement préservés.

3. **Vérification manuelle des mises à jour** :
   Même si les mises à jour automatiques sont désactivées ou configurées en mode manuel, vous pouvez lancer une vérification immédiate à tout moment en sélectionnant **Rechercher des mises à jour** dans le menu de l'interface web.

---

### Mise à jour sans connexion réseau { #mise-a-jour-sans-connexion-reseau }

Si votre Arduino Uno Q fonctionne entièrement hors ligne sur le circuit sans connexion Internet, vous pouvez mettre à jour l'installation manuellement à l'aide d'une clé USB standard.

#### Étape 1 : Transférer l'archive de mise à jour sur la carte via USB

1. **Télécharger le package de mise à jour sur un ordinateur connecté** :
   Depuis un ordinateur avec accès Internet (Mac, Windows ou Linux), ouvrez le portail [Téléchargements et versions](downloads.fr.md) ou la page [GitHub Releases](https://github.com/daufderheide/racecoordinator_ai/releases) et téléchargez le package Linux ARM64 :
   - Format de fichier : `RaceCoordinatorAI-Linux-ARM64.tar.gz` (ou avec numéro de version : `RaceCoordinatorAI-Linux-ARM64_v*.tar.gz`).
2. **Copier sur une clé USB** :
   Copiez le fichier `.tar.gz` téléchargé sur une clé USB standard formatée en FAT32 ou exFAT.
3. **Brancher la clé USB sur l'Uno Q** :
   Insérez la clé USB dans l'un des ports USB hôtes disponibles de l'Arduino Uno Q.
4. **Copier le fichier sur la carte** :
   - **Via l'interface graphique du bureau** : Ouvrez le gestionnaire de fichiers sur le bureau de l'Uno Q, cliquez sur la clé USB montée dans la barre latérale et copiez l'archive `.tar.gz` dans votre dossier `~/Downloads/` (ou votre dossier personnel `~/`).
   - **Via le terminal / SSH** : Le système monte automatiquement les périphériques de stockage USB sous `/media/arduino/<NOM_PERIPHERIQUE>` (ou montez-le manuellement avec `sudo mount /dev/sda1 /mnt`). Copiez l'archive dans votre dossier local :
     ```bash
     cp /media/arduino/*/RaceCoordinatorAI-Linux-ARM64*.tar.gz ~/Downloads/
     ```
     *(Alternativement, si votre ordinateur portable est connecté directement à la carte par câble Ethernet ou via un routeur Wi-Fi local sans Internet, vous pouvez transférer le fichier par `scp` : `scp RaceCoordinatorAI-Linux-ARM64*.tar.gz arduino@<hostname>:~/Downloads/`).*

#### Étape 2 : Appliquer la mise à jour

Une fois l'archive `.tar.gz` copiée sur la carte (par exemple dans `~/Downloads/`), choisissez l'une des trois méthodes suivantes pour appliquer la mise à jour :

##### Option 1 : Script d'aide à la mise à jour intégré (Le plus rapide et recommandé)
Race Coordinator AI comprend un script de mise à jour dédié situé dans `/opt/racecoordinatorai/scripts/update_app.sh`. Il arrête automatiquement les services actifs, extrait la nouvelle version sur `/opt/racecoordinatorai`, recompile et téléverse le micrologiciel du microcontrôleur si nécessaire, ajuste les permissions et redémarre tous les services :
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```
*(Toutes les données de course, la base de données SQLite, les dispositions d'écran et les préférences utilisateur sont automatiquement préservées).*

##### Option 2 : Extraire et exécuter `install.sh` depuis le package téléchargé
Vous pouvez extraire l'archive de mise à jour dans un dossier temporaire et exécuter son script `install.sh`. L'installateur détecte l'installation existante dans `/opt/racecoordinatorai`, met à jour les fichiers de l'application, re-flashe le micrologiciel du microcontrôleur et redémarre les services systemd :
```bash
# Extraire l'archive téléchargée
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Exécuter l'installateur sur l'installation existante (préserve la base de données et les paramètres)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Option 3 : Mise à jour manuelle via les commandes Linux (Sans scripts d'aide)
Si vous préférez effectuer la mise à jour entièrement à la main sans utiliser les scripts fournis, exécutez la séquence de commandes suivante dans le terminal :

1. **Arrêter les services actifs** :
     ```bash
     sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
     ```
2. **Extraire les fichiers mis à jour sur `/opt/racecoordinatorai`** :
     ```bash
     sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
     ```
     *(Remarque : Cela met à jour les binaires, les fichiers du client web et les scripts sur place tout en laissant votre base de données SQLite et vos médias personnalisés intacts).*
3. **Vérifier les droits et l'appartenance des fichiers** :
     ```bash
     sudo chown -R arduino:arduino /opt/racecoordinatorai
     ```
4. **Recompiler et re-flasher le micrologiciel du microcontrôleur (si le sketch a été mis à jour)** :
     ```bash
     cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
     arduino-cli compile --fqbn arduino:zephyr:unoq .
     arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
     ```
5. **Redémarrer les services serveur et kiosque** :
     ```bash
     sudo systemctl restart racecoordinatorai
     sudo systemctl restart racecoordinatorai-kiosk
     ```

---

## Focus des fenêtres et applications au démarrage du bureau (ex. Arduino App Lab)

Sur l'Arduino Uno Q, Arduino Linux OS lance « Arduino App Lab » lors de la connexion au bureau.
- **Maintien automatique du focus** : Par défaut, `start_kiosk.sh` utilise `wmctrl` pour ramener automatiquement Race Coordinator AI au premier plan et conserver le focus, garantissant que l'écran de télévision soit immédiatement prêt pour les courses sans nécessiter d'intervention à la souris ou au clavier.
- **Optionnel : Désactiver App Lab au démarrage** : Pour un kiosque de circuit dédié où Arduino App Lab n'est pas nécessaire au démarrage, vous pouvez désactiver son entrée de lancement automatique :
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
  ```

---

## Support FastLED et LED RVB (Non pris en charge sur Uno Q)

> [!WARNING] Rubans LED RVB adressables FastLED non pris en charge sur la MCU Uno Q
> Les rubans LED RVB adressables (WS2812B, NeoPixel, SK6812, APA102, etc.) pilotés par **FastLED ne sont pas pris en charge sur le microcontrôleur intégré de l'Arduino Uno Q**. La MCU temps réel de l'Uno Q utilise une architecture STM32U585 sous Zephyr OS (CMSIS 6), qui ne dispose pas de la prise en charge des registres bas niveau et du timing bit-banging dans la bibliothèque FastLED amont. Par conséquent, le sketch Race Coordinator AI (`racecoordinatorai_sketch.ino`) désactive explicitement FastLED (`WITH_FAST_LED`) lors de la compilation pour la MCU Uno Q.

### Alternatives d'éclairage disponibles

Si vous souhaitez des indicateurs lumineux visuels sur une configuration Arduino Uno Q, deux solutions s'offrent à vous :

1. **LED à sortie numérique standard** : Les LED monochromes (par exemple, des LED standard rouges, jaunes ou vertes pilotées via des broches de sortie numérique avec résistances de limitation, transistors ou relais) peuvent toujours être configurées sur la MCU de l'Uno Q dans Race Coordinator AI comme voyants d'appel ou d'état de piste standards.
2. **Arduino secondaire dédié pour les LED RVB FastLED (Recommandé pour les rubans RVB)** : Si vous souhaitez absolument des rubans LED RVB adressables pour les feux de départ à décompte en plusieurs étapes, les jauges de ravitaillement aux stands et les animations de victoire avec drapeau à damier, vous pouvez connecter un **deuxième Arduino** dédié au pilotage des LED RVB.

> [!TIP] Utilisation d'un second Arduino pour les LED RVB FastLED
> L'**architecture multi-interface** de Race Coordinator AI prend parfaitement en charge la connexion et l'exécution simultanée de plusieurs contrôleurs matériels sur le même circuit :
> 
> - **Interface principale (MCU Uno Q intégrée)** : Gère les signaux de course critiques en temps réel—capteurs optiques de comptage des tours, temps intermédiaires, boutons d'appel des pilotes et relais principaux d'alimentation de piste—avec une précision inférieure à la milliseconde.
> - **Interface secondaire (Second Arduino via USB)** : Branchez une carte Arduino standard économique (telle qu'un **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040** ou **ESP32**) sur l'un des ports hôtes USB de l'Uno Q. Flashez le sketch standard `racecoordinatorai_sketch.ino` (où FastLED est activé) sur cette deuxième carte.
> - **Configuration dans l'Éditeur de piste** : Dans l'interface web de Race Coordinator AI, accédez à l'**Éditeur de piste** $\rightarrow$ **Interfaces matérielles** et cliquez sur **Ajouter une interface** pour ajouter le port série du second Arduino (par exemple, `/dev/ttyUSB0` ou `/dev/ttyACM0`). Configurez vos bandeaux lumineux FastLED sur cette seconde interface. Race Coordinator AI orchestre automatiquement les deux cartes de façon synchrone pendant les courses.

---

## Dépannage de la synthèse vocale (TTS) et de l'audio

Race Coordinator AI utilise la Web Speech API du navigateur (`window.speechSynthesis`) pour annoncer les temps au tour, les événements de course et les commentaires des pilotes. Contrairement à Windows ou macOS, Linux (Debian 12 sur l'Uno Q) ne dispose pas de synthétiseur vocal intégré, de sorte que Chromium s'appuie sur **Speech Dispatcher** et **eSpeak NG**.

### Paquets requis
L'installateur automatisé (`install.sh`) installe ces paquets automatiquement. Si vous avez effectué une installation manuelle ou si le TTS n'émet aucun son, assurez-vous que les paquets vocaux et audio requis sont installés :
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Options du navigateur en mode kiosque et navigation multi-onglets
En mode kiosque, Chromium est lancé via `/opt/racecoordinatorai/scripts/start_kiosk.sh`. Race Coordinator AI utilise `--start-maximized` (plutôt que le mode restrictif `--kiosk`) pour garantir que les onglets secondaires — tels que Résultats de manche, Résultats de course, vues de thèmes et le Centre d'aide hors ligne — restent visibles et accessibles depuis la barre d'onglets en haut de l'écran du téléviseur. Chromium nécessite également des options spécifiques pour activer Speech Dispatcher et la lecture audio automatique, ainsi que `--test-type` pour masquer les avertissements concernant les options non prises en charge. Assurez-vous que votre script `start_kiosk.sh` contient :
```bash
  --start-maximized \
  --test-type \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(Si vous modifiez `start_kiosk.sh` manuellement, redémarrez ensuite le service du kiosque : `sudo systemctl restart racecoordinatorai-kiosk`).*

### Étapes de dépannage
1. **Vérifier le mode de fonctionnement et la sortie audio** :
   - **Mode écran kiosque** : L'audio est diffusé directement depuis l'Uno Q via la liaison USB-C DisplayPort/HDMI vers votre téléviseur/moniteur ou des haut-parleurs USB connectés.
   - **Client réseau distant** : Si vous accédez à Race Coordinator AI depuis un ordinateur portable, une tablette ou un smartphone sur le réseau local (`http://<hostname>:7070`), l'audio et le TTS sont joués sur **le navigateur et les haut-parleurs de cet appareil**, et non sur la carte Uno Q.
2. **Vérifier la sortie audio matérielle** :
   Lancez un test sonore dans le terminal de l'Uno Q pour vérifier que la sortie audio est active et non muette :
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   Si aucun son n'est émis, lancez `alsamixer` dans le terminal pour vérifier que les curseurs de volume Master/PCM/HDMI ne sont pas muets (`[MM]`, appuyez sur `M` pour basculer) et qu'ils sont suffisamment élevés.
3. **Tester les synthétiseurs vocaux en ligne de commande** :
   Vérifiez qu'eSpeak NG et Speech Dispatcher fonctionnent au niveau du système d'exploitation :
   ```bash
   # Tester la synthèse pure
   espeak-ng "Testing speech synthesis"

   # Tester Speech Dispatcher (le backend de Chromium)
   spd-say "Testing speech dispatcher"
   ```
   Si `spd-say` renvoie une erreur ou reste bloqué, redémarrez le démon : `pkill -f speech-dispatcher && spd-say "Hello"`.
   Assurez-vous que le socket Speech Dispatcher et la persistance de session utilisateur (linger) sont activés :
   ```bash
   systemctl --user enable --now speech-dispatcher.socket
   sudo loginctl enable-linger arduino
   ```
4. **Tester dans l'interface web** :
   Dans l'interface web de Race Coordinator AI, ouvrez **Personnaliser l'interface** (ou **Éditeur de thèmes** $\rightarrow$ **Paramètres audio**). Vérifiez la liste déroulante **Voix TTS** : les voix disponibles doivent apparaître. Cliquez sur **Tester la voix TTS** pour confirmer la restitution vocale.

