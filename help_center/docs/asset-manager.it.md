# Gestore Asset

Il **Gestore Asset** ti consente di caricare, organizzare e gestire tutti i tuoi asset digitali di gara, inclusi file audio, immagini personalizzate, set di immagini e schemi di rotazione.

## Panoramica

Gli asset sono risorse personalizzate utilizzate nell'applicazione per personalizzare l'esperienza di gara:

- **File Audio:** Annunci audio personalizzati, segnali di partenza, sirene di arrivo e clip di commento.
- **Set Audio:** Raccolte raggruppate di file audio o annunci vocali (TTS) mappati a valori di attivazione specifici (tempo in secondi, giri rimanenti o percentuale di carburante).
- **Immagini:** Grafica delle auto, avatar dei piloti, bandiere personalizzate, loghi degli sponsor e immagini di sfondo.
- **Set di Immagini:** Raccolte di immagini correlate (come indicatori di carburante o sequenze di conto alla rovescia).
- **Rotazioni Personalizzate:** Asset di rotazione delle manche definiti dall'utente per formati complessi.

## Caricamento Asset

Per caricare nuovi asset nella tua libreria:

1. Apri il **Gestore Asset** dal menu principale o dalla barra degli strumenti di configurazione.
2. Trascina e rilascia uno o più file nella sezione **Carica Risorse**, oppure fai clic per sfogliare il computer.
3. I formati supportati includono `.wav`, `.mp3`, `.ogg` per l'audio e `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` per le immagini.

## Set Audio e Valori di Attivazione

Un **Set Audio** ti consente di configurare una serie di suoni o frasi parlate attivate a specifiche soglie numeriche. A seconda di dove viene assegnato il set audio in Race Coordinator AI, i valori delle voci rappresentano unità diverse:

*   **Tempo in Secondi:** Utilizzato nelle impostazioni del Tema per **Conto alla rovescia di partenza**, **Secondi rimanenti**, **Avvio automatico** e **Avanzamento automatico** (ad esempio voci a `5`, `4`, `3`, `2`, `1` e `0` secondi).
*   **Conteggio Giri:** Utilizzato nelle impostazioni del Tema per gli annunci dei **Giri rimanenti**. Le voci definiscono annunci quando il leader raggiunge specifici giri rimanenti (ad esempio `10`, `5`, `1` e `0` giri rimanenti).
*   **Percentuale Carburante (%):** Utilizzato nelle impostazioni del Pilota per i **Suoni del livello di carburante**. Le voci definiscono annunci quando il carburante raggiunge soglie di avviso, critiche o pieno (ad esempio `20%`, `10%`, `0%` vuoto o `100%` pieno).

Nell'**Editor Set Audio**, puoi aggiungere voci, selezionare file audio o scrivere frasi TTS (con variabili di template come `{driver.nickname}`), impostare valori di attivazione e utilizzare il pulsante **Estrai automaticamente i valori dai nomi** per compilare automaticamente i valori dai nomi di file numerati (es. `10.mp3`, `5.mp3`).
