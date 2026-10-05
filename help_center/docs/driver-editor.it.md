# Editor Piloti

L'**Editor Piloti** consente di creare, visualizzare e personalizzare profili pilota, soprannomi, avatar e annunci audio personalizzati.

## Panoramica

L'Editor Piloti integra la selezione e la modifica dei piloti in un'interfaccia unificata:

- **Selettore Pilota**: Situato nell'intestazione superiore accanto al titolo, questo menu a discesa elenca tutti i piloti esistenti e consente di passare rapidamente dall'uno all'altro.
- **Modalità Sola Lettura**: Per impostazione predefinita, l'editor mostra i dettagli del pilota in modalità sola lettura. I campi del modulo sono bloccati per prevenire modifiche accidentali, pur consentendo l'ascolto dei campioni audio.
- **Modalità Modifica**: Cliccando sull'icona **Modifica** (matita) sulla barra degli strumenti, i campi del modulo vengono sbloccati. Durante la modalità di modifica, il selettore dei piloti è bloccato per evitare perdite di dati.
- **Salvataggio delle modifiche**: Cliccando sull'icona **Fine Modifica** (occhio / fatto), le modifiche vengono convalidate, salvate sul server e l'editor torna in modalità sola lettura.
- **Annullamento delle modifiche**: Se si tenta di lasciare l'editor con modifiche non salvate, viene mostrata una richiesta di conferma. Annullando le modifiche, tutti i campi tornano alla versione salvata in precedenza.

## Azioni della Barra degli Strumenti

La barra degli strumenti superiore offre le seguenti azioni:

- **Indietro**: Torna alla vista precedente o alla Configurazione della Gara.
- **Aggiungi Pilota (+)**: Crea un nuovo profilo pilota ed entra in modalità modifica.
- **Copia Pilota**: Duplica il profilo del pilota selezionato.
- **Modifica / Fine Modifica**: Alterna tra modalità sola lettura e modalità modifica.
- **Importa Piloti**: Apre la finestra modale per importare profili pilota, avatar e impostazioni audio da file esterni.
- **Espandi / Comprimi tutto**: Espande o comprime tutte le sezioni a soffietto contemporaneamente.
- **Elimina Pilota**: Rimuove il profilo del pilota selezionato previa conferma.
- **Guida (?)**: Avvia il tour guidato interattivo che illustra le sezioni dell'editor.

## Dettagli del Pilota

- **Nome**: Il nome completo del pilota visualizzato nelle classifiche.
- **Soprannome**: Un nome breve o fonetico utilizzato per gli annunci vocali (TTS).
- **Collega Nome e Soprannome**: Quando attivo, la digitazione del nome aggiorna automaticamente il soprannome.
- **Avatar**: Scegli un'immagine o un'icona personalizzata per il pilota.

## Annunci Audio ed Effetti Sonori

Configura effetti sonori o annunci vocali (TTS) per questo pilota:

- **Audio Giro**: Ripprodotto al completamento di un giro normale.
- **Miglior Giro Personale**: Ripprodotto quando il pilota stabilisce il suo miglior tempo.
- **Traguardi e Record**: Suoni personalizzati per record della pista, della manche e cambio di leader.
- **Ascolto Audio**: Il pulsante di riproduzione resta attivo in entrambe le modalità per ascoltare i suoni in qualsiasi momento.

## Importazione Piloti

Race Coordinator AI supporta l'importazione in blocco di piloti da file esterni, inclusa la creazione multipla, la risoluzione dei conflitti, la gestione di media personalizzati e l'impostazione predefinita degli slot audio vuoti.

### Formati di File Supportati

- **CSV (`.csv`)**: File di testo delimitati da virgole, punti e virgola o tabulazioni. Le intestazioni di colonna vengono associate in modo flessibile (senza distinzione tra maiuscole/minuscole, spazi e caratteri di sottolineatura).
- **Excel (`.xlsx`, `.xls`)**: Fogli di calcolo Microsoft Excel. Il primo foglio viene elaborato utilizzando i nomi delle colonne.
- **JSON (`.json`)**: Un array di oggetti pilota o un oggetto contenente un array `"drivers"`.
- **Pacchetto ZIP (`.zip`)**: Un archivio ZIP contenente un file dati (`drivers.csv`, `drivers.xlsx` o `drivers.json`) insieme ai file audio (`.wav`, `.mp3`, `.ogg`) e immagini avatar (`.png`, `.jpg`, `.jpeg`) associati.

### Mappatura delle Colonne e dei Campi

Sono riconosciute le seguenti colonne e campi JSON:

| Campo | Alias di Colonna Riconosciuti | Descrizione | Predefinito / Alternativa |
| :--- | :--- | :--- | :--- |
| **Nome** | `Name`, `Driver`, `Driver Name`, `Full Name` | Nome completo del pilota (obbligatorio). | Nessuno (errore riga se vuoto) |
| **Soprannome** | `Nickname`, `Nick`, `Callout`, `Display Name` | Nome breve o fonetico per annunci vocali. | Usa il **Nome** se vuoto. Validato contro i duplicati. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Nome file relativo (es. `john.png`), risorsa o URL. | Nessuno |
| **Audio Predefinito** | `Default Audio`, `Blank Audio`, `Audio Default` | Direttiva per slot audio vuoti: `none` / `muted` o `system` / `default`. | Da direttiva file o selettore modale |
| **Audio Giro** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Audio al completamento del giro standard. | Predefinito in base alla modalità audio |
| **Miglior Giro Personale** | `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Audio al raggiungimento del miglior giro personale. | Predefinito in base alla modalità audio |
| **Record della Pista** | `Track Record Audio`, `Track Record`, `Record Audio` | Audio al superamento del record della pista. | Predefinito in base alla modalità audio |
| **Leader di Gara** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Audio quando si conquista la testa della corsa. | Predefinito in base alla modalità audio |
| **Tempo Minimo sul Giro** | `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Audio se il tempo sul giro scende sotto il minimo. | Predefinito in base alla modalità audio |
| **Giro Drift** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Audio durante un giro drift. | Predefinito in base alla modalità audio |
| **Falsa Partenza** | `False Start Audio`, `False Start`, `Penalty Audio` | Audio su falsa partenza o penalità. | Predefinito in base alla modalità audio |
| **Entrata ai Box** | `Pit In Audio`, `Pit In`, `Pit Stop` | Audio all'ingresso nella corsia dei box. | Predefinito in base alla modalità audio |
| **Avviso Carburante** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Audio per riserva di carburante. | Predefinito in base alla modalità audio |
| **Carburante Esaurito** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Audio quando il carburante si esaurisce. | Predefinito in base alla modalità audio |

### Sintassi degli Slot Audio

I valori audio possono utilizzare i seguenti formati:
- **`none`** o **`off`** / **`mute`**: Lo slot è disattivato (nessun audio).
- **`tts:<testo>`** o **`${nickname} prende il comando`**: Annuncio Text-to-Speech (TTS). Sono supportate le parentesi graffe `{nickname}` e `${driver}`.
- **`preset:<suono>`**: Suoni di sistema integrati (es. `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Nome file (es. `cheer.wav`, `v8_rev.mp3`)**: File multimediale associato trascinato con l'importazione o all'interno dello ZIP.

### Direttive di File per Audio Vuoto

È possibile specificare come gestire gli slot audio vuoti direttamente nel file:
- In CSV: `# default-audio: none` o `# default-audio: system` nei commenti di intestazione.
- In JSON: `"default_audio": "none"` a livello dell'oggetto principale.
- In Excel/CSV: Colonna `Default Audio` per ogni riga pilota.
- Nell'interfaccia: Menu a discesa **Slot audio vuoti** nella finestra di importazione.

### Importazione Automatica di Risorse e Media

Quando si importano piloti con avatar o effetti sonori personalizzati:
1. **Trascina e rilascia multiplo**: Trascina il file `.csv` o `.xlsx` insieme ai file `.wav`, `.mp3`, `.png` o `.jpg` associati nell'area di rilascio.
2. **Pacchetto ZIP**: Inserisci il file di dati e le risorse multimediali in un archivio `.zip` e caricalo.
3. **Registrazione automatica**: Il server acquisisce i file multimediali nel Gestore Risorse, calcola gli hash SHA-256 e collega automaticamente le risorse create ai rispettivi avatar e slot audio.

### Risoluzione dei Conflitti

Se un pilota nel file coincide con un nome o soprannome già presente nel database, la tabella di anteprima interattiva evidenzia il conflitto e consente di scegliere tra tre modalità:
- **Rinomina automaticamente**: Rinomina il nuovo pilota (es. `Alice Walker (1)`) lasciando inalterati i profili esistenti.
- **Sovrascrivi esistente**: Aggiorna il profilo esistente con i nuovi attributi, avatar e configurazioni audio importati.
- **Salta**: Ignora la riga in conflitto durante l'importazione.

Le risoluzioni possono essere scelte riga per riga, applicate in blocco o risolte modificando direttamente nome e soprannome nella tabella di anteprima.
