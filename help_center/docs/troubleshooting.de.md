# Fehlerbehebung

## Anzeigeprobleme

### Browserkompatibilität & Leerer Bildschirm auf älteren Geräten (Android < 9, ältere Windows-Systeme & Tablets) {: #browser-compatibility }
- **Symptom**: Beim Öffnen von Race Coordinator AI auf einem älteren Tablet (z. B. Android 4.4 KitKat bis Android 8 Oreo), älteren PC oder veralteten Browser bleibt der Bildschirm komplett leer oder zeigt die Warnung „Browser nicht unterstützt“.
- **Ursache**: Race Coordinator AI basiert auf modernem Angular und ECMAScript (ES2020+) unter Verwendung von CSS Grid, CSS Custom Properties (`var(--...)`), ES-Modulen und modernen JavaScript-APIs (einschließlich `BigInt`, `globalThis`, `queueMicrotask`, Optional Chaining `?.`, Nullish Coalescing `??` und privaten Klassenfeldern `#x`).
- **Betriebssystem- & Browser-Unterstützung**:

| Plattform | Unterstützte Versionen & Mindestbrowser | Status | Hinweise |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Aktuelles Google Chrome, Microsoft Edge, Mozilla Firefox | **Vollständig unterstützt** | Sofort einsatzbereit mit automatischen Browser-Updates. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 oder Mozilla Firefox 115 ESR | **Unterstützt** | Erfordert die letzten veröffentlichten Browserversionen (Chrome 109 / Firefox 115 ESR). Internet Explorer wird nicht unterstützt. |
| **Windows XP / Vista** | Offizielle Standard-Browser (Chrome 49, Firefox 52 ESR) | **Nur Server** | Standard-Browser unterstützen kein ES2020+ und können die Benutzeroberfläche nicht lokal ausführen. Der Java-Server (JRE 8) kann jedoch im Headless-Modus auf XP/Vista als Host für Tablets oder moderne PCs betrieben werden. |
| **Android** | Android 9.0+ mit modernem Google Chrome oder System WebView | **Unterstützt** | Google hat Updates für Android 8 und älter dauerhaft eingestellt. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Unterstützt** | Moderne WebKit-Engine mit voller ECMAScript-Unterstützung. |
| **macOS** | macOS 10.15 (Catalina) bis macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Unterstützt** | Vollständig kompatibel auf Intel- und Apple Silicon Macs. |
| **Linux** | Jede moderne Distribution mit Chrome, Chromium oder Firefox | **Unterstützt** | Beinhaltet Raspberry Pi OS 64-Bit und ARM64-Systeme. |

- **Lösung & Empfehlungen**:
  - **Einen unterstützten modernen Browser verwenden**: Verwenden Sie Google Chrome, Microsoft Edge, Mozilla Firefox oder Apple Safari auf einem unterstützten Betriebssystem (Android 9.0+, iOS 14+, Windows 7+, macOS oder Linux).
  - **Ältere Windows-Systeme (Win 7 / 8 / 8.1)**: Installieren Sie **Google Chrome 109** oder **Mozilla Firefox 115 ESR** anstelle des veralteten Internet Explorers.
  - **Kostengünstige moderne Tablets**: Preiswerte moderne Tablets (z. B. Amazon Fire HD 8/10 oder günstige Android-Tablets mit Android 11–14) unterstützen modernes Chrome und bieten die volle Leistung.
  - **Bildschirmübertragung / Remote Desktop**: Für ältere Tablets können Sie den Browser-Bildschirm des Host-Rechners über einen schlanken VNC- oder Remote-Desktop-Client (z. B. bVNC oder AnyDesk) anzeigen.
