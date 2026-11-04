# Benutzeroberfläche anpassen

Auf der Seite **Benutzeroberfläche anpassen** können Sie systemweite Schnittstelleneinstellungen, Verzeichnispfade für benutzerdefinierte UI-Dateien und modulare Widgets, Vorlagen für den Excel-Export nach dem Rennen, Bildschirmschirmübergangsanimationen sowie Einstellungen für Hauptlautstärke und Sprachausgabe (TTS) konfigurieren.

> [!NOTE]
> Um benutzerdefinierte Renntag-Bildschirme und Ranglisten visuell zu gestalten, öffnen Sie den [Layout-Editor](layout-editor.de.md). Um Bildsätze für Flaggen, Startampeln und Tankanzeigen oder Rennsoundeffekte zu konfigurieren, öffnen Sie den [Design-Editor](theme-editor.de.md).

---

## Übersicht {: #overview }

Die Seite zur Anpassung der Benutzeroberfläche bietet eine zentrale Steuerung über globale Oberflächenverhaltensweisen und Audioeinstellungen auf Anwendungsebene:

- **Globaler Geltungsbereich**: Änderungen auf dieser Seite gelten anwendungsweit für alle Rennsitzungen.
- **Kontinuierliche automatische Speicherung**: Anpassungen an Lautstärke, Sprachhöhe, Warteschlangenzeiten, Verzeichnisauswahl und Übergängen werden sofort wirksam und automatisch gespeichert.
- **Aufklappbare Einstellungsbereiche**: Die Einstellungen sind in übersichtlichen, aufklappbaren Abschnitten für **Einstellungen der Benutzeroberfläche** und **Audio-Einstellungen** organisiert.
- **Rückgängig- / Wiederholen-Unterstützung**: Während der aktuellen Sitzung vorgenommene Änderungen können über die Symbolleisten-Steuerelemente schnell rückgängig gemacht oder wiederhergestellt werden.

---

## Aktionen der Symbolleiste {: #toolbar-actions }

Die obere Symbolleiste bietet wesentliche Navigations- und Sitzungsaktionen:

- **Zurück**: Kehrt zum vorherigen Bildschirm oder Navigationsmenü zurück.
- **Rückgängig / Wiederholen**: Nimmt kürzlich vorgenommene Einstellungsänderungen zurück oder wendet sie erneut an.
- **Hilfe (?)**: Startet die interaktive Führung, die jeden Abschnitt und jedes Erweiterungspanel auf der Seite hervorhebt.

---

## Einstellungen der Benutzeroberfläche {: #customize-ui-settings }

Der Abschnitt **Einstellungen der Benutzeroberfläche** konfiguriert lokale Dateisystemverzeichnisse, benutzerdefinierte Excel-Exportvorlagen und Bildschirmanimationen:

### Verzeichnis für benutzerdefinierte Benutzeroberfläche

Gibt einen lokalen Ordner an, der verwendet wird, um integrierte Anwendungsvorlagen zu überschreiben und bei Bedarf Client-Protokolldateien zu speichern:

- **Verzeichnispfad**: Zeigt den Namen des aktiven Ordners und den absoluten Dateipfad an. Wenn nicht festgelegt, verwendet die Anwendung standardmäßige interne Speicherorte.
- **Verzeichnis auswählen**: Öffnet einen systemeigenen Ordnerauswahldialog zum Durchsuchen und Auswählen eines lokalen Verzeichnisses.
- **Pfad eingeben**: Öffnet ein Modal, in dem Sie einen absoluten Dateisystempfad manuell eingeben oder einfügen können (hilfreich bei Remote-Verbindungen oder Netzwerkfreigaben).
- **Auf Standard zurücksetzen**: Löscht den benutzerdefinierten Verzeichnispfad und stellt die Standardeinstellungen wieder her.

> [!WARNING]
> Das Festlegen eines benutzerdefinierten UI-Verzeichnisses überschreibt Kernvorlagen der Anwendung und ist nur für fortgeschrittene Benutzer gedacht, die benutzerdefinierte Oberflächen entwickeln oder Protokolldateien analysieren.

### Verzeichnis für benutzerdefinierte Widgets

Konfiguriert das Stammverzeichnis, in dem Race Coordinator AI nach modularen [benutzerdefinierten Widgets](custom-widgets.de.md) sucht:

- **Verzeichnispfad**: Zeigt den ausgewählten Ordnernamen und Pfad für benutzerdefinierte Widgets an.
- **Verzeichnis auswählen**: Öffnet eine Ordnerauswahl, um einen lokalen Ordner mit benutzerdefinierten Widget-Paketen auszuwählen.
- **Pfad eingeben**: Geben Sie manuell einen absoluten Ordnerpfad ein.
- **Start-Widgets exportieren**: Kopiert einsatzbereite Beispiel-Widget-Pakete in einen Unterordner `sample/` innerhalb Ihres ausgewählten Widget-Verzeichnisses (einschließlich `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner` und `sample-detailed-leaderboard`). Diese Schaltfläche wird aktiviert, sobald ein gültiges Widget-Verzeichnis ausgewählt ist.
- **Auf Standard zurücksetzen**: Löscht den Verzeichnispfad für benutzerdefinierte Widgets.

Ausführliche technische Daten zur Erstellung benutzerdefinierter Widgets finden Sie im [Handbuch für benutzerdefinierte Widgets](custom-widgets.de.md).

### Benutzerdefinierte Exportvorlage

Verwaltet die benutzerdefinierte Microsoft Excel-Vorlage (`.xlsx`), die beim Exportieren von Rennergebnissen und -statistiken verwendet wird:

- **Vorlagenstatus**: Zeigt den Dateinamen der aktuell aktiven benutzerdefinierten Excel-Arbeitsmappenvorlage an oder gibt an, wenn die Standardvorlage aktiv ist.
- **Vorlage auswählen**: Lädt eine benutzerdefinierte `.xlsx`-Arbeitsmappe von Ihrem Computer hoch, um sie als Exportvorlage einzubetten.
- **Vorlage herunterladen**: Lädt die aktuell aktive Vorlagendatei auf Ihren Computer herunter, um sie in Microsoft Excel anzuzeigen oder zu bearbeiten.
- **Testexport**: Erstellt und lädt eine Beispiel-`.xlsx`-Exportdatei herunter, die mit Beispiel-Rennergebnissen, Heats und Telemetriedaten gefüllt ist, um Vorlagenformatierungen, Formeln und Diagramme zu testen.
- **Vorlagenvariablen**: Öffnet ein interaktives Referenzmodal, in dem alle unterstützten Platzhalter-Tags (wie `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}` usw.) aufgeführt sind, die Sie in Excel-Zellen einfügen können, um Renndaten dynamisch einzutragen.
- **Auf Standard zurücksetzen**: Kehrt zur integrierten Standard-Excel-Exportvorlage zurück.

> [!TIP]
> Wenn Sie Ihre Excel-Vorlagendatei extern in Microsoft Excel oder einem anderen Tabellenkalkulationsprogramm bearbeiten, laden Sie sie unbedingt erneut über **Vorlage auswählen** hoch, damit die aktualisierte Arbeitsmappe in Race Coordinator AI gespeichert wird. Vollständige Details zu Platzhalter-Tokens finden Sie im [Handbuch für den benutzerdefinierten XLS-Export](custom-xls-export.de.md).

### Seitenübergänge

Steuert den visuellen Animationsstil, der beim Wechseln zwischen Bildschirmen und Ansichten in der Anwendung verwendet wird:

- **Gleiten (Slide)** (Standard): Sanfter horizontaler Gleitübergang zwischen Seiten.
- **Ausblenden (Fade)**: Sanftes Überblenden der Deckkraft zwischen den Ansichten.
- **Zoomen (Zoom)**: Moderner Vergrößerungs-Skalierungsübergang.
- **Umdrehen (Flip)**: 3D-Karten-Umdreheffekt.
- **Keine (None)**: Sofortiges Umschalten der Seite ohne Animation (empfohlen für leistungsschwächere Geräte oder Kiosk-Systeme).

---

## Audio-Einstellungen {: #audio-settings }

Der Abschnitt **Audio-Einstellungen** verwaltet die systemweite Gesamtlautstärke, das Verhalten der Dispatcher-Warteschlange und synthetisierte Sprachausgaben (Text-to-Speech / TTS):

### Gesamtlautstärke

Steuert den Gesamtlautstärkepegel (0 % bis 100 %) für alle Tonausgaben in Race Coordinator AI. Das Anpassen dieses Schiebereglers skaliert alle Soundeffekte, Countdown-Signale, Warnhörner und Sprachansagen gleichzeitig.

### Zeitüberschreitung der dringenden Warteschlange

Legt fest, wie lange dringende Benachrichtigungen mit hoher Priorität (wie *Gelbe Flagge*, *Heat beendet* oder *Frühstart*) in der Audio-Warteschlange warten, wenn bereits eine andere dringende Meldung gesprochen wird:

- **3 Sekunden**: Kurze Zeitüberschreitung; verwirft anstehende Benachrichtigungen schnell, um sicherzustellen, dass gesprochene Hinweise eng mit dem Renngeschehen synchronisiert bleiben.
- **5 Sekunden** (Standard): Ausgewogene Dauer, die sicherstellt, dass dringende Hinweise gehört werden, ohne hinter Live-Ereignissen zurückzubleiben.
- **10 Sekunden**: Längere Zeitüberschreitung; lässt längere Ansagen zu Ende sprechen, bevor nachfolgende dringende Benachrichtigungen übersprungen werden.

Abgelaufene Meldungen, die das Zeitlimit überschreiten, werden automatisch verworfen.

### Ansagenabstand

Konfiguriert den Mindestabstand (Stille) zwischen aufeinanderfolgenden Sprachansagen, um überlappende oder abgehackte Töne zu verhindern:

- **Keine (0 ms)**: Aufeinanderfolgende Ansagen werden unmittelbar nacheinander abgespielt.
- **Kurz (500 ms)** (Standard): Kurze Pause von einer halben Sekunde zwischen den Aufrufen für ein natürliches Tempo.
- **Normal (1000 ms)**: 1 Sekunde Pause zwischen Ansagen für eine klarere Trennung.
- **Entspannt (1500 ms)**: 1,5 Sekunden Pause zwischen den Ansagen für ein ruhiges Kommentartempo.

### TTS-Stimme (Text-to-Speech)

Wählt aus, welche synthetische Stimme für gesprochene Rundenzeiten, Positionen, Führungsansagen und Kraftstoffstatus verwendet wird:

- **Systemstandard**: Verwendet die Standard-Sprachsynthesestimme Ihres Betriebssystems oder Browsers.
- **Installierte Stimmen**: Listet alle auf Ihrem System oder Browser erkannten Stimmen auf und zeigt deren Namen und Sprachcode an (z. B. `de-DE`, `en-US`).

### Sprachgeschwindigkeit

Steuert das Wiedergabetempo gesprochener TTS-Ansagen über einen Schieberegler von **0,1x** (sehr langsam) bis **2,0x** (doppelte Geschwindigkeit) in Schritten von 0,05. Die Standardgeschwindigkeit beträgt **1,0x**.

### Tonhöhe

Steuert die Tonhöhe/Frequenz von Sprachansagen über einen Schieberegler von **0,0x** (tiefe Stimme) bis **2,0x** (hohe Stimme) in Schritten von 0,05. Die Standardtonhöhe beträgt **1,0x**.

### Sprachlautstärke

Unabhängiger Schieberegler (0 % bis 100 %) speziell für TTS-Sprachansagen. Damit lässt sich die Lautstärke der Sprachkommentare im Verhältnis zu Renneffekten und Countdown-Signalen fein abstimmen.

### Stimme testen

Klicken Sie auf **Stimme testen**, um einen Beispiel-Testsatz mit den aktuell ausgewählten Einstellungen für Stimme, Geschwindigkeit, Tonhöhe und Lautstärke anzuhören.
