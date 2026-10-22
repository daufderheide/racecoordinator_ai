# Solução de Problemas

## Problemas de Conexão

### Suspensão da Interface USB e Desconexões Entre Baterias (Suspensão Seletiva e Economia de Energia) {: #usb-sleep-prevention }
- **Sintoma**: Durante pausas entre baterias, trocas de pista ou após alguns minutos de inatividade, a conexão com a interface (Phidget, Arduino, Trackmate ou conversor USB-Serial) é perdida. Quando a bateria seguinte começa ou os carros acionam os sensores, a interface se reconecta e a notificação é exibida: *"Interface Conectada: A conexão com a interface foi restaurada."*
- **Causa**: Sistemas operacionais modernos (Windows, macOS e Linux) aplicam políticas agressivas de economia de energia em controladores USB e Dispositivos de Interface Humana (HID). Embora o Race Coordinator AI impeça a suspensão geral do sistema operacional, o sistema desliga de forma independente as portas USB, hubs raiz USB e controladores HID inativos (Suspensão Seletiva USB) quando nenhum dado de sensor é transmitido por um breve intervalo.
- **Por que isso não pode ser desativado automaticamente pelo software**: O gerenciamento de energia a nível de hardware é controlado diretamente pelo kernel do sistema operacional e pelos drivers. No Windows, modificar as configurações de energia do hardware exige privilégios de Administrador (UAC) e alterações em chaves protegidas do Registro (`HKLM`), algo que um aplicativo padrão não pode nem deve fazer para não afetar outros periféricos essenciais (como mouses, teclados ou adaptadores Bluetooth).
- **Resolução por Sistema Operacional**:

#### Windows 10 e Windows 11 (Solução Permanente Recomendada)

##### 1. Desativar a Economia de Energia em Dispositivos USB e HID no Gerenciador de Dispositivos
1. Clique com o botão direito no menu **Iniciar** (ou pressione `Win + X`) e selecione **Gerenciador de Dispositivos**.
2. Expanda **Dispositivos de Interface Humana (Human Interface Devices)**:
    - Procure pelas entradas **Dispositivo de Entrada USB** associadas à sua interface.
    - Clique com o botão direito em cada uma, escolha **Propriedades** e acesse a guia **Gerenciamento de Energia**.
    - **Desmarque** a opção *"Permitir que o computador desligue este dispositivo para economizar energia"* e clique em **OK**.
3. Expanda **Controladores USB (Universal Serial Bus controllers)**:
    - Clique com o botão direito em cada **Hub Raiz USB** e **Generic USB Hub**, selecione **Propriedades** e vá para a guia **Gerenciamento de Energia**.
    - **Desmarque** *"Permitir que o computador desligue este dispositivo para economizar energia"* e clique em **OK**.
4. (Para Arduino / Serial): Expanda **Portas (COM e LPT)**:
    - Clique com o botão direito na sua porta serial USB (ex.: *Arduino Uno*, *Porta de comunicação USB*), escolha **Propriedades** e, se a guia **Gerenciamento de Energia** estiver presente, **desmarque** *"Permitir que o computador desligue este dispositivo para economizar energia"*.

##### 2. Desativar a Suspensão Seletiva USB nas Opções de Energia
1. Abra o **Painel de Controle** do Windows e navegue até **Opções de Energia** (ou pressione `Win + R`, digite `powercfg.cpl` e pressione Enter).
2. Clique em **Alterar configurações do plano** ao lado do seu plano de energia ativo.
3. Clique em **Alterar configurações de energia avançadas**.
4. Expanda **Configurações USB** -> **Configuração de suspensão seletiva USB**.
5. Altere as configurações de **Na bateria** e **Conectado** para **Desabilitado**.
6. Clique em **Aplicar** e depois em **OK**.

---

#### Linux e Raspberry Pi OS

##### 1. Desativar a Suspensão Automática de USB no Kernel
Por padrão, o kernel Linux suspende dispositivos USB ociosos após 2 segundos:
- **No Ubuntu, Debian ou Linux Mint (GRUB)**:
    1. Edite a configuração do GRUB: `sudo nano /etc/default/grub`.
    2. Adicione `usbcore.autosuspend=-1` em `GRUB_CMDLINE_LINUX_DEFAULT`.
    3. Atualize o GRUB e reinicie: `sudo update-grub && sudo reboot`.
- **No Raspberry Pi OS**:
    1. Abra o arquivo de parâmetros de inicialização: `sudo nano /boot/firmware/cmdline.txt` (ou `/boot/cmdline.txt`).
    2. Adicione `usbcore.autosuspend=-1` ao final da linha (todos os argumentos devem permanecer em uma única linha).
    3. Salve e reinicie: `sudo reboot`.

##### 2. Desativar a Suspensão Automática via Regra Udev (Alternativa)
1. Crie um arquivo de regras: `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Adicione a seguinte regra:
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Recarregue as regras: `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Configurações de Economia de Energia / Telas**: Abra **Ajustes do Sistema** -> **Telas** -> **Avançado...** (ou **Economizador de Energia**) e marque **"Impedir o repouso automático quando a tela estiver desligada"**.
- **Utilizar Hubs USB com Alimentação Própria**: O macOS pode desligar portas de hubs USB passivos diante de oscilações de consumo. Sempre conecte a interface de cronometragem a um hub USB alimentado por tomada dedicada.

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
