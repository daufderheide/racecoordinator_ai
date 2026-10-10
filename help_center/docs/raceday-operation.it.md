# Operazioni il Giorno di Gara

## Regolazioni dei Giri e del Tempo

I direttori di gara possono regolare manualmente il conteggio dei giri e i tempi di manche dei piloti direttamente dalla schermata di gara per risolvere problemi sul tracciato, mancate letture dei sensori o penalità:

### Apertura della Finestra di Regolazione
- **Clic sulla cella**: Fare clic sinistro su qualsiasi cella o scheda di **Conteggio Giri** (`lapCount`, `physicalLapCount`) o **Tempo Totale** (`totalTime`, `overallTotalTime`) per quella corsia.
- **Menu Direttore di Gara**: Aprire il **Menu Direttore di Gara** e selezionare **Regola sezioni di giro/tempo** per modificare qualsiasi pilota in una manche corrente, passata o non ancora iniziata in blocco.
- **Schermate dei Risultati**: Accessibile anche dalle schermate **Risultati Manche** e **Risultati Gara** per modificare le manche registrate a fine gara.

### Scorciatoie Rapide (Giri)
Facendo clic su una cella del conteggio giri interattiva:
- **`Shift + Clic Sinistro`**: Aggiunge immediatamente +0,25 giri (+1/4 di giro) senza aprire la finestra.
- **`Alt + Clic Sinistro`**: Rimuove immediatamente -0,25 giri (-1/4 di giro) senza aprire la finestra.

### Controlli nella Finestra
1. **Settori di Giro**: Inserire i settori di pista (ad es. su 100 settori per giro) per regolare il conteggio dei giri. Un'anteprima mostra la frazione di giro corrispondente (es. 25 settori = 0,25 giri).
2. **Regolazione del Tempo**: Inserire secondi positivi (penalità di tempo, es. `+5.000`) o negativi (compensazione, es. `-2.500`) con precisione al millisecondo (`0.001s`).
3. **Anteprima Tempo Totale in Tempo Reale**: La finestra calcola e mostra il tempo totale regolato del pilota prima dell'applicazione delle modifiche.

### Effetti su Classifiche e Metriche
- **Giri Regolati**: Modifica direttamente la posizione nelle classifiche per **Maggior Numero di Giri** e aggiorna i distacchi in giri (`gapLeader`, `gapPosition`). Non modifica i giri fisici effettivi, il miglior giro, il giro mediano o il passo medio fisico.
- **Tempo Totale Regolato**: Modifica la posizione nelle classifiche per **Tempo Totale Più Veloce**, agisce da spareggio per i piloti a pari giri, e aggiorna il **Tempo Medio sul Giro** ($\text{Tempo Totale Regolato} / \text{Giri Fisici}$) e i distacchi cronometrici.
- **Metriche Protette**: Il **Miglior Giro** e il **Giro Mediano** sono rigorosamente preservati dai rilevamenti fisici dei sensori e non sono mai modificati dalle regolazioni del tempo.
