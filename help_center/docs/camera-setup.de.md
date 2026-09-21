# Einrichtungsanleitung für mobile Webkameras

Diese Anleitung beschreibt die Einrichtung eines Smartphones oder Tablets (iOS oder Android) als optische Hochgeschwindigkeits-Rundenzeitkamera in **Race Coordinator AI (RC AI)**.

---

## Übersicht

Race Coordinator AI ermöglicht die Verwendung moderner Smartphones als optische Zeitmessbrücke. Wird das Gerät direkt über der Ziellinie oder Boxengasseneinfahrt montiert, erkennt die Smartphone-Kamera überfahrende Fahrzeuge auf jeder Spur und überträgt Zeitmessimpulse in Echtzeit über WebSockets an den Server.

Da diese Schnittstelle direkt im mobilen Browser ohne Installation nativer Apps ausgeführt wird, gelten die Sicherheitsrichtlinien moderner Browser.

---

## Warum der Kamerazugriff im lokalen Netzwerk eingeschränkt ist

Moderne Webbrowser setzen strenge Sicherheitsstandards für Mediengeräte (Kamera und Mikrofon über `navigator.mediaDevices.getUserMedia`) durch.

Um den Datenschutz zu gewährleisten, erlauben Browser den Kamerazugriff nur in einem **sicheren Kontext (Secure Context)**:

1. **Verschlüsselte HTTPS-Verbindungen** (`https://...`).
2. **Lokale Loopback-Adressen** (`http://localhost` oder `http://127.0.0.1`).

Wenn ein Mobilgerät über das lokale WLAN mit einer IP-Adresse (z. B. `http://192.168.1.150:4200`) eine Verbindung herstellt, stuft der Browser die Verbindung als unsicheren HTTP-Ursprung ein und blockiert den Kamerazugriff standardmäßig.

---

## Browser-Kompatibilität und Unterschiede

| Betriebssystem | Browser | Web-Engine | Umgehungs-Flag verfügbar? | Kamera über lokales HTTP? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Ja** (`chrome://flags`) | **Ja** (mit Flag) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Ja** (`edge://flags`, etc.) | **Ja** (mit Flag) |
| **Android** | Firefox | Gecko | Nein | HTTPS erforderlich |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **Nein** | HTTPS erforderlich |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **Nein** | HTTPS erforderlich |

!!! warning "Wichtiger Hinweis zu Chrome auf iOS"
    Unter Apple iOS verlangt Apple, dass alle Webbrowser (einschließlich Google Chrome, Microsoft Edge und Firefox) im Hintergrund die **WebKit-Engine** von Apple verwenden.
    
    Daher unterstützt **iOS Chrome KEINE `chrome://flags`**. Der Aufruf von `chrome://flags` auf einem iOS-Gerät bleibt wirkungslos oder startet eine Websuche. iOS-Geräte erfordern stets eine HTTPS-Verbindung, unabhängig vom gewählten Browser.

---

## Schritt-für-Schritt-Anleitung für Android (Google Chrome)

Google Chrome unter Android ermöglicht das Freischalten bestimmter lokaler IP-Adressen als sichere Ursprünge über ein internes Entwickler-Flag.

### Schritt 1: Server-IP und Port ermitteln
1. Öffnen Sie in Race Coordinator AI auf Ihrem Hauptcomputer den **Strecken-Editor** > **Kamerakonfiguration**.
2. Erweitern Sie den Abschnitt **Mobiles Koppeln** und klicken Sie auf **Kopplungs-QR-Code anzeigen**.
3. Notieren Sie die angezeigte Server-URL (z. B. `http://192.168.1.150:4200`).

### Schritt 2: Chrome-Sicherheitsflag konfigurieren
1. Öffnen Sie **Google Chrome** auf Ihrem Android-Gerät.
2. Geben Sie in der Adressleiste folgende URL ein und bestätigen Sie:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Suchen Sie das hervorgehobene Flag **"Insecure origins treated as secure"**.
4. Stellen Sie das Dropdown-Menü auf **Enabled**.
5. Geben Sie in das Textfeld darunter das exakte Protokoll, die IP-Adresse und den Port Ihres Servers ein:
   ```text
   http://192.168.1.150:4200
   ```
   *(Ersetzen Sie dies durch Ihre tatsächliche Server-IP und den Port).*
6. Tippen Sie unten rechts auf die blaue Schaltfläche **Relaunch**, um Chrome neu zu starten.

### Schritt 3: Verbinden und Berechtigungen erteilen
1. Scannen Sie mit der Kamera den im Strecken-Editor angezeigten **Kopplungs-QR-Code** (oder öffnen Sie die URL in Chrome).
2. Bestätigen Sie die Browserabfrage zum Kamerazugriff mit **Zulassen**.
3. Das Live-Videobild und die interaktiven Erfassungsgates erscheinen auf Ihrem Bildschirm.

---

## Schritt-für-Schritt-Anleitung für iOS (iPhone und iPad)

Da Apple WebKit die Sicherheitsanforderungen auf allen iOS-Browsern ohne Ausnahmeschalter erzwingt, muss die Schnittstelle für iPhone und iPad über **HTTPS** bereitgestellt werden.

### Methode 1: Lokaler HTTPS-Reverse-Proxy mit mkcert (Empfohlen)
Erstellt ein lokal vertrauenswürdiges SSL-Zertifikat in Ihrem Heimnetzwerk.

1. **mkcert installieren** (auf dem Host-PC):
   - macOS: `brew install mkcert`
   - Windows: `choco install mkcert` oder `scoop install mkcert`
   - Linux: `sudo apt install libnss3-tools && brew install mkcert`
2. **Lokale Zertifizierungsstelle (CA) erstellen**:
   ```bash
   mkcert -install
   ```
3. **Zertifikat für Ihre lokale IP erstellen**:
   ```bash
   mkcert 192.168.1.150 localhost 127.0.0.1
   ```
4. **Reverse-Proxy starten** (z. B. Caddy mit einer `Caddyfile`):
   ```caddy
   https://192.168.1.150:8443 {
       tls 192.168.1.150+2.pem 192.168.1.150+2-key.pem
       reverse_proxy localhost:4200
   }
   ```
5. **Stammzertifikat auf dem iOS-Gerät installieren**:
   - Senden Sie die Datei `rootCA.pem` (Pfad über `mkcert -CAROOT`) an das iPhone (z. B. per AirDrop).
   - Öffnen Sie **Einstellungen** > **Profil geladen** > **Installieren**.
   - Aktivieren Sie das Zertifikat unter **Einstellungen** > **Allgemein** > **Info** > **Zertifikatsvertrauenseinstellungen**.
6. Öffnen Sie Safari oder Chrome auf dem iPhone und rufen Sie die HTTPS-Adresse auf (`https://192.168.1.150:8443`).

### Methode 2: Sicherer HTTPS-Tunnel (Schnellste Testmethode)
1. Starten Sie **ngrok** auf Ihrem Haupt-PC:
   ```bash
   ngrok http 4200
   ```
2. Rufen Sie die generierte `https://...`-Adresse auf Ihrem iPhone auf.
3. Da ngrok ein weltweit gültiges SSL-Zertifikat verwendet, fragt iOS sofort nach der Kameraberechtigung.

---

## Testen auf diesem Computer (Desktop- und Laptop-Webcams)

Um die Kameraschnittstelle auf Ihrem Hauptcomputer ohne Mobilgerät zu testen, klicken Sie im Strecken-Editor auf **Auf diesem Gerät testen**. Dadurch öffnet sich die Schnittstelle lokal (`http://localhost:4200/camera_interface`).

Da `localhost` von allen modernen Browsern als sicherer Kontext (Secure Context) eingestuft wird, sind keine SSL-Zertifikate oder Browser-Flags erforderlich. Dennoch müssen Berechtigungen auf Betriebssystem- und Browserebene erteilt werden.

### macOS: Einrichtung und Fehlerbehebung

Falls die Kamera unter macOS trotz Bestätigung nicht startet:

1. **Browser-Website-Berechtigungen prüfen**:
   - Klicken Sie in der Chrome-Adressleiste (neben `localhost:4200`) auf das **Schieberegler-/Schlosssymbol** (Website-Einstellungen).
   - Stellen Sie sicher, dass **Kamera** auf **Zulassen** gesetzt ist.
2. **macOS-Systemberechtigungen erteilen**:
   - Wenn der macOS-Systemdialog (*„Google Chrome möchte auf die Kamera zugreifen“*) erscheint, klicken Sie auf **OK**.
   - Falls Sie den Dialog verpasst haben: Öffnen Sie **Systemeinstellungen** > **Datenschutz & Sicherheit** > **Kamera** und aktivieren Sie den Schalter für **Google Chrome** (oder Ihren Browser).
3. **Browser neu starten (`Cmd + Q`)**:
   - **Wichtig**: Die macOS-Sicherheitsarchitektur (TCC) verlangt, dass der Browser **vollständig beendet (`Cmd + Q`) und neu gestartet** wird, damit die Systemberechtigung im Browserprozess wirksam wird.
4. **Schaltfläche „Wiederholen“ klicken**:
   - Die ursprüngliche Kameraabfrage auf der Website bricht oft ab, während der macOS-Systemdialog noch geöffnet ist. Klicken Sie nach Erteilen der Berechtigung auf **Wiederholen**.
5. **Kamera-Sperre prüfen (Exklusivzugriff)**:
   - Die integrierte FaceTime-HD-Kamera unter macOS kann nicht von mehreren Programmen gleichzeitig genutzt werden. Beenden Sie Anwendungen wie **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth** oder **OBS** und klicken Sie auf **Wiederholen**.

### Windows: Einrichtung und Fehlerbehebung

1. Öffnen Sie **Einstellungen** > **Datenschutz und Sicherheit** > **Kamera**.
2. Stellen Sie sicher, dass der **Kamerazugriff** aktiviert ist.
3. Aktivieren Sie sowohl **Apps den Zugriff auf Ihre Kamera erlauben** als auch **Desktop-Apps den Zugriff auf Ihre Kamera erlauben**.
4. Bestätigen Sie in Chrome oder Edge den Zugriff auf `localhost:4200`.

---

## Montage und Ausrichtung

1. **Überkopfposition**: Befestigen Sie das Mobiltelefon ca. 30 bis 60 cm direkt über der Ziellinie mit Blick senkrecht nach unten.
2. **Vibrationsschutz**: Verwenden Sie eine feste Halterung, um Fehlauslösungen durch Erschütterungen zu vermeiden.
3. **Beleuchtung**: Sorgen Sie für gleichmäßige Ausleuchtung ohne Schattenwurf oder flackernde Leuchtstoffröhren.
4. **Bildwiederholrate**: Wählen Sie im Strecken-Editor **60 FPS** für zuverlässige Erfassung bei hohen Geschwindigkeiten.
