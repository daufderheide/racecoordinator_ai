# Thema's

!!! note "Inhoud in ontwikkeling"
    Dit artikel is in ontwikkeling. De volledige documentatie volgt binnenkort.

## Thema's

Elk thema bundelt visuele elementen (vlaggen, aftellampen, brandstofmeters), audiomeldingen en lay-outtoewijzingen:

- **Aangepaste UI-lay-out:** De gekoppelde schermlay-out die tijdens de race wordt geladen.
- **Bestuurdersstation-thema:** Het thema dat wordt gebruikt bij het openen of scannen van een enkelbaans bestuurdersstationvenster of -apparaat.
- **Bestuurdersweergave-thema:** Het thema dat wordt gebruikt bij het openen of scannen van het schemavenster voor de coureur of weergave op een persoonlijk apparaat.

## Audio

Thema's stellen u in staat om systeembrede geluidseffecten en spraakmeldingen voor raceleidingsgebeurtenissen aan te passen:

- **Startaftelling:** Geluiden tijdens de startprocedure (`audio.countdown`).
- **Groen licht / START:** Signaaltoon wanneer de startlichten op groen springen (`audio.countdown.green`).
- **Gele vlag:** Waarschuwingssirenes tijdens een gele vlag (`audio.yellowflag`).
- **Resterende seconden automatische start:** Aftelmeldingen voor de resterende tijd voordat een heat automatisch start (`audio.auto_start`).
- **Heat-tijd (Resterende seconden):** Aftelberichten voor de resterende heattijd (`audio.seconds_left`).
- **Rondetelling leider (Resterende ronden):** Meldingen voor de resterende ronden van de leider (`audio.laps_left`).
- **Halverwege:** Melding bij het bereiken van de helft van de heat — zowel voor tijdraces (helft van de tijd verstreken) als voor rondenraces (wanneer de leider de helft van het aantal ronden heeft voltooid) (`audio.seconds_left.halfway`).
- **Heat en race beëindigd:** Akoestische signalen voor het einde van een heat (`audio.heat_over`) of race (`audio.race_over`).
- **Resterende seconden automatisch doorschakelen:** Aftelmeldingen voor de resterende tijd voordat automatisch wordt doorgeschakeld naar de volgende heat (`audio.auto_advance`).
- **Overtredingsmeldingen:** Signalen bij onderschrijding van de minimale rondetijd (`audio.min_lap_time`).

Voor alle details over automatische geluidsdemping, prioriteitsniveaus en schermfiltering, zie de documentatie van het [Audiosysteem](audio.md).

## Coureuraudio-overschrijvingen

Thema's kunnen individuele audio-instellingen van coureurs overschrijven voor alle deelnemers wanneer het thema actief is. Standaard worden de aangepaste geluiden van elke coureur (geconfigureerd in de [Coureureditor](driver-editor.md)) afgespeeld. Een thema kan echter selectief elk van de 13 coureuraudio-gebeurtenissen overschrijven:

- **Persoonlijke rondegeluiden:** Ronde voltooid (`lapAudio`), Persoonlijk ronderecord (`bestLapAudio`).
- **Race rondegeluiden:** Ronderecord van de race (`raceBestLapAudio`), Baanrecord van de race (`raceLaneBestLapAudio`), Ronderecord van de heat (`heatBestLapAudio`), Nieuwe raceleider (`newRaceLeaderAudio`), Nieuwe heatleider (`newHeatLeaderAudio`).
- **Algemene recordgeluiden:** Algemeen ronderecord (`overallBestLapAudio`), Algemeen baanrecord (`overallLaneBestLapAudio`).
- **Gebeurtenisgeluiden:** Pitstop inrijden (`pitInAudio`), Brandstofniveau (`fuelAudio`), Valse start / Straf (`penaltyAudio`), Drift-ronde (`driftLapAudio`).

### Overschrijvingshiërarchie en configuratie
- **Uitgeschakeld (Standaard):** Het thema wijzigt het slot niet; de individuele configuratie van de coureur wordt afgespeeld.
- **Ingeschakelde overschrijving:** Het thema krijgt voorrang voor die specifieke audiogebeurtenis voor alle coureurs onder dit thema. U kunt dit instellen als een **Vooraf ingesteld geluid**, een **Geüpload audiobestand**, een aangepaste **Tekst-naar-spraak (TTS)**-zin of **Geen** (om de gebeurtenis themabreed te dempen).
- **Alle overschrijvingen herstellen:** Wist snel alle actieve overschrijvingen op het thema, waardoor de controle volledig terugkeert naar de instellingen van elke individuele coureur.
