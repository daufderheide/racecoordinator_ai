# Symbolleisten-Aktionen

Die **Editor-Symbolleiste** bietet eine einheitliche und standardisierte Steuerung für alle Verwaltungsmasken in Race Coordinator AI, einschließlich der Editoren für Fahrer, Teams, Strecken, Rennen, Layouts, Themes und Datenbanken.

## Übersicht {: #overview }

Die Symbolleiste standardisiert den Ablauf über alle Editoren hinweg:

- **Schreibgeschützter Modus**: Beim Öffnen eines Editors sind Felder gesperrt, um unbeabsichtigte Änderungen zu verhindern. Sie können Eigenschaften einsehen, Töne testen und Einstellungen sicher prüfen.
- **Bearbeitungsmodus**: Ein Klick auf das **Bearbeiten**-Symbol (Stift) schaltet die Eingabefelder frei. Währenddessen ist das obere Auswahlmenü gesperrt, um ungespeicherte Arbeit zu schützen.
- **Speichern & Beenden**: Ein Klick auf **Fertig** (Häkchen) prüft Änderungen, speichert sie in der lokalen SQLite-Datenbank und wechselt zurück in den schreibgeschützten Modus.

## Symbol-Referenz {: #icons }

Nachfolgend finden Sie eine vollständige Übersicht aller Aktionen der Symbolleiste:

### Bearbeiten / Fertig {: #edit }
- **Symbole**: `edit` (Stift) / `check` (Häkchen)
- **Tastenkürzel**: `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Beschreibung**: Schaltet zwischen Lese- und Bearbeitungsmodus um. Im Bearbeitungsmodus werden Änderungen beim Klick auf das Häkchen gespeichert.

### Neu erstellen {: #add }
- **Symbol**: `add` (Plus)
- **Beschreibung**: Erstellt ein neues leeres Element und wechselt sofort in den Bearbeitungsmodus.

### Duplizieren {: #copy }
- **Symbol**: `content_copy` (Dokumente)
- **Beschreibung**: Erstellt eine exakte Kopie des ausgewählten Elements unter einem neuen Namen.

### Löschen {: #delete }
- **Symbol**: `delete` (Mülleimer)
- **Beschreibung**: Löscht das ausgewählte Element nach Bestätigung dauerhaft.

### Rückgängig machen {: #undo }
- **Symbol**: `undo` (Pfeil gegen den Uhrzeigersinn)
- **Tastenkürzel**: `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Beschreibung**: Macht die letzte Änderung der aktuellen Bearbeitungssitzung rückgängig.

### Wiederholen {: #redo }
- **Symbol**: `redo` (Pfeil im Uhrzeigersinn)
- **Tastenkürzel**: `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` oder `Ctrl+Y` (Windows/Linux)
- **Beschreibung**: Stellt eine zuvor rückgängig gemachte Änderung wieder her.

### Alle ein-/ausklappen {: #expand-collapse }
- **Symbol**: `unfold_more` / `unfold_less` (vertikale Pfeile)
- **Beschreibung**: Klappt alle Akkordeon-Bereiche des Editors gleichzeitig ein oder aus.

### Aktivieren {: #activate }
- **Symbol**: `check_circle` (Häkchen im Kreis)
- **Beschreibung**: Setzt das ausgewählte Theme als aktives Design für Rennsitzungen.

### Importieren {: #import }
- **Symbol**: `download` / `file_upload` (Pfeil nach unten)
- **Beschreibung**: Öffnet einen Dateidialog zum Importieren von Profilen oder Datenbanken aus externen Dateien (`.json`, `.zip`, `.csv`).

### Exportieren {: #export }
- **Symbol**: `upload` / `file_download` (Pfeil nach oben)
- **Beschreibung**: Exportiert die aktuelle Konfiguration oder Datenbank in ein Archiv (`.zip`, `.xlsx`, `.csv`).

### Werkseinstellungen wiederherstellen {: #reset }
- **Symbol**: `restart_alt` (Reset-Pfeil)
- **Beschreibung**: Setzt die aktuelle Datenbank oder Konfiguration auf die Werkseinstellungen zurück.

### Layout leeren {: #clear }
- **Symbol**: `delete_sweep` (Besen)
- **Beschreibung**: Leert die Arbeitsfläche im Layout-Editor vollständig.

### Heats neu generieren {: #regenerate }
- **Symbol**: `sync` (rotierende Pfeile)
- **Beschreibung**: Berechnet die Heat-Rotationen und Spurzuteilungen neu.

### Spurgleichheits-Prüfung {: #lane-check }
- **Symbol**: `check` (Häkchen / Waage)
- **Beschreibung**: Überprüft, ob alle Spuren über alle Heats hinweg gleichmäßig belegt sind.

### Zoom-Steuerung {: #zoom }
- **Symbole**: `zoom_in` / `zoom_out` mit Schieberegler
- **Beschreibung**: Vergrößert oder verkleinert die Layout-Arbeitsfläche stufenlos zwischen 50% und 150%.

### Nutzungsanalyse (Analytics) {: #analytics }
- **Symbol**: `analytics` (Balkendiagramm)
- **Beschreibung**: Aktiviert oder deaktiviert anonyme Telemetrie- und Fehlerberichte.

### Geführte Tour (Hilfe) {: #help }
- **Symbol**: `lightbulb` (Glühbirne)
- **Beschreibung**: Startet eine interaktive Schritt-für-Schritt-Führung durch die aktuelle Seite.

