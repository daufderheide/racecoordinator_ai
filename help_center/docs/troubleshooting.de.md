# Fehlerbehebung

## Anzeigeprobleme

### Browserkompatibilität & Leerer Bildschirm auf älteren Geräten (Android < 9, ältere Tablets)
- **Symptom**: Beim Öffnen von Race Coordinator AI auf einem älteren Tablet (z. B. Android 4.4 KitKat bis Android 8 Oreo) oder einem veralteten Browser bleibt der Bildschirm komplett leer oder zeigt die Warnung „Browser nicht unterstützt“.
- **Ursache**: Race Coordinator AI basiert auf modernem Angular und ECMAScript (ES2022+) unter Verwendung von CSS Grid, CSS Custom Properties, ES-Modulen und modernen JavaScript-APIs. Google hat die Updates für Google Chrome und System WebView für Android 8 und älter dauerhaft eingestellt. Android 4.4 KitKat (veröffentlicht 2013) ist auf Chromium 30–33 (maximal Chrome 66) eingefroren und kann moderne Webanwendungen nicht ausführen.
- **Lösung**:
  - **Einen unterstützten modernen Browser verwenden**: Verwenden Sie Google Chrome, Microsoft Edge, Mozilla Firefox oder Apple Safari auf einem unterstützten Betriebssystem (Android 9.0+, iOS 14+, Windows 10+, macOS oder Linux).
  - **Kostengünstige moderne Tablets**: Preiswerte moderne Tablets (z. B. Amazon Fire HD 8/10 oder günstige Android-Tablets mit Android 11–14) unterstützen modernes Chrome und bieten die volle Leistung.
  - **Bildschirmübertragung / Remote Desktop**: Für ältere Tablets können Sie den Browser-Bildschirm des Host-Rechners über einen schlanken VNC- oder Remote-Desktop-Client (z. B. bVNC oder AnyDesk) anzeigen.
