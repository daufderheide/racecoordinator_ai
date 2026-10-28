# Layout-Editor

Der **Layout-Editor** bietet eine dedizierte Vollbild-Oberfläche zum Anpassen, Organisieren und Entwerfen visueller Bildschirmlayouts für Race Coordinator AI. Er teilt dieselbe vereinheitlichte Symbolleiste, Objektauswahl, Schreibschutz-Logik und den Bearbeitungsmodus-Lebenszyklus wie die Fahrer-, Strecken- und Renn-Editoren.

---

## Übersicht & Navigation

Der Layout-Editor kann an mehreren Stellen in der Anwendung aufgerufen werden:

- **Renntag-Setup-Symbolleiste**: Wählen Sie **Konfig > Layout-Editor** (`/layout-editor` oder `/layout-manager`).
- **UI-Editor**: Klicken Sie auf **Layout-Editor öffnen** im Bereich "UI-Layouts" des UI-Editors (`/ui-editor`).

### Schreibgeschützter Modus und Bearbeitungsmodus

- **Schreibgeschützter Modus (Standard)**: Layouteigenschaften, Canvas-Widgets, Dimensionen und Inspector-Felder sind vor versehentlichen Änderungen geschützt.
- **Bearbeitungsmodus**: Durch Klicken auf das Stiftsymbol (**Bearbeiten**) in der Symbolleiste werden der Layout-Canvas, die Zoom-Steuerung, das Neupositionieren/Größenändern von Widgets und die Inspector-Bearbeitung freigeschaltet.
- **Automatisches Speichern & Validierung**: Beim Beenden des Bearbeitungsmodus werden Änderungen validiert (z. B. Sicherstellen eines eindeutigen, nicht leeren Layout-Namens) und gespeichert. Ungültige Konfigurationen warnen den Benutzer und halten den Editor im Bearbeitungsmodus.
- **Änderungen verwerfen**: Beim Verlassen oder Navigieren mit ungespeicherten Änderungen wird das standardmäßige Bestätigungs-Modal angezeigt, um Datenverlust zu verhindern.
- **Rückgängig / Wiederholen**: Vollständig integriert mit Standard-Tastenkombinationen (<kbd>Strg</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> und <kbd>Strg</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Symbolleisten-Aktionen

Die obere Symbolleiste bietet standardisierte Verwaltungsaktionen:

- **Layout-Auswahl**: Dropdown-Menü zur Auswahl eines beliebigen System- oder benutzerdefinierten Layouts, natürlich sortiert mit lokalisierten Standardnamen (*Standard Renntag-UI*, *Standard Trainings-UI*, *Standard Fahrerstand-UI*).
- **Bearbeiten / Fertig**: Schaltet zwischen schreibgeschütztem Modus und Bearbeitungsmodus um.
- **Layout hinzufügen (<span class="material-icons">add</span>)**: Erstellt eine neue Layout-Vorlage basierend auf dem System-Standardlayout.
- **Layout kopieren (<span class="material-icons">content_copy</span>)**: Dupliziert das aktuell ausgewählte Layout unter einem eindeutigen Namen (z. B. *Layout-Name (Kopie)*).
- **Layout löschen (<span class="material-icons">delete</span>)**: Löscht das aktuelle benutzerdefinierte Layout nach Bestätigung. Standard-Systemlayouts sind geschützt und können nicht gelöscht werden.
- **Geführte Tour (<span class="material-icons">help_outline</span>)**: Startet eine interaktive geführte Tour zur Erklärung der Layoutauswahl, Symbolleiste, Arbeitsfläche und des Widget-Inspectors.

---

## Arbeitsfläche & Auflösungssteuerung

In der Steuerleiste unterhalb der Symbolleiste:

### Seitenverhältnis & Auflösungs-Voreinstellungen
Wählen Sie ein Seitenverhältnis-Preset (**16:9**, **16:10**, **4:3**, **21:9**, **Benutzerdefiniert**), um die Basisdimensionen der Arbeitsfläche (z. B. 1920×1080, 1920×1200, 1440×1080) automatisch zu skalieren.

### Skalierungsmodi
- **Automatisch einpassen (Uniform Scale)**: Behält das Seitenverhältnis der Widgets bei und passt sie an den Zielbildschirm an.
- **Auf Bildschirm dehnen (Stretch)**: Dehnt Widgets unabhängig über Breite und Höhe.
- **Fest / 1:1 Pixel-Mapping**: Behält exakte Pixeldimensionen ohne Skalierung bei.

### Zoom-Steuerung
- Stellen Sie den Zoom stufenlos von **25%** bis **400%** mit den Schaltflächen **-** und **+** oder durch direkte Eingabe des Prozentwerts ein.
- Klicken Sie auf **Zoom zurücksetzen**, um 100% Zoom wiederherzustellen.
- Zoom-Einstellungen werden im lokalen Browserspeicher pro Layout gespeichert.

### Start-Countdown-Vorschau
- Klicken Sie auf **Startampel-Vorschau** (<span class="material-icons">timer</span>), um eine Live-Vorschau der Startampel-Sequenz auf dem Canvas zu testen, ohne ein echtes Rennen zu starten.

---

## Widget-Arbeitsfläche & Inspector

- **Platzierung & Auswahl**: Klicken Sie auf ein beliebiges Widget auf der Arbeitsfläche oder wählen Sie es aus dem Dropdown-Menü aus.
- **Neupositionierung & Dimensionierung**: Ziehen Sie Widgets frei innerhalb der Arbeitsflächengrenzen. Verwenden Sie den Inspector, um exakte numerische Werte für **X**, **Y**, **Breite** und **Höhe** einzugeben.
- **Tastaturnavigation**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Verschiebt das ausgewählte Widget um 1 Pixel.
  - <kbd>Shift</kbd> + Pfeiltasten: Verschiebt das Widget um 10 Pixel.
  - <kbd>Entf</kbd> oder <kbd>Rücktaste</kbd>: Entfernt das ausgewählte Widget.
- **Spuren replizieren**: Replizieren Sie eine ausgewählte Spurenspaltenkarte über alle aktiven Spuren, Positionen, Gesamtwertungen oder Fahrer-Startnummern.
- **Erkennung & Reparatur gestapelter Spalten**:
  - Der Editor erkennt automatisch doppelte oder überlappende Spalten in Spurgittern.
  - Ein Warnbanner bietet eine Ein-Klick-Schnellkorrektur oder eine Prüfung im Dialog an.

---

## Import, Export & Migration

- **Layout importieren**: Importieren Sie eine vorhandene Layout-JSON-Datei.
- **Layout exportieren**: Laden Sie das aktive Layout als JSON-Datei herunter.
- **Backups vor Migration**: Stellen Sie für Layouts aus älteren Versionen Sicherungs-Snapshots wieder her oder exportieren Sie Migrationsdiagnosen zur Fehlerbehebung.
