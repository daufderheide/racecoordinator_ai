# Guide de Configuration de la Caméra Web Mobile

Ce guide explique comment configurer un smartphone ou une tablette (iOS ou Android) comme caméra de chronométrage optique haute vitesse dans **Race Coordinator AI (RC AI)**.

---

## Vue d'ensemble

Race Coordinator AI permet d'utiliser n'importe quel smartphone moderne comme passerelle de chronométrage optique. En fixant l'appareil directement au-dessus de la ligne d'arrivée ou de l'entrée des stands, la caméra détecte les voitures traversant chaque voie et transmet les déclenchements en temps réel au serveur via WebSockets.

Comme cette interface s'exécute directement dans le navigateur mobile sans aucune application native à installer, les règles de sécurité des navigateurs s'appliquent.

---

## Pourquoi l'accès à la caméra sur le réseau local est restreint

Les navigateurs modernes appliquent des normes de sécurité strictes concernant les périphériques multimédias (`navigator.mediaDevices.getUserMedia`).

Pour protéger la confidentialité, l'accès à la caméra n'est autorisé que dans un **Contexte Sécurisé (Secure Context)** :

1. **Connexions chiffrées HTTPS** (`https://...`).
2. **Adresses de bouclage local** (`http://localhost` ou `http://127.0.0.1`).

Lorsque votre appareil mobile se connecte à Race Coordinator AI sur le réseau Wi-Fi local via une adresse IP (ex. `http://192.168.1.150:4200`), le navigateur considère la connexion comme une origine HTTP non sécurisée et bloque l'accès à la caméra par défaut.

---

## Compatibilité et Différences entre Navigateurs

| Système d'exploitation | Navigateur | Moteur Web | Option de dérogation disponible ? | Caméra via HTTP local ? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Oui** (`chrome://flags`) | **Oui** (avec drapeau activé) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Oui** (`edge://flags`, etc.) | **Oui** (avec drapeau activé) |
| **Android** | Firefox | Gecko | Non | HTTPS obligatoire |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **Non** | HTTPS obligatoire |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **Non** | HTTPS obligatoire |

!!! warning "Remarque importante sur Chrome sous iOS"
    Sous Apple iOS, Apple impose à tous les navigateurs web (y compris Google Chrome, Edge et Firefox) d'utiliser le moteur **WebKit** d'Apple.
    
    Par conséquent, **iOS Chrome NE PREND PAS EN CHARGE les `chrome://flags`**. Saisir `chrome://flags` sous iOS n'aura aucun effet ou lancera une recherche. Les appareils iOS requièrent impérativement une connexion HTTPS, quel que soit le navigateur utilisé.

---

## Configuration Étape par Étape pour Android (Google Chrome)

Google Chrome sur Android vous permet d'ajouter des adresses IP locales à la liste des origines sécurisées via un drapeau de développement interne.

### Étape 1 : Obtenir l'IP et le port du serveur
1. Dans Race Coordinator AI sur votre ordinateur principal, ouvrez l'**Éditeur de Piste** > **Configuration de la Caméra**.
2. Développez la section **Jumelage Mobile** et cliquez sur **Afficher le QR code de jumelage**.
3. Notez l'URL affichée (ex. `http://192.168.1.150:4200`).

### Étape 2 : Configurer le drapeau de sécurité dans Chrome
1. Ouvrez **Google Chrome** sur votre appareil Android.
2. Dans la barre d'adresse de Chrome, tapez l'URL suivante et validez :
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Repérez l'option en surbrillance intitulée **"Insecure origins treated as secure"**.
4. Déroulez le menu et sélectionnez **Enabled**.
5. Dans le champ de texte situé en dessous, saisissez le protocole exact, l'adresse IP et le port de votre serveur :
   ```text
   http://192.168.1.150:4200
   ```
   *(Remplacez par votre IP et port réels).*
6. Appuyez sur le bouton bleu **Relaunch** en bas de l'écran pour redémarrer Chrome.

### Étape 3 : Connexion et autorisation
1. Scannez le **QR code de jumelage** avec votre appareil ou ouvrez le lien dans Chrome.
2. Lorsque le navigateur demande l'accès à la caméra, appuyez sur **Autoriser**.
3. Le flux vidéo et les portes de détection interactives s'affichent sur l'écran.

---

## Configuration Étape par Étape pour iOS (iPhone et iPad)

Apple WebKit imposant le contexte sécurisé sur tous les navigateurs iOS sans possibilité de dérogation par drapeau, l'utilisation d'un iPhone ou iPad requiert de distribuer l'application via **HTTPS**.

### Méthode 1 : Reverse Proxy HTTPS local avec mkcert (Recommandé)
1. **Installez mkcert** sur votre ordinateur hôte.
2. **Générez une autorité de certification locale** :
   ```bash
   mkcert -install
   ```
3. **Générez un certificat pour votre IP locale** :
   ```bash
   mkcert 192.168.1.150 localhost 127.0.0.1
   ```
4. **Configurez un reverse proxy** (ex. Caddy) pour router le port HTTPS vers `localhost:4200`.
5. **Installez l'autorité racine sur l'appareil iOS** :
   - Transférez le fichier `rootCA.pem` vers l'iPhone (par AirDrop ou email).
   - Ouvrez **Réglages** > **Profil téléchargé** > **Installer**.
   - Activez la confiance totale dans **Réglages** > **Général** > **Informations** > **Réglages des certificats**.
6. Accédez à l'URL HTTPS depuis Safari ou Chrome sur iOS.

### Méthode 2 : Tunnel HTTPS sécurisé (Test rapide)
Pour tester un iPhone sans certificats SSL locaux, un tunnel HTTPS fournit une adresse publique fiable :

#### Option A : LocalTunnel (Sans inscription)
Lancez directement sans créer de compte :
```bash
npx -y localtunnel --port 4200
```
Ouvrez le lien `https://...loca.lt` généré sur votre iPhone.

#### Option B : Tunnel SSH intégré (Sans installation ni inscription)
Utilisez la commande SSH native :
```bash
ssh -R 80:localhost:4200 localhost.run
```
Copiez l'adresse `https://...` affichée dans votre terminal sur votre iPhone.

#### Option C : ngrok (Compte gratuit requis)
ngrok nécessite un compte et un jeton d'authentification :
1. Créez un compte gratuit sur [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
2. Configurez votre jeton :
   ```bash
   npx ngrok config add-authtoken <VOTRE_JETON>
   ```
3. Lancez le tunnel :
   ```bash
   npx ngrok http 4200
   ```
4. Ouvrez l'adresse `https://...ngrok-free.app` sur votre iPhone.

### Méthode 3 : Continuité sur l'appareil photo Apple sans fil (macOS + iPhone)
Si votre ordinateur de course principal est un Mac et que vous souhaitez utiliser un iPhone comme caméra de piste, vous pouvez tirer parti de la fonctionnalité native **Continuité sur l'appareil photo (Continuity Camera)** d'Apple. Cela fonctionne **entièrement sans fil**, sans câble branché :

1. **Vérifier l'identifiant Apple et la connectivité sans fil** :
   - Assurez-vous que le Mac et l'iPhone sont connectés avec le même identifiant Apple (authentification à deux facteurs active).
   - Activez le **Wi-Fi** et le **Bluetooth** sur les deux appareils.
   - Sur l'iPhone, vérifiez dans **Réglages** > **Général** > **AirPlay et Continuité** que l'option **Appareil photo Continuité** est activée.
2. **Installer l'iPhone sur la piste** :
   - Positionnez l'iPhone horizontalement au-dessus de la ligne d'arrivée, caméra arrière orientée vers le bas.
   - Verrouillez l'écran de l'iPhone. Aucun câble n'est requis (un câble est utile uniquement pour maintenir la charge pendant les longues sessions).
3. **Lancer l'interface localement sur le Mac** :
   - Dans l'Éditeur de Piste sur le Mac, cliquez sur **Tester sur cet appareil** (ou ouvrez `http://localhost:4200/camera_interface`).
   - `localhost` étant un contexte sécurisé, le navigateur du Mac autorise l'accès à la caméra sans certificat SSL ni drapeau.
   - Sélectionnez la **Caméra iPhone** dans les réglages de caméra du navigateur ou de macOS. macOS établit la liaison vidéo sans fil automatiquement.
4. **Portée sans fil** : La Continuité sur l'appareil photo fonctionne par liaison directe pair-à-pair (portée d'environ 10 mètres dans la même pièce). Si le Mac se trouve dans une autre pièce éloignée, utilisez la **Méthode 1 (HTTPS local)**, la **Méthode 2 (Tunnel HTTPS)** ou un appareil Android connecté au Wi-Fi standard.

---

## Tests sur cet Ordinateur (Webcams de Bureau et Portables)

Pour tester l'interface sur votre ordinateur principal sans utiliser d'appareil mobile, cliquez sur **Tester sur cet appareil** dans l'Éditeur de Piste (`http://localhost:4200/camera_interface`).

Comme `localhost` est reconnu comme contexte sécurisé par tous les navigateurs, aucun certificat SSL ni drapeau n'est requis. Toutefois, les autorisations du système d'exploitation et du navigateur doivent être accordées.

### macOS : Configuration et Dépannage

Si la caméra ne s'active pas sous macOS même après confirmation :

1. **Vérifier les autorisations du navigateur** :
   - Dans la barre d'adresse (à côté de `localhost:4200`), cliquez sur l'**icône réglages/cadenas** (Paramètres du site).
   - Assurez-vous que la **Caméra** est définie sur **Autoriser**.
2. **Accorder les autorisations système sous macOS** :
   - Lorsque le dialogue système de macOS apparaît (*« Google Chrome souhaite accéder à la caméra »*), cliquez sur **OK**.
   - Si le dialogue a été ignoré ou refusé : ouvrez **Réglages Système** > **Confidentialité et sécurité** > **Caméra** et activez le commutateur pour **Google Chrome** (ou votre navigateur).
3. **Redémarrer le navigateur (`Cmd + Q`)** :
   - **Indispensable** : L'architecture de sécurité de macOS (TCC) impose de **quitter complètement (`Cmd + Q`) et relancer le navigateur** après l'octroi des autorisations pour que le processus du navigateur puisse accéder au matériel.
4. **Cliquer sur le bouton « Réessayer »** :
   - La requête initiale expire souvent pendant que le dialogue de macOS attend votre action. Cliquez sur le bouton **Réessayer** à l'écran après avoir accordé l'accès.
5. **Vérifier le verrouillage matériel (Caméra déjà utilisée)** :
   - La caméra intégrée FaceTime HD sous macOS ne peut être partagée par plusieurs applications à la fois. Fermez complètement **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth** ou **OBS**, puis cliquez sur **Réessayer**.

### Windows : Configuration et Dépannage

1. Ouvrez **Paramètres** > **Confidentialité et sécurité** > **Caméra**.
2. Vérifiez que l'**Accès à la caméra** est **Activé**.
3. Activez **Autoriser les applications à accéder à votre caméra** et **Autoriser les applications de bureau à accéder à votre caméra**.
4. Dans Chrome ou Edge, autorisez l'accès pour `localhost:4200`.

---

## Conseils de Montage et Réglages

1. **Position Zénithale** : Fixez l'appareil de 30 à 60 cm au-dessus de la ligne d'arrivée, orienté perpendiculairement vers la piste.
2. **Stabilité** : Utilisez une fixation rigide pour éviter les faux déclenchements causés par les vibrations de la piste.
3. **Éclairage** : Assurez une lumière constante sans reflets ni ombres projetées par les pilotes.
4. **Cadence d'images** : Choisissez **60 FPS** pour assurer la détection parfaite des bolides à grande vitesse.
