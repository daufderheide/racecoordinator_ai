# Editor di Interfaccia

## Panoramica

L'Editor di Interfaccia consente di progettare layout personalizzati per il giorno della gara, configurare le colonne della classifica dei piloti, personalizzare gli effetti sonori e la grafica del tema e caricare [Widget personalizzati](custom-widgets.md) modulari.

## Configurazione del Widget Cronometro

Il widget **Cronometro** mostra il tempo trascorso o rimanente della manche/gara con stili di visualizzazione configurabili:

- **Formato di visualizzazione**:
  - **Dinamico (1:23 / 45s)**: Visualizzazione compatta che omette gli zeri iniziali e nasconde i minuti quando il tempo è inferiore a un minuto.
  - **Minuti e secondi (01:23 / 00:45)**: Due cifre fisse per minuti e secondi, evitando salti di lunghezza e bruschi cambi di dimensione del font in modalità di adattamento automatico.
  - **Minuti e secondi (1:23 / 0:45)**: Mantiene i minuti sotto il minuto (`0:45`), utilizzando una sola cifra per i minuti sopra il minuto (`1:23`).
  - **Orologio completo (00:01:23 / 00:00:45)**: Orologio digitale a otto caratteri (`HH:MM:SS`), ideale per gare di durata.
  - **Secondi totali (83s / 45s)**: Mostra i secondi totali trascorsi o rimanenti senza suddivisione in minuti o ore.
- **Frazioni di secondo (Subsecondi)**:
  - **Sotto la soglia**: Mostra le frazioni di secondo (da 1 a 3 cifre decimali) quando il tempo scende sotto la soglia configurata (ad es. ultimi 10 secondi).
  - **Sempre**: Mostra le frazioni di secondo costantemente per l'intera manche.
  - **Mai**: Limita il cronometro esclusivamente ai secondi interi.
- **Anteprima dal vivo**: L'ispettore include un'anteprima istantanea che dimostra come le opzioni selezionate vengono visualizzate a vari intervalli di gara (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).
