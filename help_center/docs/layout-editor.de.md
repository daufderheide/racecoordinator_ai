# Layout-Editor

Der **Layout-Editor** bietet eine dedizierte Vollbild-Oberfläche zum Anpassen, Organisieren und Entwerfen visueller Bildschirmlayouts für Race Coordinator AI. Er teilt dieselbe vereinheitlichte Symbolleiste, Objektauswahl, Schreibschutz-Logik und den Bearbeitungsmodus-Lebenszyklus wie die Fahrer-, Strecken- und Renn-Editoren.

---

## Übersicht & Navigation

Der Layout-Editor kann an mehreren Stellen in der Anwendung aufgerufen werden:

- **Renntag-Setup-Symbolleiste**: Wählen Sie **Konfig > Layout-Editor** (`/layout-editor` oder `/layout-manager`).
- **Renntag-Verwalten-Menü**: Wählen Sie **Verwalten > Layout-Editor** (`/layout-editor`). Das Navigieren während eines laufenden Rennens behält den Rennstatus bei.
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
- **Widget-Bibliothek (<span class="material-icons">widgets</span>)**: Schaltet die Sichtbarkeit des frei schwebenden Widget-Bibliotheks-Werkzeugkastens um.
- **Widget-Konfiguration (<span class="material-icons">tune</span>)**: Schaltet die Sichtbarkeit des Widget-Konfigurationspanels um.
- **Startampel-Vorschau (<span class="material-icons">visibility</span>)**: Schaltet eine Live-Vorschau der Startampel-Sequenz auf dem Canvas um, ohne ein echtes Rennen zu starten.
- **Layout hinzufügen (<span class="material-icons">add</span>)**: Öffnet einen Vorlagenauswahldialog, mit dem Sie ein neues Layout aus einem beliebigen Standard-Race-Coordinator-AI-Layout (*RC AI*, *Training*, *Kraftstoff*, *Fahrerstand*) oder mit einem vollständig leeren Layout erstellen können.
- **Layout kopieren (<span class="material-icons">content_copy</span>)**: Dupliziert das aktuell ausgewählte Layout unter einem eindeutigen Namen (z. B. *Layout-Name (Kopie)*).
- **Layout löschen (<span class="material-icons">delete</span>)**: Löscht das aktuelle benutzerdefinierte Layout nach Bestätigung. Standard-Systemlayouts sind geschützt und können nicht gelöscht werden.
- **Geführte Tour (<span class="material-icons">help_outline</span>)**: Startet eine interaktive geführte Tour zur Erklärung der Layoutauswahl, Symbolleiste, Arbeitsfläche, Widget-Bibliothek und des Widget-Inspectors.

---

## Arbeitsfläche & Auflösungssteuerung {: #layout-controls }

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

### Widget-Bibliothek & Konfigurationssteuerung {: #widget-panels }
In der Haupt-Symbolleiste links neben dem Countdown-Vorschausymbol angeordnet:
- **Widget-Bibliothek (<span class="material-icons">widgets</span>)**: Schaltet die Sichtbarkeit des frei schwebenden Widget-Bibliotheks-Werkzeugkastens um. Ein Klick stellt den Kasten wieder her, falls er minimiert oder außerhalb des sichtbaren Bildschirmbereichs verschoben wurde.
- **Widget-Konfiguration (<span class="material-icons">tune</span>)**: Schaltet die Sichtbarkeit des Widget-Konfigurationspanels um. Wenn es ausgeblendet ist, kann sich die Arbeitsfläche über die gesamte Seitenbreite erstrecken, sofern es das Seitenverhältnis des Layouts erlaubt (wie im schreibgeschützten Modus).
- **Position zurücksetzen (<span class="material-icons">restart_alt</span>)**: Setzt den Werkzeugkasten über die Schaltfläche in der Kopfzeile sofort an die Standardursprungsposition `(0, 0)` oben links zurück.
- **Minimieren (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Klappt den Werkzeugkasten auf eine kompakte Titelleiste zusammen, um Platz auf der Arbeitsfläche freizugeben.

---

## Widget-Arbeitsfläche & Inspector {: #canvas-and-widgets }

Die Arbeitsfläche dient als authentische Live-Vorschau Ihres Layouts, genau so, wie Fahrer und Zuschauer es während eines Rennens erleben. Im **Bearbeitungsmodus** können Sie alle Widgets des Layouts hinzufügen, entfernen, neu positionieren, skalieren und konfigurieren.

### Arbeitsflächen-Interaktionen
- **Platzierung & Auswahl**: Klicken Sie direkt auf ein Widget auf der Arbeitsfläche oder wählen Sie es aus dem Dropdown-Menü in der oberen Leiste aus.
- **Neupositionierung & Dimensionierung**: Ziehen Sie Widgets frei über die Arbeitsfläche. Verwenden Sie den Inspector, um exakte numerische Werte für **X**, **Y**, **Breite** und **Höhe** einzugeben.
- **Tastaturnavigation**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Verschiebt das ausgewählte Widget um 1 Pixel.
  - <kbd>Shift</kbd> + Pfeiltasten: Verschiebt das Widget um 10 Pixel.
  - <kbd>Entf</kbd> oder <kbd>Rücktaste</kbd>: Entfernt das ausgewählte Widget.
- **Spuren replizieren**: Replizieren Sie eine ausgewählte Spurenspaltenkarte über alle aktiven Spuren, Positionen, Gesamtwertungen oder Fahrer-Startnummern.
- **Erkennung & Reparatur gestapelter Spalten**: Der Editor erkennt automatisch doppelte oder überlappende Spalten in Spurgittern. Ein Warnbanner bietet eine Ein-Klick-Schnellkorrektur oder eine Prüfung im Dialog an.

### Verfügbare Widgets & Konfigurationsoptionen

Race Coordinator AI enthält eine umfangreiche Sammlung integrierter Widgets:

1. **Bestenliste / Tabelle (Leaderboard / Grid)**:
   - **Zweck**: Zeigt eine tabellarische Live-Bestenliste der Fahrer, Positionen, Rundenanzahlen, Telemetriewerte und Abstände an.
   - **Konfigurationsoptionen**: Datenquelle (**Heat-Daten** vs. **Gesamt-Renndaten**), benutzerdefinierte Spaltenreihenfolge und -sichtbarkeit, Zeilenhöhen, Sortierregeln, automatisches Blättern und benutzerdefinierte Typografie.
2. **Spurenspalte (Lane Column - Modulare Karten)**:
   - **Zweck**: Zeigt Telemetriedaten für eine einzelne Spur, Position oder Gesamtwertung als eigenständige modulare Karte an.
   - **Konfigurationsoptionen**: Zielbindung (**Streckenspur 1–8**, **Heat-Position**, **Gesamtwertung** oder **Fahrer-Startplatz**), bis zu 8 umlaufende **Einschub-Slots (Insets)** für Fahrerfotos, Zusatzmetriken oder Badges, Textausrichtung und Schriftgrößen.
3. **Timer & Gesamtzeit (Total Time)**:
   - **Zweck**: Zeigt die verbleibende Heat-Zeit, abgelaufene Heat-Zeit oder gesamte Event-Dauer an.
   - **Konfigurationsoptionen**: Anzeige-Voreinstellungen (**Dynamisch**, **Minuten & Sekunden**, **Volle Uhrzeit**, **Sekunden gesamt**), Schwellenwerte für Untersekunden-Präzision und Format-Vorschau.
4. **Startampel-Widget (Countdown)**:
   - **Zweck**: Visuelle Startampel-Sequenz mit synchronisierten Tonsignalen.
   - **Konfigurationsoptionen**: Lampenanzahl (1 bis 10), horizontale oder vertikale Ausrichtung, Einblend-Animation, Hintergrundunschärfe und Leuchteffekte.
5. **Aktionstasten (Action Buttons)**:
   - **Zweck**: Interaktive Schaltflächen für die Rennleitung.
   - **Konfigurationsoptionen**: Aktionen (**Start/Pause**, **Gelbe Flagge / Bahnruf**, **Audioansage**, **Zurücksetzen**, **Layout-Wechsel**), Beschriftungen, Material-Icons und Farbgestaltung.
6. **Rekorde-Widget (Records)**:
   - **Zweck**: Zeigt Strecken- und Session-Rekorde (schnellste Runde aller Zeiten, Spur-Rekorde, Rundenrekorde) an.
   - **Konfigurationsoptionen**: Rekordtypen, Titelformatierung, Schriftarten und Hintergrundstile.
7. **Bild-Widget (Image)**:
   - **Zweck**: Zeigt Streckengrafiken, Sponsorenbanner, Clublogos und Grafikelemente an.
   - **Konfigurationsoptionen**: Bildpfad, Skalierungsmodus (**Einpassen**, **Füllen**, **Dehnen**), Deckkraft und Eckenabrundung.
8. **Text-Info-Widget**:
   - **Zweck**: Zeigt statische Texte oder dynamische Rennmetadaten (Rennname, aktuelle Heat, Streckenname) an.
   - **Konfigurationsoptionen**: Textvorlage mit Variablenersetzung (`{race_name}`, `{heat_number}`), Schriftgröße, Ausrichtung und Farben.
9. **Menü-Widget (Menu)**:
   - **Zweck**: Kompaktes In-Race-Menü für schnellen Zugriff auf Sound-Einstellungen, Layout-Umschaltung und Rennsteuerung.
   - **Konfigurationsoptionen**: Symbolstil, Menüpunkte und Ankerpositionierung.
10. **Kommende Heats (On Deck)**:
    - **Zweck**: Informiert Fahrer über anstehende Heat-Gruppen und Spurenwechsel.
    - **Konfigurationsoptionen**: Anzahl der Vorschau-Heats, Namensformatierung und Abstände.
11. **Benutzerdefinierte Widgets (Custom Widgets)**:
    - **Zweck**: Lädt dynamisch externe Webkomponenten und Telemetrieanzeigen aus Ihrem benutzerdefinierten Widget-Ordner.
    - **Konfigurationsoptionen**: Benutzerdefinierte Eigenschaften (Farben, Schwellenwerte, Schalter, Texte) aus dem Widget-Manifest.

Ausführliche Informationen zur Widget-Gestaltung und Entwicklung eigener Widgets finden Sie im [UI-Editor-Leitfaden](ui-editor.de.md) und im [Leitfaden für benutzerdefinierte Widgets](custom-widgets.de.md).

---

## Import, Export & Migration

- **Layout importieren**: Importieren Sie eine vorhandene Layout-JSON-Datei.
- **Layout exportieren**: Laden Sie das aktive Layout als JSON-Datei herunter.
- **Backups vor Migration**: Stellen Sie für Layouts aus älteren Versionen Sicherungs-Snapshots wieder her oder exportieren Sie Migrationsdiagnosen zur Fehlerbehebung.
