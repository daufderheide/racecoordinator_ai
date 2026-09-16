# Designs (Themes)

!!! note "Inhalt in Entwicklung"
    Dieser Artikel befindet sich im Aufbau. Weitere Details folgen in Kürze.

## Audio

Designs ermöglichen die Anpassung systemweiter Soundeffekte und Sprachansagen für Rennleitungsereignisse:

- **Start-Countdown:** Töne während der Startsequenz (`audio.countdown`).
- **Grüne Lampe / START:** Signalton beim Umschalten der Startampel auf Grün (`audio.countdown.green`).
- **Gelbe Flagge:** Warnsirenen während einer Gelbphase (`audio.yellowflag`).
- **Verbleibende Sekunden:** Zeitansagen vor Durchgangsende (`audio.seconds_left`).
- **Verbleibende Runden:** Rundenansagen für den Führenden vor Durchgangsende (`audio.laps_left`).
- **Rennhälfte:** Ansage beim Erreichen der Halbzeit eines Durchgangs – sowohl für zeitbasierte Rennen (Halbzeit der Dauer) als auch für rundenbasierte Rennen (sobald der Führende die Hälfte der Runden absolviert hat) (`audio.seconds_left.halfway`).
- **Durchgang & Rennen beendet:** Signale für das Ende eines Durchgangs (`audio.heat_over`) oder des Rennens (`audio.race_over`).
- **Regelverstöße:** Töne bei Unterschreitung der Mindestrundenzeit (`audio.min_lap_time`) oder Driftrunden (`audio.drift_lap`).

Ausführliche Informationen zu Audio-Ducking, Prioritäten und Multi-Display-Filterung finden Sie in der Dokumentation zum [Audiosystem](audio.md).
