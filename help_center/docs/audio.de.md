# Audiosystem

Race Coordinator AI verfügt über eine intelligente Zweikanal-Audio-Engine, die reichhaltige Soundeffekte, dynamische Sprachkommentare und wichtige Rennleiter-Durchsagen ohne chaotische Überschneidungen oder verpasste Signale liefert.

---

## Zweikanal-Audioarchitektur

Die Audio-Engine trennt den Ton in zwei verschiedene Kanäle:

```
                      ┌────────────────────────────────────────┐
                      │            Audio Dispatcher            │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   Soundeffekte (SFX)   │                      │     Sprachansagen      │
     │ (Nicht-verbale Presets)│                      │   (TTS & Kommentare)   │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
         Polyphone Wiedergabe                         Priorisierte Einzelstimme
    (Gleichzeitiges Abspielen)                       ("Abspielen, Verdrängen,  
                  │                                        Verwerfen")        
                  │◄────────────── Audio-Ducking ─────────────────┤
                  │     (SFX werden automatisch auf 20%           │
                  │      abgesenkt, während Sprache aktiv ist)    │
```

### 1. Soundeffekte (SFX)
- **Umfang:** Kurze, nicht-verbale Signaltöne wie Runden-Pieptöne (`default_beep`), Vorbeifahr-Geräusche (`default_driveby`) oder Glockensignale.
- **Polyphone Wiedergabe:** Soundeffekte werden sofort über HTML5-Audioelemente abgespielt. Überqueren mehrere Fahrzeuge gleichzeitig die Ziellinie, wird für jedes Fahrzeug parallel der jeweilige Rundenton ausgelöst, ohne sich gegenseitig abzuschneiden.
- **Automatisches Audio-Ducking:** Während eine Sprachansage aktiv spricht, werden gleichzeitige Soundeffekte automatisch auf **20% Lautstärke** abgesenkt. Sobald die Sprachansage beendet ist, kehren die Soundeffekte sofort zu 100% Lautstärke zurück.

### 2. Sprachansagen (Voice Callouts)
- **Umfang:** Gesprochene Text-to-Speech-Ansagen (TTS) sowie voraufgezeichnete verbale WAV-/MP3-Dateien (z. B. Kommentare, Gelbphasen-Sirenen, Boxen-Warnungen und Countdown-Stimmen).
- **Einzelstimmen-Engine:** Sprachansagen werden über einen Einkanal-Mechanismus mit dem **"Abspielen, Verdrängen oder Verwerfen"**-Prinzip gesteuert, um zu verhindern, dass Stimmen durcheinanderreden.

---

## Das Prioritätssystem & Wiedergabe-Logik

Da bei Rennen viele Ereignisse gleichzeitig eintreten (mehrere Zieldurchfahrten, Führungswechsel, Gelbphasen, Zeitansagen), nutzt Race Coordinator AI eine vierstufige Prioritätshierarchie:

### Prioritätsstufen

| Prioritätsstufe | Gewichtung | Typische Ereignisse | Verhalten bei Kanalkonflikten |
| :--- | :---: | :--- | :--- |
| **`urgent`** (Dringend) | 4 | Gelbe Flagge, Durchgang beendet, Rennen beendet, Fehlstart, Mindestrundenzeit-Verletzung, Driftrunden-Verletzung, Boxeneinfahrt, Kraftstoff-Warnungen (Warnung, Kritisch, Leer). | **Verdrängt** aktive Ansagen niedrigerer Priorität sofort. Wenn bereits eine dringende Ansage läuft, werden neue dringende Ansagen in die **Dringlichkeits-Warteschlange** eingereiht. Umgeht den Kadenz-Abstand. |
| **`high`** (Hoch) | 3 | Gesamter Streckenrekord, Spur-Streckenrekord, Neuer Rennführender, Beste Rennrunde. | **Verdrängt** aktive Ansagen mit Priorität `normal` oder `low`. Wird **verworfen**, wenn eine Ansage mit Priorität `urgent` oder gleich/höher aktiv ist. |
| **`normal`** (Normal) | 2 | Zeitansagen (z. B. "Noch 30 Sekunden"), Rennhälfte, Beste Durchgangsrunde, Beste Renn-Spurrunde, Neuer Durchgangsführender, Persönliche Bestzeit (wenn als TTS konfiguriert). | **Verdrängt** aktive Ansagen mit Priorität `low`. Wird **verworfen**, wenn eine Ansage mit `urgent`, `high` oder eine andere `normal`-Ansage aktiv ist. |
| **`low`** (Niedrig) | 1 | Reguläre Rundenansage des Fahrers (wenn als TTS konfiguriert). | Spielt nur ab, wenn der Sprachkanal vollkommen frei ist. Wird **verworfen**, wenn eine andere Ansage aktiv ist. |

### Kollisionsregeln

1. **Verdrängung (Preemption):** Trifft ein Ereignis mit höherer Priorität ein als die aktuell laufende Sprachansage, wird die aktuelle Ansage sofort gestoppt und die neue, höher priorisierte Ansage beginnt unmittelbar.
2. **Verwerfen (Dropping):** Hat die eingehende Ansage eine gleiche oder niedrigere Priorität als die aktive Ansage, wird sie verworfen, damit Stimmen nicht kollidieren.
3. **Dringlichkeits-Warteschlange (Urgent Queueing):** Dringende Ansagen (`urgent`) sind sicherheits- und rennleitungsrelevant. Läuft bereits eine dringende Ansage, wird eine neue dringende Ansage in die Warteschlange eingereiht und abgespielt, sobald die vorherige Ansage endet.
4. **Kadenzpause (Callout Spacing):** Nach jeder beendeten Sprachansage wird eine kurze Pause eingelegt, bevor die nächste nicht-dringende Ansage beginnen darf. Dringende Alarme umgehen diese Pause sofort.

### Meilenstein-Audio-Priorität & Fallback

Wenn ein Fahrer eine Runde fährt, die einen oder mehrere Meilensteine auslöst (z. B. Streckenrekord, beste Durchgangsrunde oder Führungswechsel):

1. **Prioritätskaskade bei gleichzeitigen Ereignissen:** Kandidaten-Meilensteintöne werden in strikter Prioritätsreihenfolge ausgewertet (Gesamtrekord -> Gesamt-Spurrekord -> Neuer Rennleiter -> Neuer Durchgangsleiter -> Renn-Bestzeit -> Renn-Spurbestzeit -> Durchgangs-Bestzeit -> Persönliche Bestzeit). Ist der höchstpriorisierte Ton auf `none` gestellt (oder nicht konfiguriert), geht das System zum nächsthöheren ausgelösten Ton über und spielt diesen ab, sofern konfiguriert.
2. **Verworfene Ansagen bei belegtem Sprachkanal:** Wird eine ausgewählte Meilenstein-Sprachansage **verworfen** (z. B. weil eine höher priorisierte Ansage spricht oder während einer Kadenzpause), werden für diese Runde keine weiteren Sprachansagen versucht. Stattdessen greift das System direkt auf die **persönliche Bestzeit-Audiodatei** (falls PB-Runde) oder den **regulären Rundenton** zurück.
3. **Polyphoner SFX-Fallback:** Ist der Fallback-Ton ein Soundeffekt (SFX), wird er polyphon über den SFX-Kanal abgespielt. So erhalten Fahrer selbst während laufender Kommentare immer eine akustische Bestätigung beim Überqueren der Ziellinie.

---

## Audio-Konfigurationseinstellungen

Globale Audioparameter können im **UI-Editor** im Bereich **Audio-Einstellungen** angepasst werden:

### Gesamtlautstärke (Master Volume)
- **Bereich:** 0% bis 100% (Standard: `100%`)
- **Beschreibung:** Bestimmt die maximale Lautstärke für die gesamte Anwendung und skaliert sowohl Soundeffekte als auch Text-to-Speech.

### Dringlichkeits-Timeout (Urgent Queue Timeout / TTL)
- **Optionen:** `3 Sekunden`, `5 Sekunden (Standard)`, `10 Sekunden`
- **Beschreibung:** Bestimmt, wie lange eine dringende Meldung in der Warteschlange verbleibt, wenn eine andere Meldung spricht. Abgelaufene Meldungen werden übersprungen, damit veraltete Durchsagen nicht verzögert abgespielt werden.

### Ansagen-Abstand (Callout Spacing / Kadenzpause)
- **Optionen:** `Keine (0s)`, `Kurz (500ms - Standard)`, `Normal (1000ms)`, `Entspannt (1500ms)`
- **Beschreibung:** Mindestruhezeit zwischen aufeinanderfolgenden Sprachansagen, damit Ansagen verständlich bleiben. Dringende Meldungen umgehen diese Pause sofort.

---

## Text-to-Speech (TTS) Konfiguration

Race Coordinator AI nutzt die native Web Speech API moderner Webbrowser für latenzfreie Sprachsynthese ohne Cloud-Abhängigkeit oder Internetverbindung während des Rennens.

### TTS-Sprachparameter

| Einstellung | Bereich / Optionen | Standard | Beschreibung |
| :--- | :--- | :---: | :--- |
| **TTS-Stimme** | Browser- / System-Stimmen | `-- Systemstandard --` | Wählt die installierte Stimme aus (inklusive Sprachcodes wie `de-DE`, `en-US`). |
| **Sprechgeschwindigkeit (Rate)** | `0.1x` bis `2.0x` | `1.0x` | Regelt die Sprechgeschwindigkeit. Etwas schnellere Raten (`1.1x`–`1.3x`) eignen sich hervorragend für kurze Rundenzeiten. |
| **Tonhöhe (Pitch)** | `0.0x` bis `2.0x` | `1.0x` | Passt die Tonhöhe der Stimme an. |
| **TTS-Lautstärke** | `0%` bis `100%` | `100%` | Eigene Lautstärke für Sprache vor der Master-Lautstärke-Skalierung (`masterVolume * ttsVolume`). |
| **Stimme testen** | Schaltfläche | — | Spielt sofort einen Beispieltext mit den aktuellen Einstellungen ab. |

### Dynamische TTS-Variablen

TTS-Texte unterstützen Platzhalter in `{...}` oder `${...}`:
- `{driver.name}`, `{driver.nickname}`: Fahrername / Spitzname.
- `{driver.lastLapTime}`, `{driver.bestLapTime}`: Rundenzeiten (automatisch auf 3 Nachkommastellen gerundet).
- `{driver.totalLaps}` / `{driver.lapCount}`: Gesamtzahl der gefahrenen Runden.
- `{driver.gapLeader}`, `{driver.gapPosition}`: Zeitabstände zum Führenden bzw. Vordermann.
- `{race.name}`, `{track.name}`, `{heat.number}`: Rennkontext.

Weitere Details finden Sie im [Text-to-Speech (TTS) Leitfaden](tts.md).

---

## Audio-Relevanz & Multi-Display-Filterung

In Rennumgebungen mit mehreren Bildschirmen (Hauptanzeige, Fahrerstationen, Boxenmonitore) verhindert die **Audio-Relevanz**, dass alle Bildschirme alle Geräusche abspielen.

### 1. Audio-Zuordnungen (Audio Associations)
Jeder Sound ist mit Metadaten versehen:
- **`widgetType`**: Funktionsbereich (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`**: Spurnummer (0-basiert).
- **`driverId`**: Eindeutige Fahrer-ID.

### 2. Layout-basierte Filterung auf der Hauptanzeige
- **Spuransichten (`lane-view`):** Enthält das Layout kein Spur-Widget, werden fahrerspezifische Rundengeräusche stummgeschaltet.
- **Countdown (`countdown`):** Fehlt das Countdown-Widget, werden Countdown-Signaltöne stummgeschaltet.
- **Timer (`timer`):** Fehlt das Timer-Widget, entfallen Halbzeit- und Restzeitansagen.
- **Flaggen (`flag`):** Fehlt das Flaggen-Widget, werden Gelbphasen- und Rennendesignale stummgeschaltet.

### 3. Fahrerstation-Isolierung (`scoped`)
Auf einer Fahrerstation (`/driver-station/:lane`) spielt die Audio-Engine im **`scoped`**-Modus:
- Nur Rundentöne, Bestzeiten, Boxen- und Tankwarnungen des **zugewiesenen Fahrers** werden abgespielt.
- Signale konkurrierender Fahrer werden herausgefiltert.
- Allgemeine Rennereignisse (Start-Countdown, Gelbphasen-Sirenen, Rennende) bleiben hörbar.

### 4. Isolierte Audio-Instanzen pro Seite
Jedes Browser-Fenster führt eine eigene `AudioService`-Instanz aus (`providers: [AudioService]`). Töne auf einer Fahrerstation blockieren oder verdrängen niemals die Töne der Rennleitung.

---

---

## Vollständiger Audio-Ressourcenkatalog

Die folgenden Referenztabellen listen alle Audioereignisse in Race Coordinator AI auf, einschließlich Soundtyp (nicht-verbaler SFX vs. Sprachansage), Prioritätsstufe und Relevanzbereich.

### Fahrer-Audioereignisse (Konfiguration im Fahrer-Editor)

| Fahrer-Audioereignis | Wann abgespielt | Standard-Datei / Asset | Soundtyp | Prioritätsstufe | Relevanz & Bildschirmanzeige |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Runden-Sound** | Wird bei jeder regulären Rundenüberfahrt abgespielt (oder als Ausweichsound, wenn ein Meilenstein-Sound verworfen oder nicht verfügbar ist). | `default_beep` | **SFX** (Preset) / **Sprachansage** (TTS) | `low` (Gewicht 1 bei TTS; Polyphon bei Preset-SFX) | `lane-view`: Spielt auf der Hauptanzeige (wenn Spur-Widget vorhanden) und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Persönlicher Bester Runden-Sound** | Wird abgespielt, wenn der Fahrer seine persönliche Bestzeit im aktuellen Durchgang oder der Sitzung erzielt. | `default_driveby` | **SFX** (Preset) / **Sprachansage** (TTS) | `normal` (Gewicht 2 bei TTS; Polyphon bei Preset-SFX) | `lane-view`: Spielt auf der Hauptanzeige (wenn Spur-Widget vorhanden) und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Rennen-Beste-Runde-Sound** | Wird abgespielt, wenn die schnellste Rundenzeit über alle Spuren und Durchgänge des aktuellen Rennens aufgestellt wird. | `default_best_race_lap` | **Sprachansage** | `high` (Gewicht 3) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Rennspur-Beste-Runde-Sound** | Wird abgespielt, wenn die schnellste Rundenzeit auf dieser spezifischen Spur im aktuellen Rennen erzielt wird. | `default_best_race_lane_lap` | **Sprachansage** | `normal` (Gewicht 2) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Lauf-Beste-Runde-Sound** | Wird abgespielt, wenn die schnellste Rundenzeit unter allen Fahrern im aktuellen Durchgang erzielt wird. | `default_best_heat_lap` | **Sprachansage** | `normal` (Gewicht 2) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Neuer Rennführender-Sound** | Wird abgespielt, wenn ein Fahrer die Führung im Gesamtklassement des Rennens übernimmt. | `default_new_race_leader` | **Sprachansage** | `high` (Gewicht 3) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Neuer Lauf-Führender-Sound** | Wird abgespielt, wenn ein Fahrer die Führung im aktiven Durchgang übernimmt. | `default_new_heat_leader` | **Sprachansage** | `normal` (Gewicht 2) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Gesamtrekord-Rundensound** | Wird abgespielt, wenn der absolute Streckenrekord über alle Spuren und bisherigen Rennen gebrochen wird. | `default_record_lap` | **Sprachansage** | `high` (Gewicht 3) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Spur-Gesamtrekord-Rundensound** | Wird abgespielt, wenn der allzeitige Streckenrekord für diese spezifische Spur gebrochen wird. | `default_record_lane_lap` | **Sprachansage** | `high` (Gewicht 3) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Boxenstopp-Sound** | Wird abgespielt, wenn das Fahrzeug in die Boxengasse oder den Tankbereich einfährt. | `default_pit_in` | **Sprachansage** | `urgent` (Gewicht 4) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Kraftstoffstand-Sounds** | Wird abgespielt, wenn der Tankfüllstand Warnung, kritisch oder leer erreicht. | `default_fuel_level` (Audioset) | **Sprachansage** | `urgent` (Gewicht 4) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Fehlstart-Sound** | Wird abgespielt, wenn ein Frühstart oder Verstoß beim Start erkannt wird. | `default_penalty` | **Sprachansage** | `urgent` (Gewicht 4) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |

### Design-Audioereignisse (Konfiguration im Design-Editor / Themes)

| Audio-Slot | Standard-Schlüssel | Soundtyp | Prioritätsstufe | Relevanz & Bildschirmanzeige |
| :--- | :--- | :--- | :---: | :--- |
| **Start-Countdown** | `audio.countdown` | **Sprachansage** / Audioset | `urgent` | `countdown`: Spielt auf der Hauptanzeige (wenn Countdown-Widget vorhanden) und auf allen Fahrerstationen. |
| **Grüne Lampe / START** | `audio.countdown.green` | **Sprachansage** / Signalton | `urgent` | `countdown`: Spielt auf der Hauptanzeige (wenn Countdown-Widget vorhanden) und auf allen Fahrerstationen. |
| **Gelbe Flagge** | `audio.yellowflag` | **Sprachansage** (Warnsirene) | `urgent` (Gewicht 4) | `flag`: Spielt auf der Hauptanzeige (wenn Flaggen-Widget vorhanden) und auf allen Fahrerstationen. |
| **Automatischer Start verbleibende Sekunden** | `audio.auto_start` | **Sprachansage** / Audioset (Standard: TTS) | `normal` (Gewicht 2) | `timer`: Spielt auf der Hauptanzeige (wenn Timer-Widget vorhanden) und auf allen Fahrerstationen. |
| **Verbleibende Sekunden** | `audio.seconds_left` | **Sprachansage** | `normal` (Gewicht 2) | `timer`: Spielt auf der Hauptanzeige (wenn Timer-Widget vorhanden) und auf allen Fahrerstationen. |
| **Verbleibende Runden** | `audio.laps_left` | **Sprachansage** / Audioset | `normal` (Gewicht 2) | `timer`: Spielt auf der Hauptanzeige (wenn Timer-Widget vorhanden) und auf allen Fahrerstationen. Kündigt verbleibende Runden des Führenden an; ein Wert von 0 kündigt das Erreichen der Rundenzahl durch den Führenden an (z. B. „Führender im Ziel“ bei Rennen mit Auslaufrunde). |
| **Rennhälfte** | `audio.seconds_left.halfway` | **Sprachansage** | `normal` (Gewicht 2) | `timer`: Spielt auf der Hauptanzeige (wenn Timer-Widget vorhanden) und auf allen Fahrerstationen beim Erreichen der Rennhälfte (nach Zeit oder wenn der Führende die halbe Rundenanzahl absolviert hat). |
| **Durchgang beendet** | `audio.heat_over` | **Sprachansage** | `urgent` (Gewicht 4) | `flag`: Spielt auf der Hauptanzeige (wenn Flaggen-Widget vorhanden) und auf allen Fahrerstationen. |
| **Automatisches Weiterschalten verbleibende Sekunden** | `audio.auto_advance` | **Sprachansage** / Audioset (Standard: TTS) | `normal` (Gewicht 2) | `timer`: Spielt auf der Hauptanzeige (wenn Timer-Widget vorhanden) und auf allen Fahrerstationen. |
| **Rennen beendet** | `audio.race_over` | **Sprachansage** | `urgent` (Gewicht 4) | `flag`: Spielt auf der Hauptanzeige (wenn Flaggen-Widget vorhanden) und auf allen Fahrerstationen. |
| **Mindestrundenzeit** | `audio.min_lap_time` | **Sprachansage** | `urgent` (Gewicht 4) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |
| **Driftrunde** | `audio.drift_lap` | **Sprachansage** | `urgent` (Gewicht 4) | `lane-view`: Spielt auf der Hauptanzeige und auf der Fahrerstation für die jeweilige Spur/den Fahrer. |

---

## Wo Audio konfiguriert wird

| Bereich | Einstellmöglichkeiten |
| :--- | :--- |
| **UI-Editor -> Audio-Einstellungen** | Gesamtlautstärke, Dringlichkeits-Timeout, Ansagen-Abstand, TTS-Stimme, Geschwindigkeit, Tonhöhe, TTS-Lautstärke, Hörprobe. |
| **Design-Editor (Themes)** | Systemweite Ereignisse: Start-Countdown, Grüne Lampe GO, Gelbe Flagge, Restzeit, Halbzeit, Durchgangsende, Rennende, Mindestrundenzeit, Driftrunde. |
| **Fahrer-Editor** | Fahrerspezifische Sounds: Runden-Sound, Persönlicher Bester Runden-Sound, Rennen-Beste-Runde-Sound, Rennspur-Beste-Runde-Sound, Lauf-Beste-Runde-Sound, Neuer Rennführender-Sound, Neuer Lauf-Führender-Sound, Gesamtrekord-Rundensound, Spur-Gesamtrekord-Rundensound, Boxenstopp-Sound, Kraftstoffstand-Sounds und Fehlstart-Sound. |
| **Asset Manager** | Hochladen und Verwalten von WAV-, MP3- und OGG-Dateien mit Sofort-Hörprobe. |
