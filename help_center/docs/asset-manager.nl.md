# Asset Manager

Met de **Asset Manager** kunt u al uw digitale race-assets uploaden, organiseren en beheren, inclusief audiobestanden, aangepaste afbeeldingen, afbeeldingensets en rotatieschema's.

## Overzicht

Assets zijn aangepaste bronnen die in de toepassing worden gebruikt om de race-ervaring te personaliseren:

- **Geluidsbestanden:** Aangepaste audiomeldingen, starttonen, finishsignalen en commentaarclips.
- **Audiosets:** Gegroepeerde verzamelingen van audiobestanden of tekst-naar-spraak (TTS) berichten gekoppeld aan specifieke triggerwaarden (tijd in seconden, resterende ronden of brandstofpercentage).
- **Afbeeldingen:** Autografieën, coureursavatars, aangepaste vlaggen, sponsorlogo's en achtergrondafbeeldingen.
- **Afbeeldingensets:** Verzamelingen van gerelateerde afbeeldingen (zoals brandstofmeters of aftelsequenties).
- **Aangepaste Rotaties:** Door de gebruiker gedefinieerde rotatie-assets voor complexe rotatie-indelingen.

## Assets Uploaden

Om nieuwe assets naar uw bibliotheek te uploaden:

1. Open de **Asset Manager** vanuit het hoofdmenu of de configuratie-werkbalk.
2. Sleep een of meer bestanden naar het gedeelte **Assets Uploaden**, of klik om op uw computer te zoeken.
3. Ondersteunde formaten zijn onder meer `.wav`, `.mp3`, `.ogg` voor audio en `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` voor afbeeldingen.

## Audiosets en Triggerwaarden

Met een **Audioset** kunt u een reeks geluiden of gesproken meldingen configureren die worden geactiveerd bij specifieke numerieke drempelwaarden. Afhankelijk van waar de audioset is toegewezen in Race Coordinator AI, vertegenwoordigen de waarden verschillende eenheden:

*   **Tijd in Seconden:** Gebruikt in Thema-instellingen voor **Start countdown**, **Resterende seconden**, **Automatische start** en **Automatisch doorgaan** (bijvoorbeeld vermeldingen bij `5`, `4`, `3`, `2`, `1` en `0` seconden).
*   **Rondenaantal:** Gebruikt in Thema-instellingen voor **Resterende ronden** meldingen. Vermeldingen bepalen meldingen wanneer de leider specifieke resterende rondenaantallen bereikt (bijvoorbeeld `10`, `5`, `1` en `0` resterende ronden).
*   **Brandstofpercentage (%):** Gebruikt in Coureur-instellingen voor **Brandstofniveau-geluiden**. Vermeldingen bepalen meldingen wanneer het brandstofniveau van de coureur waarschuwings-, kritieke of vol-drempelwaarden bereikt (bijvoorbeeld `20%`, `10%`, `0%` leeg of `100%` volgetankt).

In de **Audioset-editor** kunt u vermeldingen toevoegen, vooraf ingestelde audiobestanden selecteren of TTS-zinnen schrijven (met sjabloonvariabelen zoals `{driver.nickname}`), triggerwaarden instellen en de knop **Waarden automatisch extraheren uit namen** gebruiken om waarden automatisch in te vullen op basis van genummerde bestandsnamen (bijv. `10.mp3`, `5.mp3`).
