# Racedag-Bediening

## Ronde- en Tijdaanpassingen

Wedstrijdleiders kunnen handmatig het aantal ronden en de heattijden van coureurs aanpassen rechtstreeks vanaf het racedag-scherm om baanincidenten, gemiste sensordoorkomsten of straffen op te lossen:

### Het Aanpassingsvenster Openen
- **Cel Klikken**: Klik met de linkermuisknop op een cel of kaart van **Rondenaantal** (`lapCount`, `physicalLapCount`) of **Totale Tijd** (`totalTime`, `overallTotalTime`) voor die baan.
- **Wedstrijdleidermenu**: Open het **Wedstrijdleidermenu** en kies **Rondesecties/tijd aanpassen** om coureurs over huidige, voorgaande of nog niet gestarte heats in batch te bewerken.
- **Resultatenschermen**: Tevens toegankelijk via de schermen **Heatresultaten** en **Raceresultaten** om verreden heats achteraf aan te passen.

### Snelle Sneltoetsen (Ronden)
Bij het klikken op een interactieve rondecel:
- **`Shift + Linksklikken`**: Voegt direct +0,25 ronden (+1/4 ronde) toe zonder het dialoogvenster te openen.
- **`Alt + Linksklikken`**: Trekt direct -0,25 ronden (-1/4 ronde) af zonder het dialoogvenster te openen.

### Bedieningselementen in het Dialoogvenster
1. **Baansecties**: Voer baansecties in (bijv. op basis van 100 secties per ronde) om het aantal ronden aan te passen. Een live voorvertoning toont de fractie van ronden (bijv. 25 secties = 0,25 ronden).
2. **Tijdaanpassing**: Voer positieve seconden (straftijd, bijv. `+5.000`) of negatieve seconden (tijdcompensatie, bijv. `-2.500`) in met millisecondeprecisie (`0.001s`).
3. **Live Totale Tijd Voorvertoning**: Het venster berekent en toont de aangepaste totale heattijd van de coureur in realtime voordat de wijzigingen worden toegepast.

### Effect op Standen en Statistieken
- **Aangepaste Ronden**: Verandert direct de positie in **Meeste Ronden**-klassementen en werkt de rondeverschillen (`gapLeader`, `gapPosition`) bij. Fysieke sensorronden, de snelste ronde, de mediaan-rondetijd en de fysieke gemiddelde pace blijven onveranderd.
- **Aangepaste Totale Tijd**: Verandert de positie in **Snelste Totale Tijd**-klassementen, fungeert als primaire tiebreaker bij een gelijk aantal ronden, en werkt de **Gemiddelde Rondetijd** ($\text{Aangepaste Totale Tijd} / \text{Fysieke Ronden}$) en tijdsverschillen bij.
- **Beschermde Statistieken**: De **Snelste Ronde** en de **Mediaan-Rondetijd** blijven strikt behouden op basis van echte sensordoorkomsten en worden nooit gewijzigd door tijdaanpassingen.
