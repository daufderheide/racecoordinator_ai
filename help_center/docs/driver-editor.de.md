# Fahrer-Editor

Mit dem **Fahrer-Editor** können Sie Fahrerprofile, Spitznamen, Avatare und personalisierte Audioansagen erstellen, anzeigen und anpassen.

## Übersicht

Der Fahrer-Editor vereint die Fahrerauswahl und -bearbeitung in einer zentralen Benutzeroberfläche:

- **Fahrerauswahl**: Dieses Dropdown-Menü in der oberen Kopfzeile neben dem Seitentitel listet alle vorhandenen Fahrer auf und ermöglicht den schnellen Wechsel zwischen Fahrern.
- **Schreibgeschützter Modus**: Standardmäßig zeigt der Editor Fahrerdetails im schreibgeschützten Modus an. Die Formularfelder sind gesperrt, um versehentliche Änderungen zu vermeiden, während Audiowiedergaben weiterhin getestet werden können.
- **Bearbeitungsmodus**: Durch Klicken auf das **Bearbeiten**-Symbol (Stift) in der Symbolleiste werden die Formularfelder zur Bearbeitung freigegeben. Im Bearbeitungsmodus ist die Fahrerauswahl gesperrt, um unbeabsichtigtes Verlassen ungespeicherter Daten zu verhindern.
- **Änderungen speichern**: Durch Klicken auf das Symbol **Bearbeitung beenden** (Auge / Fertig) werden die Änderungen validiert, auf dem Server gespeichert und der Editor kehrt in den schreibgeschützten Modus zurück.
- **Änderungen verwerfen**: Wenn Sie versuchen, den Editor mit ungespeicherten Änderungen zu verlassen, fordert Sie der Bestätigungsdialog auf, das Verwerfen zu bestätigen. Beim Verwerfen werden alle Änderungen auf die zuletzt gespeicherte Version zurückgesetzt.

## Symbolleisten-Aktionen

Die obere Symbolleiste bietet folgende Aktionen:

- **Zurück**: Kehrt zur vorherigen Ansicht oder zur Renntag-Einrichtung zurück.
- **Fahrer hinzufügen (+)**: Erstellt eine neue Fahrervorlage und wechselt in den Bearbeitungsmodus.
- **Fahrer kopieren**: Dupliziert das aktuell ausgewählte Fahrerprofil in eine neue Vorlage.
- **Bearbeiten / Fertig**: Schaltet zwischen schreibgeschütztem Modus und Bearbeitungsmodus um.
- **Fahrer importieren**: Öffnet das Dialogfeld zum Importieren von Fahrerprofilen, Avataren und Audioeinstellungen aus externen Dateien.
- **Alle erweitern / reduzieren**: Erweitert oder reduziert alle Akkordeon-Abschnitte auf einmal.
- **Fahrer löschen**: Löscht das ausgewählte Fahrerprofil nach Bestätigung.
- **Hilfe (?)**: Startet die interaktive Einführungstour für die Bereiche des Editors.

## Fahrerdetails

- **Name**: Der vollständige Name des Fahrers, der auf Ranglisten und Berichten angezeigt wird.
- **Spitzname**: Ein Kurzname oder gesprochener Name für Text-to-Speech (TTS)-Ansagen.
- **Name & Spitzname verknüpfen**: Wenn aktiviert, wird die Eingabe im Namensfeld automatisch in das Spitznamenfeld übernommen.
- **Avatar**: Wählen Sie ein Bild oder Symbol für den Fahrer aus.

## Audioansagen & Soundeffekte

Konfigurieren Sie individuelle Soundeffekte oder Text-to-Speech (TTS)-Ansagen für diesen Fahrer:

- **Runden-Audio**: Wird beim Beenden einer normalen Runde abgespielt.
- **Persönliche Bestzeit**: Wird abgespielt, wenn der Fahrer seine schnellste Runde fährt.
- **Meilensteine & Rekorde**: Eigene Sounds oder Ansagen für Bahnrekorde, Laufrekorde und Rennführung.
- **Audiodateien testen**: Die Wiedergabetaste bleibt in beiden Modi aktiv, um Sounds jederzeit probehören zu können.

## Fahrer importieren

Race Coordinator AI unterstützt das stapelweise Importieren von Fahrern aus externen Dateien, einschließlich Massenerstellung, Konfliktbehebung, benutzerdefinierter Audio- und Bildmedien sowie Standardeinstellungen für leere Audioslots.

### Unterstützte Dateiformate

- **CSV (`.csv`)**: Textdateien mit Komma-, Semikolon- oder Tabulatortrennung. Spaltenüberschriften werden flexibel abgeglichen (ohne Berücksichtigung von Groß-/Kleinschreibung, Leerzeichen und Unterstrichen).
- **Excel (`.xlsx`, `.xls`)**: Microsoft Excel-Tabellen. Das erste Tabellenblatt wird anhand der Spaltenüberschriften verarbeitet.
- **JSON (`.json`)**: Ein Array von Fahrerobjekten oder ein Objekt mit einem `"drivers"`-Array.
- **ZIP-Paket (`.zip`)**: Ein ZIP-Archiv, das eine Datendatei (`drivers.csv`, `drivers.xlsx` oder `drivers.json`) zusammen mit referenzierten Audio- (`.wav`, `.mp3`, `.ogg`) und Avatar-Bilddateien (`.png`, `.jpg`, `.jpeg`) enthält.

### Spalten- & Feldzuordnung

Die folgenden Spalten und JSON-Felder werden erkannt:

| Feld | Erkannte Spalten-Aliase | Beschreibung | Standard / Fallback |
| :--- | :--- | :--- | :--- |
| **Name** | `Name`, `Driver`, `Driver Name`, `Full Name` | Vollständiger Fahrername (erforderlich). | Keiner (Zeilenfehler, wenn leer) |
| **Spitzname** | `Nickname`, `Nick`, `Callout`, `Display Name` | Kurzname oder gesprochener Rufname. | Fällt auf **Name** zurück, falls leer. Wird auf Duplikate geprüft. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Relativer Dateiname (z. B. `john.png`), Medienname oder URL. | Keiner |
| **Standard-Audio** | `Default Audio`, `Blank Audio`, `Audio Default` | Anweisung für leere Audioslots: `none` / `muted` oder `system` / `default`. | Aus Dateianweisung oder Modalauswahl |
| **Runden-Audio** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Beim Beenden einer Standardrunde abgespielter Ton. | Gemäß Audiomodus vorgegeben |
| **Persönliche Bestzeit** | `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Beim Aufstellen einer persönlichen Bestzeit abgespielter Ton. | Gemäß Audiomodus vorgegeben |
| **Bahnrekord** | `Track Record Audio`, `Track Record`, `Record Audio` | Ton beim Brechen des Bahnrekords. | Gemäß Audiomodus vorgegeben |
| **Rennführung** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Ton bei Übernahme der Rennführung. | Gemäß Audiomodus vorgegeben |
| **Mindestrundenzeit** | `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Ton bei Unterschreiten der Mindestrundenzeit. | Gemäß Audiomodus vorgegeben |
| **Drift-Runde** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Während einer Driftrunde abgespielter Ton. | Gemäß Audiomodus vorgegeben |
| **Frühstart** | `False Start Audio`, `False Start`, `Penalty Audio` | Ton bei Frühstart oder Strafe. | Gemäß Audiomodus vorgegeben |
| **Boxeneinfahrt** | `Pit In Audio`, `Pit In`, `Pit Stop` | Ton bei Einfahrt in die Boxengasse. | Gemäß Audiomodus vorgegeben |
| **Kraftstoffwarnung** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Ton bei niedrigem Kraftstoffstand. | Gemäß Audiomodus vorgegeben |
| **Kraftstoff leer** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Ton, wenn das Fahrzeug ohne Kraftstoff liegenbleibt. | Gemäß Audiomodus vorgegeben |

### Syntax für Audio-Slots

Audiowerte können in folgenden Formaten angegeben werden:
- **`none`** oder **`off`** / **`mute`**: Slot ist stummgeschaltet (kein Ton).
- **`tts:<text>`** oder **`${nickname} übernimmt die Führung`**: Text-to-Speech-Ansage. Einfache Klammern `{nickname}` und `${driver}` werden unterstützt.
- **`preset:<sound>`**: Verwendet integrierte Systemsounds (z. B. `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Dateiname (z. B. `cheer.wav`, `v8_rev.mp3`)**: Verweist auf eine Begleitmediendatei, die mit dem Import hochgeladen oder in einer ZIP-Datei gebündelt wurde.

### Dateianweisungen für leere Audio-Slots

Sie können direkt in der Datei festlegen, wie leere Audio-Slots behandelt werden:
- In CSV: `# default-audio: none` oder `# default-audio: system` in Kommentarkopfzeilen.
- In JSON: `"default_audio": "none"` auf Stammobjektebene.
- In Excel/CSV: Geben Sie eine Spalte `Default Audio` pro Fahrerzeile an.
- In der Benutzeroberfläche: Verwenden Sie das Dropdown-Menü **Leere Audio-Slots** im Import-Modal.

### Medien- & Ressourcen-Auto-Import

Beim Importieren von Fahrern mit benutzerdefinierten Avataren oder Soundeffekten:
1. **Mehrfachauswahl per Drag & Drop**: Ziehen Sie Ihre `.csv`- oder `.xlsx`-Datei zusammen mit beliebigen `.wav`-, `.mp3`-, `.png`- oder `.jpg`-Begleitdateien gleichzeitig in den Upload-Bereich.
2. **ZIP-Paket**: Legen Sie Ihre Datendatei und Mediendateien in ein `.zip`-Archiv und laden Sie das Archiv hoch.
3. **Automatische Registrierung**: Der Server nimmt Medien in den internen Medien-Manager auf, berechnet SHA-256-Deduplizierungs-Hashes und verknüpft die resultierenden Assets automatisch mit den jeweiligen Fahrer-Avataren und Audioslots.

### Konfliktbehebung

Wenn ein Fahrer in der Datei mit einem vorhandenen Fahrernamen oder Spitznamen in der Datenbank übereinstimmt, erkennt die interaktive Vorschautabelle den Konflikt und bietet drei Lösungsstrategien:
- **Automatisch umbenennen**: Benennt den importierten Fahrer um (z. B. `Alice Walker (1)`), sodass vorhandene Profile unverändert bleiben.
- **Vorhandene überschreiben**: Aktualisiert das vorhandene Fahrerprofil mit den neu importierten Attributen, Avataren und Audiokonfigurationen.
- **Überspringen**: Ignoriert die betroffene Zeile beim Import.

Sie können Lösungen zeilenweise festlegen, eine Lösung auf alle Konflikte gleichzeitig anwenden oder Namen und Spitznamen direkt in der Vorschautabelle bearbeiten.
