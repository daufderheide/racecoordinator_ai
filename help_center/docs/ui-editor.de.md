# Oberflächen-Editor

## Übersicht

Mit dem UI-Editor können Sie benutzerdefinierte Renntag-Layouts erstellen, Fahrerranglisten-Spalten anpassen, Soundeffekte und Grafiken des Designs ändern und modulare [Benutzerdefinierte Widgets](custom-widgets.md) laden.

## Benutzerdefinierte Widgets & Widget-Ordner

Benutzerdefinierte Widgets können zu Ihren Custom-UI-Layouts hinzugefügt werden:
- **Ordner für benutzerdefinierte Widgets**: Legen Sie Ihren lokalen Widget-Ordner im Bereich **Benutzerdefinierte Benutzeroberfläche** unten im Editor fest.
- **Beispiel-Widgets aktualisieren**: Klicken Sie auf **Beispiel-Widgets aktualisieren**, um einsatzbereite Beispiel-Widgets in einem `sample/`-Ordner zu erstellen oder zu aktualisieren (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Widget-Toolbox-Gruppen**: Die Widget-Toolbox organisiert Widgets in übergeordnete Gruppen (**Race Coordinator AI**, **Benutzerdefinierte Wurzel** und eigene Ordner wie **sample**) mit verschachtelten Untergruppen (wie **Aktionen** und **Durchgangsdaten** mit kategorisierten Unterordnern) und einem Sofort-Suchfilter.
- **Dynamischer Inspektor**: Wenn ein benutzerdefiniertes Widget auf der Arbeitsfläche ausgewählt ist, erscheinen seine individuellen Eigenschaften (Farben, Schwellenwerte, Schalter, Textfelder) dynamisch im Widget-Inspektor.

Ausführliche Informationen zur Entwicklung finden Sie im [Leitfaden für benutzerdefinierte Widgets](custom-widgets.md).

## Layout- und Spaltenkonfiguration

- Ziehen Sie Widgets aus der Palette per Drag & Drop auf die Leinwand.
- Passen Sie Größe, Position und Ausrichtung der Widgets an Ihre Bildschirmauflösung an. Alle Widgets bleiben innerhalb des Leinwandbereichs begrenzt.
- **Widget-Inspektor-Steuerung**:
  - **Position & Größe**: Positionieren und dimensionieren Sie das ausgewählte Widget präzise über die Eingabefelder für **X**, **Y**, **Breite** und **Höhe**.
  - **Widget löschen**: Klicken Sie auf das Papierkorb-Symbol im Inspektor-Kopfbereich.
- **Tastaturkurzbefehle**:
  - <kbd>Entf</kbd> oder <kbd>Rücktaste</kbd>: Entfernt das ausgewählte Widget aus dem Layout.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Verschiebt das ausgewählte Widget um 1px (oder 10px mit gedrückter <kbd>Umschalttaste</kbd>).
  - <kbd>Strg</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Letzte Aktion rückgängig machen.
  - <kbd>Strg</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Umschalt</kbd>+<kbd>Z</kbd>: Wiederherstellen.
- Spaltenreihenfolge, Spaltensichtbarkeit, Anker und Breitenpräferenzen konfigurieren.

## Timer-Widget-Konfiguration

Das **Timer**-Widget zeigt die abgelaufene oder verbleibende Renn- bzw. Durchgangszeit in konfigurierbaren Darstellungsstilen an:

- **Anzeigeformat**:
  - **Dynamisch (1:23 / 45s)**: Kompakte Anzeige, die führende Nullen weglässt und unter einer Minute nur Sekunden anzeigt.
  - **Minuten & Sekunden (01:23 / 00:45)**: Feste zweistellige Minuten und Sekunden. Verhindert Textlängensprünge und plötzliche Schriftgrößenänderungen bei automatischer Skalierung.
  - **Minuten & Sekunden (1:23 / 0:45)**: Behält Minuten auch unter einer Minute bei (`0:45`), verwendet aber einstellige Minuten ab einer Minute (`1:23`).
  - **Vollständige Uhr (00:01:23 / 00:00:45)**: Feste achtstellige Digitaluhr (`HH:MM:SS`), ideal für Langstreckenrennen.
  - **Gesamtsekunden (83s / 45s)**: Zeigt die gesamte verbleibende oder abgelaufene Zeit in Sekunden an.
- **Sekundenbruchteile (Subsekunden)**:
  - **Unter Schwellenwert**: Zeigt Dezimalstellen (1 bis 3 Stellen) an, sobald die Zeit unter den konfigurierten Schwellenwert fällt (z. B. letzte 10 Sekunden).
  - **Immer**: Zeigt Sekundenbruchteile durchgehend während des gesamten Durchgangs an.
  - **Nie**: Beschränkt den Timer ausschließlich auf ganze Sekunden.
- **Live-Vorschau**: Der Inspektor bietet eine sofortige Vorschau darauf, wie die ausgewählten Einstellungen an verschiedenen Zeitpunkten formatiert werden (`> 1 hr`, `> 1 min`, `< 1 min` und `< 10s`).

## Kamera-QR-Code-Widget

Das **Kamera-QR-Code**-Widget (in der Palette **Medien & Chrome**) zeigt einen scannbaren Kopplungs-QR-Code direkt auf Ihrer Renntagsansicht an:

- **Sofortige Mobilkopplung**: Ermöglicht Streckenposten und Fahrern, ein Mobilgerät zur optischen Rundenerkennung zu verbinden, ohne in den Strecken-Editor wechseln zu müssen.
- **Interaktive Details**: Ein Klick auf das Widget im Live-Modus öffnet einen Dialog mit vergrößertem QR-Code, direkter URL, Kopierschaltfläche und lokalem Test-Button.
- **Netzwerkauflösung**: Stellt je nach Konfiguration dynamisch entweder eine sichere Cloudflare-HTTPS-Tunnel-URL oder Ihre lokale Netzwerk-IP und den Port bereit.

## Countdown-Widget-Konfiguration

Das **Countdown**-Widget stellt die visuelle Startampel dar und steuert die Starttöne während der Startsequenz:

- **Maximale Lampenanzahl**: Legt die maximale Anzahl der angezeigten Lampen fest (Standard: 5, Bereich 1 bis 10). Wenn die Countdown-Dauer diese Anzahl überschreitet (z. B. ein 6-Sekunden-Start-Countdown bei maximal 5 Lampen), bleiben alle Lampen während der anfänglichen Differenz (1 Sekunde) dunkel/aus, bevor die Lampen nacheinander aufleuchten.
- **Einblend-Animation**: Steuert, ob das Countdown-Overlay und die Hintergrundunschärfe beim Start weich eingeblendet werden. Ist die Option deaktiviert, erscheinen Ampel und Hintergrund sofort.
- **Ausrichtung**: Wechseln Sie zwischen **Horizontaler** und **Vertikaler** Ampelanordnung.
- **Leucht- & Unschärfeeffekte**: Passen Sie Halos, Skalierungsüberlappungen für rote/grüne Lampen sowie Stärke und Bereich der Hintergrundunschärfe an.

## Spurspalten-Widgets & Duplizierung

Das **Spurspalten-Widget** ermöglicht es, einzelne Datenspalten aus der Spuransicht (wie Fahrerinfo, letzte Rundenzeit, beste Rundenzeit / persönlicher Rekord, Tankfüllstand in %, Rundenhistorie, Sektorgeschwindigkeiten, Platzierung usw.) als eigenständige modulare Karten auf der Arbeitsfläche zu platzieren.

- **Bindungsmodi**:
  - **Physische Spur**: Bindet die Karte an eine feste Spur (Spur 1 bis Spur 8). Die Karte zeigt während des gesamten Rennens die Daten dieser Spur an.
  - **Laufplatzierung (Position)**: Bindet die Karte an einen aktuellen Rang in der Platzierung (1. Platz, 2. Platz usw.). Die Karte folgt dynamisch Positionswechseln und Überholmanövern und passt Hintergrund- und Akzentfarben an die Spur des jeweiligen Fahrers auf diesem Rang an.
- **Ausrichtung**: Unterstützt **Vertikal** (Überschrift über dem Wert) und **Horizontal** (Überschrift und Wert nebeneinander).
- **Titelleisten-Design & Anpassung**:
  - Die Titelleiste ist standardmäßig identisch zur Spaltenüberschrift der Spuransicht gestaltet (halbtransparenter dunkler Hintergrund `rgba(68, 68, 68, 0.7)`, weiße Fettschrift, abgerundete obere Ecken und Trennlinie).
  - **Kopfzeile anzeigen**: Schaltet die Titelleiste ein oder aus. Bei Deaktivierung wird die Titelleiste vollständig von der Karte entfernt, wodurch maximaler Platz für Hauptwerte und Einschübe zur Verfügung steht.
  - **Benutzerdefinierte Überschrift**: Überschreibt die Standardbezeichnung des Datenpunkts mit einem individuellen Titel.
  - **Typografie & Ausrichtung**: Schriftart, Schriftgröße und Textausrichtung (Links, Zentriert, Rechts) der Titelleiste lassen sich präzise anpassen.
  - **Text- und Hintergrundfarbe**: Sowohl die Hintergrundfarbe als auch die Textfarbe der Titelleiste können über Farbwähler angepasst und mit einem Klick auf die Standardwerte zurückgesetzt werden.
- **Farbübernahme & Anpassungen**: Karten übernehmen standardmäßig die zugewiesenen Hintergrund- und Textfarben der jeweiligen Spur (`Spurfarben verwenden`) oder können mit benutzerdefinierten Farben und Rahmen gestaltet werden.
- **Über Spuren / Positionen duplizieren**:
  - Anstatt Karten für jede Spur manuell zu erstellen und auszurichten, konfigurieren Sie eine einzelne Spur oder Position und klicken im Inspektor auf **Über Spuren / Positionen duplizieren...**.
  - Wählen Sie die Ausrichtung (**Horizontal** nebeneinander oder **Vertikal** übereinander), die Gesamtanzahl der Zielspuren/-positionen (standardmäßig die maximale Spurenanzahl aller Strecken in der Datenbank), den Abstandsmodus (**Automatisch an Arbeitsbereich anpassen** oder **Abstand beibehalten**) und optional das Überschreiben bestehender Widgets.
  - **Echtzeit-Duplizierungsmodus**: Beim Starten wechselt der Editor in einen interaktiven Blueprint-Modus mit visuellen Spurführungslinien und magnetischem Einrasten. In diesem Modus platzieren und verändern Sie Widgets direkt in Spur 1 (Master); alle Änderungen werden sofort in Echtzeit auf die übrigen Spuren gespiegelt. Gespiegelte Widgets in den Spuren 2..N sind schreibgeschützte Live-Vorschauen; ein Klick darauf leitet den Fokus automatisch auf den Master in Spur 1 weiter.
  - **Intelligenter Rasterbereich & Größenanpassung**: Der Duplizierungsbereich dehnt sich automatisch in alle vier Richtungen aus, um den verfügbaren Platz auf der Arbeitsfläche auszufüllen, bis er an die Begrenzung bestehender Widgets stößt, die nicht zum Raster gehören. Sie können die Gesamtgröße des Rasters interaktiv über die 8 Ziehpunkte am Rahmen des Overlays verändern.
  - Mit **Fertig** wird das Raster in eigenständige Widgets festgeschrieben.
  - **Vorlage erneut bearbeiten & Lösen**: Beim Auswählen eines solchen Widgets zeigt der Inspektor eine Infokarte mit **Rastervorlage bearbeiten** (um jederzeit wieder in den Echtzeit-Modus zu wechseln) und **Vom Raster lösen** (um die Verknüpfung dauerhaft aufzuheben).
>>>>>>> develop

