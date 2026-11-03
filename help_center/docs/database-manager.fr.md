# Gestionnaire de Bases de Données

Le **Gestionnaire de Bases de Données** permet d'organiser, de sauvegarder, de restaurer et de basculer entre des bases de données SQLite indépendantes dans Race Coordinator. Chaque base de données conserve une collection distincte de pilotes, d'équipes, de pistes, de courses, d'événements, de championnats, de configurations d'affichage et de ressources multimédias.

---

## Vue d'ensemble {: #overview }

L'écran du Gestionnaire de Bases de Données est divisé en deux sections principales :

1. **Liste des Bases de Données (Barre latérale gauche)** : Affiche tous les fichiers de bases de données disponibles dans votre dossier local. La base active est repérée par un badge **ACTIF**. La sélection d'une base dans la liste charge ses détails et statistiques dans le volet de droite.
2. **Panneau des Détails (Côté droit)** : Affiche des statistiques complètes, les métriques d'espace disque et le contrôle d'activation de la base sélectionnée.
3. **Barre d'Outils du Gestionnaire (En-tête supérieur)** : Propose des actions pour créer, importer, exporter, dupliquer, réinitialiser ou supprimer des bases de données.

---

## Statistiques de la Base de Données {: #database-statistics }

Lorsqu'une base de données est sélectionnée, le panneau **Résumé de la Base de Données** affiche des statistiques en temps réel et l'utilisation du disque :

| Métrique | Description |
| :--- | :--- |
| **Pilotes** | Nombre total de profils de pilotes configurés. |
| **Équipes** | Nombre total d'équipes de course. |
| **Pistes** | Nombre total de configurations de pistes et d'interfaces matérielles. |
| **Courses** | Nombre total de formats de courses et de rotations de segments. |
| **Événements** | Nombre total d'événements à plusieurs étapes. |
| **Championnats** | Nombre total de championnats de saison et de barèmes de points. |
| **Ressources** | Nombre total d'images, de sons, d'ensembles d'images, d'ensembles audio et de rotations. |
| **Historique des Courses** | Nombre d'enregistrements de résultats de courses terminées et espace disque utilisé (en Mo). |
| **Courses Enregistrées** | Nombre de sessions de courses sauvegardées en cours ou en pause et espace disque utilisé (en Mo). |
| **Taille Totale** | La taille réelle du fichier de base de données SQLite sur le disque (en Mo). |

---

## Changer de Base de Données {: #switching-databases }

Race Coordinator fonctionne avec une seule base de données active à la fois. L'état de la base sélectionnée apparaît directement à côté de son nom dans l'en-tête des détails :

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Base Active (Coche verte)** : Indique la base de données actuellement utilisée par le système pour le chronométrage en direct, la gestion des courses et le stockage.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Base Inactive (Coche grise)** : Indique une base de données alternative qui n'est pas active actuellement.

### Comment changer de base

1. Cliquez sur une base de données inactive dans la barre latérale gauche.
2. Dans l'en-tête des détails, cliquez sur le bouton avec la **Coche Grise**.
3. Confirmez le basculement dans la boîte de dialogue.

> [!WARNING]
> Changer de base de données réinitialise immédiatement l'état de la course en cours et recharge toutes les ressources, pilotes et configurations depuis la nouvelle base activée.

---

## Créer une Base de Données {: #creating-a-database }

Pour créer une nouvelle base de données :

1. Cliquez sur le bouton **Ajouter** (<span class="material-icons" style="vertical-align: middle;">add</span>) dans la barre d'outils supérieure.
2. Saisissez un nom unique pour la nouvelle base dans la boîte de dialogue modale.
3. Cliquez sur **OK**. Race Coordinator crée une base SQLite propre initialisée avec le schéma standard et les ressources par défaut.

---

## Copier une Base de Données {: #copying-a-database }

Pour dupliquer une base existante :

1. Sélectionnez la base de données à copier dans la liste latérale.
2. Cliquez sur le bouton **Copier** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>) dans la barre d'outils.
3. Saisissez un nom unique pour le doublon.
4. Cliquez sur **OK**. Tous les pilotes, pistes, courses, championnats, ressources et historiques seront dupliqués dans le nouveau fichier.

---

## Supprimer une Base de Données {: #deleting-a-database }

Pour supprimer définitivement une base de données :

1. Sélectionnez la base de données à supprimer dans la liste latérale.
2. Cliquez sur le bouton **Supprimer** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>) dans la barre d'outils.
3. Confirmez la suppression dans la boîte de dialogue.

> [!NOTE]
> La base de données actuellement active ne peut pas être supprimée. Pour la supprimer, activez d'abord une autre base.

---

## Réinitialisation d'Usine {: #factory-reset }

L'action **Réinitialiser** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) efface toutes les données personnalisées de la base active et restaure la configuration d'usine par défaut :

1. Sélectionnez la base active et cliquez sur le bouton **Réinitialiser** dans la barre d'outils.
2. Examinez les messages d'avertissement et confirmez la réinitialisation.
3. Tous les pilotes, pistes, courses et ressources personnalisés seront remplacés par les valeurs par défaut d'usine.

---

## Sauvegarde et Restauration / Importation & Exportation {: #import-and-export }

### Exportation (Sauvegarde)

Pour créer une archive de sauvegarde portable d'une base de données :

1. Sélectionnez la base de données que vous souhaitez exporter.
2. Cliquez sur le bouton **Exporter** (<span class="material-icons" style="vertical-align: middle;">file_download</span>) dans la barre d'outils.
3. Race Coordinator génère une archive `.zip` horodatée contenant le fichier de base SQLite et toutes les ressources binaires associées.

### Importation (Restauration)

Pour importer une archive de base de données exportée précédemment :

1. Cliquez sur le bouton **Importer** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>) dans la barre d'outils.
2. Sélectionnez une archive `.zip` sur votre ordinateur.
3. Saisissez un nom unique pour la base importée.
4. Race Coordinator extrait et enregistre la base de données dans votre installation locale.
