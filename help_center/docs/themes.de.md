# Themes

## Übersicht {: #overview }

Themes definieren die vollständige audiovisuelle Präsentation und die atmosphärische Gestaltung Ihrer Rennveranstaltungen in Race Coordinator AI. Anstatt Anzeigeelemente, Beleuchtungsgrafiken und Audioansagen für jedes Rennen einzeln zu konfigurieren, bündeln Themes diese visuellen und akustischen Komponenten in wiederverwendbaren Profilen.

Wenn ein Theme aktiv ist, koordiniert es:
- Das gekoppelte Bildschirmlayout auf dem Hauptbildschirm.
- Synchronisierte Grafiken für Flaggen, Startampelleuchten und Tankanzeigen.
- Systemweite Soundeffekte, Countdown-Signale und Sprachansagen.
- Zentralisierte Audio-Überschreibungen für individuelle Fahrer-Soundeffekte.

---

## Theme-Einstellungen {: #top-selectors }

In der oberen Steuerungsleiste des Theme-Editors legen Sie die Kerneigenschaften und verknüpften Layouts für das Theme fest:

- **Theme-Name:** Die eindeutige Kennung des Themes. Standardsystem-Themes (*RC AI*, *Formula*, *Endurance*) sind geschützt und können weder gelöscht noch umbenannt werden.
- **Verknüpftes UI-Layout:** Wählt das im [Layout-Editor](layout-editor.de.md) erstellte Bildschirmlayout aus, das beim Start eines Rennens mit diesem Theme automatisch auf der Hauptanzeige geladen wird.
- **Fahrerstand-Theme:** Bestimmt das Theme für dedizierte Einzelfahrspur-Fahrerstand-Displays oder wenn sich ein Fahrer per Mobilgerät oder Tablet verbindet.
- **Fahreransicht-Theme:** Bestimmt das Theme für mehrspurige Fahreransicht-Zeitplananzeigen und Zuschauerbildschirme.

---

## Flaggenbilder {: #flags }

Im Bereich Flaggenbilder können Sie die Grafiken anpassen, die auf der Rennanzeige, in Flaggen-Widgets und an Fahrerständen für jeden Rennzustand angezeigt werden:

- **Rennen (`flag.racing`):** Wird bei aktiven Rennbedingungen angezeigt, wenn die Strecke freigegeben ist.
- **Lauf pausiert (`flag.heat_paused`):** Gelbe Vorsichtsflagge, die bei einer Bahnunterbrechung oder Rennpause angezeigt wird.
- **Lauf beendet (`flag.heat_over`):** Zielflagge, die signalisiert, dass die Laufzeit oder die geforderten Runden abgelaufen sind.
- **Rennen beendet (`flag.race_over`):** Finale Zielflagge zum Abschluss der gesamten Rennveranstaltung.
- **Nicht gestartet (`flag.not_started`):** Flagge vor Beginn eines Laufs oder Rennens.
- **Startet (`flag.starting`):** Rote Flagge während des anfänglichen Countdowns vor dem Umschalten auf Grün.
- **Neustart (`flag.restarting`):** Flagge während des Neustart-Countdowns nach einer Gelbphase oder Bahnunterbrechung.
- **Letzte Runde (`flag.one_lap_to_go`):** Weiße Flagge, die anzeigt, dass der Führende seine letzte Runde fährt.
- **Lauf schließt ab (`flag.heat_finishing`):** Wird angezeigt, wenn der Sieger die Ziellinie überquert hat und nachfolgende Fahrzeuge ihre laufende Runde beenden.
- **Aufwärmen (`flag.warmup`):** Flagge während Trainings- und Aufwärmphasen vor dem Rennen.
- **Fahrer fertig (`flag.driver_finished`):** Spurspezifische oder individuelle Anzeige für Fahrer, die alle Runden absolviert haben.
- **Strafe (`flag.penalty`):** Schwarze Flagge / Strafanzeige bei Frühstarts oder Rundenzeit-Unterschreitungen.

Für jede Flagge können Sie integrierte Vorlagen wählen oder benutzerdefinierte SVG-, PNG-, WebP- oder JPG-Grafiken über den [Asset-Manager](asset-manager.de.md) hochladen.

---

## Startampelleuchten {: #countdown }

Der Bereich Startampeln konfiguriert die Leuchtengrafiken für Countdown-Widgets und Startampeln auf dem Bildschirm:

- **Rote Lampe aus (`lamp.red.dim`):** Gedimmte oder unbeleuchtete rote Ampel im Ruhezustand.
- **Rote Lampe ein (`lamp.red.on`):** Hell leuchtende rote Ampel während der Countdown-Stufen vor dem Start.
- **Grüne Lampe (`lamp.green`):** Helle grüne Ampel im Moment des Rennstarts oder Neustarts, wenn Bahnstrom freigegeben wird.

Diese Grafiken passen sich automatisch an horizontale und vertikale Startampel-Widgets in Ihren Layouts an.

---

## Tankanzeige {: #fuel-gauge }

Der Bereich Tankanzeige konfiguriert mehrstufige Bildsets für analoge und digitale Kraftstoffsimulationen:

- **Tankanzeigen-Set (`gauge.fuel`):** Ein Bildset mit mehreren Einzelbildern, das den Füllstand von 100% (voll) bis 0% (leer) darstellt.

Bei aktiver Kraftstoffsimulation berechnet Race Coordinator AI den Verbrauch kontinuierlich und aktualisiert das Anzeige-Frame in Echtzeit. Bei Erreichen der Reserve warnt die Anzeige optisch, damit Fahrer die Boxengasse ansteuern.

---

## Soundeffekte {: #audio }

Themes ermöglichen die Anpassung systemweiter Soundeffekte, Countdown-Töne, Zeitansagen und Sprachnachrichten:

- **Start-Countdown (`audio.countdown`):** Tonsignale während des Start-Countdowns vor Laufbeginn.
- **Grüne Lampe / START (`audio.countdown.green`):** Ton oder Signal beim Umschalten auf Grün.
- **Gelbe Flagge (`audio.yellowflag`):** Warnsirenen oder Hupen bei einer Bahnunterbrechung.
- **Automatischer Start Restsekunden (`audio.auto_start`):** Countdown-Sprachansagen vor automatischem Laufstart.
- **Laufzeit Restsekunden (`audio.seconds_left`):** Regelmäßige Zeitansagen der verbleibenden Laufdauer.
- **Halbzeit (`audio.seconds_left.halfway`):** Benachrichtigung bei Erreichen der Halbzeit eines Laufs.
- **Führender Runden verbleibend (`audio.laps_left`):** Sprachansagen über verbleibende Runden des Führenden.
- **Lauf beendet (`audio.heat_over`):** Tonsignal zum Abschluss des aktuellen Laufs.
- **Rennen beendet (`audio.race_over`):** Fanfare oder Tonsignal zum Abschluss des gesamten Rennens.
- **Automatisches Weiterschalten (`audio.auto_advance`):** Countdown-Ansagen vor automatischem Wechsel zum nächsten Lauf.
- **Mindestrundenzeit-Verletzung (`audio.min_lap_time`):** Warnton bei Unterschreitung der Mindestrundenzeit.

Jeder Audio-Slot kann konfiguriert werden als:
1. **Preset-Sound:** Standard-Soundeffekt aus der integrierten Bibliothek.
2. **Benutzerdefiniertes Audio:** Eigene WAV-, MP3- oder OGG-Dateien aus dem Asset-Manager.
3. **Text-to-Speech (TTS):** Dynamische Sprachsynthese mit Variablen wie `{time}` und `{laps}`.

Ausführliche Informationen zu Audio-Prioritäten und Display-Zuweisung finden Sie in der Dokumentation zum [Audio-System](audio.de.md).

---

## Fahrer-Audio-Überschreibungen {: #driver-audio-overrides }

Im Standardbetrieb kann jeder Fahrer eigene Rundentöne und Sprachansagen im [Fahrer-Editor](driver-editor.de.md) festlegen. Bei Clubrennen oder Meisterschaften ist jedoch oft ein einheitliches Audioerlebnis für alle Teilnehmer erwünscht.

Der Bereich **Fahrer-Audio-Überschreibungen** ermöglicht es dem Theme, einzelne oder alle Audioansagen fahrerübergreifend zentral zu überschreiben.

### Verfügbare Fahrer-Audio-Überschreibungen

Das Theme kann alle 13 individuellen Fahrer-Audioereignisse überschreiben:

#### Persönliche Runden-Sounds
- **Runde abgeschlossen (`lapAudio`):** Ton bei jeder regulär absolvierten Runde.
- **Persönliche Bestzeit (`bestLapAudio`):** Signal bei Verbesserung der eigenen Rundenbestzeit in der aktuellen Session.

#### Rennrunden-Sounds
- **Renn-Bestzeit (`raceBestLapAudio`):** Ton bei Erzielung der schnellsten Runde des laufenden Rennens über alle Spuren hinweg.
- **Spur-Bestzeit im Rennen (`raceLaneBestLapAudio`):** Signal für die schnellste Runde auf der jeweiligen Spur im aktuellen Rennen.
- **Lauf-Bestzeit (`heatBestLapAudio`):** Ton für die schnellste Runde des aktiven Laufs.
- **Neue Rennführung (`newRaceLeaderAudio`):** Sprachausruf oder Jubelsound bei Übernahme der Gesamtführung im Rennen.
- **Neue Laufführung (`newHeatLeaderAudio`):** Signal bei Übernahme von Platz 1 im laufenden Durchgang.

#### Gesamt-Bestzeit-Sounds
- **Allzeit-Streckenrekord (`overallBestLapAudio`):** Hochpriorisierter Ton beim Aufstellen eines absoluten Streckenrekords.
- **Allzeit-Spurrekord (`overallLaneBestLapAudio`):** Signal für den Allzeit-Rekord auf der jeweiligen Spur.

#### Ereignis-Sounds
- **Boxeneinfahrt (`pitInAudio`):** Signal bei Einfahrt in die Boxengasse oder Auslösung von Boxensensoren auf digitalen Bahnen.
- **Treibstoffwarnung (`fuelAudio`):** Warnton oder Durchsage bei Erreichen des Reservebereichs oder Treibstoffmangel.
- **Frühstart / Strafe (`penaltyAudio`):** Signalton oder Sirene bei Frühstart oder Strafen.
- **Drift-Runde (`driftLapAudio`):** Stunt-Soundeffekt bei Überschreiten von Driftsensorschwellen.

### Überschreibungs-Prioritäten & Modi

Jedes Fahrer-Audioereignis kann unabhängig eingestellt werden:

- **Deaktiviert (Kontrollkästchen nicht markiert):** Das Theme greift nicht ein. Race Coordinator AI spielt die individuellen Fahrer-Einstellungen ab (oder den Systemstandard).
- **Aktiviert (Kontrollkästchen markiert):** Das Theme überschreibt das Ereignis für **alle Fahrer**, die unter diesem Theme fahren.

Bei aktiver Überschreibung stehen vier Modi zur Verfügung:
1. **Preset-Sound:** Auswahl eines Standardeffekts aus dem Katalog.
2. **Eigenes Audio:** Auswahl einer hochgeladenen Tondatei aus dem Asset-Manager.
3. **Text-to-Speech (TTS):** Eingabe eines benutzerdefinierten Textes mit Variablen-Interpolation:
   - `{driver}` — Name oder Spitzname des Fahrers.
   - `{time}` — Rundenzeit mit 3 Nachkommastellen (z. B. `3.142`).
   - `{lane}` — Aktive Spurnummer.
   - `{lap}` — Aktuelle Rundenzahl.
   - `{gap}` — Zeitabstand zum Führenden.
4. **Kein Ton (Stumm):** Schaltet das Ereignis theme-weit vollständig stumm.

### Alle Überschreibungen zurücksetzen

Klicken Sie auf **Alle Überschreibungen zurücksetzen** im Kopfbereich der Fahrer-Audio-Überschreibungen, um alle Überschreibungen mit einem Klick zu entfernen und die Kontrolle wieder den individuellen Fahrerprofilen zu übergeben.
