# Solução de Problemas

## Problemas de Exibição

### Compatibilidade do Navegador e Tela em Branco em Dispositivos Antigos (Android < 9, Sistemas Windows Legados e Tablets) {: #browser-compatibility }
- **Sintoma**: Ao abrir o Race Coordinator AI em um tablet mais antigo (como Android 4.4 KitKat até Android 8 Oreo), PC legado ou navegador desatualizado, a tela permanece totalmente em branco ou exibe o banner de aviso "Navegador não suportado".
- **Causa**: O Race Coordinator AI é desenvolvido com Angular moderno e ECMAScript (ES2020+), utilizando CSS Grid, propriedades personalizadas CSS (`var(--...)`), módulos ES e APIs JavaScript modernas (incluindo `BigInt`, `globalThis`, `queueMicrotask`, encadeamento opcional `?.`, coalescência nula `??` e campos de classe privados `#x`). Navegadores sem esses recursos não conseguem compilar nem executar o cliente web.
- **Suporte a Sistemas Operacionais e Navegadores**:

| Plataforma | Versões suportadas e navegadores mínimos | Status | Observações |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Versões atuais do Google Chrome, Microsoft Edge, Mozilla Firefox | **Totalmente suportado** | Pronto para uso com atualizações automáticas do navegador. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 ou Mozilla Firefox 115 ESR | **Suportado** | Deve usar as últimas versões de navegador suportadas (Chrome 109 / Firefox 115 ESR). O Internet Explorer não é suportado. |
| **Windows XP / Vista** | Navegadores padrão oficiais (Chrome 49, Firefox 52 ESR) | **Apenas Servidor** | Os navegadores padrão não suportam ES2020+ e não podem executar a interface do cliente localmente. No entanto, o servidor Java do Race Coordinator AI (JRE 8) roda em modo headless no XP/Vista para hospedar corridas para tablets remotos ou PCs modernos. |
| **Android** | Android 9.0+ com Google Chrome moderno ou System WebView | **Suportado** | O Google descontinuou permanentemente as atualizações do Chrome/WebView para o Android 8 e anteriores. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Suportado** | Mecanismo Apple WebKit com suporte moderno a ECMAScript. |
| **macOS** | macOS 10.15 (Catalina) até macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Suportado** | Totalmente compatível com Macs Intel e Apple Silicon. |
| **Linux** | Qualquer distribuição moderna com Chrome, Chromium ou Firefox | **Suportado** | Inclui Raspberry Pi OS 64 bits e computadores de placa única ARM64. |

- **Resolução e recomendações**:
  - **Usar um navegador moderno suportado**: Conecte-se usando Google Chrome, Microsoft Edge, Mozilla Firefox ou Apple Safari em um sistema operacional compatível (Android 9.0+, iOS 14+, Windows 7+, macOS ou Linux).
  - **Configuração do Windows Legado (Win 7 / 8 / 8.1)**: Se estiver no Windows 7 ou 8, certifique-se de instalar o **Google Chrome 109** ou o **Mozilla Firefox 115 ESR** em vez do descontinuado Internet Explorer.
  - **Tablets modernos acessíveis**: Tablets modernos econômicos (por exemplo, Amazon Fire HD 8/10 ou tablets Android rodando Android 11–14) suportam o Chrome moderno e oferecem excelente desempenho a baixo custo.
  - **Espelhamento de tela / Área de trabalho remota**: Para tablets legados, você pode rodar o servidor Race Coordinator AI na máquina host e espelhar a tela usando ferramentas leves de VNC ou área de trabalho remota (como bVNC ou AnyDesk).
