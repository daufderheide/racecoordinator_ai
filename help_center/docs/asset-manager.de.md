# Asset Manager

## Übersicht {: #overview }

Der **Asset Manager** ermöglicht das Hochladen, Organisieren und Verwalten all Ihrer digitalen Rennressourcen, einschließlich Audiodateien, benutzerdefinierten Bildern, Bilderserien und Rotationsschemata in Race Coordinator AI.

Assets sind anpassbare Ressourcen, mit denen das Rennerlebnis personalisiert wird:

- **Sounddateien:** Benutzerdefinierte Audioansagen, Startsignale, Zielhörner und Kommentarausschnitte.
- **Audiosets:** Gruppierte Sammlungen von Audiodateien oder Text-to-Speech (TTS)-Ansagen, die bestimmten Schwellenwerten zugeordnet sind (Zeit in Sekunden, verbleibende Runden oder Kraftstoffprozentsatz).
- **Bilder:** Fahrzeuggrafiken, Fahrer-Avatare, Flaggen, Sponsorenlogos und Hintergrundbilder.
- **Bilderserien:** Sammlungen aufeinanderfolgender Bilder (z. B. für Kraftstoffanzeigen oder Countdown-Sequenzen).
- **Benutzerdefinierte Rotationen:** Benutzerdefinierte Heat-Rotationsschemata für spezielle Rennformate.

---

## Assets hinzufügen {: #adding-assets }

Das linke Bedienfeld des Asset Managers bietet vier Steuerelemente, um neue Assets einzeln oder im Massenupload zur Bibliothek hinzuzufügen:

1. **Upload-Zone:** Ziehen Sie eine oder mehrere Dateien per Drag & Drop direkt in den gestrichelten Bereich oder klicken Sie darauf, um den Dateibrowser zu öffnen. Sie können mehrere Dateien gleichzeitig hochladen.
   - Unterstützte Bildformate: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Unterstützte Audioformate: `.wav`, `.mp3`, `.ogg`.
2. **Neuer Bildersatz:** Öffnet den Bildersatz-Editor zum Erstellen einer zusammenhängenden Bilderserie für Animationen und Statusanzeigen wie Kraftstoffanzeigen oder Ampelsequenzen.
3. **Neues Audioset:** Öffnet den Audiosatz-Editor zum Erstellen von mehrstufigen Audiosequenzen für Countdown-Timer, verbleibende Runden oder Kraftstoffwarnungen.
4. **Neue benutzerdefinierte Rotation:** Öffnet den Rotationseditor zur Definition oder zum Import spezieller Spurwechsel- und Heat-Rotationsschemata.

---

## Asset-Bibliothek & Aktionen {: #asset-library }

Das Hauptbedienfeld zeigt alle in der Datenbank gespeicherten Bild- und Audio-Assets.

Wenn Sie mit der Maus über eine Asset-Karte fahren, werden Schnellaktionen angezeigt:
- **Audio-Wiedergabe:** Klicken Sie auf die Wiedergabetaste bei Audiokarten, um Soundeffekte direkt vorzuhören.
- **Bildvorschau:** Zeigt Vollauflösungsvorschauen von Grafik-Assets und Einzelbilder von Bilderserien an.
- **Direktes Umbenennen:** Klicken Sie auf den Namen oder das Bearbeitungssymbol, um das Asset direkt in der Übersicht umzubenennen.
- **Asset löschen:** Klicken Sie auf das Papierkorbsymbol, um ungenutzte Dateien aus der Datenbank zu entfernen.

Durch Klicken auf Assets können Sie diese auswählen. Bei ausgewählten Assets bietet die obere Werkzeugleiste Aktionen zur Massenbearbeitung und zum Löschen.

---

## Filter & Layout-Optionen {: #filter-tabs }

Der Asset Manager bietet Filter- und Ansichtssteuerelemente am oberen Rand der Bibliothek:

- **Filter-Reiter:** Schnelles Filtern nach Ressourcentyp:
  - **Alle:** Zeigt jedes Asset in der Datenbank an.
  - **Bilder:** Zeigt nur einzelne statische Bilddateien an (`.png`, `.jpg`, `.svg` usw.).
  - **Bildersets:** Zeigt mehrstufige Bilderserien und Tankanzeigen an.
  - **Sounds:** Zeigt einzelne Sounddateien an (`.wav`, `.mp3`, `.ogg`).
  - **Audiosets:** Zeigt schwellenwertgesteuerte Audiosammlungen an.
  - **Benutzerdefinierte Rotationen:** Zeigt benutzerdefinierte Rotationsschemata an.
- **Layout-Umschalter:** Wechseln Sie zwischen **Listenansicht**, **Kleinen Miniaturansichten**, **Mittleren Miniaturansichten** und **Großen Miniaturansichten**.
- **Nach Namen filtern:** Echtzeit-Suchfeld zur sofortigen Eingrenzung der Asset-Liste bei der Eingabe.

---

## Audiosets & Schwellenwerte

Ein **Audioset** ermöglicht es Ihnen, eine Reihe von Tönen oder gesprochenen Phrasen zu konfigurieren, die bei bestimmten numerischen Schwellenwerten ausgelöst werden:

*   **Zeit in Sekunden:** Wird in den Theme-Einstellungen für **Start-Countdown**, **Verbleibende Sekunden**, **Automatischer Start** und **Automatischer Durchlauf** verwendet.
*   **Rundenzahl:** Wird in den Theme-Einstellungen für **Verbleibende Runden** verwendet (z. B. Ansagen bei `10`, `5`, `1` und `0` verbleibenden Runden des Führenden).
*   **Kraftstoff-Prozentsatz (%):** Wird in den Fahrereinstellungen für **Kraftstoffstand-Töne** verwendet (z. B. bei `20%`, `10%`, `0%` leer oder `100%` voll).

### Doppelte Auslöser-Modi: Verbleibend vs. Verstrichen

Jeder Eintrag in einem Audioset kann mit einem **Auslösemodus** konfiguriert werden:

*   **Verbleibend (Countdown):** Wird ausgelöst, wenn sich das Rennen dem Ende oder der Ziellinie nähert.
*   **Verstrichen (Count-up):** Wird ausgelöst, wenn das Rennen ab dem Start voranschreitet.

---

## Verwendung von Assets in Themes & UI-Layouts

Nach dem Erstellen oder Hochladen stehen Ihre Assets in der gesamten Anwendung zur Verfügung:

- Wählen Sie benutzerdefinierte Soundeffekte im [Theme-Editor](themes.de.md) für Rundenzeiten, Führungswechsel und Start/Ziel-Signale.
- Weisen Sie Grafiken im [Fahrer-Editor](driver-editor.de.md) für Fahrzeugbilder und Avatare zu.
- Konfigurieren Sie visuelle Widgets und Instrumente im [Layout-Editor](layout-editor.de.md).
- Verknüpfen Sie Rotationsdateien im [Renn-Editor](race-editor.de.md).
