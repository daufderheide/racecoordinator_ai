# Editor Gara

## Impostazioni carburante

Race Coordinator AI supporta una simulazione completa del carburante per piste analogiche e digitali, inclusi capacità del serbatoio, livello iniziale, tempi di sosta ai box, velocità di rifornimento, penalità per carburante esaurito e modelli di consumo.

### Modelli di consumo del carburante

Il consumo di carburante per giro (analogico) o al secondo (digitale) può essere regolato da impostazioni matematiche predefinite o da un profilo personalizzato interattivo:

- **Lineare**: Il consumo scala linearmente con la velocità o la percentuale di acceleratore.
- **Quadratico**: Il consumo aumenta quadraticamente per tempi sul giro più veloci o livelli di acceleratore più alti.
- **Cubico**: Il consumo aumenta ripidamente per velocità estreme e pieno gas.
- **Curva personalizzata**: Consente un controllo preciso della curva di consumo trascinando punti di controllo interattivi direttamente sul grafico di utilizzo.

### Modifica interattiva della curva personalizzata

Quando si seleziona **Curva personalizzata** come tipo di utilizzo, i punti di controllo compaiono direttamente sulla curva SVG:

- **Generazione iniziale della curva**: Al primo passaggio a Curva personalizzata, i 5 punti iniziali vengono campionati direttamente dal profilo attivo (Lineare, Quadratico o Cubico) senza salti visivi.
- **Trascina e rilascia interattivo**: Fai clic e trascina qualsiasi punto in alto, in basso, a sinistra o a destra per rimodellare la curva.
- **Monotonia garantita**:
    - *Carburante analogico*: I tempi sul giro più veloci consumano sempre una quantità di carburante maggiore o uguale rispetto ai tempi più lenti (curva monotona non crescente). Il trascinamento è vincolato per evitare inversioni.
    - *Carburante digitale*: Livelli di acceleratore più alti consumano sempre una quantità di carburante maggiore o uguale rispetto a livelli più bassi (curva monotona non decrescente).
- **Aggiunta di punti**: Fai clic lungo la linea della curva per inserire un nuovo punto di controllo nella posizione interpolata.
- **Eliminazione di punti**: Fai clic con il tasto destro su un punto intermedio per rimuoverlo (i 2 punti terminali restano fissi).
- **Pulsanti di ripristino**: Ripristina rapidamente la curva ai modelli Lineare, Quadratico o Cubico tramite i pulsanti sopra il grafico.
- **Persistenza in background**: Se passi a un profilo predefinito e poi torni a Curva personalizzata, i tuoi punti modificati vengono conservati.
- **Calcoli autorevoli sul server**: Il server valuta il consumo durante le gare utilizzando lo stesso algoritmo di interpolazione lineare a tratti, garantendo un'anteprima identica alla gara.
