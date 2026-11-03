# Editor Eventi

L'**Editor Eventi** consente di progettare, configurare e gestire eventi multi-gara. In Race Coordinator AI, un evento collega molteplici configurazioni di gara distinte in una progressione sequenziale, come turni di qualificazione seguiti da semifinali e finali, o tornei a fasi.

## Panoramica

L'Editor Eventi offre un'interfaccia a due pannelli per organizzare competizioni su più livelli:

- **Selettore Evento**: Situato nell'intestazione in alto accanto al titolo della pagina, questo menu a discesa elenca tutti gli eventi salvati e consente di passare rapidamente dall'uno all'altro tramite i pulsanti precedente/successivo.
- **Modalità Sola Lettura**: Di default, l'editor si apre in modalità sola lettura per impedire modifiche accidentali alle sequenze delle gare.
- **Modalità Modifica**: Facendo clic sull'icona **Modifica** (matita) nella barra degli strumenti, si sbloccano i campi di inserimento e i comandi della sequenza gare.
- **Salvataggio Automatico Continuo**: Le modifiche al nome dell'evento, alla descrizione, al tempo di avanzamento automatico e alla sequenza vengono salvate automaticamente in background.
- **Uscita dalla Modalità Modifica**: Facendo clic sull'icona **Fine Modifica** (segno di spunta), l'evento viene convalidato, i dati persistiti e la modalità di sola lettura ripristinata.

---

## Azioni della Barra degli Strumenti

La barra degli strumenti superiore offre azioni indispensabili per la gestione:

- **Indietro**: Torna alla schermata precedente o a Configurazione Giorno di Gara.
- **Aggiungi Evento (+)**: Crea un nuovo modello di evento con impostazioni predefinite ed entra in modalità modifica.
- **Duplica Evento**: Clona l'evento corrente con un nuovo nome univoco.
- **Modifica / Fine Modifica**: Alterna tra Modalità Sola Lettura e Modalità Modifica (scorciatoia da tastiera: `Cmd/Ctrl+E`).
- **Elimina Evento**: Elimina definitivamente l'evento selezionato previa conferma.
- **Annulla / Ripristina**: Annulla o riapplica le ultime modifiche apportate durante la sessione.
- **Aiuto (?)**: Avvia il tour guidato interattivo che illustra ogni sezione dell'editor.

---

## Configurazione Evento {: #event-configuration }

Il pannello di sinistra configura i metadati generali e il comportamento di passaggio automatico tra le fasi:

- **Nome Evento**: Un nome univoco che identifica l'evento in tutta l'applicazione e nelle classifiche.
- **Descrizione**: Un'area di testo opzionale per note, regolamenti di fase, riepiloghi o indicazioni per il torneo.
- **Tempo di Avanzamento Automatico**: Il conto alla rovescia (in secondi) da attendere dopo la fine di una gara prima di caricare e avviare automaticamente la gara successiva. Impostando questo valore a `0` si disattiva l'avanzamento automatico.

---

## Sequenza Gare {: #race-sequence }

Il pannello di destra gestisce l'ordine sequenziale delle gare che compongono l'evento:

- **Aggiungi Gara**: In Modalità Modifica, fai clic sul pulsante **+ Aggiungi Gara** per selezionare configurazioni salvate e aggiungerle alla sequenza.
- **Ordine di Progressione**: Le gare si svolgono in successione dall'alto verso il basso (Fase #1, Fase #2, ecc.). In Modalità Modifica, trascina l'indicatore (<span class="material-icons">drag_indicator</span>) su ciascuna scheda per riordinare le fasi.
- **Limiti di Piloti**: Ciascuna fase può limitare il numero di concorrenti ammessi:
  - **Illimitato (Tutti i Piloti)**: Tutti i piloti qualificati della fase precedente partecipano alla gara.
  - **Limite Numerico**: Specifica il numero esatto dei migliori piloti ammessi alla fase (ad es. i migliori 8 alle semifinali). Fai clic su **Illimitato** per alternare tra limite numerico e tutti i piloti.
- **Rimuovi Gara**: In Modalità Modifica, fai clic sull'icona del cestino (<span class="material-icons">delete</span>) per rimuovere una fase. Ciascun evento deve contenere almeno una gara.

