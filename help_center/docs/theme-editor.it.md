# Editor di Temi

L'**Editor di Temi** offre un'interfaccia dedicata e intuitiva per gestire bandiere visive, sequenze di luci del conto alla rovescia, indicatori di carburante, annunci audio del direttore di gara e sostituzioni audio dei piloti per Race Coordinator AI. Condivide la stessa barra degli strumenti unificata, selezione degli oggetti, protezione in sola lettura e ciclo di vita della modalità di modifica utilizzati negli editor Piloti, Tracciati, Gare e Layout.

---

## Panoramica e Navigazione

L'Editor di Temi è accessibile da diverse posizioni all'interno dell'applicazione:

- **Barra degli strumenti Configurazione Giorno di Gara**: Selezionare **Config > Editor di Temi** (`/theme-editor` o `/theme-manager`).
- **Menu Opzioni Giorno di Gara**: Fare clic sul menu a ingranaggio sulla barra degli strumenti del giorno di gara e selezionare **Editor di Temi** (`/theme-editor`). La navigazione durante una gara attiva mantiene la connessione e lo stato della gara.
- **Editor UI**: Fare clic su **Apri Editor di Temi** dalla scheda Temi nell'Editor UI (`/ui-editor`).

### Ciclo di Vita Modalità Sola Lettura e Modifica

- **Modalità Sola Lettura (Predefinita)**: Le proprietà del tema, gli slot delle immagini, le impostazioni audio e le sostituzioni audio dei piloti sono protetti da modifiche accidentali.
- **Modalità Modifica**: Facendo clic sull'icona a forma di matita (**Modifica**) nella barra degli strumenti si sblocca il tema per la modifica.
- **Salvataggio Automatico e Convalida**: Quando si esce dalla modalità di modifica, le modifiche vengono convalidate (ad es. assicurando un nome univoco e non vuoto) e salvate.
- **Annulla Modifiche**: Uscire o navigare verso un'altra schermata con modifiche non salvate mostra il consueto modale di conferma per l'annullamento.
- **Annulla / Ripeti**: Pienamente integrato con le scorciatoie da tastiera standard (<kbd>Ctrl</kbd>+<kbd>Z</kbd> e <kbd>Ctrl</kbd>+<kbd>Y</kbd>).

---

## Azioni della Barra degli Strumenti

- **Selettore Temi**: Menu a discesa per selezionare qualsiasi tema di sistema o personalizzato.
- **Modifica / Fine Modifica**: Alterna tra la modalità sola lettura e la modalità di modifica.
- **Espandi / Riduci Tutto**: Apre o chiude tutte le sezioni di configurazione comprimibili contemporaneamente.
- **Aggiungi Tema**: Crea un nuovo modello di tema basato sul tema di sistema predefinito.
- **Copia Tema**: Duplica il tema selezionato con un nome univoco.
- **Elimina Tema**: Elimina il tema personalizzato corrente previa conferma. I temi di sistema predefiniti sono protetti e non possono essere eliminati.
- **Tour Guidato**: Avvia una visita interattiva guidata.

