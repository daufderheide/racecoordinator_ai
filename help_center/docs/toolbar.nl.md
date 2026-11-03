# Werkbalkacties

De **Editor Werkbalk** biedt een gestandaardiseerde bediening over alle beheerschermen in Race Coordinator AI (Coureurs, Teams, Banen, Races, Lay-outs, Thema's en Databases).

## Overzicht {: #overview }

De werkbalk structureert de levenscyclus in alle editors:

- **Alleen-Lezen Modus**: Bij het openen zijn invoervelden vergrendeld om onbedoelde wijzigingen te voorkomen, terwijl u eigenschappen en audio veilig kunt inspecteren.
- **Bewerkingsmodus**: Klikken op **Bewerken** (potlood) ontgrendelt de invoervelden. Het keuzemenu bovenaan wordt vergrendeld om niet-opgeslagen wijzigingen te beschermen.
- **Opslaan en Sluiten**: Klikken op **Voltooid** (vinkje) valideert en bewaart de gegevens in SQLite en keert terug naar de alleen-lezen modus.

## Pictogramoverzicht {: #icons }

Hieronder volgt een overzicht van elk actiepictogram op de werkbalk:

### Bewerken / Voltooid {: #edit }
- **Pictogrammen**: `edit` (potlood) / `check` (vinkje)
- **Sneltoets**: `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Beschrijving**: Schakelt tussen alleen-lezen en bewerkingsmodus.

### Nieuw Maken {: #add }
- **Pictogram**: `add` (plus)
- **Beschrijving**: Maakt een nieuw leeg item aan en opent direct de bewerkingsmodus.

### Dupliceren {: #copy }
- **Pictogram**: `content_copy` (dubbel document)
- **Beschrijving**: Maakt een kopie van het geselecteerde item onder een nieuwe naam.

### Verwijderen {: #delete }
- **Pictogram**: `delete` (prullenbak)
- **Beschrijving**: Verwijdert het item permanent na bevestiging.

### Ongedaan Maken {: #undo }
- **Pictogram**: `undo` (pijl linksom)
- **Sneltoets**: `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Beschrijving**: Maakt de laatste wijziging in de actieve bewerkingssessie ongedaan.

### Opnieuw Uitvoeren {: #redo }
- **Pictogram**: `redo` (pijl rechtsom)
- **Sneltoets**: `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` of `Ctrl+Y` (Windows/Linux)
- **Beschrijving**: Voert de zojuist ongedaan gemaakte wijziging opnieuw uit.

### Alles Uitvouwen / Samenvouwen {: #expand-collapse }
- **Pictogram**: `unfold_more` / `unfold_less` (verticale pijlen)
- **Beschrijving**: Vouwt alle accordeonsecties in de editor gelijktijdig uit of samen.

### Activeren {: #activate }
- **Pictogram**: `check_circle` (omcirkeld vinkje)
- **Beschrijving**: Stelt het geselecteerde thema in als het actieve thema voor races.

### Importeren {: #import }
- **Pictogram**: `download` / `file_upload` (pijl omlaag)
- **Beschrijving**: Opent een dialoogvenster om externe bestanden te importeren (`.json`, `.zip`, `.csv`).

### Exporteren {: #export }
- **Pictogram**: `upload` / `file_download` (pijl omhoog)
- **Beschrijving**: Exporteert de configuratie naar een archief (`.zip`, `.xlsx`, `.csv`).

### Fabrieksinstellingen Herstellen {: #reset }
- **Pictogram**: `restart_alt` (reset-pijl)
- **Beschrijving**: Zet de database of configuratie terug naar de oorspronkelijke waarden.

### Lay-out Wissen {: #clear }
- **Pictogram**: `delete_sweep` (bezem)
- **Beschrijving**: Maakt het werkgebied in de Lay-out Editor volledig leeg.

### Heats Opnieuw Genereren {: #regenerate }
- **Pictogram**: `sync` (roterende pijlen)
- **Beschrijving**: Berekent de heat-rotaties en baantoewijzingen opnieuw.

### Baanverdeling Controleren {: #lane-check }
- **Pictogram**: `check` (vinkje / weegschaal)
- **Beschrijving**: Controleert of alle banen gelijkmatig over de heats verdeeld zijn.

### Zoombediening {: #zoom }
- **Pictogrammen**: `zoom_in` / `zoom_out` met schuifregelaar
- **Beschrijving**: Past het vergrotingsniveau van het werkgebied aan tussen 50% en 150%.

### Gebruiksstatistieken (Analytics) {: #analytics }
- **Pictogram**: `analytics` (staafdiagram)
- **Beschrijving**: Schakelt anonieme telemetrie en foutenrapportage in of uit.

### Rondleiding (Help) {: #help }
- **Pictogram**: `lightbulb` (gloeilamp)
- **Beschrijving**: Start een interactieve stapsgewijze rondleiding op de huidige pagina.

