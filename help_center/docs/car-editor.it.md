# Editor auto slot

L'**editor auto slot** tiene un elenco delle tue auto slot: cosa sono, la classe in cui corrono, la scala e l'assetto. Aprilo da Race Day Setup con **Gestisci → Auto slot**.

!!! note
    Questo è il primo passo del supporto alle auto. Le auto non sono ancora collegate a piloti o gare, quindi il giorno della gara non cambia nulla.

    Il badge **Anteprima** accanto al titolo indica che questa funzione è ancora in via di definizione. Potrebbe cambiare molto, o persino essere rimossa, mentre raccogliamo i pareri. Dicci cosa ne pensi su GitHub o SlotForum.

## Panoramica

L'editor auto slot funziona come l'editor delle squadre:

- **Selettore auto**: l'elenco accanto al titolo della pagina mostra tutte le tue auto, ordinate per nome.
- **Sola lettura**: all'apertura vedi l'auto scelta con tutti i campi bloccati.
- **Modifica**: fai clic sull'icona **Modifica** (matita) per sbloccare i campi. Durante la modifica il selettore è bloccato.
- **Salvataggio automatico**: le modifiche vengono salvate in background mentre le fai.
- **Annullare le modifiche**: se esci con modifiche non salvate o non valide, ti viene chiesta una conferma. Annullando, l'auto torna all'ultima versione salvata.

## Azioni della barra degli strumenti

- **Indietro**: torna a Race Day Setup.
- **Aggiungi auto (+)**: crea una nuova auto e la apre in modifica.
- **Duplica**: copia l'auto scelta con un nome nuovo e unico. Comodo per una seconda auto dello stesso tipo.
- **Modifica / Fatto**: passa dalla sola lettura alla modifica e viceversa.
- **Elimina**: elimina l'auto scelta dopo la conferma.
- **Annulla / Ripeti**: va indietro o avanti tra le modifiche recenti.
- **Aiuto (?)**: avvia la visita guidata.

## L'auto {: #car-profile }

Il pannello di sinistra indica cos'è l'auto:

- **Foto**: scegli un'immagine o carica una foto dell'auto.
- **Nome**: obbligatorio e unico tra le tue auto (ad esempio "Porsche 911 RSR #92").
- **Marca / produttore**: ad esempio Scalextric, Carrera, Slot.it o NSR.
- **Classe**: la classe in cui corre l'auto, come GT3 o Classic. Mentre scrivi vengono suggerite le classi delle altre auto, così la stessa classe si scrive sempre allo stesso modo.
- **Scala**: 1/24, 1/32, 1/43, 1/64 (HO), Altra o Non impostata.

## Assetto {: #car-setup }

Il pannello di destra indica come è preparata l'auto. Ogni campo è testo libero, da descrivere come fa il tuo club:

- **Motore**: ad esempio "Slot.it V12/4 21.5k", o pancake / inline per l'HO.
- **Magnete**: tipo e forza, o "nessuno" per le gare senza magnete.
- **Telaio**, **Rapporto** (ad esempio 9/27) e **Pneumatici**.
- **Modificata**: seleziona se l'auto è stata modificata rispetto alla versione di serie; lascia vuoto per un'auto di serie.
- **Note**: qualsiasi altra cosa sull'auto.

## I tuoi campi {: #car-custom-fields }

Sotto l'assetto puoi aggiungere campi tuoi, per tutto ciò che segue il tuo club (ad esempio peso, pignone o guida). In modalità modifica, fai clic su **Gestisci campi**:

- **Nuovo campo**: dagli un nome e scegli un tipo: **Testo**, **Numero**, **Sì / no** o **Scelta da un elenco** (una scelta per riga).
- **Modifica**: rinomina un campo o cambia le scelte. Il tipo non può essere cambiato dopo aver aggiunto il campo.
- **Sposta su / giù**: cambia l'ordine dei campi.
- **Elimina**: rimuove il campo, e il suo valore da ogni auto, dopo la conferma.

Ogni auto ha gli stessi campi e mantiene i propri valori. Un campo lasciato vuoto resta vuoto.
