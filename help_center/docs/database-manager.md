# Database Manager

The **Database Manager** enables organizing, backing up, restoring, and switching between isolated SQLite databases in Race Coordinator. Each database maintains an independent collection of drivers, teams, tracks, races, events, seasons, custom UI layouts, and multimedia assets.

---

## Overview {: #overview }

The Database Manager screen is organized into two primary sections:

1. **Database List (Left Sidebar)**: Displays all available database files stored in your local application directory. The active database is highlighted with an **ACTIVE** badge. Selecting any database from the list loads its details and statistics into the right-hand panel.
2. **Detail Panel (Right Side)**: Displays comprehensive statistics, storage metrics, and the activation control for the currently selected database.
3. **Manager Toolbar (Top Header)**: Provides actions to create, import, export, duplicate, reset, or delete databases.

---

## Database Statistics {: #database-statistics }

When a database is selected from the list, the **Database Summary** panel displays real-time statistics and disk space utilization:

| Metric | Description |
| :--- | :--- |
| **Drivers** | Total number of configured driver profiles. |
| **Teams** | Total number of racing teams. |
| **Tracks** | Total number of track configurations and hardware setups. |
| **Races** | Total number of configured race formats and heat rotations. |
| **Events** | Total number of multi-round events. |
| **Seasons** | Total number of season championships and scoring setups. |
| **Assets** | Total number of images, audio clips, image sets, audio sets, and rotations. |
| **Race Records** | Number of completed race result records and their disk storage size (in MB). |
| **Saved Races** | Number of in-progress or paused saved race sessions and their storage size (in MB). |
| **Total Size** | The physical size of the SQLite database file on disk (in MB). |

---

## Switching Databases {: #switching-databases }

Race Coordinator operates on one active database at a time. The status of the selected database is displayed directly next to its name in the detail header:

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Active Database (Green Checkmark)**: Indicates the database currently in use by the system for live timing, race operations, and data storage.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Inactive Database (Grey Checkmark)**: Indicates an alternative database that is not currently active.

### How to Switch

1. Click any inactive database in the left sidebar list.
2. In the detail header, click the **Grey Checkmark** button.
3. Confirm the switch in the confirmation dialog.

> [!WARNING]
> Switching databases immediately resets the active race session state and reloads all cached assets, drivers, and track configurations from the newly activated database.

---

## Creating a Database {: #creating-a-database }

To create a brand-new database:

1. Click the **Add** (<span class="material-icons" style="vertical-align: middle;">add</span>) button on the top toolbar.
2. Enter a unique name for the new database in the modal dialog.
3. Click **OK**. Race Coordinator creates a fresh SQLite database initialized with standard schema and default assets.

---

## Copying a Database {: #copying-a-database }

To clone an existing database:

1. Select the database you wish to copy from the sidebar list.
2. Click the **Copy** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>) button on the toolbar.
3. Enter a unique name for the duplicate.
4. Click **OK**. All drivers, tracks, races, seasons, assets, and history records will be cloned into the new database file.

---

## Deleting a Database {: #deleting-a-database }

To permanently remove a database:

1. Select the database you wish to delete from the sidebar list.
2. Click the **Delete** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>) button on the toolbar.
3. Confirm the deletion in the modal dialog.

> [!NOTE]
> The currently active database cannot be deleted. To delete an active database, first switch to another database.

---

## Factory Reset {: #factory-reset }

The **Reset** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) action wipes all custom data from the currently active database and restores the factory defaults:

1. Select the active database and click the **Reset** button on the toolbar.
2. Review the high-visibility warning modals and confirm the reset.
3. All custom drivers, tracks, races, and assets will be replaced with clean factory defaults.

---

## Backup and Restore / Import & Export {: #import-and-export }

### Exporting (Backup)

To create a portable backup archive of a database:

1. Select the database you wish to export.
2. Click the **Export** (<span class="material-icons" style="vertical-align: middle;">file_download</span>) button on the toolbar.
3. Race Coordinator generates a timestamped `.zip` archive containing the SQLite database file and all stored binary assets.

### Importing (Restore)

To import a previously exported database archive:

1. Click the **Import** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>) button on the toolbar.
2. Select a `.zip` archive from your computer.
3. Enter a unique name for the imported database.
4. Race Coordinator extracts and registers the database into your local installation.
