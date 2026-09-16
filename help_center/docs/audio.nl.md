# Audiosysteem

Race Coordinator AI beschikt over een intelligente tweekanaals audio-engine die rijke geluidseffecten, dynamisch gesproken commentaar en cruciale raceleidingsmeldingen levert zonder storende overlap of gemiste signalen.

---

## Tweekanaals Audio-architectuur

De audio-engine scheidt geluid in twee afzonderlijke kanalen:

```
                      ┌────────────────────────────────────────┐
                      │            Audio Dispatcher            │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │  Geluidseffecten (SFX) │                      │     Spraakberichten    │
     │  (Korte Niet-Verbale)  │                      │    (TTS & Commentaar)  │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
        Polyfone Weergave                            Eén Prioritaire Stem
    (Gelijktijdige weergave)                         ("Afspelen, Voorrang,    
                  │                                         Negeren")         
                  │◄─────────── Automatische Volumeverlaging ─────┤
                  │ (SFX worden automatisch gedempt naar 20%      │
                  │   volume terwijl er een spraakbericht klinkt) │
```

### 1. Geluidseffecten (SFX)
- **Onderdelen:** Korte, niet-verbale tonen zoals rondesignalen (`default_beep`), voorbijrijgeluiden (`default_driveby`) of belsignalen.
- **Polyfone Weergave:** Geluidseffecten spelen direct af via HTML5-audio. Als meerdere wagens tegelijk over de finishlijn rijden, klinkt voor elke wagen tegelijk het eigen rondesignaal zonder elkaar af te kappen.
- **Automatische Demping (Audio Ducking):** Wanneer er een spraakbericht wordt uitgesproken, wordt het volume van gelijktijdige geluidseffecten automatisch gedimd naar **20%**. Zodra de stem klaar is, herstelt het SFX-volume direct naar 100%.

### 2. Gesproken Meldingen (Voice Callouts)
- **Onderdelen:** Tekst-naar-spraak (TTS) en opgenomen gesproken audiobestanden (commentaar, gele vlag sirenes, pitstopmeldingen en aftellingen).
- **Enkele Stem:** Gestuurd via de **"Afspelen, Voorrang of Negeren"**-logica zodat stemmen nooit door elkaar heen praten.

---

## Het Prioriteitssysteem

Tijdens een race gebeuren er veel dingen gelijktijdig. Race Coordinator AI hanteert een hiërarchie met 4 prioriteitsniveaus:

### Prioriteitsniveaus

| Niveau | Gewicht | Typische Gebeurtenissen | Gedrag bij Gelijktijdigheid |
| :--- | :---: | :--- | :--- |
| **`urgent`** (Urgent) | 4 | Gele vlag, heat afgelopen, race afgelopen, valse start, minimale rondetijd overschreden, drift-ronde, pitstop, brandstofwaarschuwingen (waarschuwing, kritiek, leeg). | **Onderbreekt** lagere prioriteiten direct. Als er al een urgent bericht klinkt, wordt het nieuwe urgente bericht in de **Urgente Wachtrij** geplaatst. Negeert de pauze tussen berichten. |
| **`high`** (Hoog) | 3 | Absoluut baanrecord, baanvakrecord, nieuwe raceleider, beste raceronde. | **Onderbreekt** berichten van niveau `normal` of `low`. Wordt **genegeerd** als er een bericht met `urgent` of gelijke/hogere prioriteit klinkt. |
| **`normal`** (Normaal) | 2 | Tijdsaankondigingen (bijv. "nog 30 seconden"), halverwege, beste heatronde, beste baandeelronde, nieuwe heatleider, persoonlijk record van de rijder (in TTS-modus). | **Onderbreekt** berichten van niveau `low`. Wordt **genegeerd** als er een bericht met `urgent`, `high` of een ander `normal` bericht klinkt. |
| **`low`** (Laag) | 1 | Standaard rondemelding van de rijder (in TTS-modus). | Speelt alleen als er geen andere stem actief is. Wordt **genegeerd** als er een ander spraakbericht klinkt. |

### Regels bij Conflicten

1. **Voorrang (Preemption):** Heeft een inkomende gebeurtenis een hogere prioriteit dan het actieve spraakbericht, dan stopt het huidige bericht direct en begint het nieuwe bericht.
2. **Negeren (Dropping):** Heeft een inkomend bericht een gelijke of lagere prioriteit, dan wordt het genegeerd om overlap te voorkomen.
3. **Urgente Wachtrij (Urgent Queueing):** Urgente meldingen zijn van vitaal belang voor de raceveiligheid. Als er een urgente melding binnenkomt terwijl een andere klinkt, wacht deze in de wachtrij en speelt direct daarna af.
4. **Pauze tussen Berichten (Callout Spacing):** Na elk gesproken bericht wordt een korte stilte ingelast voordat een volgend niet-urgent bericht mag starten.

### Prioriteit en Terugvaloptie bij Mijlpalen (Milestone Priority & Fallback)

Rijdt een deelnemer een ronde die een of meer mijlpalen activeert (zoals een baanrecord, beste ronde in de heat of leiderswissel):

1. **Prioriteitscascade bij gelijktijdige gebeurtenissen:** Mijlpaalgeluiden worden beoordeeld in strikte prioriteitsvolgorde (Baanrecord -> Baanrecord per spoor -> Nieuwe raceleider -> Nieuwe heatleider -> Snelste raceronde -> Snelste raceronde per spoor -> Snelste heatronde -> Persoonlijk record). Als het geluid met de hoogste prioriteit is ingesteld op `none` (of niet geconfigureerd), gaat het systeem naar het volgende geluid met de hoogste prioriteit dat tijdens die ronde is getriggerd en speelt dat af indien geconfigureerd.
2. **Genegeerde meldingen bij bezet spraakkanaal:** Wordt een geselecteerde spraakmelding **genegeerd** omdat een melding met hogere prioriteit klinkt (of tijdens een spraakpauze), dan worden er voor die ronde geen verdere spraakmeldingen geprobeerd. In plaats daarvan valt het systeem direct terug op het **persoonlijk recordgeluid** (indien PR-ronde) of het **standaard rondesignaal**.
3. **Polyfone SFX-terugval:** Is dit reservegeluid een geluidseffect (SFX), dan speelt dit polyfoon af, zodat de rijder altijd direct akoestische bevestiging krijgt bij de finishlijn.

---

## Audio-configuratieopties

Globale instellingen vindt u in de **UI Editor** onder het gedeelte **Audio-instellingen**:

### Hoofdvolume (Master Volume)
- **Bereik:** 0% tot 100% (Standaard: `100%`)
- **Beschrijving:** Bepaalt het maximale volume voor de gehele toepassing, zowel voor effecten als spraak.

### Time-out Urgente Wachtrij (TTL)
- **Opties:** `3 seconden`, `5 seconden (Standaard)`, `10 seconden`
- **Beschrijving:** Maximale bewaartijd voor een urgent bericht in de wachtrij. Verlopen meldingen worden gewist om achterhaalde waarschuwingen te voorkomen.

### Tussenruimte Berichten (Spraakpauze)
- **Opties:** `Geen (0s)`, `Kort (500ms - Standaard)`, `Normaal (1000ms)`, `Ontspannen (1500ms)`
- **Beschrijving:** Minimale stilte tussen opeenvolgende gesproken berichten. Urgente meldingen omzeilen deze pauze onmiddellijk.

---

## Tekst-naar-Spraak (TTS) Configuratie

Race Coordinator AI maakt gebruik van de ingebouwde Web Speech API van de browser, waardoor spraak zonder vertraging en zonder internetverbinding lokaal wordt gegenereerd.

### TTS-Spraakparameters

| Instelling | Bereik / Opties | Standaard | Beschrijving |
| :--- | :--- | :---: | :--- |
| **TTS-stem** | Browser- / Systeemstemmen | `-- Systeemstandaard --` | Selecteert de geïnstalleerde spraakstem (inclusief taalcodes zoals `nl-NL`, `en-US`). |
| **Spraaksnelheid (Rate)** | `0.1x` tot `2.0x` | `1.0x` | Regelt de spreeksnelheid. Een iets hogere snelheid (`1.1x`–`1.3x`) is prettig op snelle banen. |
| **Toonhoogte (Pitch)** | `0.0x` tot `2.0x` | `1.0x` | Past de toonhoogte van de stem aan. |
| **TTS-volume** | `0%` tot `100%` | `100%` | Eigen volume voor spraak, geschaald door het Hoofdvolume (`masterVolume * ttsVolume`). |
| **Stem Testen** | Knop | — | Laat direct een voorbeeldzin horen met de huidige instellingen. |

### Dynamische TTS-Variabelen

TTS-teksten ondersteunen dynamische variabelen tussen `{...}` of `${...}`:
- `{driver.name}`, `{driver.nickname}`: Naam en bijnaam van de rijder.
- `{driver.lastLapTime}`, `{driver.bestLapTime}`: Rondetijden (afgerond op 3 decimalen).
- `{driver.totalLaps}` / `{driver.lapCount}`: Aantal voltooide ronden.
- `{driver.gapLeader}`, `{driver.gapPosition}`: Verschil met de leider of voorganger.
- `{race.name}`, `{track.name}`, `{heat.number}`: Race-informatie.

Raadpleeg de [Tekst-naar-Spraak (TTS) Handleiding](tts.md) voor meer voorbeelden.

---

## Audiorelevantie en Schermfiltering

Bij opstellingen met meerdere beeldschermen (hoofdscherm, rijdersstations, pitmonitors) zorgt **Audiorelevantie** ervoor dat niet elk scherm alle geluiden tegelijk laat horen.

### 1. Audio-associaties (Audio Associations)
Elk geluid bevat contextgegevens:
- **`widgetType`**: Functiedomein (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`**: Baannummer (0-gebaseerd).
- **`driverId`**: Uniek ID van de rijder.

### 2. Schermfiltering op het Hoofdscherm
- **Baanweergave (`lane-view`):** Bevat het actieve scherm geen baan-widget, dan worden rijder-rondesignalen gedempt.
- **Aftelling (`countdown`):** Zonder aftel-widget worden startpiepjes gedempt.
- **Timer (`timer`):** Zonder timer-widget worden tijdsmeldingen gedempt.
- **Vlaggen (`flag`):** Zonder vlag-widget worden gele vlag- en finishsignalen gedempt.

### 3. Rijdersstations in Beperkte Modus (`scoped`)
Op een rijdersstation (`/driver-station/:lane`):
- Werkt het filter in de **`scoped`**-modus.
- Klinken alleen de signalen, records en brandstofmeldingen van de **toegewezen rijder**.
- Geluiden van concurrenten worden gefilterd om de rijder niet af te leiden.
- Algemene racegebeurtenissen (startsignaal, gele vlag, einde heat) blijven hoorbaar.

### 4. Gescheiden Audio-engines per Tabblad
Elk venster gebruikt een eigen `AudioService`-instantie (`providers: [AudioService]`). Geluid op een rijdersstation interfereert nooit met de wedstrijdleiding.

---

---

## Volledige Audio-resourcecatalogus

De onderstaande tabellen geven een gedetailleerd overzicht van alle audiogebeurtenissen in Race Coordinator AI, inclusief geluidstype (niet-verbaal geluidseffect vs. gesproken spraakbericht), prioriteitsniveau en schermbereik.

### Rijdersaudiogebeurtenissen (Geconfigureerd in de Rijders Editor)

| Rijdersaudiogebeurtenis | Wanneer afgespeeld | Standaard Bestand / Asset | Geluidstype | Prioriteitsniveau | Relevantie & Schermweergave |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Ronde Geluid** | Wordt afgespeeld bij elke reguliere ronde (of als fallback als een mijlpaalgeluid wordt overgeslagen of niet beschikbaar is). | `default_beep` | **SFX** (Preset) / **Spraakbericht** (TTS) | `low` (Gewicht 1 bij TTS; Polyfoon bij preset-SFX) | `lane-view`: Klinkt op het Hoofdscherm (indien Baan-widget aanwezig) en op het Rijdersstation van die specifieke baan/rijder. |
| **Persoonlijk Beste Ronde Geluid** | Wordt afgespeeld wanneer de rijder diens snelste ronde in de huidige heat of sessie neerzet. | `default_driveby` | **SFX** (Preset) / **Spraakbericht** (TTS) | `normal` (Gewicht 2 bij TTS; Polyfoon bij preset-SFX) | `lane-view`: Klinkt op het Hoofdscherm (indien Baan-widget aanwezig) en op het Rijdersstation van die specifieke baan/rijder. |
| **Race Beste Ronde Geluid** | Wordt afgespeeld bij de snelste ronde over alle heats en sporen van de huidige race. | `default_best_race_lap` | **Spraakbericht** | `high` (Gewicht 3) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Race Baan Beste Ronde Geluid** | Wordt afgespeeld bij de snelste ronde op dat specifieke spoor tijdens de huidige race. | `default_best_race_lane_lap` | **Spraakbericht** | `normal` (Gewicht 2) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Heat Beste Ronde Geluid** | Wordt afgespeeld bij de snelste ronde onder alle rijders in de actieve heat. | `default_best_heat_lap` | **Spraakbericht** | `normal` (Gewicht 2) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Geluid nieuwe raceleider** | Wordt afgespeeld wanneer een rijder de leiding in het algemeen raceklassement overneemt. | `default_new_race_leader` | **Spraakbericht** | `high` (Gewicht 3) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Geluid nieuwe heatleider** | Wordt afgespeeld wanneer een rijder de leiding in de actieve heat overneemt. | `default_new_heat_leader` | **Spraakbericht** | `normal` (Gewicht 2) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Algemeen Baanrecord Ronde Geluid** | Wordt afgespeeld wanneer het absolute baanrecord over alle sporen en eerdere races wordt verbroken. | `default_record_lap` | **Spraakbericht** | `high` (Gewicht 3) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Baanrecord per Spoor Ronde Geluid** | Wordt afgespeeld wanneer het historische baanrecord voor dat specifieke spoor wordt verbroken. | `default_record_lane_lap` | **Spraakbericht** | `high` (Gewicht 3) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Pit In Geluid** | Wordt afgespeeld wanneer de auto de pitstraat of tankzone binnenrijdt. | `default_pit_in` | **Spraakbericht** | `urgent` (Gewicht 4) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Brandstofniveau Geluiden** | Wordt afgespeeld wanneer de brandstof daalt naar waarschuwings-, kritiek- of leegdrempels. | `default_fuel_level` (Audioset) | **Spraakbericht** | `urgent` (Gewicht 4) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Valse Start Geluid** | Wordt afgespeeld wanneer een valse start of overtreding bij de start wordt gedetecteerd. | `default_penalty` | **Spraakbericht** | `urgent` (Gewicht 4) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |

### Thema-audiogebeurtenissen (Geconfigureerd in de Thema Editor)

| Audioslot | Standaardsleutel | Geluidstype | Prioriteitsniveau | Relevantie & Schermweergave |
| :--- | :--- | :--- | :---: | :--- |
| **Startaftelling** | `audio.countdown` | **Spraakbericht** / Audioset | `urgent` | `countdown`: Klinkt op het Hoofdscherm (indien Aftel-widget aanwezig) en op alle Rijdersstations. |
| **Groen Licht / START** | `audio.countdown.green` | **Spraakbericht** / Signaaltoon | `urgent` | `countdown`: Klinkt op het Hoofdscherm (indien Aftel-widget aanwezig) en op alle Rijdersstations. |
| **Gele Vlag** | `audio.yellowflag` | **Spraakbericht** (Waarschuwingssirene) | `urgent` (Gewicht 4) | `flag`: Klinkt op het Hoofdscherm (indien Vlag-widget aanwezig) en op alle Rijdersstations. |
| **Resterende Seconden** | `audio.seconds_left` | **Spraakbericht** | `normal` (Gewicht 2) | `timer`: Klinkt op het Hoofdscherm (indien Timer-widget aanwezig) en op alle Rijdersstations. |
| **Halverwege** | `audio.seconds_left.halfway` | **Spraakbericht** | `normal` (Gewicht 2) | `timer`: Klinkt op het Hoofdscherm (indien Timer-widget aanwezig) en op alle Rijdersstations. |
| **Heat Beëindigd** | `audio.heat_over` | **Spraakbericht** | `urgent` (Gewicht 4) | `flag`: Klinkt op het Hoofdscherm (indien Vlag-widget aanwezig) en op alle Rijdersstations. |
| **Race Beëindigd** | `audio.race_over` | **Spraakbericht** | `urgent` (Gewicht 4) | `flag`: Klinkt op het Hoofdscherm (indien Vlag-widget aanwezig) en op alle Rijdersstations. |
| **Minimale Rondetijd** | `audio.min_lap_time` | **Spraakbericht** | `urgent` (Gewicht 4) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |
| **Drift-ronde** | `audio.drift_lap` | **Spraakbericht** | `urgent` (Gewicht 4) | `lane-view`: Klinkt op het Hoofdscherm en op het Rijdersstation van die specifieke baan/rijder. |

---

## Waar Audio Wordt Geconfigureerd

| Onderdeel | Wat u hier kunt instellen |
| :--- | :--- |
| **UI Editor -> Audio-instellingen** | Hoofdvolume, time-out urgente wachtrij, tussenruimte berichten, TTS-stem, snelheid, toonhoogte, TTS-volume en testknop. |
| **Thema Editor** | Systeemgeluiden: startaftelling, groen licht, gele vlag sirene, resterende tijd, halverwege, einde heat, einde race, minimumtijd en drift-ronde. |
| **Rijders Editor** | Rijderspecifieke geluiden: Ronde Geluid, Persoonlijk Beste Ronde Geluid, Race Beste Ronde Geluid, Race Baan Beste Ronde Geluid, Heat Beste Ronde Geluid, Geluid nieuwe raceleider, Geluid nieuwe heatleider, Algemeen Baanrecord Ronde Geluid, Baanrecord per Spoor Ronde Geluid, Pit In Geluid, Brandstofniveau Geluiden en Valse Start Geluid. |
| **Asset Manager** | Uploaden en beheren van WAV-, MP3- en OGG-bestanden met directe voorbeluistering. |
