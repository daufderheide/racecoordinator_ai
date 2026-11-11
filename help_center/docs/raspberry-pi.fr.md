# Configuration sur Raspberry Pi (Expérimental)

Ce guide explique comment installer et configurer **Race Coordinator AI (RC AI)** sur un nano-ordinateur **Raspberry Pi** en utilisant une architecture à deux cartes.

---

> [!NOTE] Configuration Matérielle Expérimentale
> Bien que l'application principale Linux ARM64 de Race Coordinator AI s'exécute nativement et de manière très fluide sur Raspberry Pi OS 64 bits, l'exécution sur Raspberry Pi est classée comme **expérimentale**. Contrairement à l'architecture intégrée double cœur de l'Arduino Uno Q (qui combine un MPU d'application et un microcontrôleur STM32 temps réel sur un seul circuit imprimé), une configuration Raspberry Pi nécessite un **microcontrôleur USB externe** (tel qu'un Arduino Uno, Nano, Mega ou RP2040) pour gérer les capteurs de piste et les relais d'alimentation.

---

## Architecture : Pourquoi une configuration à deux cartes ?

Pour comprendre pourquoi Race Coordinator AI utilise deux cartes avec un Raspberry Pi, il est utile de distinguer l'informatique généraliste du chronométrage déterministe en temps réel :

```
┌────────────────────────────────────────────────────────┐
│          Raspberry Pi 4 / 5 (Ordinateur Hôte)          │
│                                                        │
│  - Raspberry Pi OS 64 bits (Debian Linux)              │
│  - Serveur Java 21 et Base de données SQLite           │
│  - Serveur d'Application Web (Port 7070)               │
│  - Affichage Kiosque Plein Écran Chromium (HDMI TV)    │
└───────────────────────────┬────────────────────────────┘
                            │ Connexion Série USB
                            │ (/dev/ttyACM0 ou /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      Microcontrôleur Externe (Arduino Uno / Nano)      │
│                                                        │
│  - Firmware Temps Réel (racecoordinatorai_sketch.ino)  │
│  - Gestion des Interruptions Précise à la Microseconde │
│  - Entrées Tolérantes au 5V (Phototransistors / IR)    │
│  - Relais d'Alimentation Piste & Boutons d'Interruption│
└────────────────────────────────────────────────────────┘
```

### Pourquoi ne pas utiliser directement les broches GPIO du Raspberry Pi ?

1. **Gigue (Jitter) d'Ordonnancement du Noyau Linux** :
   Raspberry Pi OS est un système d'exploitation multitâche préemptif généraliste. Le noyau Linux répartit continuellement le temps processeur entre les services d'arrière-plan, les entrées/sorties réseau, l'interface graphique et les tâches système. Cela introduit une latence d'ordonnancement non déterministe (gigue ou "jitter") généralement comprise entre **5 et 30 millisecondes**. En circuit routier électrique (slot car), une voiture légère franchissant un capteur optique ou une section morte à grande vitesse ne génère une impulsion électrique que pendant **1 à 5 millisecondes**. L'utilisation directe des entrées GPIO Linux entraîne inévitablement des tours manqués et des temps au centième de seconde imprécis.
2. **Niveaux de Tension et Protection Contre les Surtensions** :
   Le connecteur GPIO 40 broches du Raspberry Pi fonctionne exclusivement en **logique 3,3V** sans protection intégrée contre les surtensions. Raccorder directement les câblages de la piste expose la carte à une destruction irréversible par des capteurs optiques 5V, des surtensions inductives de relais ou la force contre-électromotrice (12V–18V) des moteurs de voitures.
3. **La Solution à Deux Cartes** :
   En associant le Raspberry Pi à un microcontrôleur USB économique (comme un Arduino Uno R3/R4, Nano, Mega 2560 ou Raspberry Pi Pico avec firmware Arduino), vous obtenez le meilleur des deux mondes :
   - Le **microcontrôleur** exécute un firmware bare-metal temps réel avec des interruptions matérielles à la sous-milliseconde et une immunité électrique 5V.
   - Le **Raspberry Pi** sert d'ordinateur hôte performant pour le serveur Java 21, la base SQLite, le réseau, la synthèse vocale et l'affichage vidéo HDMI.

---

## Prérequis Matériels et Variantes de Mémoire

### 1. Nano-ordinateur Raspberry Pi

* **Modèles Pris en Charge** : **Raspberry Pi 4 Modèle B** ou **Raspberry Pi 5** (ARM Cortex-A72 ou Cortex-A76 64 bits).
* **Système d'Exploitation** : **Raspberry Pi OS (64 bits)** est obligatoire. La version 32 bits n'est pas prise en charge.
* **Stockage** : Carte microSD haute vitesse de 16 Go ou plus (classe A1 ou A2 recommandée) ou disque SSD USB 3.0.
* **Alimentation** : Alimentation officielle USB-C Raspberry Pi (15W pour Pi 4, 27W pour Pi 5) pour éviter les baisses de tension.

### 2 Go contre 4 Go / 8 Go de RAM

| Modèle | Mode de Fonctionnement Recommandé | Description |
| :--- | :--- | :--- |
| **Raspberry Pi (2 Go RAM)** | **Mode Sans Écran (Headless)** | Idéal pour fonctionner uniquement comme serveur de piste sans écran raccordé. Les pilotes et directeurs de course visualisent l'interface sur tablettes, iPads, smartphones ou ordinateurs portables via Wi-Fi/LAN (`http://<pi-ip>:7070`). Désactiver le navigateur kiosque local libère la mémoire vive pour le serveur Java et la base de données. |
| **Raspberry Pi (4 Go ou 8 Go RAM)** | **Mode Affichage Kiosque** *(Recommandé)* | Recommandé lors de la connexion directe d'un écran HDMI ou téléviseur. Exécute le bureau graphique complet, le navigateur plein écran Chromium, Java et la base de données simultanément avec une excellente réactivité. |

### 2. Microcontrôleur Externe de Chronométrage

Une carte externe exécutant le firmware Race Coordinator AI :

* **Cartes Recommandées** :
  * **Arduino Uno R3 ou R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (idéal pour les pistes de 4 ou 6 voies nécessitant de nombreuses broches)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** avec firmware Arduino
* **Câble USB** : Câble USB standard reliant le microcontrôleur à un port USB du Raspberry Pi.
* **Capteurs et Relais de Piste** : Raccordés au microcontrôleur conformément au **[Guide de Configuration des Circuits](track-editor.fr.md)**.

---

## Installation Étape par Étape

### Étape 1 : Installer Raspberry Pi OS (64 bits)

1. Téléchargez et lancez le **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** sur votre PC ou Mac.
2. Choisissez votre modèle de Raspberry Pi (Pi 4 ou Pi 5).
3. Dans **Système d'exploitation**, choisissez **Raspberry Pi OS (64-bit)** (Debian Bookworm ou Bullseye).
4. Cliquez sur **Modifier les paramètres** (icône d'engrenage) pour préconfigurer :
   * **Nom d'hôte (Hostname)** : Définissez un nom identifiable (ex. `racecoordinator` ou `slotcar-pi`).
   * **Identifiant et Mot de passe** : Créez un compte utilisateur (ex. utilisateur `pi`).
   * **Wi-Fi** : Renseignez le SSID et le mot de passe de votre réseau sans fil.
   * **Services** : Cochez **Activer SSH** (authentification par mot de passe ou clé publique).
5. Sélectionnez votre carte microSD ou SSD cible et cliquez sur **Écrire**.

### Étape 2 : Flasher le Firmware du Microcontrôleur

Avant de brancher votre Arduino sur le Raspberry Pi :

1. Téléchargez le package de publication de Race Coordinator AI sur votre ordinateur ou localisez `racecoordinatorai_sketch.ino` dans l'archive sous le dossier `firmware/`.
2. Ouvrez le sketch dans l'**IDE Arduino** sur votre ordinateur.
3. Sélectionnez le type de carte (ex. *Arduino Uno* ou *Arduino Nano*) et le port série.
4. Cliquez sur **Téléverser** pour compiler et flasher le firmware sur la carte.
5. Débranchez le microcontrôleur de l'ordinateur et branchez-le sur l'un des ports USB du Raspberry Pi. Il apparaîtra automatiquement comme périphérique série (généralement `/dev/ttyACM0` ou `/dev/ttyUSB0`).

### Étape 3 : Installer les Prérequis sur le Raspberry Pi

Démarrez le Raspberry Pi et connectez-vous en SSH depuis le terminal de votre ordinateur :

```bash
ssh pi@<hostname>.local
# Ou connectez-vous avec l'adresse IP du Pi :
# ssh pi@192.168.1.xxx
```

Mettez à jour les paquets et installez Java, les utilitaires audio, le navigateur et le gestionnaire de fenêtres :

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Remarque : Sur les versions récentes de Debian/Raspberry Pi OS Bookworm, le paquet du navigateur s'appelle `chromium` au lieu de `chromium-browser`. Si `chromium-browser` est introuvable, installez `chromium`).*

### Étape 4 : Télécharger et Exécuter l'Installateur Automatisé

1. Transférez l'archive de publication Linux ARM64 sur votre Raspberry Pi :
   ```bash
   # Depuis le terminal de votre PC / Mac :
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(Vous pouvez également la télécharger directement sur le Pi avec `curl` ou `wget` depuis le [Portail des Téléchargements](downloads.fr.md)).*

2. Décompressez l'archive et accédez au dossier de l'installateur :
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Lancez l'installateur avec `sudo` :
   ```bash
   sudo ./install.sh
   ```

#### Détection Automatique du Matériel et Bannière Préalable

L'installateur lit `/proc/device-tree/model` et détecte automatiquement qu'il s'exécute sur un Raspberry Pi :

- **Résolution de Plateforme** : Définit `Hardware Platform: pi`.
- **Compte de Service** : Attribue les fichiers et services à l'utilisateur appelant (ex. `pi`), configurant les services systemd et les permissions du groupe série (`dialout`).
- **Téléversement de Firmware** : Ignore automatiquement la compilation et le téléversement du firmware Zephyr de l'Arduino Uno Q, puisqu'un Arduino USB externe est utilisé sur Raspberry Pi.

Avant de copier des fichiers ou de modifier des services, l'installateur affiche le **Résumé de Résolution de Configuration Préalable** :

```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: pi
   Resolution:      Auto-detected (/proc/device-tree/model: Raspberry Pi 4 Model B Rev 1.5)
 Service Account:   pi
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/pi
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      SKIP (External USB microcontroller used on Raspberry Pi)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

#### Options de Ligne de Commande de l'Installateur

Vous pouvez personnaliser l'installation grâce à des arguments optionnels :

| Argument | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Définir explicitement la plateforme matérielle cible. | Détecté automatiquement depuis `/proc/device-tree/model` (`pi`) |
| `--user=<nom_utilisateur>` | Compte utilisateur Linux pour `/opt/racecoordinatorai` et les services. | Détecté automatiquement via `$SUDO_USER` (par défaut `pi` sur Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Ignorer explicitement la compilation/téléversement du sketch microcontrôleur. | Automatiquement ignoré sur `pi` |
| `-v`, `--verbose` | Activer la journalisation détaillée. | Sortie standard (`false`) |
| `-h`, `--help` | Afficher l'aide et quitter. | - |

---

## Modes de Fonctionnement : Kiosque ou Sans Écran (Headless)

### 1. Mode Affichage Kiosque (Pi 4 Go / 8 Go)

Par défaut, l'installateur active deux services d'arrière-plan systemd :

1. `racecoordinatorai.service` : Le serveur principal Java et la base SQLite embarquée.
2. `racecoordinatorai-kiosk.service` : Une session plein écran Chromium démarrant sur la sortie HDMI principale sur `http://localhost:7070`.

Si un téléviseur ou un moniteur est branché sur le port HDMI du Pi, Race Coordinator AI s'ouvre automatiquement au démarrage en mode plein écran.

### 2. Mode Sans Écran (Headless) (Pi 2 Go ou Serveur Dédié)

Si vous disposez d'un **Raspberry Pi 2 Go** ou si le Pi est installé sous la piste sans écran raccordé, désactivez le service de kiosque :

```bash
# Arrêter et désactiver définitivement le navigateur kiosque :
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

Lorsque le service kiosque est désactivé :

- Le serveur ne consomme que très peu de mémoire vive (~250–350 Mo de RAM).
- Connectez n'importe quel appareil sur le même réseau Wi-Fi ou filaire en ouvrant un navigateur :
  ```text
  http://<adresse-ip-du-pi>:7070
  # Exemple : http://192.168.1.150:7070 ou http://racecoordinator.local:7070
  ```

---

## Configurer l'Interface de Piste dans Race Coordinator AI

Une fois le serveur démarré, configurez la liaison série avec le microcontrôleur externe :

1. Ouvrez l'interface web dans votre navigateur (`http://localhost:7070` ou `http://<pi-ip>:7070`).
2. Rendez-vous dans **Gestionnaire de Pistes** → **Modifier la Piste**.
3. Dans l'onglet **Interfaces Matérielles** :
   * **Type d'interface** : Sélectionnez **Arduino**.
   * **Port** : Sélectionnez `/dev/ttyACM0` ou `/dev/ttyUSB0` (le port relié à votre Arduino).
   * **Vitesse (Baud)** : `115200`.
4. Cliquez sur **Connecter / Tester l'interface** pour valider la communication bidirectionnelle.
5. Associez vos capteurs de voies, boutons d'interruption et relais d'alimentation aux broches Arduino correspondantes.
6. Cliquez sur **Enregistrer la Piste**.

---

## Gestion des Services Systemd

Gérez les services en arrière-plan à l'aide des commandes standard `systemctl` :

```bash
# Vérifier l'état du serveur et afficher les journaux en direct :
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Redémarrer l'application :
sudo systemctl restart racecoordinatorai.service

# Vérifier l'état du navigateur kiosque (si activé) :
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Mise à Jour d'une Installation Existante

La mise à jour de Race Coordinator AI sur un Raspberry Pi préserve l'ensemble de vos données :

* **Préservation des Données** : Votre base de données (`racecoordinator.db`), vos historiques de courses, profils de pilotes et thèmes personnalisés sont conservés dans `/home/<utilisateur>/.racecoordinatorai/` et ne sont jamais écrasés.
* **Mise à Jour Automatique dans l'Application** : Lorsqu'une mise à jour est disponible, cliquez sur **Installer Maintenant** dans la bannière de notification. Le script `/opt/racecoordinatorai/scripts/update_app.sh` détecte automatiquement le Raspberry Pi et ignore le flashage du sketch.
* **Mise à Jour Manuelle** : Téléchargez le nouveau fichier `.tar.gz` et exécutez :
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
