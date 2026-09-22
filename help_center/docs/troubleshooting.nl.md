# Probleemoplossing

## Weergaveproblemen

### Browsercompatibiliteit & Leeg Scherm op Oudere Apparaten (Android < 9, Oudere Windows-systemen en Tablets) {: #browser-compatibility }
- **Symptoom**: Bij het openen van Race Coordinator AI op een oudere tablet (zoals Android 4.4 KitKat tot en met Android 8 Oreo), een oudere pc of een verouderde browser blijft het scherm volledig leeg of wordt de waarschuwingsbanner "Browser niet ondersteund" weergegeven.
- **Oorzaak**: Race Coordinator AI is gebouwd met modern Angular en ECMAScript (ES2020+), waarbij gebruik wordt gemaakt van CSS Grid, aangepaste CSS-eigenschappen (`var(--...)`), ES-modules en moderne JavaScript-API's (waaronder `BigInt`, `globalThis`, `queueMicrotask`, optionele ketenvorming `?.`, nullish coalescing `??` en privé-klassevelden `#x`). Browsers die deze functies missen, kunnen de webclient niet compileren of uitvoeren.
- **Ondersteuning voor Besturingssysteem en Browser**:

| Platform | Ondersteunde versies & minimale browsers | Status | Opmerkingen |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Actuele versies van Google Chrome, Microsoft Edge, Mozilla Firefox | **Volledig ondersteund** | Direct klaar voor gebruik met automatische browserupdates. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 of Mozilla Firefox 115 ESR | **Ondersteund** | Moet de laatste ondersteunde browserversies gebruiken (Chrome 109 / Firefox 115 ESR). Internet Explorer wordt niet ondersteund. |
| **Windows XP / Vista** | Officiële standaardbrowsers (Chrome 49, Firefox 52 ESR) | **Alleen Server** | Standaardbrowsers missen ES2020+ en kunnen de gebruikersinterface niet lokaal uitvoeren. De Race Coordinator AI Java-server (JRE 8) draait echter headless op XP/Vista om races te hosten voor externe tablets of moderne pc's. |
| **Android** | Android 9.0+ met moderne Google Chrome of System WebView | **Ondersteund** | Google heeft updates voor Chrome/WebView op Android 8 en ouder definitief stopgezet. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Ondersteund** | Apple WebKit-engine met moderne ECMAScript-ondersteuning. |
| **macOS** | macOS 10.15 (Catalina) tot en met macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Ondersteund** | Volledig compatibel op Intel- en Apple Silicon-Macs. |
| **Linux** | Elke moderne distributie met Chrome, Chromium of Firefox | **Ondersteund** | Inclusief Raspberry Pi OS 64-bit en ARM64 single-board computers. |

- **Oplossing en aanbevelingen**:
  - **Gebruik een ondersteunde moderne browser**: Maak verbinding met Google Chrome, Microsoft Edge, Mozilla Firefox of Apple Safari op een ondersteund besturingssysteem (Android 9.0+, iOS 14+, Windows 7+, macOS of Linux).
  - **Oudere Windows-installatie (Win 7 / 8 / 8.1)**: Zorg bij gebruik van Windows 7 of 8 voor de installatie van **Google Chrome 109** of **Mozilla Firefox 115 ESR** in plaats van het verouderde Internet Explorer.
  - **Voordelige moderne tablets**: Betaalbare moderne tablets (bijv. Amazon Fire HD 8/10 of Android-tablets met Android 11–14) ondersteunen modern Chrome en leveren uitstekende prestaties tegen lage kosten.
  - **Scherm spiegelen / Extern bureaublad**: Voor oudere tablets kunt u de Race Coordinator AI-server op de hostcomputer draaien en het scherm spiegelen met behulp van lichte VNC- of externe bureaubladtoepassingen (zoals bVNC of AnyDesk).
