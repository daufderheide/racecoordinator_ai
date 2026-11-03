# Azioni della Barra degli Strumenti

La **Barra degli Strumenti dell'Editor** offre controlli uniformi e standardizzati su tutte le schermate di gestione di Race Coordinator AI (Piloti, Team, Piste, Gare, Layout, Temi e Database).

## Panoramica {: #overview }

La barra degli strumenti regola il ciclo di vita delle schermate:

- **Modalità Sola Lettura**: All'apertura, i moduli sono bloccati per evitare modifiche involontarie consentendo al contempo l'ispezione sicura delle impostazioni.
- **Modalità Modifica**: Cliccando su **Modifica** (matita) si sbloccano i campi. Il selettore in alto si blocca per proteggere il lavoro non salvato.
- **Salvataggio ed Uscita**: Cliccando su **Fine** (segno di spunta) le modifiche vengono convalidate, salvate nel database SQLite e si torna alla modalità di sola lettura.

## Riferimento Icone {: #icons }

Di seguito la descrizione dettagliata delle icone disponibili:

### Modifica / Fine {: #edit }
- **Icone**: `edit` (matita) / `check` (spunta)
- **Scorciatoia**: `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Descrizione**: Passa dalla modalità sola lettura alla modalità modifica e viceversa.

### Crea Nuovo {: #add }
- **Icona**: `add` (più)
- **Descrizione**: Crea un nuovo elemento vuoto ed entra immediatamente in modalità modifica.

### Duplica {: #copy }
- **Icona**: `content_copy` (documenti sovrapposti)
- **Descrizione**: Duplica l'elemento selezionato con un nuovo nome.

### Elimina {: #delete }
- **Icona**: `delete` (cestino)
- **Descrizione**: Rimuove definitivamente l'elemento previa conferma.

### Annulla {: #undo }
- **Icona**: `undo` (freccia antioraria)
- **Scorciatoia**: `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Descrizione**: Annulla l'ultima modifica effettuata nella sessione corrente.

### Ripristina {: #redo }
- **Icona**: `redo` (freccia oraria)
- **Scorciatoia**: `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` o `Ctrl+Y` (Windows/Linux)
- **Descrizione**: Ripristina la modifica annullata in precedenza.

### Espandi / Comprimi Tutto {: #expand-collapse }
- **Icona**: `unfold_more` / `unfold_less` (frecce verticali)
- **Descrizione**: Espande o comprime contemporaneamente tutte le sezioni a fisarmonica dell'editor.

### Attiva {: #activate }
- **Icona**: `check_circle` (spunta nel cerchio)
- **Descrizione**: Imposta il tema selezionato come tema attivo per le gare.

### Importa {: #import }
- **Icona**: `download` / `file_upload` (freccia in basso)
- **Descrizione**: Apre il dialogo per importare file esterni (`.json`, `.zip`, `.csv`).

### Esporta {: #export }
- **Icona**: `upload` / `file_download` (freccia in alto)
- **Descrizione**: Esporta i dati in un archivio (`.zip`, `.xlsx`, `.csv`).

### Ripristina Predefiniti {: #reset }
- **Icona**: `restart_alt` (freccia di ripristino)
- **Descrizione**: Riporta il database o i valori alle impostazioni di fabbrica.

### Svuota Layout {: #clear }
- **Icona**: `delete_sweep` (scopa)
- **Descrizione**: Cancella completamente l'area di lavoro nell'Editor Layout.

### Rigenera Batterie {: #regenerate }
- **Icona**: `sync` (frecce rotanti)
- **Descrizione**: Ricalcola e rigenera le rotazioni e le assegnazioni delle corsie.

### Controllo Corsie {: #lane-check }
- **Icona**: `check` (spunta / bilancia)
- **Descrizione**: Verifica che tutte le corsie siano distribuite uniformemente nelle batterie.

### Regolazione Zoom {: #zoom }
- **Icone**: `zoom_in` / `zoom_out` con cursore
- **Descrizione**: Regola l'ingrandimento dell'area di lavoro tra il 50% e il 150%.

### Statistiche di Utilizzo (Analytics) {: #analytics }
- **Icona**: `analytics` (grafico a barre)
- **Descrizione**: Attiva o disattiva l'invio anonimo di dati diagnostici.

### Tour Guidato (Aiuto) {: #help }
- **Icona**: `lightbulb` (lampadina)
- **Descrizione**: Avvia una guida interattiva passo-passo sui comandi della pagina.

