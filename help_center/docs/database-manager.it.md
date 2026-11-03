# Gestione Database

Il pannello **Gestione Database** consente di organizzare, eseguire il backup, ripristinare e passare da un database SQLite indipendente all'altro in Race Coordinator. Ciascun database mantiene una raccolta autonoma di piloti, scuderie, piste, gare, eventi, campionati, layout dell'interfaccia e risorse multimediali.

---

## Panoramica {: #overview }

La schermata Gestione Database è articolata in due sezioni principali:

1. **Elenco Database (Barra laterale sinistra)**: Mostra tutti i file di database disponibili salvati nella cartella locale dell'applicazione. Il database attivo è contrassegnato con l'etichetta **ATTIVO**. Selezionando un database dall'elenco, i suoi dettagli e le relative statistiche verranno caricati nel riquadro di destra.
2. **Pannello Dettagli (Lato destro)**: Visualizza statistiche complete, parametri di archiviazione su disco e il comando di attivazione del database attualmente selezionato.
3. **Barra degli Strumenti (Intestazione superiore)**: Fornisce azioni per creare, importare, esportare, duplicare, ripristinare o eliminare i database.

---

## Statistiche del Database {: #database-statistics }

Quando si seleziona un database dall'elenco, il riquadro **Riepilogo Database** mostra le statistiche in tempo reale e l'occupazione del disco:

| Metrica | Descrizione |
| :--- | :--- |
| **Piloti** | Numero totale di profili pilota configurati. |
| **Scuderie** | Numero totale di scuderie da corsa. |
| **Piste** | Numero totale di configurazioni di pista e interfacce hardware. |
| **Gare** | Numero totale di formati di gara e rotazioni delle manche. |
| **Eventi** | Numero totale di eventi multi-round. |
| **Campionati** | Numero totale di campionati stagionali e schemi di punteggio. |
| **Risorse** | Numero totale di immagini, clip audio, set di immagini, set audio e rotazioni. |
| **Record di Gara** | Numero di registrazioni dei risultati delle gare completate e relativo spazio su disco (in MB). |
| **Gare Salvate** | Numero di sessioni di gara salvate in corso o in pausa e relativo spazio su disco (in MB). |
| **Dimensione Totale** | La dimensione effettiva del file di database SQLite su disco (in MB). |

---

## Cambio di Database {: #switching-databases }

Race Coordinator opera con un solo database attivo alla volta. Lo stato del database selezionato è mostrato accanto al suo nome nell'intestazione del pannello dettagli:

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Database Attivo (Segno di spunta verde)**: Indica il database attualmente utilizzato dal sistema per il cronometraggio in tempo reale, la gestione delle corse e l'archiviazione dei dati.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Database Inattivo (Segno di spunta grigio)**: Indica un database alternativo attualmente non attivo.

### Come cambiare database

1. Fai clic su un database inattivo nell'elenco laterale sinistro.
2. Nell'intestazione dei dettagli, fai clic sul pulsante con il **Segno di Spunta Grigio**.
3. Conferma il cambio nella finestra di dialogo.

> [!WARNING]
> Il cambio del database azzera immediatamente lo stato della sessione di gara attiva e ricarica tutte le risorse, i piloti e le impostazioni delle piste dal nuovo database attivato.

---

## Creazione di un Database {: #creating-a-database }

Per creare un nuovo database da zero:

1. Fai clic sul pulsante **Aggiungi** (<span class="material-icons" style="vertical-align: middle;">add</span>) nella barra degli strumenti in alto.
2. Inserisci un nome univoco per il nuovo database nella finestra modale.
3. Fai clic su **OK**. Race Coordinator creerà un database SQLite pulito inizializzato con lo schema standard e le risorse predefinite.

---

## Copia di un Database {: #copying-a-database }

Per duplicare un database esistente:

1. Seleziona il database da copiare nell'elenco laterale.
2. Fai clic sul pulsante **Copia** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>) sulla barra degli strumenti.
3. Inserisci un nome univoco per la copia.
4. Fai clic su **OK**. Tutti i piloti, le piste, le gare, i campionati, le risorse e la cronologia verranno clonati nel nuovo file.

---

## Eliminazione di un Database {: #deleting-a-database }

Per rimuovere definitivamente un database:

1. Seleziona il database da eliminare nell'elenco laterale.
2. Fai clic sul pulsante **Elimina** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>) sulla barra degli strumenti.
3. Conferma l'eliminazione nella finestra di dialogo.

> [!NOTE]
> Il database attualmente attivo non può essere eliminato. Per eliminarlo, passa prima a un altro database.

---

## Ripristino Impostazioni di Fabbrica {: #factory-reset }

L'azione **Ripristina** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) cancella tutti i dati personalizzati dal database attivo e ripristina la configurazione predefinita di fabbrica:

1. Seleziona il database attivo e fai clic sul pulsante **Ripristina** sulla barra degli strumenti.
2. Esamina gli avvisi di conferma e approva il ripristino.
3. Tutti i piloti, le piste, le gare e le risorse personalizzate verranno sostituiti con i valori predefiniti di fabbrica.

---

## Backup e Ripristino / Importazione ed Esportazione {: #import-and-export }

### Esportazione (Backup)

Per creare un archivio di backup portatile di un database:

1. Seleziona il database che desideri esportare.
2. Fai clic sul pulsante **Esporta** (<span class="material-icons" style="vertical-align: middle;">file_download</span>) sulla barra degli strumenti.
3. Race Coordinator genera un archivio `.zip` con indicazione della data e dell'ora contenente il file SQLite e tutte le risorse binarie memorizzate.

### Importazione (Ripristino)

Per importare un archivio di database esportato in precedenza:

1. Fai clic sul pulsante **Importa** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>) sulla barra degli strumenti.
2. Seleziona un archivio `.zip` dal tuo computer.
3. Inserisci un nome univoco per il database importato.
4. Race Coordinator decomprime e registra il database nella tua installazione locale.
