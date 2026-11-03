# Datenbankmanager

Der **Datenbankmanager** ermöglicht das Organisieren, Sichern, Wiederherstellen und Wechseln zwischen isolierten SQLite-Datenbanken in Race Coordinator. Jede Datenbank enthält eine eigenständige Sammlung von Fahrern, Teams, Strecken, Rennen, Veranstaltungen, Meisterschaften, benutzerdefinierten UI-Layouts und Multimedia-Assets.

---

## Übersicht {: #overview }

Der Datenbankmanager-Bildschirm ist in zwei Hauptbereiche unterteilt:

1. **Datenbankliste (Linke Seitenleiste)**: Zeigt alle verfügbaren Datenbankdateien an, die in Ihrem lokalen Anwendungsverzeichnis gespeichert sind. Die aktive Datenbank ist mit einem **AKTIV**-Kennzeichen versehen. Durch Auswählen einer Datenbank aus der Liste werden deren Details und Statistiken im rechten Bereich geladen.
2. **Detailbereich (Rechte Seite)**: Zeigt umfassende Statistiken, Speichermetriken und die Aktivierungssteuerung für die aktuell ausgewählte Datenbank an.
3. **Manager-Symbolleiste (Oberer Header)**: Bietet Aktionen zum Erstellen, Importieren, Exportieren, Duplizieren, Zurücksetzen oder Löschen von Datenbanken.

---

## Datenbankstatistiken {: #database-statistics }

Wenn eine Datenbank aus der Liste ausgewählt wird, zeigt das Panel **Datenbankzusammenfassung** Echtzeitstatistiken und die Festplattenauslastung an:

| Metrik | Beschreibung |
| :--- | :--- |
| **Fahrer** | Gesamtzahl der konfigurierten Fahrerprofile. |
| **Teams** | Gesamtzahl der Rennteams. |
| **Strecken** | Gesamtzahl der Streckenkonfigurationen und Hardware-Setups. |
| **Rennen** | Gesamtzahl der konfigurierten Rennformate und Durchgangsrotationen. |
| **Veranstaltungen** | Gesamtzahl der mehrteiligen Veranstaltungen. |
| **Meisterschaften** | Gesamtzahl der Meisterschaften und Punktesysteme. |
| **Assets** | Gesamtzahl der Bilder, Audioclips, Bildersets, Audiosets und Rotationen. |
| **Renndatensätze** | Anzahl der abgeschlossenen Rennergebnisdatensätze und deren Speichergröße (in MB). |
| **Gespeicherte Rennen** | Anzahl der laufenden oder pausierten gespeicherten Rennsitzungen und deren Speichergröße (in MB). |
| **Gesamtgröße** | Die physische Größe der SQLite-Datenbankdatei auf der Festplatte (in MB). |

---

## Datenbanken wechseln {: #switching-databases }

Race Coordinator arbeitet jeweils mit einer aktiven Datenbank. Der Status der ausgewählten Datenbank wird direkt neben ihrem Namen im Header des Detailbereichs angezeigt:

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Aktive Datenbank (Grünes Häkchen)**: Kennzeichnet die Datenbank, die derzeit vom System für Zeitmessung, Rennbetrieb und Datenspeicherung verwendet wird.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Inaktive Datenbank (Graues Häkchen)**: Kennzeichnet eine alternative Datenbank, die derzeit nicht aktiv ist.

### So wechseln Sie

1. Klicken Sie in der linken Seitenleiste auf eine inaktive Datenbank.
2. Klicken Sie im Detail-Header auf das **Graue Häkchen**.
3. Bestätigen Sie den Wechsel im Bestätigungsdialog.

> [!WARNING]
> Durch das Wechseln der Datenbank wird der aktuelle Rennsitzungsstatus sofort zurückgesetzt und alle zwischengespeicherten Assets, Fahrer und Streckenkonfigurationen werden aus der neu aktivierten Datenbank neu geladen.

---

## Datenbank erstellen {: #creating-a-database }

So erstellen Sie eine neue Datenbank:

1. Klicken Sie in der oberen Symbolleiste auf die Schaltfläche **Hinzufügen** (<span class="material-icons" style="vertical-align: middle;">add</span>).
2. Geben Sie im modalen Dialog einen eindeutigen Namen für die neue Datenbank ein.
3. Klicken Sie auf **OK**. Race Coordinator erstellt eine frische SQLite-Datenbank, die mit dem Standardschema und Standard-Assets initialisiert wird.

---

## Datenbank kopieren {: #copying-a-database }

So klonen Sie eine vorhandene Datenbank:

1. Wählen Sie die zu kopierende Datenbank aus der Seitenleiste aus.
2. Klicken Sie in der Symbolleiste auf die Schaltfläche **Kopieren** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>).
3. Geben Sie einen eindeutigen Namen für das Duplikat ein.
4. Klicken Sie auf **OK**. Alle Fahrer, Strecken, Rennen, Meisterschaften, Assets und Verlaufsdatensätze werden in die neue Datenbankdatei kopiert.

---

## Datenbank löschen {: #deleting-a-database }

So entfernen Sie eine Datenbank dauerhaft:

1. Wählen Sie die zu löschende Datenbank aus der Seitenleiste aus.
2. Klicken Sie in der Symbolleiste auf die Schaltfläche **Löschen** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>).
3. Bestätigen Sie den Löschvorgang im modalen Dialog.

> [!NOTE]
> Die aktuell aktive Datenbank kann nicht gelöscht werden. Um eine aktive Datenbank zu löschen, wechseln Sie zuerst zu einer anderen Datenbank.

---

## Werkseinstellungen wiederherstellen {: #factory-reset }

Die Aktion **Zurücksetzen** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) löscht alle benutzerdefinierten Daten aus der aktuell aktiven Datenbank und stellt die Werkseinstellungen wieder her:

1. Wählen Sie die aktive Datenbank aus und klicken Sie in der Symbolleiste auf die Schaltfläche **Zurücksetzen**.
2. Überprüfen Sie die Warnhinweise und bestätigen Sie das Zurücksetzen.
3. Alle benutzerdefinierten Fahrer, Strecken, Rennen und Assets werden durch saubere Werkseinstellungen ersetzt.

---

## Sicherung und Wiederherstellung / Import & Export {: #import-and-export }

### Exportieren (Sicherung)

So erstellen Sie ein tragbares Sicherungsarchiv einer Datenbank:

1. Wählen Sie die zu exportierende Datenbank aus.
2. Klicken Sie in der Symbolleiste auf die Schaltfläche **Exportieren** (<span class="material-icons" style="vertical-align: middle;">file_download</span>).
3. Race Coordinator erstellt ein mit einem Zeitstempel versehenes `.zip`-Archiv, das die SQLite-Datenbankdatei und alle gespeicherten Binär-Assets enthält.

### Importieren (Wiederherstellung)

So importieren Sie ein zuvor exportiertes Datenbankarchiv:

1. Klicken Sie in der Symbolleiste auf die Schaltfläche **Importieren** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>).
2. Wählen Sie ein `.zip`-Archiv von Ihrem Computer aus.
3. Geben Sie einen eindeutigen Namen für die importierte Datenbank ein.
4. Race Coordinator entpackt und registriert die Datenbank in Ihrer lokalen Installation.
