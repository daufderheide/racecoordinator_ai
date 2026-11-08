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

### Reinicializações e Quedas de Tensão do Microcontrolador {: #microcontroller-brownout-resets }

- **Sintoma**: Durante uma corrida ou treino, um banner de aviso surge na tela do dia de corrida: *"Reinicialização do microcontrolador detectada: O microcontrolador da interface reiniciou inesperadamente durante a operação."* Clicar em **Detalhes** abre uma janela exibindo o nome da interface, a contagem de reinicializações e o horário da reinicialização mais recente. Se ocorrerem várias reinicializações na mesma sessão, uma nota alerta sobre a frequência anormal de reinicializações.
- **O que está sendo reportado**: A interface de cronometragem (como Arduino Uno, Nano, Mega ou microcontrolador USB compatível) sofreu uma reinicialização de hardware imprevista ou queda de tensão (brownout) enquanto conectada ao Race Coordinator AI. Isso indica que o microprocessador da placa sofreu uma queda momentânea de alimentação ou um pico de ruído elétrico que acionou sua linha de reset físico ou o circuito Brown-Out Detection (BOD).

#### O que Acontece no Race Coordinator AI (RMS)
Quando um microcontrolador reinicia inesperadamente durante uma prova:
1. **Bootloader e Handshake**: O microcontrolador reinicia e envia uma saudação de identificação inicial e pings de status ao Race Coordinator AI.
2. **Recuperação Automática de Estado**: O Race Coordinator AI detecta que a placa já estava conectada e operando. Em vez de abortar a bateria, o RMS reconfigura imediatamente o microcontrolador: reaplica pinos de entrada, polaridades (ativo em nível alto/baixo), tempos de debounce e restaura o estado dos relés conforme o status atual da bateria (ex.: alimentação da pista LIGADA).
3. **Janela de Escudo Protetor (250 ms)**: Na inicialização de um Arduino, as entradas digitais podem flutuar momentaneamente ou relatar estados pull-up padrão antes de estabilizarem. O Race Coordinator AI ativa um escudo protetor de 250 ms logo após um reset imprevisto. Durante essa janela, transmissões estáticas de pinos são filtradas para evitar contagens de volta falsas, voltas fantasmas ou chamadas de pista acidentais provocadas por ruído elétrico de inicialização.
4. **Impacto na Corrida — Risco de Voltas Perdidas**:
    - Embora o Race Coordinator AI restabeleça a conexão e a energia da pista automaticamente sem cancelar a bateria, o microcontrolador fica **completamente cego aos sinais dos sensores** durante seu reinício físico, execução do bootloader e negociação (normalmente de 200 a 500 milissegundos).
    - **Qualquer autorama que cruzar um sensor óptico, dead strip ou chave reed durante essa janela de reset NÃO será registrado, provocando voltas perdidas.**
    - Se as reinicializações ocorrerem com frequência, a contagem de voltas e a classificação da bateria ficarão incorretas, e os pilotos poderão notar breves interrupções de corrente.

#### Causas Comuns
*Nota: Embora as causas detalhadas abaixo representem a vasta maioria dos problemas observados em pistas de autorama, cada instalação física é única e outros fatores elétricos ou mecânicos podem estar presentes.*

1. **Repique Indutivo de Relés (Picos de Força Contra-Eletromotriz - Back-EMF)**:
    - **A causa principal de quedas de tensão de microcontroladores em pistas de autorama.**
    - Os relés que controlam a energia da pista possuem bobinas eletromagnéticas. Quando um relé desliga (em uma parada de prova ou final de bateria), o colapso do campo magnético na bobina gera um pico maciço de tensão reversa (centenas de volts de contra-FEM).
    - Se a placa de relés não dispuser de diodos flyback apropriados ou compartilhar o terra/alimentação diretamente com o Arduino, esse pico de alta tensão atinge o microcontrolador, acionando o BOD ou travando a CPU.
2. **Fiação de Botões de Parada & Cabos Longos como Antenas**:
    - Botões de chamada instalados ao redor da pista frequentemente utilizam fiações longas sem blindagem (de 3 a mais de 15 metros).
    - Esses cabos compridos funcionam como antenas, captando intensa interferência eletromagnética (EMI) dos motores, faiscamento nas cordoalhas e fendas dos trilhos.
    - Pressionar ou soltar botões mecânicos sem resistores pull-up externos ou filtros RC de debounce pode induzir pulsos de tensão transitória diretamente nos pinos de entrada.
3. **Queda de Tensão no Barramento USB 5V**:
    - Os microcontroladores necessitam de 4,5 V a 5,2 V estáveis para operar com confiabilidade.
    - Se o Arduino estiver conectado a um hub USB passivo, a uma porta frontal de PC com cabo interno longo ou a uma porta USB compartilhada sob alta carga, a tensão pode cair momentaneamente abaixo do limiar BOD (geralmente 2,7 V ou 4,3 V), forçando um reinício instantâneo.
4. **Interferência Eletromagnética (EMI) da Corrente da Pista**:
    - Os motores de autorama consomem correntes elevadas e produzem faíscas contínuas entre as escovas, cordoalhas e condutores da pista.
    - Se os fios dos sensores, dos botões ou o próprio microcontrolador passarem paralelos e muito próximos dos cabos de força da pista ou de fontes DC variáveis, o acoplamento indutivo causará picos de tensão na eletrônica de cronometragem.
5. **Circuitos de Tomada AC Compartilhados sem Filtro**:
    - Ligar o computador de cronometragem, a fonte DC da pista, tornos de pneus ou ferramentas na mesma régua de tomadas sem filtro de linha pode transmitir transientes da rede através da fonte do PC para o barramento USB.
6. **Descarga Eletrostática (ESD)**:
    - Em locais secos, o atrito contínuo dos carros sobre a pista plástica gera eletricidade estática. Quando um piloto ou fiscal toca em um botão ou trilho metálico, a descarga eletrostática pode reiniciar a placa.

#### Formas Potenciais de Resolver o Problema

- **Instalar Diodos Flyback em Todas as Bobinas de Relés**:
    - Solde um diodo retificador comum (como **1N4001**, **1N4004** ou **1N4007**) em polarização reversa diretamente nos terminais DC de cada bobina de relé (cátodo/faixa listrada no +DC, ânodo no terra/-DC). Isso dissipa com segurança a energia de contra-FEM quando o relé é desenergizado.
- **Utilizar Placas de Relés Optoacopladas com Alimentação Independente**:
    - A maioria dos módulos de relé de 5V possui um jumper de isolamento denominado **JD-VCC / VCC / GND**.
    - Remova o jumper `JD-VCC`. Conecte os 5V e os pinos de sinal do Arduino na régua de controle, mas alimente as bobinas dos relés de forma independente plugando uma fonte de tomada de 5V DC entre o pino `JD-VCC` e o terra `GND` da placa de relés. Isso isola completamente a corrente ruidosa dos relés do barramento de 5V do Arduino.
- **Adicionar Resistores Pull-Up Externos e Capacitores aos Botões**:
    - Não confie unicamente nos resistores pull-up internos fracos do Arduino (~20 kΩ–50 kΩ) em fiações longas. Instale **resistores pull-up externos de 1 kΩ a 4,7 kΩ** entre cada pino de entrada e o +5V no borne do Arduino.
    - Conecte um pequeno **capacitor cerâmico de 0,1 µF (100 nF)** entre cada pino de botão e o terra para filtrar ruídos de alta frequência e repiques de contato.
- **Utilizar um Hub USB com Fonte de Alimentação Dedicada**:
    - Conecte o microcontrolador a um hub USB alimentado por tomada própria de 110V/220V em vez de conectá-lo diretamente a uma porta do PC ou notebook. Um hub alimentado garante 5V constantes independentemente do uso do computador.
- **Separar Fisicamente os Cabos de Sinal da Energia da Pista**:
    - Mantenha os cabos de sensores (infravermelho, óptico, reed) e dos botões a pelo menos 15 a 30 cm de distância dos trilhos de força e dos cabos das fontes.
    - Nos pontos em que os cabos de sinal precisarem cruzar fios de energia da pista, faça o cruzamento em **ângulo reto de 90 graus** e nunca em paralelo.
- **Empregar Cabos de Par Trançado Blindado (STP)**:
    - Em trechos compridos, utilize cabo de rede blindado (Cat5e/Cat6 STP) ou cabo para instrumentação blindado. Aterre a malha de blindagem somente no lado do Arduino.
- **Circuitos Elétricos Independentes**:
    - Ligue a fonte de alimentação da pista e o computador em tomadas separadas ou utilize um protetor de surtos com filtro de linha de boa qualidade.

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
