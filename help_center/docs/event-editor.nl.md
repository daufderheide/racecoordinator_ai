# Evenementeneditor

Met de **Evenementeneditor** ontwerpt, configureert en beheert u evenementen die uit meerdere races bestaan. In Race Coordinator AI koppelt een evenement afzonderlijke raceconfiguraties aan elkaar in een opeenvolgende reeks, zoals kwalificatieronden gevolgd door halve finales en finales, of toernooischema's met meerdere fasen.

## Overzicht

De Evenementeneditor biedt een overzichtelijke indeling met twee panelen:

- **Evenementselectie**: Deze vervolgkeuzelijst in de bovenste koptekst toont alle opgeslagen evenementen en maakt het mogelijk snel te wisselen en te bladeren met de vorige/volgende knoppen.
- **Alleen-lezenmodus**: Standaard opent de editor in de alleen-lezenmodus om onbedoelde wijzigingen aan de racevolgorde te voorkomen.
- **Bewerkingsmodus**: Door op het potloodpictogram (**Bewerken**) op de werkbalk te klikken, worden formuliervelden en volgordeknoppen ontgrendeld.
- **Continu automatisch opslaan**: Aanpassingen aan naam, beschrijving, doorschakeltijd en volgorde worden automatisch op de achtergrond opgeslagen.
- **Bewerkingsmodus verlaten**: Klikken op het vinkje (**Bewerken Voltooien**) valideert het evenement, slaat alles op en keert terug naar de alleen-lezenmodus.

---

## Werkbalkacties

De werkbalk bovenaan biedt essentiële beheer- en bewerkingsfuncties:

- **Terug**: Keert terug naar het vorige scherm of de Racedag-configuratie.
- **Evenement toevoegen (+)**: Maakt een nieuw evenementsjabloon met standaardwaarden en schakelt over naar de bewerkingsmodus.
- **Evenement dupliceren**: Kloont het huidige evenement onder een nieuwe unieke naam.
- **Bewerken / Voltooien**: Wisselt tussen de alleen-lezenmodus en bewerkingsmodus (sneltoets: `Cmd/Ctrl+E`).
- **Evenement verwijderen**: Verwijdert het geselecteerde evenement definitief na bevestiging.
- **Ongedaan maken / Opnieuw uitvoeren**: Maakt recente bewerkingen ongedaan of past ze opnieuw toe.
- **Help (?)**: Start de interactieve rondleiding langs alle onderdelen van de editor.

---

## Evenementconfiguratie {: #event-configuration }

Het linkerpaneel configureert algemene metagegevens en automatische doorschakeling tussen fasen:

- **Naam van Evenement**: Een unieke weergavenaam die het evenement aanduidt in de app en op scoreborden.
- **Beschrijving**: Een optioneel tekstveld voor toelichtingen, regels of toernooi-instructies.
- **Automatische Doorschakeltijd**: Het aftellen (in seconden) nadat een race eindigt voordat automatisch de volgende race in de volgorde wordt geladen. Waarde `0` schakelt automatisch doorschakelen uit.

---

## Racevolgorde {: #race-sequence }

Het rechterpaneel beheert de geordende reeks races van het evenement:

- **Race toevoegen**: Klik in de bewerkingsmodus op **+ Race Toevoegen** om opgeslagen races te kiezen en aan de volgorde toe te voegen.
- **Voortgangsvolgorde**: Races worden van boven naar beneden uitgevoerd (Fase #1, Fase #2, enz.). Versleep in bewerkingsmodus de sleepgreep (<span class="material-icons">drag_indicator</span>) om fasen te verplaatsen.
- **Maximum coureurslimieten**: Elke fase kan het aantal deelnemers beperken:
  - **Onbeperkt (Alle coureurs)**: Alle gekwalificeerde coureurs uit de vorige fase rijden deze race.
  - **Vaste limiet**: Stel een exact aantal best geklasseerde coureurs in dat doorstroomt (bijv. top 8 naar halve finales). Klik op **Onbeperkt** om te wisselen tussen een limiet en alle coureurs.
- **Race verwijderen**: Klik in bewerkingsmodus op het prullenbakpictogram (<span class="material-icons">delete</span>) om een race uit de volgorde te verwijderen. Elk evenement moet minstens één race bevatten.

