# Solución de Problemas

## Problemas de Visualización

### Compatibilidad del Navegador y Pantalla en Blanco en Dispositivos Antiguos (Android < 9, Windows Heredado y Tablets) {: #browser-compatibility }
- **Síntoma**: Al abrir Race Coordinator AI en una tableta antigua (como Android 4.4 KitKat hasta Android 8 Oreo), PC antiguo o navegador desactualizado, la pantalla permanece completamente en blanco o muestra el aviso "Navegador no compatible".
- **Causa**: Race Coordinator AI está desarrollado con Angular moderno y ECMAScript (ES2020+), utilizando CSS Grid, Variables CSS (`var(--...)`), módulos ES y APIs de JavaScript modernas (incluyendo `BigInt`, `globalThis`, `queueMicrotask`, optional chaining `?.`, nullish coalescing `??` y campos privados de clase `#x`).
- **Soporte de Sistemas Operativos y Navegadores**:

| Plataforma | Versiones Compatibles y Navegadores Mínimos | Estado | Notas |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Google Chrome, Microsoft Edge, Mozilla Firefox actuales | **Totalmente Compatible** | Compatible de forma predeterminada con actualizaciones automáticas. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 o Mozilla Firefox 115 ESR | **Compatible** | Requiere las últimas versiones lanzadas (Chrome 109 / Firefox 115 ESR). Internet Explorer no es compatible. |
| **Windows XP / Vista** | Navegadores oficiales estándar (Chrome 49, Firefox 52 ESR) | **Solo Servidor** | Los navegadores estándar carecen de ES2020+ y no pueden ejecutar la interfaz web. Sin embargo, el servidor Java (JRE 8) puede ejecutarse en modo headless en XP/Vista como anfitrión para tabletas o PCs modernos. |
| **Android** | Android 9.0+ con Google Chrome actual o System WebView | **Compatible** | Google suspendió permanentemente las actualizaciones en Android 8 y versiones anteriores. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Compatible** | Motor WebKit de Apple con compatibilidad total con ECMAScript moderno. |
| **macOS** | macOS 10.15 (Catalina) hasta macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Compatible** | Totalmente compatible en Mac con procesadores Intel y Apple Silicon. |
| **Linux** | Cualquier distribución moderna con Chrome, Chromium o Firefox | **Compatible** | Incluye Raspberry Pi OS de 64 bits y placas ARM64. |

- **Solución y Recomendaciones**:
  - **Usar un Navegador Moderno Compatible**: Conéctese utilizando Google Chrome, Microsoft Edge, Mozilla Firefox o Apple Safari en un sistema operativo compatible (Android 9.0+, iOS 14+, Windows 7+, macOS o Linux).
  - **Configuración en Windows Heredado (Win 7 / 8 / 8.1)**: En Windows 7 u 8, asegúrese de instalar **Google Chrome 109** o **Mozilla Firefox 115 ESR** en lugar del descontinuado Internet Explorer.
  - **Tabletas Modernas Económicas**: Las tabletas económicas modernas (p. ej., Amazon Fire HD 8/10 o tabletas Android asequibles con Android 11–14) son compatibles con Chrome actual y brindan un rendimiento óptimo.
  - **Duplicación de Pantalla / Escritorio Remoto**: En tabletas antiguas, puede visualizar la pantalla del navegador del equipo anfitrión a través de un cliente ligero de VNC o escritorio remoto (como bVNC o AnyDesk).
