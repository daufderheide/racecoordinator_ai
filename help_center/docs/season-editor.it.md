# Editor Stagione

L'**Editor Stagione** consente di creare, gestire ed esaminare stagioni di campionato. Una stagione tiene traccia delle classifiche su più gare ed eventi nel tempo, accumula punti di campionato per i piloti, applica le regole delle gare scartate e calcola le posizioni in tempo reale.

## Panoramica

L'Editor Stagione offre un'interfaccia completa per la gestione del campionato:

- **Selettore Stagione**: Situato nell'intestazione superiore accanto al titolo della pagina, questo menu a discesa elenca tutte le stagioni salvate e consente di passare dall'una all'altra con i controlli precedente/successivo.
- **Modalità Sola Lettura**: Di default, l'editor si apre in modalità sola lettura per impedire modifiche accidentali a classifiche e gare registrate.
- **Modalità Modifica**: Facendo clic sull'icona **Modifica** (matita) nella barra degli strumenti si sbloccano i campi e le azioni per aggiungere o rimuovere gare.
- **Salvataggio Automatico Continuo**: Le modifiche ai nomi, agli scarti e all'assegnazione delle gare vengono salvate automaticamente in background.
- **Uscita dalla Modalità Modifica**: Facendo clic sull'icona **Fine Modifica** (segno di spunta) la stagione viene convalidata, i dati salvati e la modalità sola lettura ripristinata.

---

## Azioni della Barra degli Strumenti

La barra degli strumenti superiore offre azioni indispensabili per la gestione:

- **Indietro**: Torna alla schermata precedente o a Configurazione Giorno di Gara.
- **Aggiungi Stagione (+)**: Crea un nuovo modello di stagione con impostazioni predefinite ed entra in modalità modifica.
- **Duplica Stagione**: Clona la stagione corrente con un nuovo nome univoco.
- **Modifica / Fine Modifica**: Alterna tra Modalità Sola Lettura e Modalità Modifica (scorciatoia da tastiera: `Cmd/Ctrl+E`).
- **Elimina Stagione**: Elimina definitivamente la stagione di campionato selezionata previa conferma.
- **Annulla / Ripristina**: Annulla o riapplica le ultime modifiche apportate durante la sessione.
- **Aiuto (?)**: Avvia il tour guidato interattivo che illustra ogni sezione dell'editor.

---

## Configurazione Stagione {: #season-configuration }

Il pannello di sinistra configura le regole generali del campionato e i parametri di punteggio:

- **Nome Stagione**: Un nome univoco per il campionato mostrato nelle classifiche, nei resoconti e nel Giorno di Gara.
- **Gare Scartate (Drops)**: Il numero di gare con il punteggio peggiore da scartare dal totale dei punti di ciascun pilota.

---

## Info Stagione e Gestione Gare {: #season-info-bar }

La barra situata sopra il pannello destro mostra statistiche di stato e controlli per le gare:

- **Gare Disputate**: Mostra il numero totale di gare ed eventi conclusi inclusi nella stagione.
- **Badge Gare Demo**: Indica se nella cronologia degli eventi della stagione sono state registrate gare di prova o dimostrative.
- **Aggiungi Gara**: In Modalità Modifica, fai clic su **+ Aggiungi Gara** per scegliere gare concluse dalla cronologia e aggiungerle alla stagione.

---

## Classifica Stagionale {: #season-standings }

La sezione classifica calcola e presenta le posizioni del campionato in tempo reale:

- **Posizione e Podio**: I piloti sono ordinati per punteggio totale; le medaglie d'oro, d'argento e di bronzo evidenziano i primi tre concorrenti.
- **Nome Pilota**: Nome completo di ciascun pilota partecipante.
- **Punti Netti**: Il punteggio ufficiale utilizzato per la classifica (punti lordi meno detrazioni delle gare scartate).
- **Punti Scartati**: La somma dei punti scartati in base alla regola delle gare scartate.
- **Punti Lordi**: Il totale dei punti grezzi accumulati in tutte le gare disputate.
- **Gare Disputate**: Il numero di gare a cui il pilota ha partecipato.

---

## Dettaglio Gare {: #race-breakdowns }

La sezione di dettaglio offre schede per ogni gara inclusa nella stagione:

- **Schede di Gara Espandibili**: Fai clic su una scheda per visualizzare la tabella dei risultati per pilota con punti di posizione e bonus.
- **Rimuovi Gare**: In Modalità Modifica, fai clic sull'icona del cestino (<span class="material-icons">delete</span>) per rimuovere una gara dalla stagione.

