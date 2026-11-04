# Personnaliser l'interface

La page **Personnaliser l'interface** vous permet de configurer les paramètres système de l'interface, les répertoires des fichiers d'interface et des widgets modulaires personnalisés, les modèles d'exportation de course vers Excel, les animations de transition d'écran ainsi que les réglages du volume général et de la synthèse vocale (TTS).

> [!NOTE]
> Pour concevoir visuellement des écrans de jour de course et des tableaux des scores personnalisés, accédez à l'[Éditeur de disposition](layout-editor.fr.md). Pour configurer des ensembles d'images de drapeaux, de feux de départ et de jauges de carburant ou des effets sonores de course, accédez à l'[Éditeur de thème](theme-editor.fr.md).

---

## Vue d'ensemble {: #overview }

La page de personnalisation de l'interface offre un contrôle centralisé sur les comportements globaux de l'interface et les options audio au niveau de l'application :

- **Portée globale** : Les modifications apportées sur cette page s'appliquent à l'ensemble de l'application et à toutes les sessions de course.
- **Enregistrement automatique continu** : Les réglages de volume, de hauteur vocale, de délais de file d'attente, de répertoires et de transitions prennent effet immédiatement et sont enregistrés automatiquement.
- **Sections extensibles dédiées** : Les réglages sont organisés en sections déroulantes distinctes pour les **Paramètres de personnalisation de l'interface** et les **Paramètres audio**.
- **Prise en charge d'Annuler / Rétablir** : Les modifications effectuées pendant votre session peuvent être rapidement annulées ou rétablies via la barre d'outils.

---

## Actions de la barre d'outils {: #toolbar-actions }

La barre d'outils supérieure fournit les actions essentielles de navigation et de gestion de session :

- **Retour** : Revient à l'écran ou au menu de navigation précédent.
- **Annuler / Rétablir** : Annule ou rétablit les modifications récentes apportées lors de la session actuelle.
- **Aide (?)** : Lance la visite guidée interactive mettant en évidence chaque section et panneau de la page.

---

## Paramètres de personnalisation de l'interface {: #customize-ui-settings }

La section **Paramètres de personnalisation de l'interface** configure les dossiers locaux, les modèles d'exportation vers Excel et les animations de transition d'écran :

### Dossier d'interface personnalisée

Définit un dossier local utilisé pour remplacer les modèles intégrés de l'application et stocker les journaux client si nécessaire :

- **Chemin du dossier** : Affiche le nom du dossier actif et son chemin d'accès absolu. S'il n'est pas défini, l'application utilise les emplacements internes par défaut.
- **Sélectionner un dossier** : Ouvre une boîte de dialogue pour parcourir et sélectionner un répertoire local.
- **Saisir un chemin** : Ouvre une fenêtre modale pour taper ou coller manuellement un chemin d'accès absolu au système de fichiers.
- **Rétablir par défaut** : Efface le chemin personnalisé et rétablit les valeurs par défaut.

> [!WARNING]
> La définition d'un dossier d'interface personnalisé remplace les modèles principaux de l'application et est réservée aux utilisateurs expérimentés développant des interfaces personnalisées ou analysant les journaux.

### Dossier de widgets personnalisés

Configure le répertoire racine dans lequel Race Coordinator AI recherche les [widgets personnalisés](custom-widgets.fr.md) modulaires :

- **Chemin du dossier** : Affiche le nom et le chemin du dossier de widgets personnalisés.
- **Sélectionner un dossier** : Ouvre un sélecteur de dossier pour choisir un répertoire local contenant des packages de widgets.
- **Saisir un chemin** : Saisissez manuellement un chemin de dossier absolu.
- **Exporter les widgets de démarrage** : Copie des packages de widgets d'exemple prêts à l'emploi dans un sous-dossier `sample/` du répertoire sélectionné (incluant `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner` et `sample-detailed-leaderboard`). Ce bouton s'active dès qu'un dossier valide est sélectionné.
- **Rétablir par défaut** : Efface le chemin du dossier des widgets personnalisés.

Pour obtenir toutes les spécifications techniques de création de widgets personnalisés, consultez le [Guide des widgets personnalisés](custom-widgets.fr.md).

### Modèle d'exportation personnalisé

Gère le modèle Microsoft Excel personnalisé (`.xlsx`) utilisé lors de l'exportation des résultats et statistiques de course :

- **État du modèle** : Affiche le nom du fichier du classeur Excel actuellement actif ou indique si le modèle par défaut du système est utilisé.
- **Sélectionner un modèle** : Téléverse un classeur `.xlsx` personnalisé depuis votre ordinateur pour l'intégrer en tant que modèle d'exportation.
- **Télécharger le modèle** : Télécharge le fichier de modèle actif sur votre ordinateur pour l'afficher ou le modifier dans Microsoft Excel.
- **Exportation de test** : Génère et télécharge un fichier d'exportation `.xlsx` d'exemple contenant des résultats fictifs pour vérifier la mise en page, les formules et les graphiques.
- **Variables du modèle** : Ouvre une fenêtre modale répertoriant toutes les balises de remplacement prises en charge (telles que `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}`, etc.) à insérer dans les cellules Excel pour injecter automatiquement les données de course.
- **Rétablir par défaut** : Rétablit le modèle d'exportation Excel standard intégré.

> [!TIP]
> Si vous modifiez votre fichier modèle dans Microsoft Excel ou un autre tableur, téléversez-le à nouveau via **Sélectionner un modèle** pour enregistrer le classeur mis à jour dans Race Coordinator AI. Pour plus de détails, consultez le [Guide d'exportation XLS personnalisée](custom-xls-export.fr.md).

### Transitions de page

Définit le style d'animation visuelle appliqué lors du passage d'un écran à un autre dans l'application :

- **Glissement (Slide)** (Par défaut) : Transition de glissement horizontal fluide entre les pages.
- **Fondu (Fade)** : Fondu d'opacité fluide entre les vues.
- **Zoom** : Transition moderne avec effet d'agrandissement.
- **Retournement (Flip)** : Effet de retournement 3D style carte.
- **Aucune (None)** : Changement de page instantané sans animation (recommandé pour les appareils moins puissants ou les bornes interactives).

---

## Paramètres audio {: #audio-settings }

La section **Paramètres audio** gère le niveau du volume principal, les comportements de file d'attente et la synthèse vocale (TTS) :

### Volume principal

Contrôle le volume sonore global (0 % à 100 %) de toutes les sorties audio dans Race Coordinator AI. Ce curseur ajuste proportionnellement tous les effets sonores, signaux de compte à rebours, avertisseurs sonores et annonces vocales en même temps.

### Délai d'expiration de la file d'attente urgente

Définit le temps pendant lequel les alertes urgentes de haute priorité (telles que *Drapeau jaune*, *Manche terminée* ou *Faux départ*) attendent dans la file d'attente audio si un autre message urgent est déjà en cours de lecture :

- **3 secondes** : Délai court ; supprime rapidement les alertes en attente pour garantir que les notifications restent synchronisées avec la course.
- **5 secondes** (Par défaut) : Durée équilibrée assurant la bonne réception des messages urgents sans retard important par rapport aux événements en direct.
- **10 secondes** : Délai prolongé ; laisse les annonces plus longues se terminer avant d'ignorer les notifications urgentes suivantes.

Les alertes expirées dépassant ce délai sont automatiquement supprimées.

### Espacement des annonces vocales

Configure l'intervalle de silence minimal entre les annonces vocales successives pour éviter les chevauchements ou les coupures :

- **Aucun (0 ms)** : Les annonces successives s'enchaînent immédiatement.
- **Court (500 ms)** (Par défaut) : Courte pause d'une demi-seconde entre les annonces pour un rythme naturel.
- **Normal (1000 ms)** : Pause d'une seconde entre les annonces pour une séparation plus nette.
- **Détendu (1500 ms)** : Pause de 1,5 seconde entre les annonces pour un rythme de commentaire posé.

### Voix de synthèse vocale (TTS)

Sélectionne la voix synthétisée utilisée pour les temps au tour, les positions, les annonces de leader et les alertes de carburant :

- **Par défaut du système** : Utilise la voix de synthèse vocale par défaut du système d'exploitation ou du navigateur.
- **Voix installées** : Liste toutes les voix détectées sur votre système ou navigateur avec leur nom et leur identifiant de langue (par exemple, `fr-FR`, `en-US`).

### Vitesse d'élocution

Règle la vitesse de lecture des annonces TTS à l'aide d'un curseur allant de **0,1x** (très lent) à **2,0x** (vitesse double) par paliers de 0,05. La vitesse par défaut est **1,0x**.

### Hauteur de voix (Pitch)

Règle la hauteur/fréquence vocale des annonces TTS via un curseur allant de **0,0x** (grave) à **2,0x** (aigu) par paliers de 0,05. La hauteur par défaut est **1,0x**.

### Volume de la voix

Curseur de volume indépendant (0 % à 100 %) dédié aux annonces de synthèse vocale. Il permet d'équilibrer le niveau des commentaires parlés par rapport aux effets sonores et aux avertisseurs de compte à rebours.

### Tester la voix

Cliquez sur **Tester la voix** pour entendre un exemple de phrase vocale prononcé avec vos réglages actuels de voix, de vitesse, de tonalité et de volume.
