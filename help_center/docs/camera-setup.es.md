# Guía de Configuración de Cámara Web Móvil

Esta guía explica cómo configurar un teléfono inteligente o tableta (iOS o Android) como una cámara óptica de cronometraje de vueltas de alta velocidad en **Race Coordinator AI (RC AI)**.

---

## Descripción General

Race Coordinator AI le permite utilizar cualquier teléfono inteligente moderno como puente de cronometraje óptico. Al montar el dispositivo directamente sobre la línea de meta o la entrada a boxes de la pista, la cámara web del teléfono detecta el paso de los coches en cada carril y transmite los eventos de activación al servidor en tiempo real a través de WebSockets.

Dado que esta interfaz se ejecuta directamente dentro del navegador móvil sin instalar aplicaciones nativas, se aplican las políticas de seguridad del navegador.

---

## Por qué está restringido el acceso a la cámara en la red local

Los navegadores web modernos aplican estándares estrictos de seguridad en relación con dispositivos multimedia (`navigator.mediaDevices.getUserMedia`).

Para proteger la privacidad del usuario, los navegadores solo permiten el acceso a la cámara en un **Contexto Seguro (Secure Context)**:

1. **Conexiones HTTPS cifradas** (`https://...`).
2. **Direcciones de bucle local** (`http://localhost` o `http://127.0.0.1`).

Cuando su dispositivo móvil se conecta a Race Coordinator AI a través de la red Wi-Fi local mediante una dirección IP (por ejemplo, `http://192.168.1.150:4200`), el navegador clasifica la conexión como un origen HTTP no seguro y bloquea el acceso a la cámara de forma predeterminada.

---

## Compatibilidad y Diferencias entre Navegadores

| Sistema Operativo | Navegador | Motor Web | ¿Opción de elusión disponible? | ¿Cámara por HTTP local? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Sí** (`chrome://flags`) | **Sí** (con opción activada) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Sí** (`edge://flags`, etc.) | **Sí** (con opción activada) |
| **Android** | Firefox | Gecko | No | Requiere HTTPS |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **No** | Requiere HTTPS |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **No** | Requiere HTTPS |

!!! warning "Nota Importante sobre Chrome en iOS"
    En Apple iOS, las normativas de Apple exigen que todos los navegadores (incluidos Google Chrome, Edge y Firefox) utilicen internamente el motor **WebKit** de Apple.
    
    Por lo tanto, **iOS Chrome NO admite `chrome://flags`**. Escribir `chrome://flags` en un dispositivo iOS no surtirá efecto o abrirá una búsqueda web. Los dispositivos iOS requieren obligatoriamente una conexión HTTPS, independientemente de la aplicación de navegador utilizada.

---

## Configuración Paso a Paso para Android (Google Chrome)

Google Chrome en Android permite autorizar direcciones IP locales específicas como orígenes seguros mediante una opción de desarrollo interna.

### Paso 1: Obtener la IP y Puerto del Servidor
1. En Race Coordinator AI en su equipo principal, vaya a **Editor de Pistas** > **Configuración de Cámara**.
2. Despliegue la sección **Emparejamiento Móvil** y pulse **Mostrar Código QR de Emparejamiento**.
3. Anote la URL del servidor mostrada (por ejemplo, `http://192.168.1.150:4200`).

### Paso 2: Configurar la Opción de Seguridad en Chrome
1. Abra **Google Chrome** en su dispositivo Android.
2. En la barra de direcciones de Chrome, escriba la siguiente URL y presione Entrar:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Busque la opción destacada titulada **"Insecure origins treated as secure"**.
4. Cambie el menú desplegable a **Enabled**.
5. En el cuadro de texto que aparece debajo, introduzca el protocolo exacto, dirección IP y puerto de su servidor:
   ```text
   http://192.168.1.150:4200
   ```
   *(Sustituya por su IP y puerto reales).*
6. Pulse el botón azul **Relaunch** en la parte inferior para reiniciar Chrome.

### Paso 3: Conectar y Conceder Permisos
1. Abra la cámara de su teléfono y escanee el **Código QR de Emparejamiento** mostrado en el Editor de Pistas (o abra el enlace en Chrome).
2. Cuando el navegador pregunte si permite acceder a la cámara, pulse **Permitir**.
3. El flujo de vídeo en directo y las puertas de detección interactivas aparecerán en la pantalla.

---

## Configuración Paso a Paso para iOS (iPhone y iPad)

Dado que Apple WebKit impone el requisito de contexto seguro en todos los navegadores de iOS sin opciones de elusión, el uso de iPhone o iPad requiere servir la aplicación mediante **HTTPS**.

### Método 1: Proxy Inverso HTTPS Local con mkcert (Recomendado)
1. **Instale mkcert** en su ordenador principal (`brew install mkcert` en macOS o mediante gestor de paquetes en Windows/Linux).
2. **Genere una Autoridad Certificadora (CA) local**:
   ```bash
   mkcert -install
   ```
3. **Cree un certificado para su IP local**:
   ```bash
   mkcert 192.168.1.150 localhost 127.0.0.1
   ```
4. **Ejecute un proxy inverso** como Caddy configurando su `Caddyfile` para redirigir el puerto seguro a `localhost:4200`.
5. **Instale el certificado raíz en su dispositivo iOS**:
   - Envíe el archivo `rootCA.pem` al iPhone (por ejemplo, mediante AirDrop).
   - Vaya a **Ajustes** > **Perfil descargado** > **Instalar**.
   - Active la confianza completa en **Ajustes** > **General** > **Información** > **Ajustes de confianza de certificados**.
6. Abra Safari o Chrome en iOS e ingrese a su dirección segura (`https://...`).

### Método 2: Túnel Seguro HTTPS (Prueba Rápida)
Para probar un iPhone sin instalar certificados SSL locales, un túnel HTTPS genera una dirección pública de confianza:

#### Opción A: LocalTunnel (Sin registro)
Ejecute directamente en la terminal sin crear cuenta:
```bash
npx -y localtunnel --port 4200
```
Abra el enlace `https://...loca.lt` generado en su iPhone.

#### Opción B: Túnel SSH integrado (Sin instalación ni registro)
Utilice el comando SSH nativo del sistema:
```bash
ssh -R 80:localhost:4200 localhost.run
```
Copie la dirección `https://...` mostrada en la terminal a su iPhone.

#### Opción C: ngrok (Requiere cuenta gratuita)
ngrok exige una cuenta y un token de autenticación:
1. Regístrese gratis en [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
2. Configure su token:
   ```bash
   npx ngrok config add-authtoken <SU_TOKEN>
   ```
3. Inicie el túnel:
   ```bash
   npx ngrok http 4200
   ```
4. Abra la dirección `https://...ngrok-free.app` en su iPhone.

### Método 3: Cámara de Continuidad Inalámbrica de Apple (macOS + iPhone)
Si su ordenador principal es un Mac y desea utilizar un iPhone como cámara de pista, puede aprovechar la función integrada **Cámara de Continuidad (Continuity Camera)** de Apple. Funciona **completamente sin cables**:

1. **Comprobar ID de Apple y conectividad inalámbrica**:
   - Asegúrese de que el Mac y el iPhone hayan iniciado sesión con el mismo ID de Apple (autenticación de doble factor activa).
   - Mantenga **Wi-Fi** y **Bluetooth** encendidos en ambos dispositivos.
   - En el iPhone, verifique en **Ajustes** > **General** > **AirPlay y Continuidad** que la opción **Cámara de Continuidad** esté activada.
2. **Montar el iPhone sobre la pista**:
   - Fije el iPhone horizontalmente sobre la línea de meta con la cámara trasera orientada hacia abajo.
   - Bloquee la pantalla del iPhone. Funciona de manera inalámbrica (solo necesita cable si desea mantener la batería cargada durante eventos largos).
3. **Iniciar la interfaz localmente en el Mac**:
   - En el Editor de Pistas del Mac, haga clic en **Probar en este dispositivo** (o abra `http://localhost:4200/camera_interface`).
   - Al ser `localhost` un contexto seguro, el navegador del Mac permite el acceso a la cámara sin certificados SSL ni flags.
   - Seleccione la **Cámara del iPhone** en los ajustes de cámara del navegador o de macOS. El sistema establecerá el enlace de vídeo inalámbrico de forma automática.
4. **Alcance inalámbrico**: La Cámara de Continuidad funciona mediante conexión directa punto a punto (alcance típico de unos 10 metros en la misma sala). Si el Mac se encuentra en otra habitación lejana, utilice el **Método 1 (HTTPS local)**, el **Método 2 (Túnel HTTPS)** o un móvil Android conectado al Wi-Fi de la casa.

---

## Pruebas en este Ordenador (Cámaras Web de Escritorio y Portátil)

Para probar la interfaz en su ordenador principal sin necesidad de un dispositivo móvil, haga clic en **Probar en este dispositivo** en el Editor de Pistas (`http://localhost:4200/camera_interface`).

Dado que `localhost` es reconocido universalmente como un contexto seguro, no se precisan certificados SSL ni flags. Sin embargo, deben autorizarse los permisos del sistema operativo y del navegador.

### macOS: Configuración y Solución de Problemas

Si la cámara no se inicializa en macOS tras haber concedido los permisos:

1. **Comprobar los permisos del navegador**:
   - En la barra de direcciones (junto a `localhost:4200`), pulse el **icono de ajustes/candado** (Configuración del sitio).
   - Verifique que la **Cámara** esté establecida en **Permitir**.
2. **Conceder permisos del sistema en macOS**:
   - Cuando aparezca el cuadro de diálogo de macOS (*«Google Chrome desea acceder a la cámara»*), pulse **Aceptar**.
   - Si no apareció o fue rechazado antes: abra **Ajustes del Sistema** > **Privacidad y seguridad** > **Cámara** y active el selector de **Google Chrome** (o su navegador).
3. **Reiniciar el navegador (`Cmd + Q`)**:
   - **Crucial**: La seguridad de macOS (TCC) exige **cerrar por completo (`Cmd + Q`) y volver a abrir el navegador** tras conceder los permisos del sistema para que surtan efecto.
4. **Pulsar el botón «Reintentar»**:
   - La solicitud inicial de la página web suele agotarse mientras el diálogo de macOS espera confirmación. Pulse **Reintentar** en la pantalla tras conceder los permisos.
5. **Verificar el bloqueo exclusivo de hardware**:
   - La cámara FaceTime HD de Mac solo puede ser utilizada por una aplicación al mismo tiempo. Cierre por completo aplicaciones como **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth** u **OBS** y pulse **Reintentar**.

### Windows: Configuración y Solución de Problemas

1. Abra **Configuración** > **Privacidad y seguridad** > **Cámara**.
2. Asegúrese de que el **Acceso a la cámara** esté **Activado**.
3. Active **Permitir que las aplicaciones accedan a la cámara** y **Permitir que las aplicaciones de escritorio accedan a la cámara**.
4. En Chrome o Edge, autorice los permisos para `localhost:4200`.

---

## Consejos de Montaje y Ajuste

1. **Posición Cenital**: Monte el dispositivo de 30 a 60 cm directamente encima de la pista apuntando hacia abajo a la línea de meta.
2. **Evitar Vibraciones**: Emplee un soporte rígido para evitar falsos positivos producidos por las sacudidas de los coches.
3. **Iluminación**: Asegure una luz uniforme y constante en todos los carriles, evitando sombras de los participantes.
4. **Tasa de Cuadros**: Seleccione **60 FPS** en la configuración de la cámara para detectar coches a máxima velocidad con total precisión.
