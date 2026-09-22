# Risoluzione dei Problemi

## Problemi di Visualizzazione

### Compatibilità del Browser e Schermo Vuoto su Dispositivi Datati (Android < 9, Sistemi Windows Precedenti e Tablet) {: #browser-compatibility }
- **Sintomo**: Aprendo Race Coordinator AI su un tablet precedente (come Android 4.4 KitKat fino ad Android 8 Oreo), un PC datato o un browser obsoleto, lo schermo rimane completamente vuoto oppure mostra il banner di avviso "Browser non supportato".
- **Causa**: Race Coordinator AI è sviluppato con Angular moderno ed ECMAScript (ES2020+), utilizzando CSS Grid, variabili CSS (`var(--...)`), moduli ES e moderne API JavaScript (tra cui `BigInt`, `globalThis`, `queueMicrotask`, optional chaining `?.`, nullish coalescing `??` e campi di classe privati `#x`). I browser privi di queste funzionalità non possono compilare né eseguire il client web.
- **Supporto del Sistema Operativo e del Browser**:

| Piattaforma | Versioni supportate e browser minimi | Stato | Note |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Google Chrome, Microsoft Edge, Mozilla Firefox aggiornati | **Completamente supportato** | Supportato nativamente con aggiornamenti automatici del browser. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 o Mozilla Firefox 115 ESR | **Supportato** | È necessario utilizzare le ultime versioni del browser supportate (Chrome 109 / Firefox 115 ESR). Internet Explorer non è supportato. |
| **Windows XP / Vista** | Browser ufficiali predefiniti (Chrome 49, Firefox 52 ESR) | **Solo Server** | I browser predefiniti non supportano ES2020+ e non possono eseguire localmente l'interfaccia client. Tuttavia, il server Java di Race Coordinator AI (JRE 8) funziona in modalità headless su XP/Vista per gestire gare per tablet remoti o PC moderni. |
| **Android** | Android 9.0+ con Google Chrome moderno o System WebView | **Supportato** | Google ha interrotto definitivamente gli aggiornamenti di Chrome/WebView per Android 8 e versioni precedenti. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Supportato** | Motore Apple WebKit con supporto moderno ECMAScript. |
| **macOS** | macOS 10.15 (Catalina) fino a macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Supportato** | Pienamente compatibile con computer Mac Intel e Apple Silicon. |
| **Linux** | Qualsiasi distribuzione moderna con Chrome, Chromium o Firefox | **Supportato** | Include Raspberry Pi OS a 64 bit e computer a scheda singola ARM64. |

- **Risoluzione e raccomandazioni**:
  - **Utilizzare un Browser Moderno Supportato**: Collegarsi utilizzando Google Chrome, Microsoft Edge, Mozilla Firefox o Apple Safari su un sistema operativo supportato (Android 9.0+, iOS 14+, Windows 7+, macOS o Linux).
  - **Configurazione di Windows Legacy (Win 7 / 8 / 8.1)**: Se si utilizza Windows 7 o 8, assicurarsi di installare **Google Chrome 109** o **Mozilla Firefox 115 ESR** anziché il dismesso Internet Explorer.
  - **Tablet Moderni Economici**: Tablet moderni accessibili (es. Amazon Fire HD 8/10 o tablet Android con Android 11–14) supportano Chrome moderno offrendo prestazioni eccellenti a costi contenuti.
  - **Display Remoto / Mirroring dello Schermo**: Per tablet o terminali datati, è possibile eseguire il server Race Coordinator AI sulla macchina host e proiettare lo schermo con strumenti leggeri VNC o desktop remoto (come bVNC o AnyDesk).
