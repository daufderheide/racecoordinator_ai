# Éditeur de Circuits

L'**Éditeur de Circuits** est l'interface centrale de configuration permettant de modéliser votre piste de slot car physique, de personnaliser les dimensions et couleurs des voies et d'établir la communication avec votre matériel de chronométrage, relais d'alimentation, capteurs et systèmes d'éclairage.

Race Coordinator AI propose une architecture multi-interface avancée permettant d'exploiter simultanément plusieurs contrôleurs de chronométrage et de gestion (tels qu'Arduino, Trackmate, Phidget ou BART) sur un même circuit.

---

## Vue d'Ensemble & Sauvegarde Automatique

L'Éditeur de Circuits est divisé en deux zones de travail synchronisées :

- **Panneau de Gauche (Propriétés Générales & Voies)** : Configurez l'identification du circuit, le nombre de sections, l'échelle physique et les caractéristiques de chaque voie (dimensions, ordre et couleurs). Ajoutez de nouvelles interfaces matérielles au bas de ce panneau.
- **Panneau de Droite (Interfaces Matérielles & Tests Interactifs)** : Configurez les contrôleurs connectés, associez les broches et canaux aux fonctions de la piste, paramétrez les bandeaux LED RGB adressables et testez capteurs et relais en temps réel.

Toutes les modifications effectuées dans l'Éditeur de Circuits sont **automatiquement validées et enregistrées en direct**. Si une configuration invalide est détectée (par exemple un nom vide ou déjà utilisé, ou une broche requise non assignée), l'enregistrement est suspendu et des alertes visuelles mettent en évidence les champs à corriger.

---

## Configuration Générale du Circuit

L'en-tête définit les propriétés fondamentales de votre circuit :

### Nom du Circuit (Track Name)
L'identifiant unique de votre circuit dans la base de données de Race Coordinator AI. Chaque circuit doit posséder un nom distinct.

### Nombre de Sections de Piste (Number of Track Sections)
Définit le nombre de segments qui découpent votre piste. Ce paramètre remplit deux fonctions essentielles :

1. **Attribution des Tours Partiels en Fin de Manche** :
   - La valeur par défaut **100** représente un découpage en pourcentage, permettant aux directeurs de course d'attribuer des tours partiels avec deux décimales de précision (ex. $14{,}65$ tours) selon l'endroit où s'arrête la voiture au signal de fin de manche.
   - Si vous disposez de repères physiques ou de lignes tracées le long de la piste, réglez ce nombre sur le nombre total de repères (ex. 20 repères sur une piste de 18 mètres). Les commissaires notent alors le numéro du dernier repère franchi.
2. **Chronométrage des Temps Intermédiaires / Secteurs** :
   - Lorsque des capteurs intermédiaires sont installés, cette valeur détermine la répartition logique des secteurs du tracé.

### Échelle du Circuit (Track Scale)
Sélectionnez l'échelle de votre circuit dans le menu déroulant :

- **1:1 (Échelle Réelle)**
- **Échelle 1:24** (Grandes voitures de slot car commerciales / carrosseries dures)
- **Échelle 1:32** (Standard des clubs et circuits domestiques, Carrera, Scalextric, Policar)
- **Échelle 1:43** (Circuits compacts analogiques et numériques)
- **Échelle 1:64 (HO)** (Voitures de slot car HO, AFX, Auto World, Tyco)

!!! info "Télémétrie de Vitesse à l'Échelle"
    Race Coordinator AI combine l'**Échelle du Circuit** et la **Longueur de chaque Voie** pour calculer des vitesses authentiques à l'échelle (en km/h ou mph) affichées sur les écrans de classement, les postes de pilotage et les exports XLS.

---

## Configuration des Voies (Lane Configuration)

La section **Éditeur de Voies (Lane Editor)** permet d'ajuster la géométrie, l'ordre sur la grille de départ et l'apparence visuelle de chaque voie.

```
+---------------+-------------------+--------------------+-------------------+
|  Réordonner/X |  Voie # & Long.   |  Couleur de Fond   |  Couleur de Texte |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |      [ Rouge ]     |     [ Blanc ]     |
|  [::]   [X]   |  #2  [ 50.25 ] ft |     [ Blanc ]      |      [ Noir ]     |
|  [::]   [X]   |  #3  [ 52.00 ] ft |      [ Bleu ]      |     [ Blanc ]     |
|  [::]   [X]   |  #4  [ 53.75 ] ft |      [ Jaune ]     |      [ Noir ]     |
+---------------+-------------------+--------------------+-------------------+
```

### Ajouter et Supprimer des Voies
- **Ajouter une Voie (`+`)** : Cliquez sur le bouton **`+`** dans l'en-tête pour ajouter une voie. Des couleurs de contraste adaptées sont assignées automatiquement.
- **Supprimer une Voie (`X`)** : Cliquez sur la croix rouge **`X`** à côté de la voie à retirer. Les interfaces matérielles réajustent automatiquement leurs broches.

### Réorganisation par Glisser-Déposer
Saisissez la poignée de déplacement (**`::`**) pour glisser la voie vers le haut ou le bas. L'ordre des voies est répercuté immédiatement sur les grilles de rotation, les postes de pilotage et les tableaux d'affichage.

### Longueur de Voie (Pieds / Mètres)
Indiquez la longueur physique au centre de chaque voie en **pieds (ft)**.

Sur les circuits sans pont de compensation, les voies intérieures sont plus courtes que les voies extérieures. Renseigner des longueurs précises garantit :
- L'exactitude des vitesses à l'échelle (km/h) pour chaque voie.
- La justesse des distances parcourues et du calcul de consommation de carburant.

!!! tip "Conversion Mètres en Pieds"
    Si votre circuit a été mesuré en mètres, convertissez en pieds :
    
    $$\text{Longueur (pieds)} = \text{Longueur (mètres)} \times 3{,}28084$$
    
    $$(1\text{ pied} = 0{,}3048\text{ mètre})$$

### Couleurs de Voie (Fond & Texte)
Chaque voie dispose de deux sélecteurs de couleur :

- **Couleur de Fond** : Couleur d'identification principale de la voie (ex. Rouge, Blanc, Bleu, Jaune, Orange, Vert, Violet, Noir).
- **Couleur de Texte / Premier Plan** : Couleur de contraste pour les numéros et textes affichés sur la voie.

!!! note "Synchronisation Matérielle des Couleurs"
    Modifier la couleur de fond d'une voie s'applique instantanément aux bandeaux LED FastLED Arduino configurés, accordant les feux de voie et jauges de ravitaillement aux couleurs réelles de votre piste.

---

## Architecture des Interfaces Matérielles

Race Coordinator AI permet d'associer plusieurs équipements de chronométrage en parallèle.

### Prise en Charge Multi-Interface
Vous pouvez combiner différents contrôleurs sur un même circuit :
- Utiliser une carte **Trackmate** pour le comptage optique des tours et la coupure d'alimentation générale.
- Raccorder en même temps un **Arduino** avec le sketch Race Coordinator AI pour piloter une rampe de départ FastLED RGB, des barres de ravitaillement et les feux de drapeau jaune.
- Connecter un boîtier **Phidget** pour les boutons d'interruption (chaos) ou les capteurs de secteurs.

### Onglets d'Interface & Navigation Rapide
Des onglets situés en haut du panneau droit permettent d'accéder d'un clic aux réglages de chaque contrôleur configuré.

### Indicateurs d'État de Connexion en Direct
Chaque carte d'interface affiche son statut en temps réel :

| Statut | Signification | Action |
| :--- | :--- | :--- |
| **Connecté** (Vert) | Communication active et flux de données bidirectionnel établi. | Prêt pour la course et les tests interactifs. |
| **Aucune Donnée** (Ambre) | Périphérique détecté sur le port mais aucun signal ni heartbeat. | Vérifier la vitesse en bauds, le câble USB ou le sketch. |
| **Déconnecté** (Gris / Rouge) | Matériel introuvable, port fermé ou absence d'alimentation. | Vérifier le port COM, le câble USB et l'alimentation. |

---

## Interfaces Matérielles Prises en Charge

### 1. Interface Arduino

L'interface **Arduino** est la solution la plus adaptable. Avec une carte Arduino Uno, Mega ou compatible, vous gérez le comptage des tours, les relais d'alimentation, les boutons de pause, les temps intermédiaires, la télémétrie de poignée et les LED RGB adressables FastLED.

#### Types de Cartes
- **Arduino Uno** : Idéal pour 2 à 4 voies (14 broches numériques 2–13 et 6 entrées analogiques A0–A5).
- **Arduino Mega 2560** : Recommandé pour 6 à 8 voies, chronométrage de plusieurs secteurs ou installations d'éclairage LED complexes (54 broches numériques 2–53 et 16 entrées analogiques A0–A15).

#### Connexion & Compatibilité des Firmware
- **Port Série COM** : Port USB attribué par votre système d'exploitation.
- **Vitesse** : `115200` bauds recommandé.
- **Compatibilité des Sketches** :
    - **Sketch Race Coordinator AI (`v2.1.0.x`)** : Gère l'ensemble des fonctionnalités modernes (FastLED RGB, ponts diviseurs de tension et télémétrie temps réel).
    - **Sketch Classique Race Coordinator 1.0 (`v1.0.0.x`)** : Rétrocompatible pour les tours, relais et boutons. Les réglages LED FastLED sont désactivés avec une bulle explicative.

#### Filtrage Antirebond / Debounce ($\mu\text{s}$)
Définit la durée d'antirebond en **microsecondes** ($1\text{ ms} = 1000\,\mu\text{s}$). Les micro-oscillations électriques sont ignorées.
- Capteurs optiques infrarouges ou phototransistors : **100 à 500 $\mu\text{s}$**.
- Pistes de contact (dead strips) ou ampoules reed : **1000 à 5000 $\mu\text{s}$**.

#### Inversion Logique (Normalement Fermé / NC)
- **Capteurs de Voie Normalement Fermés (NC)** : À activer si le capteur délivre un niveau haut au repos et passe à l'état bas au passage d'une voiture (cas typique des cellules photoélectriques). À désactiver sur dead strips ou reeds.
- **Relais Normalement Fermés (NC)** : À activer si le relais s'excite pour couper l'alimentation et retombe au repos pour alimenter la piste. Garantit que la piste reste sous tension même si l'ordinateur est éteint.

#### Comportement Stand sur Broche de Tour
Permet au capteur de ligne d'assurer le ravitaillement en course avec essence :
- **Aucun (None)** : Comptage de tour standard uniquement.
- **Entrée Stand (Pit In)** : Déclenche le ravitaillement.
- **Sortie Stand (Pit Out)** : Clôture le ravitaillement.
- **Entrée/Sortie (Pit In/Out)** : Le passage déclenche le ravitaillement ; à la reprise de course, le passage suivant est compté comme tour normal.

#### Affectation des Broches Numériques & Analogiques
- **Comptage des Tours** : Détection de passage par voie.
- **Alimentation** : Relais principal (Master Relay) et relais individuels par voie (Lane Relays).
- **Contrôle de Course** : Bouton d'arrêt d'urgence global ou par poste de pilotage.
- **Temps & Stands** : Capteurs de secteurs et d'entrée/sortie de voie des stands.
- **Éclairage RGB** : Broche de données pour bandeaux LED adressables.

!!! tip "Tests Matériels Interactifs"
    Chaque sélecteur de broche comporte un **Indicateur d'État en Direct** :
    - **Entrées (Capteurs/Boutons)** : Déclencher un capteur allume l'indicateur en vert vif pendant 500 ms.
    - **Sorties (Relais)** : Cliquer sur l'indicateur bascule physiquement le relais pour tester le câblage.

#### Ponts Diviseurs & Télémétrie d'Accélération
Permet de mesurer la tension des poignées ($0\text{--}5\text{V}$) pour les courses avec carburant numérique :
- **Indicateur en Direct** : Valeur analogique brute ($0\text{--}1023$).
- **Tension Maximale** : Valeur correspondant à 100% de gaz.
- **« Régler Max sur Indicateur »** : Enregistre le pic mesuré lors d'une pression à fond sur la gâchette.
- **Lier les Voies** : Applique le calibrage à l'ensemble des voies en une seule opération.

#### Éclairage LED RGB Adressable (FastLED)
1. **Paramétrage du Bandeau** : Broche de signal, nombre de LED, luminosité ($0\text{--}255$), fréquence de clignotement et ordre des couleurs (`GRB`, `RGB`, etc.).
2. **Affectation des Fonctions par LED** :
   - **Feux de Départ** : Compte à rebours par étapes, Vert de départ et Rouge de faux départ.
   - **Feux de Drapeau** : Vert (course active), Jaune clignotant (chaos), Rouge/Damier (manche finie).
   - **Alimentation de Voie** : S'allume de la couleur de la voie tant que la tension est active.
   - **Jauge de Ravitaillement** : Segment de LED qui se remplit au fur et à mesure du plein en stand.
   - **Leader de Manche** : Éclairage de la couleur du pilote menant la manche en cours.
   - **Flash de Tour** : Clignotement de la couleur de la voie à chaque passage de ligne.

---

### 2. Interface Trackmate

Gestion native des cartes Trackmate branchées via port série COM (USB ou RS-232).

- **Antirebond (Niveaux 1 à 4)** : Filtrage matériel (niveau 2 ou 3 recommandé pour le 1:32 et 1:24).
- **Logique Normalement Fermée** : Inversion pour cellules infrarouges et relais.
- **Relais par Voie** : À activer si votre carte comporte des relais indépendants par voie.
- **8 Canaux de Capteurs** : Attribution des 8 entrées physiques aux voies ou stands.
- **Test des Relais** : Boutons de commutation manuelle dans l'interface.
- **Bouton d'Arrêt de Course** : Entrée dédiée avec voyant d'activité en direct.

---

### 3. Interface Phidget

Prise en charge des boîtiers d'E/S USB et VINT de Phidgets (InterfaceKit 0/16/16, 8/8/8, relais 1014 et hubs VINT).

- **Détection Automatique** : Identification par Numéro de Série et Port de Hub VINT.
- **Entrées Numériques** : Canaux opto-isolés pour tours, drapeaux et secteurs avec indicateurs en direct.
- **Sorties Numériques / Relais** : Commande des relais de coupure générale ou par voie.
- **Entrées Analogiques** : Surveillance de tension pour le carburant numérique.
- **Inversion des Polarités** : Réglage indépendant pour capteurs et relais.

!!! warning "Pilotes Phidget22 Indispensables"
    Nécessite l'installation préalable des bibliothèques **Phidget22** officielles sur votre ordinateur.

---

### 4. Interface BART (Chronomètre Bluetooth Policar)

Liaison sans fil avec les ponts de détection et transpondeurs Policar BART Bluetooth Low Energy (BLE).

- **Recherche BLE Sans Fil** : Détection automatique des boîtiers Bluetooth sans configuration de port COM.
- **Canaux Matériels (jusqu'à 32)** : Attribution directe aux voies et aux stands.
- **Filtre de Temps de Tour Minimal (ms)** : Seuil matériel éliminant les déclenchements parasites.
- **Indicateur d'Activité en Direct** : Confirmation visuelle instantanée lors de chaque passage.

---

### 5. Interface Démo / Simulation

Permet de tester vos formats de course, rotations, thèmes visuels, annonces vocales et classements sans aucun matériel raccordé.

- **Simulation Réaliste** : Génère des chronos plausibles, des écarts de course et des arrêts aux stands virtuels selon la configuration de vos voies.
- **Prêt à l'Emploi** : Fonctionne immédiatement sur tout circuit.

---

## Utilisation de l'Éditeur & Barre d'Outils

- **Annuler (`Ctrl+Z`) / Rétablir (`Ctrl+Y`)** : Historique complet pour rétablir facilement tout changement.
- **Enregistrer sous (Dupliquer le Circuit)** : Crée une copie conforme sous un nouveau nom, idéal pour tester des variantes sans altérer le circuit principal.
- **Visite Guidée** : Cliquez sur le bouton d'aide (**`?`**) pour lancer une visite interactive de chaque élément à l'écran.

---

## Dépannage Matériel Fréquent

### Alimentation Inversée (Relais à l'Envers)
- **Symptôme** : La piste est alimentée sous drapeau jaune et se coupe sous drapeau vert.
- **Solution** : Cochez ou décochez la case **Relais Normalement Fermés (Normally Closed Relays)**.

### Ravitaillement Sans Fin
- **Symptôme** : Les voitures se mettent à ravitailler sans arrêt dès qu'elles sont sur la piste.
- **Solution** : Changez l'état de la case **Capteurs de Voie Normalement Fermés (Normally Closed Lane Sensors)**.

### Tours Doubles ou Passages Manqués
- **Solution** : Augmentez l'antirebond (Debounce) en cas de doubles comptages ; diminuez-le si des voitures très rapides ne sont pas détectées, et vérifiez l'alignement des cellules optiques.

### Bandeaux LED FastLED Éteints
- **Solution** : Vérifiez que l'Arduino utilise le **sketch officiel `v2.1.0.x`**, que le type de LED et l'ordre des couleurs sont exacts, et que la masse (GND) de l'alimentation 5V externe est reliée à la masse de l'Arduino.
