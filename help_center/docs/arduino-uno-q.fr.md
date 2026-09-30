# Guide de configuration de l'Arduino UNO Q

Ce guide explique comment configurer **Race Coordinator AI (RC AI)** sur la carte de développement hybride **Arduino UNO Q** en tant qu'appareil matériel autonome.

---

## Présentation du matériel et variantes de mémoire

L'**Arduino UNO Q** combine un nano-ordinateur Linux 64 bits (SBC) avec un microcontrôleur temps réel sur une seule carte :

- **MPU Linux (Qualcomm Cortex-A53 à 2,0 GHz)** : Exécute le serveur Race Coordinator AI, la base de données SQLite, le serveur client web et la mise à jour automatique.
- **MCU temps réel (STM32U585 Cortex-M33 à 160 MHz)** : Gère les interruptions des broches de capteurs de tour, les relais d'alimentation et les ponts d'éclairage RVB FastLED avec une précision inférieure à la milliseconde.
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

### Étape 1 : Préparer la carte et se connecter via SSH
1. Installez **Arduino Linux OS** (Debian 12 arm64) sur l'Uno Q.
2. Connectez la carte à votre réseau local via Wi-Fi ou Ethernet :
   * **Configuration Wi-Fi au premier démarrage** : Lors du démarrage initial, l'assistant de configuration vous invite à configurer le réseau sans fil.
   * **Remarque sur la première connexion** : La connexion Wi-Fi peut ne pas prendre effet immédiatement après la saisie, et les commandes de terminal manuelles telles que `sudo nmcli dev wifi connect "Votre_SSID" password "Votre_MotDePasse"` peuvent également échouer au premier démarrage. Si cela se produit, exécutez simplement `sudo reboot`. Après le redémarrage, la carte réseau sans fil s'initialise correctement et se connecte automatiquement à votre réseau Wi-Fi configuré.
   * **Appliquer les mises à jour de la carte et du micrologiciel** : Lors du redémarrage (ou lorsque le système vous y invite), il peut vous être demandé si vous souhaitez mettre à jour divers packages et composants du micrologiciel sur la carte. Il est fortement recommandé d'accepter et d'effectuer toutes les mises à jour suggérées, car le micrologiciel d'origine en usine est souvent obsolète. Notez que cette mise à jour initiale peut prendre un certain temps (souvent 5 à 10+ minutes selon la vitesse du réseau et la taille des paquets) ; laissez le processus se terminer sans interruption.
3. Activer SSH sur la carte et se connecter :
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
   * **Se connecter depuis votre PC** : Ouvrez un terminal sur votre ordinateur et connectez-vous en utilisant le nom d'hôte ou l'adresse IP de la carte :
     ```bash
     ssh arduino@<hostname>
     # Ou connectez-vous directement via l'adresse IP :
     ssh arduino@<ADRESSE_IP>
     ```

### Étape 2 : Installer les prérequis
Installez l'environnement d'exécution Java (`default-jre-headless`), les utilitaires audio (`espeak-ng`, `alsa-utils`), `chromium` et le gestionnaire de fenêtres (`wmctrl`) :
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng alsa-utils git curl unzip chromium wmctrl
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
   sudo usermod -a -G dialout arduino
   ```

3. **Installer et enregistrer les services systemd** :
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Étape 4 : Flasher le micrologiciel du microcontrôleur (avec support FastLED)
Compilez et téléversez le sketch matériel sur la MCU intégrée :
```bash
# Vérifier les cartes et ports détectés
arduino-cli board list

# Installer le cœur de carte Zephyr dans arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Installer les bibliothèques Arduino requises (pont routeur Uno Q & FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# Compiler racecoordinatorai_sketch pour la MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Téléverser sur la MCU intégrée via le pont réseau interne
# (Saisir le mot de passe 'arduino' lorsque vous y êtes invité, ou passer --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Remarque : Comme vérifié via `arduino-cli board list`, le microcontrôleur Uno Q exécute Zephyr OS sur le pont réseau interne `172.17.0.1` avec la FQBN `arduino:zephyr:unoq`. La bibliothèque `Arduino_RouterBridge` est requise pour la communication série via le pont SoC. Les bandeaux LED FastLED ne sont pas pris en charge actuellement sur l'architecture STM32U5 / Zephyr Cortex-M33 en raison des définitions de registres CMSIS 6, mais toutes les fonctionnalités principales de la piste—capteurs de tours, temps intermédiaires, boutons d'appel et relais de piste—sont parfaitement opérationnelles).*

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

## Focus des fenêtres et applications au démarrage du bureau (ex. Arduino App Lab)

Sur l'Arduino Uno Q, Arduino Linux OS lance « Arduino App Lab » lors de la connexion au bureau.
- **Maintien automatique du focus** : Par défaut, `start_kiosk.sh` utilise `wmctrl` pour ramener automatiquement Race Coordinator AI au premier plan et conserver le focus, garantissant que l'écran de télévision soit immédiatement prêt pour les courses sans nécessiter d'intervention à la souris ou au clavier.
- **Optionnel : Désactiver App Lab au démarrage** : Pour un kiosque de circuit dédié où Arduino App Lab n'est pas nécessaire au démarrage, vous pouvez désactiver son entrée de lancement automatique :
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
  ```

---

## Configuration du pont de lumières RVB FastLED

FastLED est entièrement pris en charge sur l'Uno Q. Les rubans LED RVB adressables (WS2812B, NeoPixel, SK6812, APA102) se connectent directement aux broches GPIO de la MCU STM32.

- **Feux de départ** : Animation de compte à rebours en 5 étapes (rouge $\rightarrow$ jaune $\rightarrow$ vert).
- **Voie des stands / Ravitaillement** : Jauge de niveau de carburant en pourcentage en temps réel par voie.
- **Leader & Victoire** : Impulsion dynamique pour le leader de manche et animation de drapeau à damier.

---

## Mises à jour logicielles automatiques

Lorsqu'il est connecté au Wi-Fi, Race Coordinator AI vérifie automatiquement les versions GitHub :
1. **Mise à jour de l'application** : Télécharge le nouveau package Linux ARM64 en arrière-plan.
2. **Redémarrage du service** : Redémarre `racecoordinatorai.service` via systemd de manière transparente.
3. **Synchronisation du sketch MCU** : Re-flashe automatiquement le micrologiciel du microcontrôleur STM32 à l'aide d'arduino-cli si `racecoordinatorai_sketch.ino` a été mis à jour.
