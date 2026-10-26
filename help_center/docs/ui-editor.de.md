# Oberflächen-Editor

## Übersicht

Mit dem UI-Editor können Sie benutzerdefinierte Renntag-Layouts erstellen, Fahrerranglisten-Spalten anpassen, Soundeffekte und Grafiken des Designs ändern und modulare [Benutzerdefinierte Widgets](custom-widgets.md) laden.

## Benutzerdefinierte Widgets & Widget-Ordner

Benutzerdefinierte Widgets können zu Ihren Custom-UI-Layouts hinzugefügt werden:
- **Ordner für benutzerdefinierte Widgets**: Legen Sie Ihren lokalen Widget-Ordner im Bereich **Benutzerdefinierte Benutzeroberfläche** unten im Editor fest.
- **Beispiel-Widgets aktualisieren**: Klicken Sie auf **Beispiel-Widgets aktualisieren**, um einsatzbereite Beispiel-Widgets in einem `sample/`-Ordner zu erstellen oder zu aktualisieren (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Widget-Bibliothek-Gruppen**: Die Widget-Bibliothek organisiert Widgets in übergeordnete Gruppen (**Race Coordinator AI**, **Benutzerdefinierte Wurzel** und eigene Ordner wie **sample**) mit verschachtelten Untergruppen (wie **Aktionen** und **Durchgangsdaten** mit kategorisierten Unterordnern) und einem Sofort-Suchfilter.
- **Dynamische Konfiguration**: Wenn ein benutzerdefiniertes Widget auf der Arbeitsfläche ausgewählt ist, erscheinen seine individuellen Eigenschaften (Farben, Schwellenwerte, Schalter, Textfelder) dynamisch in der Widget-Konfiguration.

Ausführliche Informationen zur Entwicklung finden Sie im [Leitfaden für benutzerdefinierte Widgets](custom-widgets.md).

## Layout- und Spaltenkonfiguration

- Ziehen Sie Widgets aus der Palette per Drag & Drop auf die Leinwand.
- Passen Sie Größe, Position und Ausrichtung der Widgets an Ihre Bildschirmauflösung an. Alle Widgets bleiben innerhalb des Leinwandbereichs begrenzt.
- **Widget-Konfigurations-Steuerung**:
  - **Position & Größe**: Positionieren und dimensionieren Sie das ausgewählte Widget präzise über die Eingabefelder für **X**, **Y**, **Breite** und **Höhe**.
  - **Widget löschen**: Klicken Sie auf das Papierkorb-Symbol im Konfigurations-Kopfbereich.
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
- **Live-Vorschau**: Der Konfigurationsbereich bietet eine sofortige Vorschau darauf, wie die ausgewählten Einstellungen an verschiedenen Zeitpunkten formatiert werden (`> 1 hr`, `> 1 min`, `< 1 min` und `< 10s`).

> [!NOTE]
> Genau diese Zeitformatierungsoptionen (Anzeigeformat-Vorgaben, Subsekunden-Modi, Schwellenwert und Dezimalstellen-Schieberegler mit Live-Vorschau) werden auch für **Gesamtzeit-Widgets** (Heat-Gesamtzeit und Renn-/Gesamtzeit) sowie für **Gesamtzeit-Spalten** in der Spuransicht unterstützt. Klicken Sie in der Spaltenliste der Spuransicht auf das Symbol für Zeitoptionen (<span class="material-icons">more_time</span>) neben einer beliebigen Gesamtzeit-Spalte, um deren Zeitformat anzupassen.

## Countdown-Widget-Konfiguration

Das **Countdown**-Widget stellt die visuelle Startampel dar und steuert die Starttöne während der Startsequenz:

- **Maximale Lampenanzahl**: Legt die maximale Anzahl der angezeigten Lampen fest (Standard: 5, Bereich 1 bis 10). Wenn die Countdown-Dauer diese Anzahl überschreitet (z. B. ein 6-Sekunden-Start-Countdown bei maximal 5 Lampen), bleiben alle Lampen während der anfänglichen Differenz (1 Sekunde) dunkel/aus, bevor die Lampen nacheinander aufleuchten.
- **Einblend-Animation**: Steuert, ob das Countdown-Overlay und die Hintergrundunschärfe beim Start weich eingeblendet werden. Ist die Option deaktiviert, erscheinen Ampel und Hintergrund sofort.
- **Ausrichtung**: Wechseln Sie zwischen **Horizontaler** und **Vertikaler** Ampelanordnung.
- **Leucht- & Unschärfeeffekte**: Passen Sie Halos, Skalierungsüberlappungen für rote/grüne Lampen sowie Stärke und Bereich der Hintergrundunschärfe an.

## Spurspalten-Widgets & Duplizierung

Das **Spurspalten-Widget** ermöglicht es, einzelne Datenspalten aus der Spuransicht (wie Fahrerinfo, letzte Rundenzeit, beste Rundenzeit / persönlicher Rekord, Tankfüllstand in %, Rundenhistorie, Sektorgeschwindigkeiten, Platzierung usw.) als eigenständige modulare Karten auf der Arbeitsfläche zu platzieren.

- **Zielfahrer & Einzelkarten**:
  - Einzelne Karten außerhalb eines Rasters wählen den anzuzeigenden Fahrer: nach **Spur** (Spur 1 bis Spur 8), nach **Lauf-Position** (1., 2. usw.), nach Rang in der **Gesamtwertung** oder nach **Fahrer-Setzung**.

### Inset-Widgets & Ausrichtung

Jede Spurspalten-Karte unterstützt bis zu 8 sekundäre **Inset-Plätze** (Einfügungen), die um den Umfang des primären Datenwerts angeordnet sind (Oben-Links, Oben-Mitte, Oben-Rechts, Mitte-Links, Mitte-Rechts, Unten-Links, Unten-Mitte, Unten-Rechts):

- **Datenbindung**: Insets können sekundäre Metriken (z. B. beste Runde, Rundenzahl, Kraftstoff %, gefahrene Durchgänge, Fahrername), Bilder/Avatare oder eingebettete benutzerdefinierte Widgets anzeigen.
- **Horizontale & vertikale Ausrichtung**:
  - Auf der Inset-Registerkarte des Inspektors bietet jedes platzierte Inset Optionen für **Horizontale Ausrichtung** (**Links**, **Zentriert**, **Rechts**) und **Vertikale Ausrichtung** (**Oben**, **Zentriert**, **Unten**).
  - Insets verwenden standardmäßig ihre natürliche Umfangsausrichtung (z. B. `Oben-Links` standardmäßig Links/Oben, `Unten-Rechts` standardmäßig Rechts/Unten), was vollständige visuelle Kompatibilität mit bestehenden Layouts gewährleistet und gleichzeitig präzise Positionierung innerhalb jedes Inset-Bereichs ermöglicht.
- **Benutzerdefinierte Stile**: Insets können Spaltenschriftarten und -farben erben oder benutzerdefinierte Typografie, Textfarben, Dezimalstellen und Formatschwellenwerte konfigurieren.

### Raster-Datenquellen: Lauf-Daten vs. Gesamtwertungs-Daten

Jedes Datenraster im UI-Editor verfügt im Reiter „Raster“ über eine Einstellung **Datenquelle**, die festlegt, welche Fahrer die Zeilen des Rasters füllen:

- **Lauf-Daten (`heat`)**:
  - **Fahrerbereich**: Bindet ausschließlich an die Fahrer, die aktiv im aktuellen Lauf auf der Strecke antreten (`heatDrivers`).
  - **Anzeigeverhalten**: Es werden nur Fahrer angezeigt, die sich im laufenden Lauf auf der Strecke befinden. Pausierende oder in anderen Läufen eingeteilte Teilnehmer werden ausgeblendet.
  - **Paginierung & Scrollen**: Die Zeilenanzahl ist strikt auf die Fahrer des aktiven Laufs und die physischen Spuren begrenzt. Das Raster scrollt niemals über die aktiven Teilnehmer hinaus in leere Zeilen.
- **Gesamtwertungs-Daten (`overall`)**:
  - **Fahrerbereich**: Bindet an **alle registrierten Teilnehmer** des gesamten Turniers bzw. Rennens (`participants`).
  - **Anzeigeverhalten**: Jeder im Event registrierte Fahrer kann im Raster dargestellt werden, unabhängig davon, ob er im aktuellen Lauf auf der Strecke fährt oder in den Boxen pausiert.
  - **Paginierung & Scrollen**: Die Zeilenanzahl spiegelt das gesamte Teilnehmerfeld wider (z. B. 16, 24 oder 32 Fahrer über mehrere Läufe hinweg). Hat das Raster weniger sichtbare Zeilen als Teilnehmer vorhanden sind, unterstützt es automatisches mehrseitiges Scrollen durch das gesamte Gesamtklassement.
  - **Pausierende Fahrer**: Für Fahrer, die sich nicht auf der Strecke befinden, werden kumulierte Teilnehmerstatistiken automatisch bereitgestellt.

### Widgets: Lauf-Daten-Widgets vs. Gesamtwertungs-Widgets

Die Toolbox unterteilt Datenspalten und -karten in die Gruppen **Lauf-Daten** und **Gesamtwertung**. Die Auswahl des Widgets bestimmt, welche Kennzahlen für jede Zeile berechnet und angezeigt werden:

- **Lauf-Daten-Widgets** (z. B. *Rundenzahl, Letzte Rundenzeit, Beste Lauf-Rundenzeit, Sektorzeit, Reaktionszeit, Lauf-Position / Rang, Lauf-Abstände, Tank / Telemetrie, Ghost-Pacing*):
  - Berechnen Leistungskennzahlen ausschließlich für den **aktiven Lauf**.
  - **In einem Lauf-Daten-Raster**: Jede Zeile zeigt Live-Echtzeit-Telemetrie und Rundenzeiten der aktuell auf der Strecke fahrenden Fahrzeuge.
  - **In einem Gesamtwertungs-Raster**: Fahrer, die aktuell auf der Strecke sind, zeigen ihre Live-Telemetrie; pausierende oder inaktive Fahrer zeigen für laufsเนินezifische Werte Striche (`--`) oder Nullen, da sie im laufenden Lauf keine Daten erzeugen.
- **Gesamtwertungs-Widgets** (z. B. *Gesamtrang, Gesamte Runden, Physische Runden, Gesamtzeit, Renn-Rekordrunde, Gesamte Durchschnitts-/Medianzeit, Gesamt-Konsistenz, Gesamt-Abstände, Siegchancen / Prognosen, Gefahrene Heats / Verbleibende Heats*):
  - Berechnen kumulierte Leistungskennzahlen über **alle absolvierten Läufe** des Turniers hinweg.
  - **In einem Gesamtwertungs-Raster**: Jede Fahrerzeile (egal ob auf der Strecke oder pausierend in den Boxen) zeigt die vollständigen Gesamtstatistiken, die Gesamtrundenzahl des Turniers, die beste Rennrunde und den Gesamtplatz.
  - **In einem Lauf-Daten-Raster**: Die aktiven Fahrer zeigen ihre Gesamtplatzierung und turnierweiten Statistiken direkt neben ihren aktuellen Laufrunden an (z. B. Verfolgen des Gesamtplatzes während des laufenden Rennens).

#### Gefahrene & Verbleibende Heats Widget

Das **Gefahrene Heats** (`heatsRaced`)-Widget zeigt den Rennlauf-Fortschritt jedes Teilnehmers an:

- **Gefahrene Heats (Standardmodus)**: Zeigt an, wie viele Läufe der Fahrer im aktuellen Event bereits absolviert hat oder gerade bestreitet.
- **Verbleibende Heats Modus**: Wenn die Einstellung **Heat-Anzeigemodus** von *Gefahrene Heats* auf *Verbleibende Heats* umgeschaltet wird, zeigt die Karte an, wie viele geplante Läufe der Fahrer noch vor sich hat. Sofern kein benutzerdefinierter Spaltentitel festgelegt wurde, wechselt die Überschrift automatisch von `HEATS GEFAHREN` zu `HEATS VERBLEIBEND`.
- Diese Konfiguration steht auch für Insets auf allen Spaltenkarten zur Verfügung.

#### Abstands-Widgets (Gaps & Intervalle)

Race Coordinator AI bietet **2 konfigurierbare Abstands-Widgets** für Lauf-Daten und Gesamtwertungsdaten:

1. **Lauf-Abstand (`gap`)**: Ermittelt Abstände in Echtzeit ausschließlich zwischen den Fahrzeugen des aktiven Laufs.
2. **Gesamt-Abstand (`overallGap`)**: Ermittelt kumulierte Abstände über alle Turnierteilnehmer hinweg.

Jedes Abstands-Widget kann im Spalten-Inspektor über zwei zentrale Optionen konfiguriert werden:
- **Ziel**:
  - **Führender**: Abstand zum aktuellen Spitzenreiter (P1).
  - **Vorausfahrender**: Abstand zum unmittelbar im Klassement vorausfahrenden Konkurrenten (z. B. P3 zu P2).
- **Berechnungsmodus**:
  - **Immer Zeit**: Kontinuierliche rechnerische Pace-Projektion in Sekunden (`+X.XXX`).
  - **Zeit und Runden zurück**: Formel-1-Modus mit Zeitanzeige in derselben Runde oder Rundenrückstand (`+1 Runde`, `+N Runden`) bei Überrundung.
  - **Immer Runden**: Exakter Runden-Delta-Wert zwischen Konkurrenten bei Rundenüberquerung, unter Berücksichtigung der Teilrunde des Vergleichsfahrers.

> [!NOTE]
> Mehrere Abstands-Widgets mit unterschiedlicher Konfiguration (z. B. eine Spalte für den Abstand zum Führenden und eine für den Abstand zum Vordermann) können gleichzeitig im selben Layout oder Raster platziert werden.

Für detaillierte mathematische Formeln und Zeitmessungsspezifikationen siehe den [Leitfaden zu Abstandsberechnungen](gap-calculations.md).

#### Widget für letzte Runden (`lastLaps`)

Das Widget **Letzte Runden** (`lastLaps`) zeigt die zuletzt absolvierten Rundenzeiten des Fahrers im aktuellen Lauf an:

- **Anzuzeigende letzte Runden**: Konfiguriert, wie viele letzte Runden im Widget dargestellt werden sollen (Schieberegler 1–20, Zahleneingabe 1–50). Standardwert ist `5`.
- **Dynamische Skalierung & Einpassung**: Die Karte passt Schriftgrößen und Zeilenabstände automatisch an, um die konfigurierte Anzahl an Runden sauber in die Spaltengeometrie einzupassen.
- **Raster-Synchronisation**: In Bahnrastern synchronisiert das Zuweisen von Zeitformaten die Anzahl der angezeigten letzten Runden über alle Bahnen hinweg.

### Raster-Sortierung & Interaktionsmatrix

Das Dropdown-Menü **Raster-Sortierung** im Reiter „Raster“ steuert die Zeilenreihenfolge. Das Verhalten hängt direkt davon ab, ob die **Datenquelle** des Rasters auf **Lauf-Daten** oder **Gesamtwertung** eingestellt ist:

| Sortieroption | Im Lauf-Daten-Raster (`gridType: heat`) | Im Gesamtwertungs-Raster (`gridType: overall`) |
| :--- | :--- | :--- |
| **Spur** | Statische Sortierung nach physischer Spur (Spur 1, Spur 2, ...). Jede Zeile ist fest an eine Spur und den dort fahrenden Fahrer gebunden. | Aktive Fahrer auf der Strecke erscheinen zuerst in Spurnummer-Reihenfolge (Spur 1, Spur 2, ...), gefolgt von allen pausierenden Teilnehmern, sortiert nach ihrem Rang in der Gesamtwertung. |
| **Lauf-Position** | Dynamische Neusortierung in Echtzeit nach Rennposition im aktuellen Lauf (1., 2., 3. im Lauf). Zeilen tauschen live die Plätze, wenn Autos die Ziellinie überqueren oder sich überholen. | Aktive Fahrer erscheinen ganz oben, sortiert nach ihrer Lauf-Position (1., 2., ...), gefolgt von allen inaktiven Teilnehmern, sortiert nach Gesamtwertungsrang. |
| **Gesamtwertung** | Sortiert **ausschließlich die Fahrer des aktiven Laufs** nach deren Rang im Gesamtklassement. (Fahren z. B. die Gesamtränge 2, 5, 8 und 14 im aktuellen Lauf, ordnen die 4 Zeilen diese als #2, #5, #8, #14). Es werden keine rennfremden Fahrer angezeigt und es entstehen keine Leerzeilen. | Sortiert das **gesamte Teilnehmerfeld** nach der aktuellen Gesamtwertung (1. Gesamt, 2. Gesamt, 3. Gesamt, ...). Das gesamte Feld sortiert sich live neu, wenn Punkte und Runden aktualisiert werden. |
| **Fahrer-Setzung** | Sortiert die Fahrer des aktiven Laufs nach ihrer Qualifikations-/Setzungsnummer (niedrigste Setzung zuerst). | Sortiert alle Event-Teilnehmer nach ihrer anfänglichen Setzungsposition (Setzung 1, Setzung 2, Setzung 3, ...) über das gesamte Feld hinweg. |
- **Ausrichtung**: Unterstützt **Vertikal** (Überschrift über dem Wert) und **Horizontal** (Überschrift und Wert nebeneinander).
- **Titelleisten-Design & Anpassung**:
  - Die Titelleiste ist standardmäßig identisch zur Spaltenüberschrift der Spuransicht gestaltet (halbtransparenter dunkler Hintergrund `rgba(68, 68, 68, 0.7)`, weiße Fettschrift, abgerundete obere Ecken und Trennlinie).
  - **Kopfzeile anzeigen**: Schaltet die Titelleiste ein oder aus. Bei Deaktivierung wird die Titelleiste vollständig von der Karte entfernt, wodurch maximaler Platz für Hauptwerte und Einschübe zur Verfügung steht.
  - **Benutzerdefinierte Überschrift**: Überschreibt die Standardbezeichnung des Datenpunkts mit einem individuellen Titel.
  - **Typografie & Ausrichtung**: Schriftart, Schriftgröße und Textausrichtung (Links, Zentriert, Rechts) der Titelleiste lassen sich präzise anpassen.
  - **Text- und Hintergrundfarbe**: Sowohl die Hintergrundfarbe als auch die Textfarbe der Titelleiste können über Farbwähler angepasst und mit einem Klick auf die Standardwerte zurückgesetzt werden.
- **Farbübernahme & Anpassungen**: Karten übernehmen standardmäßig die zugewiesenen Hintergrund- und Textfarben der jeweiligen Spur (`Spurfarben verwenden`) oder können mit benutzerdefinierten Farben und Rahmen gestaltet werden.
- **Über Spuren / Positionen duplizieren**:
  - Anstatt Karten für jede Spur manuell zu erstellen und auszurichten, konfigurieren Sie eine einzelne Spur oder Position und klicken im Konfigurationsbereich auf **Über Spuren / Positionen duplizieren...**.
  - Wählen Sie die Ausrichtung (**Horizontal** nebeneinander oder **Vertikal** übereinander), die Gesamtanzahl der Zielspuren/-positionen (standardmäßig die maximale Spurenanzahl aller Strecken in der Datenbank), den Abstandsmodus (**Automatisch an Arbeitsbereich anpassen** oder **Abstand beibehalten**) und optional das Überschreiben bestehender Widgets.
  - **Echtzeit-Duplizierungsmodus**: Beim Starten wechselt der Editor in einen interaktiven Blueprint-Modus mit visuellen Spurführungslinien und magnetischem Einrasten. In diesem Modus platzieren und verändern Sie Widgets direkt in Spur 1 (Master); alle Änderungen werden sofort in Echtzeit auf die übrigen Spuren gespiegelt. Gespiegelte Widgets in den Spuren 2..N sind schreibgeschützte Live-Vorschauen; ein Klick darauf leitet den Fokus automatisch auf den Master in Spur 1 weiter.
  - **Intelligenter Rasterbereich & Größenanpassung**: Der Duplizierungsbereich dehnt sich automatisch in alle vier Richtungen aus, um den verfügbaren Platz auf der Arbeitsfläche auszufüllen, bis er an die Begrenzung bestehender Widgets stößt, die nicht zum Raster gehören. Sie können die Gesamtgröße des Rasters interaktiv über die 8 Ziehpunkte am Rahmen des Overlays verändern.
  - Mit **Fertig** wird das Raster in eigenständige Widgets festgeschrieben.
  - **Vorlage erneut bearbeiten & Lösen**: Beim Auswählen eines solchen Widgets zeigt die Widget-Konfiguration eine Infokarte mit **Rastervorlage bearbeiten** (um jederzeit wieder in den Echtzeit-Modus zu wechseln) und **Vom Raster lösen** (um die Verknüpfung dauerhaft aufzuheben).

### Raster-Synchronisierung: Spalten spiegeln vs. Zeilen spiegeln

Ein Raster im Race Coordinator AI ist eine zweidimensionale Matrix, die sich aus Teilnehmer-Plätzen und Datenmetriken zusammensetzt:

- **Vertikale Ausrichtung (Standard)**:
  - **Zeilen (Teilnehmer-Plätze)**: Repräsentieren jede einzelne physische Rennspur (**Spur 1, Spur 2, ...**) oder Rennposition (**Position 1, Position 2, ...**).
  - **Spalten (Datenfelder)**: Repräsentieren einzelne Datenmetriken innerhalb eines Platzes (z. B. *Fahrername, Rundenanzahl, Letzte Rundenzeit, Beste Runde, Abstand, Fahrzeugbild*).
  - **Spalten spiegeln**: Steuert die optische Stil-Synchronisierung über alle Datenspalten hinweg.
  - **Zeilen spiegeln**: Regelt die Replikation und Geometrie-Synchronisierung von Zeile zu Zeile ausgehend von der **Hauptzeile (Spur 1 / Position 1 Master)** auf alle übrigen Zeilen (**Spuren 2..N**).
- **Horizontale Ausrichtung**:
  - **Spalten (Teilnehmer-Plätze)**: Repräsentieren jede einzelne physische Rennspur (**Spur 1, Spur 2, ...**) oder Rennposition (**Position 1, Position 2, ...**). Jede Spur in einer Heat-Ansicht ist eine Spalte.
  - **Zeilen (Datenfelder)**: Repräsentieren vertikal untereinander gestapelte Datenmetriken.
  - **Spalten spiegeln**: Regelt die Replikation und Geometrie-Synchronisierung von Spalte zu Spalte ausgehend von der **Hauptspalte (Spur 1 / Position 1 Master)** auf alle übrigen Spalten (**Spuren 2..N**). Bei Deaktivierung werden Spuren unabhängig und die Schaltfläche **Auf alle Spalten spiegeln** erscheint.
  - **Zeilen spiegeln**: Steuert die optische Stil-Synchronisierung über alle Datenzeilen (Metriken) hinweg.

Der Widget-Inspektor bietet im Abschnitt **Rasterstruktur & Layout** zwei wesentliche Synchronisierungsoptionen: **Spalten spiegeln** und **Zeilen spiegeln**.

#### Spalten spiegeln

**Spalten spiegeln** synchronisiert Spalten über das gesamte Raster hinweg:
- Bei **vertikaler Ausrichtung** repräsentieren Spalten unterschiedliche Datenfelder/Metriken. Spalten spiegeln gleicht optische Stile über diese Spalten ab.
- Bei **horizontaler Ausrichtung** repräsentieren Spalten einzelne Rennspuren/Positionen. Spalten spiegeln regelt die Replikation, Größenanpassung und Gestaltung von der **Hauptspalte (Spur 1 / Position 1)** auf alle übrigen Rennspuren.

- **Aktiviert (Standard)**:
  - Spalten teilen verknüpfte Stile (vertikal) oder vollständige Master-Replikation (horizontal).
  - Änderungen am Master werden sofort auf alle Spalten übertragen.
  - **Synchronisierte Eigenschaften**:
    - **Kopfzeilenstil**: Schriftart, Schriftgröße, Textfarbe, Hintergrundfarbe, Textausrichtung und Kopfzeilenhöhe/-breite.
    - **Datenzellenstil**: Schriftart, Schriftgröße, Textfarbe, Hintergrundfarbe, Umschalten der Spurfarben (`useLaneColors`) und Wertausrichtung.
    - **Rahmenstil**: Rahmenanzeige, Rahmenfarbe, Rahmenbreite und Eckenradius.
    - **Zeitformatierung**: Nachkommastellen, Anzeigeformat und Schwellenwerte für Subsekunden-Präzision.
    - **Runden-Telemetrie-Hervorhebung**: Zeilen-/Spaltenhervorhebung beim Auslösen einer Runde.
- **Deaktiviert**:
  - Hebt die Spaltensynchronisierung auf.
  - Bei vertikaler Ausrichtung kann jede Spalte eigene Stile erhalten, und Schaltflächen zum manuellen Anwenden auf alle Spalten erscheinen.
  - Bei horizontaler Ausrichtung wird jede Spurspalte unabhängig, Widgets zeigen das Kennzeichen **Unabhängig** (z. B. `Spur 2 (Unabhängig)`), und die Schaltfläche **Auf alle Spalten spiegeln** erscheint.
- **Verhalten beim erneuten Aktivieren**:
  - Reaktiviert die Spaltensynchronisierung. Bei horizontaler Ausrichtung synchronisiert das erneute Aktivieren oder Anklicken von **Auf alle Spalten spiegeln** alle Spalten sofort wieder mit der Master-Spur.

#### Zeilen spiegeln

**Zeilen spiegeln** synchronisiert Zeilen über das gesamte Raster hinweg:
- Bei **vertikaler Ausrichtung** repräsentieren Zeilen einzelne Rennspuren/Positionen. Zeilen spiegeln regelt die Replikation und Geometrie-Synchronisierung von der **Hauptzeile (Spur 1 / Position 1)** auf alle übrigen Zeilen (**Spuren 2..N**).
- Bei **horizontaler Ausrichtung** repräsentieren Zeilen unterschiedliche Metriken innerhalb jeder Spur. Zeilen spiegeln regelt die optische Stil-Synchronisierung über diese Metrikenzeilen.

- **Aktiviert (Standard)**:
  - Zeilen folgen strikt der Master-Vorlage (vertikal) oder teilen einheitliche Stile (horizontal).
  - Jede Verschiebung, Größenänderung oder Einstellungsänderung an der Master-Zelle wird sofort auf alle übrigen Spuren/Positionen übertragen.
  - Bei vertikaler Ausrichtung tragen Nicht-Master-Widgets das Kennzeichen **Gespiegelt** (z. B. `Spur 2 (Gespiegelt)`).
- **Deaktiviert**:
  - Entkoppelt Zeilen.
  - Bei vertikaler Ausrichtung zeigen Nicht-Master-Widgets das Kennzeichen **Unabhängig** (z. B. `Spur 2 (Unabhängig)`), Spuren können einzeln angepasst werden, und die Schaltfläche **Auf alle Zeilen spiegeln** erscheint.
  - Bei horizontaler Ausrichtung kann jede Metrikzeile eigene Stile erhalten.
- **Verhalten beim erneuten Aktivieren**:
  - Reaktiviert die Zeilenreplikation und -synchronisierung. Bei vertikaler Ausrichtung synchronisiert das erneute Aktivieren oder Anklicken von **Auf alle Zeilen spiegeln** alle Zeilen sofort wieder mit dem Master.

#### Zusätzliche Zeilen

Wenn ein Raster unbesetzte Zeilen aufweist (z. B. wenn weniger Fahrer an einem Rennen oder Lauf teilnehmen als Zeilen/Spuren im Raster konfiguriert sind), steuert die Einstellung **Zusätzliche Zeilen** im Raster-Inspektor das Verhalten:

- **Entfernen**: Entfernt überzählige unbesetzte Zeilen und Spalten automatisch, sodass das Raster exakt an die tatsächliche Fahrerzahl angepasst wird. (Standard für Raster mit **Gesamtwertung** und **Fahrer-Setzung**).
- **Leer anzeigen**: Behält die zusätzlichen Zeilen bei und zeigt `--` für alle Metriken und Insets an, während Kartenstrukturen und Kopfzeilen sichtbar bleiben. (Standard für Raster mit **Lauf** und **Spur**).
- **Blank anzeigen**: Behält die zusätzlichen Zeilen bei und zeigt nur Kartenrahmen und Hintergrundfarben ohne Werte oder Kopfzeilen an.

#### Vergleichsübersicht

| Option | Ausrichtung | Geltungsbereich | Was synchronisiert wird | Verhalten bei Deaktivierung | Verhalten bei erneuter Aktivierung |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spalten spiegeln** | Vertikal | Spalten (Datenmetriken) | Optischer Stil: Schriften, Größen, Farben, Rahmen, Kopfzeilen, Zeitformate | Spalten werden unabhängig; bestehende Stile bleiben erhalten; manuelle Schaltflächen „Auf alle Spalten anwenden“ erscheinen | Aktiviert Auto-Sync für künftige Änderungen |
| **Spalten spiegeln** | Horizontal | Spalten (Spuren / Teilnehmer) | Geometrie, Replikation und Stile von Spur 1 Master auf alle Spurspalten | Spurspalten werden unabhängig; Status `Unabhängig` erscheint; Schaltfläche `Auf alle Spalten spiegeln` erscheint | Stellt Master-Replikation wieder her; gleicht alle Spalten an Master an |
| **Zeilen spiegeln** | Vertikal | Zeilen (Spuren / Teilnehmer) | Geometrie, Replikation und Einstellungen von Spur 1 Master auf alle Spurzeilen | Spurzeilen werden unabhängig; Status `Unabhängig` erscheint; Schaltfläche `Auf alle Zeilen spiegeln` erscheint | Stellt Master-Replikation wieder her; gleicht alle Zeilen an Master an |
| **Zeilen spiegeln** | Horizontal | Zeilen (Datenmetriken) | Optischer Stil: Schriften, Größen, Farben, Rahmen über Metrikzeilen | Metrikzeilen werden unabhängig; bestehende Stile bleiben erhalten | Aktiviert Auto-Sync für künftige Änderungen |

