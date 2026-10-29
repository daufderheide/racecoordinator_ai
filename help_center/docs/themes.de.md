# Designs (Themes)

!!! note "Inhalt in Entwicklung"
    Dieser Artikel befindet sich im Aufbau. Weitere Details folgen in Kürze.

## Designs (Themes)

Jedes Theme bündelt visuelle Assets (Flaggen, Ampeln, Tankanzeigen), Audio-Ansagen und Layout-Zuweisungen:

- **Benutzerdefiniertes UI-Layout:** Das gekoppelte Display-Layout, das während des Rennens geladen wird.
- **Fahrerstand-Theme:** Das Theme, das beim Öffnen oder Scannen eines Fahrerstand-Fensters bzw. -Geräts verwendet wird.
- **Fahreransicht-Theme:** Das Theme, das beim Öffnen oder Scannen des Fahreransicht-Zeitplanfensters bzw. Mobilgeräts verwendet wird.

## Audio

Designs ermöglichen die Anpassung systemweiter Soundeffekte und Sprachansagen für Rennleitungsereignisse:

- **Start-Countdown:** Töne während der Startsequenz (`audio.countdown`).
- **Grüne Lampe / START:** Signalton beim Umschalten der Startampel auf Grün (`audio.countdown.green`).
- **Gelbe Flagge:** Warnsirenen während einer Gelbphase (`audio.yellowflag`).
- **Automatischer Start verbleibende Sekunden:** Countdown-Ansagen für die verbleibende Zeit bis zum automatischen Start eines Durchgangs (`audio.auto_start`).
- **Heat-Zeit (Verbleibende Sekunden):** Zeitansagen vor Durchgangsende (`audio.seconds_left`).
- **Führender-Rundenzahl (Verbleibende Runden):** Rundenansagen für den Führenden vor Durchgangsende (`audio.laps_left`).
- **Rennhälfte:** Ansage beim Erreichen der Halbzeit eines Durchgangs – sowohl für zeitbasierte Rennen (Halbzeit der Dauer) als auch für rundenbasierte Rennen (sobald der Führende die Hälfte der Runden absolviert hat) (`audio.seconds_left.halfway`).
- **Durchgang & Rennen beendet:** Signale für das Ende eines Durchgangs (`audio.heat_over`) oder des Rennens (`audio.race_over`).
- **Automatisches Weiterschalten verbleibende Sekunden:** Countdown-Ansagen für die verbleibende Zeit bis zum automatischen Weiterschalten zum nächsten Durchgang (`audio.auto_advance`).
- **Regelverstöße:** Töne bei Unterschreitung der Mindestrundenzeit (`audio.min_lap_time`).

Ausführliche Informationen zu Audio-Ducking, Prioritäten und Multi-Display-Filterung finden Sie in der Dokumentation zum [Audiosystem](audio.md).

## Fahrer-Audio-Überschreibungen

Themes können individuelle Fahreraudio-Einstellungen für alle Teilnehmer überschreiben, wenn das Theme aktiv ist. Standardmäßig werden die im [Fahrer-Editor](driver-editor.md) konfigurierten Töne der Fahrer abgespielt. Ein Theme kann jedoch selektiv jedes der 13 Fahrer-Audioereignisse überschreiben:

- **Persönliche Rundentöne:** Runde absolviert (`lapAudio`), Persönliche Bestzeit (`bestLapAudio`).
- **Renn-Rundentöne:** Beste Rennrunde (`raceBestLapAudio`), Beste Renn-Spurrunde (`raceLaneBestLapAudio`), Beste Durchgangsrunde (`heatBestLapAudio`), Neue Rennführung (`newRaceLeaderAudio`), Neue Durchgangsführung (`newHeatLeaderAudio`).
- **Gesamte Bestzeittöne:** Gesamt-Bestzeit (`overallBestLapAudio`), Gesamt-Spurbestzeit (`overallLaneBestLapAudio`).
- **Ereignistöne:** Boxeneinfahrt (`pitInAudio`), Kraftstoffstand (`fuelAudio`), Fehlstart / Strafe (`penaltyAudio`), Driftrunde (`driftLapAudio`).

### Überschreibungshierarchie & Konfiguration
- **Deaktiviert (Standard):** Das Theme lässt den Slot unberührt; die individuelle Konfiguration des Fahrers wird verwendet.
- **Aktivierte Überschreibung:** Das Theme hat für dieses spezifische Audioereignis bei allen Fahrern Vorrang. Es kann als **Voreingestellter Sound**, **Eigene Audiodatei**, **Text-zu-Sprache (TTS)** oder **Keine** (zur themenweiten Stummschaltung) konfiguriert werden.
- **Alle Überschreibungen zurücksetzen:** Entfernt alle aktiven Überschreibungen im Theme und stellt die Steuerung über die Fahrereinstellungen wieder her.
