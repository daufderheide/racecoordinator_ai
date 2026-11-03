# Thèmes

## Vue d'ensemble {: #overview }

Les thèmes définissent la présentation audiovisuelle globale et l'atmosphère immersive de vos courses dans Race Coordinator AI. Plutôt que de configurer les éléments visuels, les feux de départ et les annonces audio individuellement pour chaque course, les thèmes rassemblent ces paramètres dans des profils réutilisables.

Lorsqu'un thème est actif, il gère :
- La disposition d'écran principale associée.
- Des graphismes synchronisés pour les drapeaux, les feux de départ et les jauges de carburant.
- Les effets sonores du système, signaux de départ et annonces vocales.
- Des remplacements audio centralisés pour les sons individuels des pilotes.

---

## Paramètres du Thème {: #top-selectors }

Situés dans la barre d'outils supérieure de l'Éditeur de Thèmes, ces réglages définissent les propriétés essentielles du thème :

- **Nom du Thème :** L'identifiant unique du thème. Les thèmes système par défaut (*RC AI*, *Formula*, *Endurance*) sont protégés et ne peuvent pas être supprimés ou renommés.
- **Disposition d'Interface Associée :** Sélectionne la disposition créée dans l'[Éditeur de Dispositions](layout-editor.fr.md) chargée automatiquement sur l'écran principal lors d'une course avec ce thème.
- **Thème du Poste de Pilotage :** Spécifie le thème utilisé pour les écrans dédiés à une seule voie ou lorsqu'un pilote se connecte via mobile ou tablette.
- **Thème de la Vue Pilote :** Spécifie le thème utilisé pour les écrans de calendrier et d'information destinés aux spectateurs.

---

## Images des Drapeaux {: #flags }

La section Images des Drapeaux vous permet de personnaliser les graphismes affichés sur le canevas de course, les widgets et les postes de pilotage :

- **Course (`flag.racing`) :** Affiché lors des conditions de course normales avec piste dégagée.
- **Manche Interrompue (`flag.heat_paused`) :** Drapeau jaune de neutralisation affiché lors d'une interruption de piste ou pause.
- **Manche Terminée (`flag.heat_over`) :** Drapeau à damier affiché à la fin du temps ou des tours réglementaires de la manche.
- **Course Terminée (`flag.race_over`) :** Drapeau à damier final signalant la conclusion de l'événement complet.
- **Non Démarré (`flag.not_started`) :** Drapeau affiché avant le départ d'une manche ou d'une course.
- **Départ en cours (`flag.starting`) :** Drapeau rouge affiché pendant le compte à rebours avant le feu vert.
- **Nouveau Départ (`flag.restarting`) :** Drapeau affiché pendant la relance après un drapeau jaune.
- **Dernier Tour (`flag.one_lap_to_go`) :** Drapeau blanc traditionnel signalant que le leader est dans son dernier tour.
- **Arrivée en cours (`flag.heat_finishing`) :** Drapeau affiché pendant que les autres voitures terminent leur tour après le vainqueur.
- **Échauffement (`flag.warmup`) :** Affiché pendant les séances d'entraînement et d'échauffement des pilotes.
- **Pilote Terminé (`flag.driver_finished`) :** Témoin par voie affiché pour un pilote ayant bouclé tous ses tours.
- **Pénalité (`flag.penalty`) :** Drapeau noir / avertissement lors d'un faux départ ou d'une infraction de temps au tour.

Pour chaque drapeau, vous pouvez choisir des modèles intégrés ou téléverser vos propres images SVG, PNG, WebP ou JPG via le [Gestionnaire de Médias](asset-manager.fr.md).

---

## Feux de Départ {: #countdown }

La section Feux de Départ configure les visuels de lampes utilisés par le Widget Compte à Rebours et les feux sur écran :

- **Lampe Rouge Éteinte (`lamp.red.dim`) :** Feu rouge éteint ou tamisé au repos.
- **Lampe Rouge Allumée (`lamp.red.on`) :** Feu rouge allumé pendant les phases du compte à rebours de départ.
- **Lampe Verte (`lamp.green`) :** Feu vert vif allumé au moment du départ lors de la mise sous tension de la piste.

Ces graphismes s'adaptent automatiquement aux widgets horizontaux et verticaux.

---

## Jauge de Carburant {: #fuel-gauge }

La section Jauge de Carburant configure les ensembles d'images animées pour les simulations de ravitaillement :

- **Jeu d'Images de Jauge (`gauge.fuel`) :** Ensemble d'images séquentielles représentant le niveau de carburant de 100% (plein) à 0% (vide).

Lors d'une course avec gestion du carburant, Race Coordinator AI calcule la consommation en temps réel et met à jour l'image affichée, déclenchant des alertes visuelles en réserve.

---

## Effets Sonores {: #audio }

Les thèmes vous permettent de personnaliser les sons du système, signaux de départ, bips de temps et messages vocaux :

- **Compte à Rebours Départ (`audio.countdown`) :** Bips sonores pendant la phase de départ.
- **Feu Vert / DÉPART (`audio.countdown.green`) :** Tonalité jouée dès que le feu passe au vert.
- **Drapeau Jaune (`audio.yellowflag`) :** Sirènes d'alerte lors d'une interruption de course.
- **Départ Automatique Secondes Restantes (`audio.auto_start`) :** Annonces vocales avant le départ automatique.
- **Temps de Manche Restant (`audio.seconds_left`) :** Annonces vocales régulières du temps restant.
- **Mi-Course (`audio.seconds_left.halfway`) :** Notification à la moitié de la durée ou des tours.
- **Tours Restants Leader (`audio.laps_left`) :** Annonces vocales des tours restants pour le leader.
- **Manche Terminée (`audio.heat_over`) :** Signal sonore à l'arrivée de la manche.
- **Course Terminée (`audio.race_over`) :** Fanfare finale clôturant l'événement complet.
- **Avance Automatique (`audio.auto_advance`) :** Compte à rebours avant le passage à la manche suivante.
- **Temps au Tour Minimal Infringé (`audio.min_lap_time`) :** Tonalité d'alerte en cas d'infraction au temps minimal.

Chaque son peut être configuré sous forme de :
1. **Son Prédéfini :** Effet sonore standard de la bibliothèque intégrée.
2. **Fichier Audio :** Fichier WAV, MP3 ou OGG importé depuis le Gestionnaire de Médias.
3. **Synthèse Vocale (TTS) :** Phrase vocale dynamique avec variables (`{time}`, `{laps}`).

Consultez le guide du [Système Audio](audio.fr.md) pour plus d'informations sur les priorités et le mixage sonore.

---

## Remplacements Audio Pilote {: #driver-audio-overrides }

En temps normal, chaque pilote peut configurer ses propres sons dans l'[Éditeur de Pilotes](driver-editor.fr.md). Cependant, lors de courses de club ou d'événements à thème, un son uniforme pour tous les concurrents est souvent souhaité.

La section **Remplacements Audio Pilote** permet au thème de remplacer de manière centralisée les annonces audio pour l'ensemble des pilotes de la course.

### Remplacements Audio Disponibles

Le thème peut remplacer les 13 événements sonores individuels :

#### Sons Personnels de Tour
- **Tour Bouclé (`lapAudio`) :** Son joué à chaque tour valide d'un pilote.
- **Record Personnel (`bestLapAudio`) :** Son joué quand un pilote bat son meilleur temps de la session.

#### Sons de Tour en Course
- **Meilleur Tour de la Course (`raceBestLapAudio`) :** Son joué pour le meilleur temps absolu de la course en cours toutes voies confondues.
- **Meilleur Tour de Voie en Course (`raceLaneBestLapAudio`) :** Son joué pour le meilleur tour réalisé sur une voie spécifique.
- **Meilleur Tour de Manche (`heatBestLapAudio`) :** Son joué pour le meilleur temps de la manche active.
- **Nouveau Leader de Course (`newRaceLeaderAudio`) :** Message vocal ou fanfare lors de la prise de tête de la course.
- **Nouveau Leader de Manche (`newHeatLeaderAudio`) :** Son joué lors de la prise de la 1ère place de la manche.

#### Sons de Records Absolus
- **Record Absolu du Circuit (`overallBestLapAudio`) :** Son prioritaire signalant un record de piste historique.
- **Record Absolu de Voie (`overallLaneBestLapAudio`) :** Son signalant un record historique sur une voie précise.

#### Sons d'Événements
- **Entrée aux Stands (`pitInAudio`) :** Son à l'entrée de la voie des stands sur circuit numérique.
- **Alerte Carburant (`fuelAudio`) :** Signal sonore ou vocal en réserve ou à sec.
- **Faux Départ / Pénalité (`penaltyAudio`) :** Buzzer lors d'un faux départ ou d'une pénalité.
- **Tour en Dérapage (`driftLapAudio`) :** Effet sonore lors du franchissement de seuils de capteurs de dérive.

### Priorité et Modes de Remplacement

Chaque son de pilote peut être configuré individuellement :

- **Désactivé (Case non cochée) :** Le thème n'intervient pas. Race Coordinator AI utilise le son défini par le pilote (ou le son par défaut).
- **Activé (Case cochée) :** Le thème remplace ce son pour **tous les pilotes** participant à une course avec ce thème.

Quatre modes sont proposés :
1. **Son Prédéfini :** Effet sonore standard de la bibliothèque intégrée.
2. **Fichier Audio :** Fichier personnalisé du Gestionnaire de Médias.
3. **Synthèse Vocale (TTS) :** Phrase personnalisée avec variables dynamiques :
   - `{driver}` — Nom ou surnom du pilote.
   - `{time}` — Temps au tour avec 3 décimales (ex. `3.142`).
   - `{lane}` — Numéro de la voie active.
   - `{lap}` — Nombre de tours bouclés.
   - `{gap}` — Écart de temps avec le leader.
4. **Aucun (Muet) :** Rend l'événement totalement silencieux pour toute la course.

### Réinitialiser Tous les Remplacements

Cliquez sur **Réinitialiser Tous les Remplacements** dans l'en-tête de la section pour annuler tous les remplacements du thème en un seul clic et rendre le contrôle aux profils individuels des pilotes.
