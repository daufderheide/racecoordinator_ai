# Thèmes

!!! note "Contenu en cours de rédaction"
    Cet article est en cours de développement. Le contenu complet sera disponible prochainement.

## Thèmes

Chaque thème regroupe des éléments visuels (drapeaux, feux de départ, jauges de carburant), des annonces audio et des affectations de mise en page :

- **Disposition d'interface personnalisée :** La disposition d'écran associée chargée pendant la course.
- **Thème du poste de pilote :** Le thème utilisé lors de l'ouverture ou du scan d'une fenêtre ou d'un appareil de poste de pilote à voie unique.
- **Thème de la vue pilote :** Le thème utilisé lors de l'ouverture ou du scan de la fenêtre du calendrier de la vue pilote ou d'un affichage sur appareil personnel.

## Audio

Les thèmes vous permettent de personnaliser les effets sonores et annonces vocales pour les événements de course :

- **Compte à rebours de départ :** Sons joués pendant la séquence de départ (`audio.countdown`).
- **Feu vert / PARTEZ :** Tonalité jouée lorsque les feux passent au vert (`audio.countdown.green`).
- **Drapeau jaune :** Sirènes d'alerte lors d'une neutralisation (`audio.yellowflag`).
- **Secondes restantes avant démarrage automatique :** Annonces du compte à rebours pour le temps restant avant le démarrage automatique d'une manche (`audio.auto_start`).
- **Temps de manche (Secondes restantes) :** Annonces du temps restant dans la manche (`audio.seconds_left`).
- **Tours du meneur (Tours restants) :** Annonces des tours restants pour le meneur de la manche (`audio.laps_left`).
- **Mi-manche :** Annonce du cap de la mi-course dans une manche — aussi bien pour les courses au temps (mi-durée écoulée) que pour les courses au nombre de tours (lorsque le meneur franchit la moitié des tours requis) (`audio.seconds_left.halfway`).
- **Manche et course terminées :** Signaux marquant la fin d'une manche (`audio.heat_over`) ou de la course (`audio.race_over`).
- **Secondes restantes avant passage automatique :** Annonces du compte à rebours pour le temps restant avant le passage automatique à la manche suivante (`audio.auto_advance`).
- **Alertes d'infraction :** Tonalités en cas de temps au tour trop court (`audio.min_lap_time`).

Pour plus de détails sur l'atténuation automatique, les priorités et le filtrage multi-écrans, consultez la documentation du [Système Audio](audio.md).

## Remplacements audio du pilote

Les thèmes peuvent remplacer les paramètres audio individuels des pilotes pour tous les participants lorsque le thème est actif. Par défaut, les sons personnalisés de chaque pilote (configurés dans l'[Éditeur de pilotes](driver-editor.md)) sont joués pendant leurs événements de course. Cependant, un thème peut remplacer sélectivement l'un des 13 événements audio du pilote :

- **Sons de tours personnels :** Tour effectué (`lapAudio`), Meilleur tour personnel (`bestLapAudio`).
- **Sons de tours de course :** Meilleur tour de course (`raceBestLapAudio`), Meilleur tour de voie de course (`raceLaneBestLapAudio`), Meilleur tour de manche (`heatBestLapAudio`), Nouveau meneur de course (`newRaceLeaderAudio`), Nouveau meneur de manche (`newHeatLeaderAudio`).
- **Sons de meilleur tour général :** Meilleur tour général (`overallBestLapAudio`), Meilleur tour de voie général (`overallLaneBestLapAudio`).
- **Sons d'événements :** Arrêt au stand (`pitInAudio`), Niveau de carburant (`fuelAudio`), Faux départ / Pénalité (`penaltyAudio`), Tour de drift (`driftLapAudio`).

### Hiérarchie de remplacement et configuration
- **Désactivé (Par défaut) :** Le thème ne modifie pas l'emplacement ; la configuration individuelle du pilote est utilisée.
- **Remplacement activé :** Le thème prend la priorité pour cet événement sonore spécifique pour tous les pilotes sous ce thème. Vous pouvez le configurer comme un **Son prédéfini**, un **Fichier audio importé**, une phrase de **Synthèse vocale (TTS)** personnalisée ou **Aucun** (pour désactiver le son sur tout le thème).
- **Réinitialiser tous les remplacements :** Efface rapidement tous les remplacements actifs du thème, redonnant le contrôle total aux paramètres de chaque pilote.
