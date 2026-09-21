# Risoluzione dei Problemi

## Problemi di Visualizzazione

### Compatibilità del Browser e Schermo Vuoto su Dispositivi Datati (Android < 9, Tablet Precedenti)
- **Sintomo**: Aprendo Race Coordinator AI su un tablet precedente (come Android 4.4 KitKat fino ad Android 8 Oreo) o su un browser obsoleto, lo schermo rimane completamente vuoto oppure mostra il messaggio "Browser non supportato".
- **Causa**: Race Coordinator AI è sviluppato con Angular moderno ed ECMAScript (ES2022+), utilizzando CSS Grid, variabili CSS personalizzate, moduli ES e moderne API JavaScript. Google ha interrotto definitivamente gli aggiornamenti di Google Chrome e System WebView per Android 8 e versioni precedenti. Android 4.4 KitKat (rilasciato nel 2013) è bloccato a Chromium 30–33 (o al massimo Chrome 66) e non può eseguire applicazioni web moderne.
- **Risoluzione**:
  - **Utilizzare un Browser Moderno Supportato**: Collegarsi utilizzando Google Chrome, Microsoft Edge, Mozilla Firefox o Apple Safari su un sistema operativo supportato (Android 9.0+, iOS 14+, Windows 10+, macOS o Linux).
  - **Tablet Moderni Economici**: Tablet moderni a basso costo (es. Amazon Fire HD 8/10 o tablet Android con Android 11–14) supportano le versioni recenti di Chrome offrendo prestazioni fluide.
  - **Mirroring dello Schermo / Desktop Remoto**: Per i tablet meno recenti, è possibile visualizzare la schermata del browser del computer host tramite un client leggero VNC o desktop remoto (come bVNC o AnyDesk).
