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
2. **Mode appareil sans tête (Actuellement non pris en charge - Disponible sur demande)** : La carte exécute uniquement le serveur backend et se connecte au matériel de piste, sans qu'aucun moniteur ni navigateur local ne soit exécuté. Les utilisateurs accèdent à l'interface web via le réseau local (`http://uno-q.local:7070`). Comme indiqué ci-dessus, le mode sans tête sur l'Uno Q n'est pas pris en charge par défaut, mais peut être ajouté sur demande si l'Uno Q dispose d'une connexion réseau.

---

## Installation étape par étape

### Étape 1 : Préparer la carte et se connecter via SSH
1. Installez **Arduino Linux OS** (Debian 12 arm64) sur l'Uno Q.
2. Connectez la carte à votre réseau local via Wi-Fi ou Ethernet.
3. Ouvrez une session SSH :
   ```bash
   ssh arduino@uno-q.local
   ```

### Étape 2 : Installer les prérequis
Installez OpenJDK 11, `arduino-cli`, les utilitaires d'affichage et Chromium :
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Étape 3 : Flasher le micrologiciel du microcontrôleur (avec support FastLED)
Compilez et téléversez le sketch matériel sur la MCU STM32 intégrée :
```bash
# Installer le cœur de carte STM32 dans arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:stm32

# Compiler et téléverser racecoordinatorai_sketch
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Étape 4 : Installer le package d'application et les services Systemd
1. Téléchargez `RaceCoordinatorAI-Linux-ARM64.tar.gz` et décompressez-le dans `/opt/racecoordinatorai` :
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Exécutez le script d'installation :
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Démarrez les services :
   ```bash
   # Démarrer le serveur backend
   sudo systemctl start racecoordinatorai

   # (Facultatif) Activer le kiosque d'écran local sur USB-C DisplayPort
   sudo systemctl enable --now racecoordinatorai-kiosk
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
