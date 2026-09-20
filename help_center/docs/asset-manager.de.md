# Asset Manager

Der **Asset Manager** ermöglicht es Ihnen, alle Ihre digitalen Renn-Assets hochzuladen, zu organisieren und zu verwalten, einschließlich Audiodateien, benutzerdefinierter Bilder, Bildersets und Rotationsschemata.

## Übersicht

Assets sind benutzerdefinierte Ressourcen, die in der gesamten Anwendung verwendet werden, um das Rennerlebnis zu personalisieren:

- **Sounddateien:** Benutzerdefinierte Audioansagen, Starttöne, Zielhörner und Kommentarclips.
- **Audio-Sets:** Gruppierte Sammlungen von Audiodateien oder Text-to-Speech-(TTS-)Ansagen, die bestimmten Auslösewerten zugeordnet sind (Zeit in Sekunden, verbleibende Runden oder Kraftstoffprozentsatz).
- **Bilder:** Fahrzeuggrafiken, Fahrer-Avatare, benutzerdefinierte Flaggen, Sponsor-Logos und Hintergrundbilder.
- **Bildersets:** Sammlungen verwandter Bilder (z. B. Tankanzeigen oder Countdown-Sequenzen).
- **Benutzerdefinierte Rotationen:** Benutzerdefinierte Rundenrotations-Assets für komplexe Rotationsformate.

## Assets hochladen

So laden Sie neue Assets in Ihre Bibliothek hoch:

1. Öffnen Sie den **Asset Manager** über das Hauptmenü oder die Konfigurations-Symbolleiste.
2. Ziehen Sie einzelne oder mehrere Dateien per Drag & Drop in den Bereich **Assets hochladen** oder klicken Sie, um Ihren Computer zu durchsuchen.
3. Unterstützte Formate sind `.wav`, `.mp3`, `.ogg` für Audio und `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` für Bilder.

## Audio-Sets & Auslösewerte

Ein **Audio-Set** ermöglicht es Ihnen, eine Reihe von Tönen oder Sprachansagen zu konfigurieren, die bei bestimmten numerischen Schwellenwerten ausgelöst werden. Je nachdem, wo das Audio-Set in Race Coordinator AI zugewiesen ist, stehen die Eintragswerte für unterschiedliche Einheiten:

*   **Zeit in Sekunden:** Wird in den Theme-Einstellungen für **Start-Countdown**, **Verbleibende Sekunden**, **Autostart** und **Automatisches Weiterschalten** verwendet (z. B. Einträge bei `5`, `4`, `3`, `2`, `1` und `0` Sekunden).
*   **Rundenzahl:** Wird in den Theme-Einstellungen für Ansagen der **Verbleibenden Runden** verwendet. Einträge legen Ansagen fest, wenn der Führende bestimmte Restrundenzahlen erreicht (z. B. `10`, `5`, `1` und `0` verbleibende Runden).
*   **Kraftstoffprozentsatz (%):** Wird in den Fahrereinstellungen für **Kraftstoffstandstöne** verwendet. Einträge legen Ansagen fest, wenn der Kraftstoffstand des Fahrers Warn-, kritische oder Voll-Schwellenwerte erreicht (z. B. `20%`, `10%`, `0%` leer oder `100%` vollgetankt).

Im **Audio-Set-Editor** können Sie Einträge hinzufügen, vordefinierte Audiodateien auswählen oder TTS-Phrasen eingeben (mit Vorlagenvariablen wie `{driver.nickname}`), Auslösewerte festlegen und mit der Schaltfläche **Werte automatisch aus Namen extrahieren** Werte automatisch aus nummerierten Dateinamen übernehmen (z. B. `10.mp3`, `5.mp3`).

### Duale Auslösemodi: Verbleibend vs. Abgelaufen

Jeder Eintrag in einem Audio-Set kann mit einem **Auslösemodus** konfiguriert werden:

*   **Verbleibend (Countdown):** Wird ausgelöst, wenn das Rennen sich dem Ende oder dem Zeitlimit nähert (z. B. 10 verbleibende Runden oder 30 Sekunden verbleibend). Dies ist der Standardmodus für Countdowns.
*   **Abgelaufen (Vorwärtszählung):** Wird ausgelöst, wenn das Rennen vom Start aus voranschreitet (z. B. 10 absolvierte Runden oder 30 abgelaufene Sekunden im Lauf).

#### Gleicher Zahlenwert für zwei Ereignisse
Race Coordinator AI unterstützt die Konfiguration von zwei Einträgen mit exakt demselben numerischen Wert (z. B. Wert `10`):
- Ein Eintrag als **Abgelaufen** wird abgespielt, wenn der Führende diesen Meilenstein erreicht (z. B. bei 10 gefahrenen Runden).
- Ein Eintrag als **Verbleibend** wird abgespielt, wenn sich das Rennen dem Ziel nähert (z. B. wenn noch 10 Runden verbleiben).

#### Natürliche Rennverlauf-Vorschau
Bei der Vorschau oder automatischen Wiedergabe eines Audio-Sets im Asset Manager oder Audio-Selector werden die Sounds in natürlicher Rennreihenfolge abgespielt:
1. Alle **Abgelaufen**-Einträge spielen zuerst in aufsteigender Reihenfolge (0 → N).
2. Alle **Verbleibend**-Einträge spielen danach in absteigender Countdown-Reihenfolge (N → 0).

## Assets verwalten & organisieren

- **Kategorie-Filterung:** Filtern Sie Ihre Asset-Liste nach Typ (Bilder, Sounds, Bildersets, Rotationen).
- **Vorschau & Wiedergabe:** Klicken Sie auf eine Audiodatei für die Wiedergabe oder auf ein Bild für die Vorschau.
- **Umbenennen:** Geben Sie Ihren Assets klare Namen zur einfachen Auswahl im UI-Editor und Theme Manager.
