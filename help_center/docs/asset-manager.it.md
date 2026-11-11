# Gestione Risorse

## Panoramica {: #overview }

La **Gestione Risorse** ti consente di caricare, organizzare e gestire tutti i file multimediali per le tue gare, inclusi file audio, immagini personalizzate, set di immagini e schemi di rotazione in Race Coordinator AI.

Le risorse sono elementi personalizzati utilizzati per rendere unica l'esperienza di gara:

- **File audio:** Annunci vocali personalizzati, segnali acustici di partenza, trombe di traguardo e commenti.
- **Set audio:** Raccolte raggruppate di suoni o frasi di sintesi vocale (TTS) mappate su soglie specifiche (secondi rimanenti, giri rimanenti o livello carburante).
- **Immagini:** Grafiche delle auto, avatar dei piloti, bandiere personalizzate, loghi degli sponsor e sfondi.
- **Set di immagini:** Sequenze di immagini collegate (come indicatori di carburante o semafori di partenza).
- **Rotazioni personalizzate:** Schemi di rotazione delle corsie definiti dall'utente per formati di gara specifici.

---

## Aggiunta di risorse {: #adding-assets }

Il pannello di sinistra della Gestione Risorse fornisce quattro controlli per aggiungere risorse alla libreria, singolarmente o in blocco:

1. **Area di caricamento (Drop Zone):** Trascina uno o più file direttamente nell'area tratteggiata o fai clic per aprire la finestra di selezione dei file. Puoi caricare più file contemporaneamente.
   - Formati immagine supportati: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Formati audio supportati: `.wav`, `.mp3`, `.ogg`.
2. **Nuovo set di immagini:** Apre l'Editor set di immagini per creare sequenze grafiche animate e indicatori di stato (come le barre del carburante).
3. **Nuovo set audio:** Apre l'Editor set audio per creare sequenze sonore attivate in base a timer, giri rimanenti o percentuali di carburante.
4. **Nuova rotazione personalizzata:** Apre l'Editor rotazioni per definire schemi personalizzati di scambio corsie.

---

## Libreria risorse & Azioni {: #asset-library }

Il pannello principale della libreria mostra tutte le risorse visive e sonore memorizzate nel database.

Passando il cursore su qualsiasi elemento compaiono comandi rapidi:
- **Riproduzione audio:** Fai clic sul pulsante di riproduzione sulle schede audio per ascoltare immediatamente il suono senza aprire alcun editor.
- **Anteprima immagine:** Mostra l'immagine a piena risoluzione e i singoli fotogrammi dei set di immagini.
- **Rinomina diretta:** Fai clic sul nome per rinominare rapidamente la risorsa direttamente nella griglia.
- **Elimina risorsa:** Fai clic sull'icona del cestino per rimuovere file inutilizzati dal database.

Puoi anche selezionare più risorse facendo clic su di esse. Con elementi selezionati, la barra degli strumenti superiore offre azioni di modifica ed eliminazione in blocco.

---

## Filtri e opzioni di visualizzazione {: #filter-tabs }

La Gestione Risorse offre strumenti rapidi per trovare e organizzare le risorse:

- **Schede di filtro:** Filtra rapidamente la libreria in base al tipo di risorsa (la scheda selezionata viene automaticamente salvata e ripristinata alle visite successive):
  - **Tutte:** Mostra ogni risorsa memorizzata nel database.
  - **Immagini:** Singoli file grafici statici (`.png`, `.jpg`, `.svg`, ecc.).
  - **Set di immagini:** Animazioni e indicatori composti da più immagini.
  - **Suoni:** Singoli file sonori (`.wav`, `.mp3`, `.ogg`).
  - **Set audio:** Raccolte sonore legate a soglie numeriche.
  - **Rotazioni personalizzate:** Schemi di rotazione delle corsie per le manche.
- **Layout di visualizzazione:** Passa tra **Vista a elenco**, **Miniature piccole**, **Miniature medie** e **Miniature grandi**.
- **Filtra per nome:** Campo di ricerca in tempo reale che restringe istantaneamente l'elenco durante la digitazione.

---

## Set audio e valori di attivazione

Un **Set audio** consente di programmare una serie di suoni o annunci vocali che si attivano al raggiungimento di determinate soglie:

*   **Tempo in secondi:** Utilizzato nei temi per conti alla rovescia, secondi rimanenti, avvio automatico e avanzamento automatico.
*   **Conteggio giri:** Utilizzato nei temi per annunciare i giri mancanti del battistrada.
*   **Percentuale carburante (%):** Utilizzato nel profilo dei piloti per avvisi di riserva e rifornimento completato.

### Modalità di attivazione: Rimanente vs Trascorso

Ciascuna voce può essere configurata in due modalità:
*   **Rimanente (Conto alla rovescia):** Si attiva quando la manche si avvicina alla conclusione o allo zero.
*   **Trascorso (Conto progressivo):** Si attiva man mano che la gara avanza dalla partenza.

---

## Utilizzo delle risorse nei temi e nei layout

Una volta caricate o create, le tue risorse sono subito disponibili nell'intera applicazione:

- Seleziona suoni nell'[Editor temi](themes.it.md) per i tempi sul giro e gli annunci di fine gara.
- Assegna immagini nell'[Editor piloti](driver-editor.it.md) per foto e avatar.
- Configura widget visivi nell'[Editor layout](layout-editor.it.md).
- Collega schemi di rotazione nell'[Editor gare](race-editor.it.md).
