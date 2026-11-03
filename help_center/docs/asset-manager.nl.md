# Assetbeheer

## Overzicht {: #overview }

Met **Assetbeheer** kunt u al uw digitale racemedia uploaden, organiseren en beheren, waaronder audiobestanden, afbeeldingen, afbeeldingenseries en rotatieschema's in Race Coordinator AI.

Assets zijn aanpasbare bestanden om de race-ervaring persoonlijk te maken:

- **Geluidsbestanden:** Aangepaste audiomeldingen, startsignalen, finishhoorns en commentaren.
- **Audiosets:** Gegroepeerde verzamelingen geluidsbestanden of tekst-naar-spraak (TTS)-meldingen gekoppeld aan specifieke drempelwaarden (seconden, resterende ronden of brandstofniveau).
- **Afbeeldingen:** Auto-afbeeldingen, coureursavatars, aangepaste vlaggen, sponsorlogo's en achtergronden.
- **Afbeeldingenseries:** Reeksen opeenvolgende afbeeldingen voor animaties (zoals brandstofmeters of startlichten).
- **Aangepaste rotaties:** Gebruikersgedefinieerde baanrotaties voor speciale raceformats.

---

## Assets toevoegen {: #adding-assets }

Het linkerpaneel van Assetbeheer biedt vier knoppen om nieuwe assets toe te voegen aan uw bibliotheek, afzonderlijk of in bulk:

1. **Uploadzone (Drop Zone):** Sleep bestanden rechtstreeks naar het gestreepte vak of klik erop om de bestandsverkenner te openen. U kunt meerdere bestanden tegelijk uploaden.
   - Ondersteunde afbeeldingsformaten: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Ondersteunde audioformaten: `.wav`, `.mp3`, `.ogg`.
2. **Nieuwe afbeeldingenset:** Opent de Afbeeldingenset-editor om meerdere opeenvolgende afbeeldingen te combineren tot animaties en statusmeters.
3. **Nieuwe audioset:** Opent de Audioset-editor om sequenties van geluiden te programmeren op basis van tijd, resterende ronden of brandstof.
4. **Nieuwe aangepaste rotatie:** Opent de Rotatie-editor om gespecialiseerde baanwisselschema's te ontwerpen.

---

## Assetbibliotheek & Acties {: #asset-library }

Het hoofdpaneel toont alle opgeslagen beeld- en audio-assets in uw database.

Wanneer u met de muis over een assetkaart beweegt, verschijnen handige snelacties:
- **Audio afspelen:** Klik op de afspeelknop op audiokaarten om het geluid meteen te beluisteren zonder een editor te openen.
- **Afbeeldingsvoorbeeld:** Toont afbeeldingen in volledige resolutie en details van afzonderlijke frames in series.
- **Direct hernoemen:** Klik op de naam om de asset meteen in het overzicht te hernoemen.
- **Asset verwijderen:** Klik op het prullenbak-icoon om overbodige bestanden uit de database te wissen.

U kunt ook assets aanklikken om ze te selecteren. Bij geselecteerde items biedt de bovenste werkbalk acties voor bulksgewijs bewerken en verwijderen.

---

## Filters & Weergaveopties {: #filter-tabs }

Bovenaan de bibliotheek vindt u diverse functies om snel het juiste bestand te vinden:

- **Filtertabbladen:** Filter de bibliotheek op assettype:
  - **Alles:** Toont elk bestand in de database.
  - **Afbeeldingen:** Enkelvoudige statische afbeeldingen (`.png`, `.jpg`, `.svg`, enz.).
  - **Afbeeldingensets:** Animaties en brandstofmeters bestaande uit meerdere afbeeldingen.
  - **Geluiden:** Losse audioclips (`.wav`, `.mp3`, `.ogg`).
  - **Audiosets:** Geluidsverzamelingen gekoppeld aan numerieke drempelwaarden.
  - **Aangepaste rotaties:** Baanrotatieschema's voor heats.
- **Weergave-indeling:** Schakel tussen **Lijstweergave**, **Kleine miniaturen**, **Middelgrote miniaturen** en **Grote miniaturen**.
- **Filteren op naam:** Zoekveld dat de lijst in realtime filtert terwijl u typt.

---

## Audiosets en drempelwaarden

Met een **Audioset** kunt u geluiden of gesproken meldingen koppelen aan concrete meetpunten in de race:

*   **Tijd in seconden:** Gebruikt in thema's voor startaftellingen en meldingen over resterende heattijd.
*   **Aantal ronden:** Gebruikt in thema's voor aankondigingen van resterende ronden voor de leider.
*   **Brandstofpercentage (%):** Gebruikt bij coureursinstellingen voor tankwaarschuwingen en voltankmeldingen.

### Dubbele triggermodi: Resterend vs. Verstreken

Elke melding kan worden ingesteld met een specifieke modus:
*   **Resterend (Aftellen):** Wordt geactiveerd wanneer de heat het nulpunt of de finish nadert.
*   **Verstreken (Optellen):** Wordt geactiveerd naarmate de race vordert vanaf de start.

---

## Assets gebruiken in thema's en lay-outs

Zodra uw bestanden zijn geüpload of gemaakt, zijn ze direct beschikbaar in alle onderdelen van Race Coordinator AI:

- Kies geluidseffecten in de [Thema-editor](themes.nl.md) voor rondetijden en finishfanfares.
- Koppel afbeeldingen in de [Coureureditor](driver-editor.nl.md) voor profielfoto's en avatars.
- Configureer visuele meters in de [Lay-outeditor](layout-editor.nl.md).
- Koppel rotatieschema's in de [Race-editor](race-editor.nl.md).
