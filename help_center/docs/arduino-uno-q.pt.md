# Guia de Configuração do Arduino UNO Q

Este guia explica como configurar o **Race Coordinator AI (RC AI)** na placa de desenvolvimento híbrida **Arduino UNO Q** como um dispositivo de hardware independente.

---

## Visão Geral do Hardware e Variantes de Memória

O **Arduino UNO Q** combina um Computador de Placa Única (SBC) Linux de 64 bits com um microcontrolador em tempo real em uma única placa:

- **MPU Linux (Qualcomm Cortex-A53 @ 2,0 GHz)**: Executa o servidor Race Coordinator AI, banco de dados SQLite, servidor de cliente web e atualizador automático.
- **MCU em Tempo Real (STM32U585 Cortex-M33 @ 160 MHz)**: Gerencia interrupções de pinos de sensores de volta, tempos de setor, botões de chamada e relés de energia da pista com precisão submilisegundo (nota: LEDs RGB endereçáveis FastLED não são suportados nesta arquitetura).
- **Saída de Vídeo**: A saída USB-C DisplayPort conecta-se diretamente a um monitor, TV ou tela sensível ao toque.

### Modelos de 4 GB vs. 2 GB

* **Arduino UNO Q 4 GB (Recomendado e Suportado)**: Equipado com 4 GB de RAM e 32 GB de armazenamento eMMC. Este modelo é necessário para o **Modo de Exibição Quiosque** (controlando diretamente uma TV ou monitor HDMI/DisplayPort), pois executar o desktop Linux, o navegador Chromium, o runtime Java e o banco de dados SQLite simultaneamente requer mais de 2 GB de memória.
* **Arduino UNO Q 2 GB (Consideração para Modo Sem Cabeça / Headless)**:
  * Embora o modelo de 2 GB não tenha a memória necessária para executar com fluidez o desktop local e a exibição quiosque do Chromium, ele tem memória suficiente para executar o servidor backend em **Modo de Dispositivo Sem Cabeça (Headless)**.
  * **Status Atual de Suporte**: O modo headless no Uno Q **não é suportado atualmente**, pois alterações adicionais no pacote de suporte e na configuração do Uno Q ainda são necessárias. No entanto, o suporte para modo headless no Q de 2 GB **pode ser adicionado mediante solicitação**, desde que o Uno Q tenha uma conexão de rede ativa (Wi-Fi ou Ethernet) para permitir que diretores de corrida e pilotos acessem a interface web a partir de outros dispositivos na rede.

---

## Modos de Operação

1. **Modo de Exibição Quiosque (Modelo de 4 GB)**: Conecte um monitor ou TV HDMI/DisplayPort diretamente à porta USB-C do Uno Q através de um adaptador multiporta. A placa inicia automaticamente o Chromium no modo quiosque em tela cheia (`http://localhost:7070`), permitindo simultaneamente conexões de rede remotas.
2. **Modo de Dispositivo Sem Cabeça (Atualmente não suportado - Disponível mediante solicitação)**: A placa executa apenas o servidor backend e se conecta ao hardware da pista, sem nenhum monitor ou navegador local em execução. Os usuários acessam a interface web através da rede local (`http://<hostname>:7070` ou `http://<ENDEREÇO_IP>:7070`). Conforme observado acima, o modo headless no Uno Q não é suportado por padrão, mas pode ser adicionado mediante solicitação se o Uno Q tiver uma conexão de rede.

---

## Instalação Passo a Passo

### Passo 1: Preparar a Placa e Conectar via Rede

1. **Ligar a Placa** *(A regravação/flash geralmente não é necessária)*:
   * O seu Arduino Uno Q vem com o **Arduino Linux OS (Debian 12 arm64) pré-instalado** no armazenamento flash eMMC interno de 32 GB. Basta conectar a placa à energia para iniciar o sistema operacional.
   * *(Nota: Gravar uma imagem do sistema operacional só é necessário se você estiver recuperando um sistema corrompido ou realizando uma redefinição completa de fábrica).*

2. **Configuração da Conexão de Rede**:
   > [!IMPORTANT]
   > **Acesso à Internet Necessário Apenas Durante a Configuração Inicial**: Uma conexão de rede com acesso à internet é estritamente necessária durante esta configuração inicial para atualizar pacotes e baixar pré-requisitos. Uma vez concluída a configuração, o Race Coordinator AI funciona 100% localmente e offline, sem exigir conexão com a internet. No entanto, manter a placa conectada à sua rede local oferece grandes benefícios contínuos:
   > - **Atualizações Automáticas de Software**: Baixe e instale facilmente novas versões do Race Coordinator AI e atualizações de firmware diretamente pela interface web.
   > - **Acesso de Clientes Remotos**: Diretores de prova, pilotos e espectadores podem conectar seus smartphones, tablets ou laptops diretamente à interface web da placa (`http://<hostname>:7070` ou `http://<ENDEREÇO_IP>:7070`) pela sua rede local.

   * **Configuração de Wi-Fi pelo Assistente na Tela**: Na primeira inicialização, o assistente de configuração solicitará a configuração da rede sem fio. Selecione sua rede Wi-Fi e insira a senha.
   * **Alternativa: Configurar o Wi-Fi via Linha de Comando**: Se você não configurou o Wi-Fi pelo assistente ou precisa configurá-lo manualmente no terminal:
     ```bash
     # Listar redes sem fio disponíveis:
     nmcli dev wifi list

     # Conectar-se à sua rede Wi-Fi:
     sudo nmcli dev wifi connect "Seu_SSID" password "Sua_Senha"
     ```
   * **Alternativa: Ethernet Cabeada**: Basta conectar um cabo Ethernet à placa (ou um adaptador Ethernet USB-C). O adaptador de rede é configurado automaticamente via DHCP.
   * **Nota sobre a Primeira Conexão**: A conexão Wi-Fi pode não entrar em vigor imediatamente após a primeira inserção, ou comandos manuais `nmcli` podem apresentar erros temporários na primeira inicialização. Se isso ocorrer, basta executar `sudo reboot`. Após reiniciar, o adaptador de rede sem fio inicializa-se corretamente e conecta-se automaticamente à sua rede Wi-Fi configurada.
   * **Aplicar Atualizações da Placa e do Firmware**: Ao reiniciar (ou quando solicitado pelo sistema), pode ser perguntado se você deseja atualizar vários pacotes e componentes de firmware na placa. É altamente recomendável aceitar e executar todas as atualizações sugeridas, pois o firmware de fábrica geralmente está desatualizado. Observe que essa atualização inicial pode levar algum tempo (geralmente de 5 a mais de 10 minutos, dependendo da velocidade da rede e do tamanho dos pacotes); permita que ela seja concluída sem interrupções.

3. **Habilitar SSH na Placa e Conectar (Recomendado)**:
   * Configurar a placa é mais fácil via SSH a partir do seu computador, pois você pode copiar e colar os comandos de instalação diretamente.
   * **Habilitar o Serviço SSH**: Por padrão, o servidor SSH não está em execução na placa. A partir do terminal local (usando o teclado e a tela conectados à placa), habilite e inicie o serviço SSH:
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Descobrir o Nome de Host e o Endereço IP**: Execute `hostname` e `hostname -I` na placa para descobrir o nome de host atribuído e o endereço IP local da sua placa (a configuração de fábrica geralmente atribui um nome exclusivo como `allianora` em vez de `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Nota: o `avahi-daemon` não vem pré-instalado no Arduino Linux OS, portanto, nomes de domínio mDNS `.local` como `uno-q.local` não existem por padrão, a menos que você instale o pacote via `sudo apt-get install -y avahi-daemon`).*
   * **Conectar a partir do seu PC**:
     * **macOS**: Abra o aplicativo integrado **Terminal** ou **iTerm2** ([iterm2.com](https://iterm2.com/)) e conecte-se via linha de comando:
       ```bash
       ssh arduino@<hostname>
       # Ou conecte-se diretamente via IP:
       ssh arduino@<ENDEREÇO_IP>
       ```
     * **Windows**: Você pode usar o PowerShell ou o Prompt de Comando integrados (executando `ssh arduino@<hostname>` ou `ssh arduino@<ENDEREÇO_IP>`) ou usar um cliente SSH gráfico como o **PuTTY** (baixe em [putty.org](https://www.putty.org/)). Ao usar o PuTTY:
       1. Insira o nome de host ou endereço IP da placa no campo **Host Name (or IP address)**.
       2. Certifique-se de que a porta seja `22` e o tipo de conexão seja **SSH**.
       3. Clique em **Open**, aceite o aviso de chave de host na primeira conexão e faça login como usuário `arduino` com sua senha.

### Passo 2: Instalar Pré-requisitos
Instale o ambiente de execução Java (`default-jre-headless`), os utilitários de áudio (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium` e o gerenciador de janelas (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Nota: No Debian, o pacote do navegador se chama `chromium` em vez de `chromium-browser`, e `default-jre-headless` fornece o runtime OpenJDK padrão. O utilitário `wmctrl` é usado pelo serviço quiosque para garantir que o Race Coordinator AI mantenha o foco da janela frente a aplicativos iniciados com a área de trabalho, como o Arduino App Lab).*

Verifique se o `arduino-cli` está instalado:
```bash
arduino-cli version
```
*(Se o `arduino-cli` não estiver pré-instalado em sua placa, instale-o através de: `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Passo 3: Instalar o Pacote do Aplicativo e Serviços Systemd
Transfira `RaceCoordinatorAI-Linux-ARM64.tar.gz` do seu computador para a placa:
```bash
# A partir do terminal do seu laptop:
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Escolha um dos seguintes métodos de instalação:

#### Opção A: Instalação Automatizada Pronta para Uso (Recomendado)
O instalador automatizado gerencia a verificação de pré-requisitos, configuração de diretórios, permissões seriais, registro de serviços systemd, envio do firmware do microcontrolador e inicialização imediata com tratamento de erros:
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
# Ou para saída detalhada:
# sudo ./install.sh -v
```
*(Nota: Avisos como `tar: Ignoring unknown extended header...` são marcas de metadados inofensivas do macOS e podem ser ignoradas com segurança).*

> [!NOTE] Download e Duração do Núcleo Zephyr (~5 a 10+ Minutos)
> Durante a configuração inicial, o `arduino-cli` baixa e descompacta o **núcleo da placa Zephyr (`arduino:zephyr`)** para a MCU integrada STM32U5 Cortex-M33. Esse pacote contém todo o sistema operacional em tempo real Zephyr, a cadeia de ferramentas de compilação cruzada ARM e as bibliotecas de hardware (~500 MB+ de download e dezenas de milhares de arquivos).
>
> - **Tempo estimado**: **5 a 10+ minutos** dependendo da sua conexão com a Internet e da velocidade de gravação da memória flash eMMC. **Hora ideal para tomar um café!**
> - **Progresso no console**: O progresso de download e extração é exibido diretamente no terminal. Se desejar uma saída mais detalhada durante a compilação e descompactação, execute `sudo ./install.sh -v`.
> - **Verificação do progresso através de um segundo console / SSH**: Se estiver em dúvida se a instalação travou, abra uma segunda sessão SSH (ou outra aba de terminal no Uno Q) e execute:
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   Você verá que o `arduino-cli` está utilizando CPU e E/S ativamente enquanto baixa e extrai os pacotes. Você também pode acompanhar os arquivos temporários sendo preenchidos:
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

#### Opção B: Instalação Manual Passo a Passo (Alternativa)
Se preferir o controle manual ou precisar personalizar sua configuração:
1. **Extrair os arquivos do aplicativo para `/opt/racecoordinatorai`**:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Configurar permissões e acesso ao grupo serial**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout,audio arduino
   ```

3. **Instalar e registrar serviços systemd**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

#### Atualizar Manualmente uma Instalação Existente (A Partir do Arquivo Baixado)
Quando você baixar uma atualização de versão (como `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` salva em `~/Downloads/` através da caixa de diálogo do navegador ou transferida manualmente), você poderá aplicar a atualização usando qualquer um dos seguintes métodos:

##### Método 1: Script Auxiliar de Atualização Integrado (Mais Rápido e Recomendado)
O Race Coordinator AI inclui um script de atualização automatizado no local que extrai a versão sobre `/opt/racecoordinatorai`, recompila e envia o firmware do microcontrolador caso tenha sido atualizado, e reinicia os serviços:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```

##### Método 2: Extrair e Executar `install.sh` do Pacote Baixado
```bash
# Extrair o arquivo baixado
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Executar o instalador sobre a instalação existente (preserva o banco de dados e as configurações)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Método 3: Extração Manual Direta dos Arquivos
Se preferir realizar cada etapa manualmente:
1. **Interromper os serviços ativos**:
   ```bash
   sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
   ```
2. **Extrair os arquivos atualizados sobre `/opt/racecoordinatorai`**:
   ```bash
   sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```
3. **Garantir as permissões corretas**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
4. **Regravar o firmware do microcontrolador (caso o sketch tenha sido atualizado)**:
   ```bash
   cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
   arduino-cli compile --fqbn arduino:zephyr:unoq .
   arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
   ```
5. **Reiniciar os serviços**:
   ```bash
   sudo systemctl restart racecoordinatorai
   sudo systemctl restart racecoordinatorai-kiosk
   ```

### Passo 4: Gravar o Firmware do Microcontrolador
Compile e envie o sketch de hardware para a MCU integrada:
```bash
# Verificar placas e portas detectadas
arduino-cli board list

# Instalar o core da placa Zephyr no arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Instalar as bibliotecas Arduino necessárias (bridge de roteador Uno Q)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

# Compilar racecoordinatorai_sketch para a MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Enviar para a MCU integrada através da ponte de rede interna
# (Digite a senha da placa 'arduino' quando solicitado, ou passe --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Nota: Como verificado via `arduino-cli board list`, o microcontrolador Uno Q executa o Zephyr OS sobre a ponte de rede interna `172.17.0.1` com FQBN `arduino:zephyr:unoq`. A biblioteca `Arduino_RouterBridge` é necessária para a comunicação serial através da ponte SoC. Note que a execução de `arduino-cli core install arduino:zephyr` baixa ~500 MB+ e leva de 5 a 10+ minutos para ser descompactada no armazenamento eMMC (aproveite para tomar um café enquanto descompacta; você pode verificar o progresso com `top -p $(pgrep arduino-cli)` em um segundo terminal). As fitas de LED FastLED não são suportadas atualmente na arquitetura STM32U5 / Zephyr Cortex-M33 devido a definições de registradores do CMSIS 6, mas todos os recursos essenciais da pista—sensores de volta, tempos de setor, botões de chamada e relés de pista—estão totalmente operacionais).*

### Passo 5: Iniciar Serviços e Iniciar Exibição Quiosque
Inicie o daemon backend e ative o quiosque de TV em tela cheia:
```bash
# Iniciar o servidor backend
sudo systemctl start racecoordinatorai

# Você já ativou o daemon backend anteriormente.
# Agora ative o serviço quiosque de TV para inicialização gráfica:
sudo systemctl enable racecoordinatorai-kiosk.service

# Iniciar a exibição quiosque de TV em tela cheia imediatamente
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Foco de Janela e Aplicativos de Inicialização Automática da Área de Trabalho (ex. Arduino App Lab)

No Arduino Uno Q, o Arduino Linux OS inicia o «Arduino App Lab» ao fazer login na área de trabalho.
- **Retenção Automática de Foco**: Por padrão, o `start_kiosk.sh` utiliza o `wmctrl` para trazer automaticamente o Race Coordinator AI para o primeiro plano e reter o foco, garantindo que a tela da TV esteja imediatamente pronta para corridas sem a necessidade de alternar janelas com mouse ou teclado.
- **Opcional: Desativar App Lab na Inicialização**: Para um quiosque de pista dedicado onde o Arduino App Lab não é necessário na inicialização, você pode desativar sua entrada de inicialização automática:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
  ```

---

## Suporte a FastLED e LEDs RGB (Não suportado no Uno Q)

> [!WARNING] Fitas LED RGB endereçáveis FastLED não suportadas na MCU do Uno Q
> Fitas de iluminação LED RGB endereçáveis (WS2812B, NeoPixel, SK6812, APA102, etc.) acionadas via **FastLED não são suportadas no microcontrolador integrado do Arduino Uno Q**. A MCU em tempo real do Uno Q utiliza uma arquitetura STM32U585 sob o Zephyr OS (CMSIS 6), a qual não possui suporte de baixo nível para registradores e temporização bit-banging na biblioteca FastLED upstream. Consequentemente, o sketch do Race Coordinator AI (`racecoordinatorai_sketch.ino`) desativa explicitamente o FastLED (`WITH_FAST_LED`) ao compilar para a MCU do Uno Q.

### Alternativas de iluminação disponíveis

Se desejar indicadores visuais de iluminação em uma instalação com o Arduino Uno Q, tem duas opções:

1. **LEDs de saída digital padrão**: LEDs de cor única (por exemplo, LEDs padrão vermelhos, amarelos ou verdes acionados por pinos de saída digital com resistores limitadores de corrente, transistores ou relés) continuam a poder ser configurados na MCU do Uno Q no Race Coordinator AI como indicadores normais de chamada ou de estado da pista.
2. **Arduino secundário dedicado para LEDs RGB FastLED (Recomendado para fitas RGB)**: Se realmente deseja fitas de LED RGB endereçáveis para semáforos de largada com contagem regressiva em vários estágios, gráficos de barras de abastecimento nas boxes e animações de vitória com bandeira quadriculada, você pode conectar um **segundo Arduino** dedicado exclusivamente ao controle dos LEDs RGB.

> [!TIP] Usando um segundo Arduino para LEDs RGB FastLED
> A **arquitetura multi-interface** do Race Coordinator AI suporta totalmente a conexão e operação simultânea de múltiplos controladores de hardware na mesma pista:
> 
> - **Interface Principal (MCU integrada do Uno Q)**: Gerencia os sinais críticos da corrida—sensores ópticos de contagem de voltas, tempos de setor, botões de chamada dos pilotos e relés principais de energia da pista—com precisão submilisegundo.
> - **Interface Secundária (Segundo Arduino via USB)**: Conecte uma placa Arduino padrão econômica (como um **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040** ou **ESP32**) a uma das portas host USB do Uno Q. Grave o sketch padrão `racecoordinatorai_sketch.ino` (onde o FastLED está habilitado) nesta segunda placa.
> - **Configuração no Editor de Pistas**: Na interface web do Race Coordinator AI, navegue até **Editor de Pistas** $\rightarrow$ **Interfaces de Hardware** e clique em **Adicionar Interface** para adicionar a porta serial do segundo Arduino (por exemplo, `/dev/ttyUSB0` ou `/dev/ttyACM0`). Configure as suas fitas de luzes FastLED nesta segunda interface. O Race Coordinator AI orquestra automaticamente ambas as placas de forma simultânea durante as corridas.

---

## Resolução de Problemas de Conversão de Texto em Fala (TTS) e Áudio

O Race Coordinator AI utiliza a Web Speech API do navegador (`window.speechSynthesis`) para anunciar tempos de volta, eventos de corrida e comentários dos pilotos. Ao contrário do Windows ou macOS, o Linux (Debian 12 no Uno Q) não possui um sintetizador de voz integrado, de modo que o Chromium depende do **Speech Dispatcher** e do **eSpeak NG**.

### Pacotes Necessários
O instalador automatizado (`install.sh`) instala estes pacotes automaticamente. Se você realizou uma instalação manual ou o TTS não emite som, certifique-se de que os pacotes de fala e áudio necessários estejam instalados:
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Parâmetros do Navegador no Modo Quiosque e Navegação com Várias Abas
No modo quiosque, o Chromium é iniciado via `/opt/racecoordinatorai/scripts/start_kiosk.sh`. O Race Coordinator AI utiliza `--start-maximized` (em vez do modo restritivo `--kiosk`) para garantir que abas secundárias —como Resultados de bateria, Resultados da corrida, visualizações de temas e a Central de Ajuda offline— permaneçam visíveis e acessíveis através da barra de abas no topo da tela da TV. O Chromium também requer parâmetros específicos para habilitar o Speech Dispatcher e a reprodução automática de áudio. Certifique-se de que o seu script `start_kiosk.sh` inclua:
```bash
  --start-maximized \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(Se você editar o `start_kiosk.sh` manualmente, reinicie o serviço do quiosque em seguida: `sudo systemctl restart racecoordinatorai-kiosk`).*

### Passos de Resolução de Problemas
1. **Verificar o Modo de Operação e a Saída de Áudio**:
   - **Modo de Tela Quiosque**: O áudio é reproduzido diretamente do Uno Q através da conexão USB-C DisplayPort/HDMI para a sua TV/monitor ou caixas de som USB conectadas.
   - **Cliente de Rede Remoto**: Se estiver visualizando o Race Coordinator AI a partir de um laptop, tablet ou celular na rede local (`http://<hostname>:7070`), o áudio e o TTS serão reproduzidos através do **navegador e das caixas de som desse dispositivo**, não pela placa Uno Q.
2. **Verificar a Saída de Áudio do Hardware**:
   Execute um teste de som no terminal do Uno Q para confirmar que a saída de áudio está ativa e não silenciada:
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   Se não ouvir som, execute o `alsamixer` no terminal para verificar se os controles deslizantes de volume Master/PCM/HDMI não estão silenciados (`[MM]`, pressione `M` para alternar) e se estão em um nível adequado.
3. **Testar os Sintetizadores de Fala na Linha de Comando**:
   Verifique se o eSpeak NG e o Speech Dispatcher funcionam no nível do sistema operacional:
   ```bash
   # Testar a síntese pura
   espeak-ng "Testing speech synthesis"

   # Testar o Speech Dispatcher (o backend do Chromium)
   spd-say "Testing speech dispatcher"
   ```
   Se o `spd-say` retornar erro ou travar, reinicie o daemon: `pkill -f speech-dispatcher && spd-say "Hello"`.
4. **Testar na Interface Web**:
   Na interface web do Race Coordinator AI, abra **Personalizar interface** (ou **Editor de temas** $\rightarrow$ **Configurações de áudio**). Verifique o menu suspenso **Voz de TTS**: as vozes disponíveis devem ser exibidas. Clique em **Testar voz TTS** para confirmar a reprodução.

---

## Atualizações Automáticas de Software

Quando conectado ao Wi-Fi, o Race Coordinator AI verifica automaticamente as versões do GitHub:
1. **Atualização do Aplicativo**: Baixa o novo pacote Linux ARM64 em segundo plano.
2. **Reinício do Serviço**: Reinicia o `racecoordinatorai.service` via systemd de forma transparente.
3. **Sincronização do Sketch da MCU**: Grava novamente o firmware do microcontrolador STM32 automaticamente usando o `arduino-cli` se o `racecoordinatorai_sketch.ino` tiver sido atualizado.

> [!TIP]
> Se você baixou um arquivo de versão `.tar.gz` pelo link **Baixar atualização** no navegador, consulte [Atualizar Manualmente uma Instalação Existente](#atualizar-manualmente-uma-instalacao-existente-a-partir-do-arquivo-baixado) acima para aplicar a atualização.

