# Editor del Team

L'**Editor del Team** consente di creare, visualizzare e personalizzare i profili dei team, assegnare i piloti, caricare i loghi e gestire le formazioni.

## Panoramica

L'Editor del Team integra la selezione e la modifica del team in un'interfaccia unificata:

- **Selettore del Team**: Situato nell'intestazione superiore accanto al titolo della pagina, questo menu a discesa elenca tutti i team esistenti e consente di passare rapidamente da uno all'altro.
- **Modalità Sola Lettura**: Per impostazione predefinita, l'apertura dell'editor mostra i dettagli del team e i piloti assegnati in modalità sola lettura. I campi del modulo, la selezione del logo e le azioni di assegnazione sono bloccati per prevenire modifiche accidentali.
- **Modalità Modifica**: Facendo clic sull'icona **Modifica** (matita) nella barra degli strumenti, si sbloccano i campi di input e i controlli di assegnazione. In modalità modifica, il selettore del team rimane bloccato per evitare di abbandonare modifiche non salvate.
- **Salvataggio Automatico Continuo**: Man mano che apporti modifiche (nome del team, logo o riordino/assegnazione dei piloti), le modifiche vengono salvate automaticamente in background sul server senza uscire dalla modalità di modifica.
- **Termina Modifica**: Facendo clic sull'icona **Termina Modifica** (segno di spunta), le modifiche vengono convalidate, salvate sul server e viene ripristinata la modalità sola lettura.
- **Annulla Modifiche**: Se si tenta di uscire con modifiche non salvate o non valide, la finestra di dialogo di conferma richiederà l'approvazione. L'annullamento ripristina tutte le modifiche all'ultima versione salvata.

## Azioni della Barra degli Strumenti

La barra degli strumenti superiore fornisce le seguenti azioni:

- **Indietro**: Ritorna alla visualizzazione precedente o a Configurazione Giorno di Gara.
- **Aggiungi Team (+)**: Crea un nuovo modello di team ed entra in modalità di modifica.
- **Duplica Team**: Duplica il team attualmente selezionato assegnandogli un nome univoco.
- **Modifica / Termina Modifica**: Alterna tra la modalità sola lettura e la modalità modifica (scorciatoia da tastiera: Cmd/Ctrl+E).
- **Elimina Team**: Elimina il team selezionato previa conferma.
- **Annulla / Ripeti**: Annulla o riapplica le modifiche recenti effettuate durante la sessione.
- **Guida (?)**: Apre la guida interattiva che evidenzia ogni sezione dell'editor.

## Profilo del Team {: #team-profile }

Il pannello di sinistra raccoglie le impostazioni principali di identità e categorizzazione del team:

- **Nome del Team**: Il nome univoco del team visualizzato nelle classifiche, nelle tabelle dei record e nei tabelloni di gara.
- **Immagine / Logo del Team**: Scegli un'icona preimpostata o carica un logo personalizzato per rappresentare il team.
- **Etichette del Team**: Assegna etichette con codice colore (simili alle etichette di GitHub) per organizzare i team in categorie personalizzate (come "GT3", "Pro" o "Amateur"). I team possono appartenere a qualsiasi numero di etichette. In modalità modifica, fai clic su **Gestisci etichette** per creare, modificare, ricolorare, eliminare o assegnare etichette. Nella schermata Configurazione del Giorno di Gara, puoi filtrare i team disponibili per etichetta per comporre rapidamente le formazioni di gara.

## Membri del Team & Formazione {: #team-members }

La sezione superiore del pannello destro mostra i piloti attualmente assegnati a questo team:

- **Gestione della Formazione**: In modalità modifica, puoi trascinare e rilasciare i piloti tramite la maniglia (`☰`) per riordinare la sequenza del team, oppure fare clic sul pulsante elimina (<span class="material-icons">delete</span>) per rimuovere un pilota dal team.
- **Rotazione Round-Robin**: Quando un team disputa una gara, i piloti assegnati ruotano automaticamente tra le manche assegnate al team seguendo un ordine round-robin basato su questo elenco.
- **Cambi di Pilota a Metà Manche**: A seconda della configurazione di gara del team, i piloti possono essere sostituiti anche a metà manche, durante una sosta ai box o in qualsiasi punto del circuito.
- **Etichette Pilota**: Ciascun pilota mostra le etichette assegnate come badge accanto al proprio nome per verificare con facilità qualifiche e livelli di abilità.

## Piloti Disponibili {: #available-drivers }

La sezione inferiore del pannello destro elenca tutti i piloti registrati che non sono attualmente assegnati a questo team:

- **Aggiunta Piloti**: In modalità modifica, fai clic sulla scheda di qualsiasi pilota o sull'icona di aggiunta (<span class="material-icons">add</span>) per aggiungerlo immediatamente alla formazione del team.
- **Appartenenza a Più Team**: Un pilota può appartenere a più di un team nel tuo database.
- **Prevenzione di Conflitti in Gara**: Sebbene un pilota possa appartenere a più team, nessun pilota può partecipare alla stessa gara più di una volta, né correndo per due team rivali né partecipando contemporaneamente come singolo e in squadra.
