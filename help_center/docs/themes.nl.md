# Thema's

## Overzicht {: #overview }

Thema's bepalen de complete audiovisuele presentatie en sfeer van uw race-evenementen in Race Coordinator AI. In plaats van grafische elementen, startverlichting en geluidsmeldingen afzonderlijk voor elke race in te stellen, bundelen thema's deze visuele en audio-elementen in herbruikbare profielen.

Wanneer een thema actief is, coördineert het:
- De gekoppelde schermlay-out op het hoofdscherm.
- Gesynchroniseerde grafische weergaven voor vlaggen, startlichten en brandstofmeters.
- Systeembrede geluidseffecten, aftelsignalen en spraakmeldingen.
- Gecentraliseerde audio-overschrijvingen voor individuele coureursgeluidseffecten.

---

## Thema-instellingen {: #top-selectors }

Deze instellingen bevinden zich in de bovenste bedieningsbalk van de Thema-editor en definiëren de kerneigenschappen en gekoppelde lay-outs voor het thema:

- **Themanaam:** De unieke identificatie voor het thema. Standaard systeemthema's (*RC AI*, *Formula*, *Endurance*) zijn beveiligd en kunnen niet worden verwijderd of hernoemd.
- **Gekoppelde UI-lay-out:** Selecteert de schermlay-out die is gemaakt in de [Lay-outeditor](layout-editor.md) en die automatisch wordt geladen op het primaire racescherm wanneer dit thema voor een race wordt geselecteerd.
- **Bestuurdersstation-thema:** Bepaalt het thema dat wordt gebruikt bij het openen van een enkelbaans bestuurdersstationvenster of wanneer een coureur verbinding maakt via een mobiel apparaat of tablet.
- **Bestuurdersweergave-thema:** Bepaalt het thema dat wordt gebruikt voor meerspoors schemaschermen en toeschouwersmonitoren.
- **Vensterthema's (Begeleidende thema's):** Configureert begeleidende thema's voor secundaire beeldschermen. Standaard zijn alle beschikbare thema's geselecteerd. Tijdens een race toont de menubalk strikt de thema's die op het hoofdthema zijn geconfigureerd. Thema's kunnen afzonderlijk worden beheerd of in één klik worden in- of uitgeschakeld met **Alles selecteren** in de Thema-editor. Wanneer een nieuw thema wordt aangemaakt, wordt dit automatisch toegevoegd aan alle bestaande thema's waarvan alles is geselecteerd.

---

## Vlagafbeeldingen {: #flags }

In de sectie Vlagafbeeldingen kunt u de afbeeldingen aanpassen die op het racecanvas, op vlagwidgets en op bestuurdersstations worden weergegeven voor elke raceomstandigheid:

- **Racen (`flag.racing`):** Weergegeven tijdens actieve raceomstandigheden wanneer de baan groen is en de auto's vrij ronden rijden.
- **Heat gepauzeerd (`flag.heat_paused`):** Gele waarschuwingsvlag die wordt weergegeven tijdens een baanonderbreking of racepauze.
- **Heat afgelopen (`flag.heat_over`):** Finishvlag die wordt weergegeven wanneer de heatduur of het doelaantal ronden is bereikt.
- **Race afgelopen (`flag.race_over`):** Uiteindelijke finishvlag die het einde van het volledige race-evenement aangeeft.
- **Niet gestart (`flag.not_started`):** Vlag die wordt weergegeven vóór de start van een heat of race.
- **Starten (`flag.starting`):** Rode vlag die wordt weergegeven tijdens de initiële aftelprocedure voordat de lichten op groen springen.
- **Herstarten (`flag.restarting`):** Vlag die wordt weergegeven tijdens het herstartaftellen na een gele vlag of baanonderbreking.
- **Laatste ronde (`flag.one_lap_to_go`):** Traditionele witte vlag die aangeeft dat de raceleider aan zijn laatste ronde bezig is.
- **Heat finishen (`flag.heat_finishing`):** Vlag die wordt weergegeven wanneer de leider over de finish is gekomen en overige auto's hun huidige ronde afmaken.
- **Opwarming (`flag.warmup`):** Weergegeven tijdens oefensessies en opwarmrondes van coureurs voorafgaand aan de race.
- **Coureur gefinisht (`flag.driver_finished`):** Baanspecifieke of individuele indicator die wordt weergegeven voor coureurs die hun vereiste ronden hebben voltooid.
- **Straf (`flag.penalty`):** Zwarte vlagindicator die wordt weergegeven wanneer een coureur een valse start veroorzaakt of een rondeovertreding begaat.

Voor elke vlag kunt u kiezen uit ingebouwde voorinstellingen of aangepaste SVG-, PNG-, WebP- of JPG-afbeeldingen uploaden vanuit uw bibliotheek via het [Assetbeheer](asset-manager.md).

---

## Startaftellichten {: #countdown }

In de sectie Startaftellichten configureert u de visuele lampafbeeldingen die worden gebruikt door de Aftelwidget en de startlichten op het scherm:

- **Rode lamp uit (`lamp.red.dim`):** De gedoofde of gedimde rode lampafbeelding die wordt weergegeven wanneer de lichten inactief zijn of voordat het aftellen begint.
- **Rode lamp aan (`lamp.red.on`):** De brandende rode lampafbeelding die wordt weergegeven tijdens elke fase van de startaftelsequentie.
- **Groene lamp (`lamp.green`):** De felgroene lampafbeelding die wordt weergegeven op het moment van starten of herstarten wanneer de baan onder stroom wordt gezet.

Deze afbeeldingen schalen automatisch mee met horizontale en verticale startlichtwidgets die in uw lay-outs zijn geconfigureerd.

---

## Brandstofmeter {: #fuel-gauge }

In de sectie Brandstofmeter configureert u visuele meters met meerdere frames die worden gebruikt tijdens analoge en digitale brandstofracesimulaties:

- **Brandstofmeterserie (`gauge.fuel`):** Een afbeeldingenserie met meerdere opeenvolgende frames die het brandstofniveau weergeven van vol (100%) tot leeg (0%).

Tijdens een race met ingeschakelde brandstofsimulatie berekent Race Coordinator AI continu het verbruik op basis van gashendel of ronden en werkt het meterframe in realtime bij. Wanneer het brandstofniveau onder de reservegrens daalt, activeert de meter knipperende animaties en waarschuwingssignalen om coureurs aan te sporen de pitstraat in te rijden.

---

## Geluidseffecten {: #audio }

Met thema's kunt u systeembrede geluidseffecten, aftelgeluiden, periodieke tijdsmeldingen en spraakberichten aanpassen:

- **Startaftelling (`audio.countdown`):** Geluidseffecten die worden afgespeeld tijdens de aftelprocedure voordat de heat begint.
- **Groene lamp / START (`audio.countdown.green`):** Toon of hoorn die wordt afgespeeld op het moment dat de startlichten op groen springen en de race begint.
- **Gele vlag (`audio.yellowflag`):** Waarschuwingssirenes of signaaltonen die worden geactiveerd bij een baanonderbreking of gele vlag.
- **Resterende seconden automatische start (`audio.auto_start`):** Periodieke spraakberichten voor de resterende tijd vóór een automatische heatstart.
- **Heat-tijd (Resterende seconden) (`audio.seconds_left`):** Periodieke spraakberichten die de resterende heattijd aangeven.
- **Halverwege (`audio.seconds_left.halfway`):** Melding bij het bereiken van de helft van de heat (helft van de duur verstreken of leider die de helft van het aantal ronden voltooit).
- **Rondetelling leider (`audio.laps_left`):** Spraakmeldingen voor de resterende ronden van de heatleider.
- **Heat beëindigd (`audio.heat_over`):** Geluidssignaal dat het einde van de actieve heat aangeeft.
- **Race beëindigd (`audio.race_over`):** Feestelijke fanfare of signaaltoon die het einde van het volledige race-evenement markeert.
- **Resterende seconden automatisch doorschakelen (`audio.auto_advance`):** Periodieke aftelmeldingen vóór het automatisch doorschakelen naar de volgende heat.
- **Overtreding minimale rondetijd (`audio.min_lap_time`):** Waarschuwingstoon wanneer een auto een sensor activeert onder de minimale rondetijddrempel.

Elk audioslot kan worden geconfigureerd als:
1. **Vooraf ingesteld geluid:** Kies uit de ingebouwde geluidseffectenbibliotheek van Race Coordinator AI.
2. **Aangepast audiobestand:** Upload eigen WAV-, MP3- of OGG-bestanden via het Assetbeheer.
3. **Tekst-naar-spraak (TTS):** Dynamische spraaksynthesizerzinnen met runtime-variabelen (zoals `{time}` en `{laps}`).

Voor alle details over automatische audiodemping, prioriteitsniveaus en weergave op meerdere schermen, zie de documentatie van het [Audiosysteem](audio.md).

---

## Coureuraudio-overschrijvingen {: #driver-audio-overrides }

Bij standaardraces kan elke coureur gepersonaliseerde rondetonen en spraakmeldingen instellen in de [Coureureditor](driver-editor.md). Voor clubevenementen, commerciële racebanen of themakampioenschappen willen raceorganisatoren echter vaak een uniforme audio-ervaring voor alle deelnemers.

Met de sectie **Coureuraudio-overschrijvingen** kan het thema centraal enkele of alle audiomeldingen voor alle deelnemers aan de race overschrijven.

### Beschikbare coureuraudio-overschrijvingen

Het thema kan elk van de 13 individuele audiogebeurtenissen voor coureurs overschrijven:

#### Persoonlijke rondegeluiden
- **Ronde voltooid (`lapAudio`):** Geluid dat wordt afgespeeld telkens wanneer een coureur een geldige standaardronde voltooit.
- **Persoonlijk ronderecord (`bestLapAudio`):** Geluid dat wordt afgespeeld wanneer een coureur zijn eigen beste rondetijd in de huidige racesessie verbetert.

#### Race rondegeluiden
- **Ronderecord van de race (`raceBestLapAudio`):** Geluid dat wordt afgespeeld wanneer een coureur de snelste rondetijd over alle banen en coureurs in de huidige race neerzet.
- **Baanrecord van de race (`raceLaneBestLapAudio`):** Geluid dat wordt afgespeeld wanneer een coureur de snelste ronde op zijn specifieke baan in de huidige race rijdt.
- **Ronderecord van de heat (`heatBestLapAudio`):** Geluid dat wordt afgespeeld wanneer een coureur de snelste rondetijd van de actieve heat neerzet.
- **Nieuwe raceleider (`newRaceLeaderAudio`):** Spraakmelding of feestelijk geluid wanneer een coureur de algemene leiding in de race overneemt.
- **Nieuwe heatleider (`newHeatLeaderAudio`):** Geluid dat wordt afgespeeld wanneer een coureur de 1e plaats in de actieve heat inneemt.

#### Algemene ronderecordgeluiden
- **Algemeen ronderecord (`overallBestLapAudio`):** Geluid met hoge prioriteit dat wordt afgespeeld wanneer een coureur een baanrecord aller tijden over alle banen vestigt.
- **Algemeen baanrecord (`overallLaneBestLapAudio`):** Geluid dat wordt afgespeeld wanneer een coureur een baanrecord aller tijden voor die specifieke baan vestigt.

#### Gebeurtenisgeluiden
- **Pitstop inrijden (`pitInAudio`):** Geluid dat wordt afgespeeld wanneer een auto de pitstraat inrijdt of pitsensoren op digitale banen activeert.
- **Brandstofwaarschuwing (`fuelAudio`):** Waarschuwingstoon of spraakmelding bij het bereiken van de reservebrandstof of bij lege tank.
- **Valse start / Straf (`penaltyAudio`):** Zoemer of claxon wanneer een auto een valse start veroorzaakt of een rondeboete oploopt.
- **Drift-ronde (`driftLapAudio`):** Urgent geluidseffect of gesproken melding wanneer een auto bij uitgeschakelde baanstroom binnen het drifttijd-venster over de finishlijn uitrolt.

### Overschrijvingsprioriteit & modi

Elke coureuraudiogebeurtenis in de lijst kan onafhankelijk worden geconfigureerd:

- **Uitgeschakeld (Selectievakje niet aangevinkt):** Het thema laat het slot ongemoeid. Race Coordinator AI speelt het aangepaste geluid van de individuele coureur af (of de standaardwaarde indien niet geconfigureerd).
- **Ingeschakeld (Selectievakje aangevinkt):** Het thema overschrijft de audiogebeurtenis voor **elke coureur** die deelneemt aan races met dit thema, ongeacht wat er in hun individuele profiel is geconfigureerd.

Kies na inschakeling uit vier uitvoermodi:
1. **Vooraf ingesteld geluid:** Selecteer een standaard geluidseffect uit de ingebouwde catalogus.
2. **Geüpload audiobestand:** Selecteer een aangepast audiobestand uit uw Assetbeheerbibliotheek.
3. **Tekst-naar-spraak (TTS):** Voer een aangepaste zin in met coureurspecifieke variabelen:
   - `{driver}` — De weergavenaam of bijnaam van de coureur.
   - `{time}` — De rondetijd geformatteerd op drie decimalen (bijv. `3.142`).
   - `{lane}` — Het actieve baannummer (bijv. `2`).
   - `{lap}` — Het huidige aantal voltooide ronden.
   - `{gap}` — Het tijdsverschil met de leider of de dichtstbijzijnde auto.
4. **Geen (Dempen):** Dempt de gebeurtenis themabreed volledig, waardoor er geen geluid of melding wordt afgespeeld.

### Alle overschrijvingen herstellen

Klik op de knop **Alle overschrijvingen herstellen** in de koptekst van de sectie Coureuraudio-overschrijvingen om alle thema-overschrijvingen in één keer te wissen. Alle 13 slots keren terug naar hun niet-aangevinkte standaardstatus, waardoor de audiobediening weer volledig bij het individuele profiel van elke coureur komt te liggen.
