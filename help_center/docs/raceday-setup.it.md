# Configurazione Giorno di Gara

La schermata di **Configurazione Giorno di Gara** è il centro di partenza di tutte le competizioni in Race Coordinator AI. Da qui configuri i piloti, scegli formati di gara e stagioni, verifichi le rotazioni e avvii gare ufficiali o dimostrative.

## Panoramica {: #overview }

L'interfaccia è suddivisa in due aree di lavoro principali:

- **Gruppo Piloti (Pannello Sinistro)**: Diviso in **Piloti Disponibili** (i piloti pronti a gareggiare) e **Piloti in Gara** (i partecipanti attivi con il loro ordine di partenza).
- **Configurazione e Controlli (Pannello Destro)**: Schede Avvio Rapido per gare recenti, selettori di gara e stagione, riepiloghi in tempo reale e pulsanti di avvio.
- **Barra dei Menu Superiore**: Accesso rapido ai gestori di configurazione, ai file di gara e alle impostazioni generali.

## Piloti Disponibili {: #available-drivers }

La sezione **Piloti Disponibili** elenca tutti i piloti e i team del database disponibili per correre:

- **Aggiungere Piloti**: Trascina un pilota nella lista di gara oppure fai doppio clic sul nome per inserirlo in fondo alla lista.
- **Ricerca e Filtri**: Filtra i piloti in tempo reale per nome o soprannome. Usa le frecce e premi Invio per aggiungere.
- **Filtri Etichette**: Filtra i partecipanti in base a etichette colorate personalizzate.
- **Gestione Piloti e Team**: Clicca sui pulsanti **Team** o **Piloti** per aprire i relativi gestori.
- **Convalida Formazione**: I piloti selezionati non possono essere duplicati. Se un team partecipa, i suoi membri individuali vengono nascosti dall'elenco disponibili.

## Piloti in Gara {: #racing-drivers }

La sezione **Piloti in Gara** mostra i partecipanti scelti per la sessione:

- **Ordine di Partenza (Seeding)**: L'ordine nella lista stabilisce le posizioni di partenza nelle rotazioni. Trascina i piloti per riordinarli.
- **Rimuovere Piloti**: Fai doppio clic su un pilota o trascinalo fuori dalla lista per rimuoverlo dalla gara.
- **Barra delle Azioni**:
    - **Visualizza Formazione Completa**: Apre l'elenco completo del database.
    - **Aggiungi Tutti (+)**: Inserisce tutti i piloti disponibili con un solo clic.
    - **Rimuovi Tutti (-)**: Svuota l'elenco di gara.
    - **Mescola (Shuffle)**: Assegna casualmente le posizioni di partenza.
- **Cerca Piloti in Gara**: Cerca i partecipanti o premi Invio per rimuoverli.

## Selezione Gara e Stagione {: #race-and-season-selection }

Consente di scegliere il formato di gara da disputare:

- **Selettore Gara**: Scegli gare singole o eventi a più gare. Ogni formato definisce rotazioni, punteggi e condizioni di arrivo.
- **Cerca Gara**: Filtra gare ed eventi rapidamente per nome.
- **Selettore Stagione**: Collega la gara a un campionato per registrare i punteggi, oppure scegli **Nessuna** per una gara singola.
- **Riepilogo Configurazione e Classifica**: Mostra dettagli di punteggio, carburante, modalità vivavoce, pista, tema o classifica del campionato.
- **Modifica Gara Selezionata**: Clicca sull'icona della matita per modificare i parametri nell'Editor Gare.

## Gare ad Avvio Rapido {: #quick-start-races }

Sopra il selettore gara, due schede ad **Avvio Rapido** mostrano le configurazioni utilizzate più di recente per un accesso istantaneo.

## Avviare una Gara {: #starting-a-race }

Quando la formazione e il formato sono pronti, usa i pulsanti in basso a destra:

- **Avvia Gara**: Inizia l'evento ufficiale con l'hardware di rilevamento attivo (ad es. Arduino, Phidget, Trakmate).
- **Gara Demo**: Avvia una gara simulata senza sensori per collaudare grafica e suoni.
- **Rientra / Termina Gara**: Durante una gara in corso, consente di tornare alla schermata di gara o terminare la sessione.

## Barra dei Menu {: #menu-bar }

La barra superiore organizza le opzioni dell'applicazione:

- **File**: Carica gare, visualizza lo storico, esporta/importa impostazioni o esci dall'app.
- **Configurazione**: Gestori per piloti, team, piste, gare, eventi, stagioni, layout, temi e database.
- **Opzioni**: Interfaccia utente, server, lingua, aggiornamenti e modalità demo.
- **Aiuto**: Livelli di log, finestra Info e Centro Assistenza.
