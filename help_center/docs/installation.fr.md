# Guide d'Installation

Ce guide vous accompagne pas à pas pour télécharger, installer et configurer Race Coordinator AI sur votre ordinateur.

---

## Systèmes d'Exploitation Pris en Charge

Race Coordinator AI est entièrement multiplateforme et fonctionne aussi bien sur les systèmes d'exploitation récents qu'anciens :

| Plateforme | Versions Prises en Charge | Installateur Recommandé |
| :--- | :--- | :--- |
| **🪟 Windows (Moderne)** | Windows 10, Windows 11 (64 bits & 32 bits) | **Installateur En Ligne** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Ancien)** | Windows 8, Windows 7, Windows XP | **Installateur Complet Hors Ligne** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Requis pour installation initiale sur Win 8 et antérieurs)* |
| **🍏 macOS** | macOS 10.15 (Catalina) jusqu'à macOS 15+ (Intel & Apple Silicon) | **Image Disque** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64 bits), Arduino Linux OS, Debian, Ubuntu | **Paquet ARM64 / Linux** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Choisir Votre Canal de Publication

Race Coordinator AI est distribué via trois canaux :

* **🟢 Versions Stables Officielles** *(Recommandé)* : Versions rigoureusement testées et prêtes pour la production, recommandées pour les compétitions régulières, les circuits personnels et les clubs.
* **🟡 Aperçus Bêta** : Versions préalables incluant les nouvelles fonctionnalités, nouveaux pilotes matériels et améliorations expérimentales pour tests communautaires.
* **🔵 Versions Alpha / Nightly** : Compilations automatiques issues du développement actif.

👉 Consultez le **[Portail des Téléchargements et Versions](downloads.fr.md)** pour télécharger une version ou consulter l'historique complet.

---

## 🪟 Installation sous Windows

### 1. Télécharger l'Installateur
* Pour **Windows 10 / 11** : Téléchargez `RaceCoordinatorAI_Online_Setup_*.exe`.
* Pour **Windows 8 et versions antérieures** (ou ordinateurs sans connexion Internet active) : Téléchargez `RaceCoordinatorAI_Offline_Setup_*.exe`.

### 2. Exécuter l'Installateur
1. Double-cliquez sur le fichier `.exe` téléchargé.
2. Si Windows SmartScreen affiche un message *"Windows a protégé votre ordinateur"*, cliquez sur **Informations complémentaires** puis sur **Exécuter quand même**.
3. Suivez les étapes de l'assistant Inno Setup pour choisir le dossier d'installation (par défaut : `C:\Program Files\RaceCoordinator AI`).
4. Choisissez si vous souhaitez créer un raccourci sur le bureau.
5. Cliquez sur **Installer** pour terminer l'installation.

### 3. Lancement
Double-cliquez sur le raccourci **Race Coordinator AI** sur votre bureau ou ouvrez l'application depuis le menu Démarrer de Windows.

!!! note "Prérequis pour versions anciennes de Windows (XP / 7 / 8)"
    Sous Windows 7, 8 ou XP, assurez-vous d'avoir installé le package redistribuable [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784).

---

## 🍏 Installation sous macOS

### 1. Télécharger l'Image Disque
Téléchargez `RaceCoordinator_Mac_*.dmg` depuis la page des versions.

### 2. Installer dans le Dossier Applications
1. Double-cliquez sur le fichier `RaceCoordinator_Mac_*.dmg` téléchargé pour monter l'image disque.
2. Faites glisser l'icône **Race Coordinator AI** dans votre dossier **Applications**.
3. Éjectez l'image disque.

### 3. Premier Lancement et Sécurité macOS
1. Ouvrez votre dossier **Applications** et double-cliquez sur **Race Coordinator AI**.
2. Si macOS affiche un message indiquant que l'application ne peut pas être ouverte car elle provient d'un développeur non identifié :
   - Ouvrez **Réglages Système** → **Confidentialité et sécurité**.
   - Faites défiler jusqu'à la section **Sécurité** et cliquez sur **Ouvrir quand même** à côté de Race Coordinator AI.
   - Vous pouvez également maintenir la touche `Contrôle` enfoncée, cliquer sur l'icône de l'application dans Applications et sélectionner **Ouvrir**.

---

## 🐧 Installation sous Linux, Raspberry Pi et Arduino Uno Q

Pour les configurations sur appareils matériels dédiés avec services d'arrière-plan systemd, mode kiosque et interfaces de circuit, consultez nos guides dédiés :

* **[Guide de Configuration Arduino UNO Q](arduino-uno-q.fr.md)** : Installation clé en main pour l'appareil double cœur Arduino Uno Q avec microcontrôleur STM32 temps réel intégré.
* **[Guide de Configuration Raspberry Pi (Expérimental)](raspberry-pi.fr.md)** : Installation sur Raspberry Pi 4 / 5 selon une architecture à deux cartes couplée à un microcontrôleur USB Arduino externe.

### 1. Télécharger le Paquet Linux
Téléchargez `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` depuis la page des téléchargements.

### 2. Extraire et Exécuter
1. Ouvrez un terminal et décompressez l'archive dans le dossier souhaité :
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Vérifiez que le lanceur possède les droits d'exécution :
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Lancez l'application :
   ```bash
   ./RaceCoordinatorAI
   ```

---

## Premier Lancement & Prise en Main

Lors du premier lancement de Race Coordinator AI :

1. **Base de Données par Défaut** : L'application initialise automatiquement une base de données SQLite embarquée (`racecoordinator.db`) préremplie avec des pilotes et équipes exemples, un circuit 4 voies standard et des formats de course courants (Toutes rondes, Essais libres).
2. **Mode Démonstration Clavier** : Vous pouvez explorer et tester immédiatement les modes de course à l'aide du chronométrage par touches du clavier, sans brancher de matériel physique.
3. **Configurer les Capteurs de Piste** : Rendez-vous dans **Gestionnaire de Pistes** → **Modifier la Piste** pour paramétrer votre matériel d'interface (Arduino Uno / Uno Q, Phidget, Trak-Mate ou détection par webcam).

---

## Mise à Niveau des Installations Existantes

La mise à jour vers une version plus récente de Race Coordinator AI s'effectue sans aucune perte de données :

* **Vos Données Sont Préservées** : Votre base de données (`racecoordinator.db`), vos statistiques de course, profils de pilotes, configurations de circuits et thèmes personnalisés sont stockés dans le dossier de données de l'utilisateur et ne sont **pas** écrasés lors d'une mise à jour.
* **Pour Mettre à Jour sous Windows** : Lancez simplement le nouvel installateur par-dessus l'installation existante, ou cliquez sur **Installer Maintenant** dans la bannière de mise à jour intégrée à l'application.
* **Pour Mettre à Jour sous Linux / Arduino Uno Q / Raspberry Pi** : Exécutez `sudo /opt/racecoordinatorai/scripts/update_app.sh /chemin/vers/RaceCoordinatorAI-Linux-ARM64*.tar.gz` ou décompressez l'archive et exécutez `sudo ./install.sh`. Consultez le [Guide Arduino UNO Q](arduino-uno-q.fr.md#mise-à-jour-dune-installation-existante) ou le [Guide Raspberry Pi](raspberry-pi.fr.md#mise-à-jour-dune-installation-existante) pour les instructions détaillées.

---

## Signaler un Problème & Suggestions

Si vous rencontrez une anomalie lors de l'installation ou souhaitez suggérer une amélioration :

1. Rendez-vous sur notre **[Portail d'Assistance GitHub](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Parcourez les signalements existants pour vérifier si une solution ou un contournement est déjà disponible.
3. Cliquez sur **New Issue** et précisez :
   * Votre système d'exploitation et sa version.
   * La version de Race Coordinator AI (ex. `v1.0.0` ou `v1.0.0-beta.1`).
   * Les étapes de reproduction ainsi que des captures d'écran ou journaux d'erreurs si possible.
