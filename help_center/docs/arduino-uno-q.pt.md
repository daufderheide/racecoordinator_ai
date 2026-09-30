# Guia de Configuração do Arduino UNO Q

Este guia explica como configurar o **Race Coordinator AI (RC AI)** na placa de desenvolvimento híbrida **Arduino UNO Q** como um dispositivo de hardware independente.

---

## Visão Geral do Hardware e Variantes de Memória

O **Arduino UNO Q** combina um Computador de Placa Única (SBC) Linux de 64 bits com um microcontrolador em tempo real em uma única placa:

- **MPU Linux (Qualcomm Cortex-A53 @ 2,0 GHz)**: Executa o servidor Race Coordinator AI, banco de dados SQLite, servidor de cliente web e atualizador automático.
- **MCU em Tempo Real (STM32U585 Cortex-M33 @ 160 MHz)**: Gerencia interrupções de pinos de sensores de volta, relés de energia e pontes de luz RGB FastLED com precisão submilisegundo.
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

### Passo 1: Preparar a Placa e Conectar via SSH
1. Instale o **Arduino Linux OS** (Debian 12 arm64) no Uno Q.
2. Conecte a placa à sua rede local via Wi-Fi ou Ethernet:
   * **Configuração de Wi-Fi na primeira inicialização**: Na inicialização inicial, o assistente de configuração solicitará a configuração da rede sem fio.
   * **Nota sobre a primeira conexão**: A conexão Wi-Fi pode não entrar em vigor imediatamente após a primeira inserção, e comandos manuais de terminal como `sudo nmcli dev wifi connect "Seu_SSID" password "Sua_Senha"` também podem falhar na primeira inicialização. Se isso ocorrer, basta executar `sudo reboot`. Após reiniciar, o adaptador de rede sem fio se inicializa corretamente e se conecta automaticamente à sua rede Wi-Fi configurada.
   * **Aplicar atualizações da placa e do firmware**: Ao reiniciar (ou quando solicitado pelo sistema), pode ser perguntado se você deseja atualizar vários pacotes e componentes de firmware na placa. É altamente recomendável aceitar e executar todas as atualizações sugeridas, pois o firmware de fábrica geralmente está desatualizado. Observe que essa atualização inicial pode levar algum tempo (geralmente de 5 a mais de 10 minutos, dependendo da velocidade da rede e do tamanho dos pacotes); permita que ela seja concluída sem interrupções.
3. Habilitar SSH na placa e conectar:
   * **Habilitar o serviço SSH**: Por padrão, o servidor SSH não está em execução na placa. A partir do terminal local (usando o teclado e a tela conectados à placa), habilite e inicie o serviço SSH:
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Descobrir o nome de host e o endereço IP**: Execute `hostname` e `hostname -I` na placa para descobrir o nome de host atribuído e o endereço IP local da sua placa (a configuração de fábrica geralmente atribui um nome exclusivo como `allianora` em vez de `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Nota: o `avahi-daemon` não vem pré-instalado no Arduino Linux OS, portanto, nomes de domínio mDNS `.local` como `uno-q.local` não existem por padrão, a menos que você instale o pacote via `sudo apt-get install -y avahi-daemon`).*
   * **Conectar a partir do seu PC**: Abra um terminal no seu computador e conecte-se usando o nome de host ou endereço IP da placa:
     ```bash
     ssh arduino@<hostname>
     # Ou conecte-se diretamente via IP:
     ssh arduino@<ENDEREÇO_IP>
     ```

### Passo 2: Instalar Pré-requisitos
Instale o ambiente de execução Java (`default-jre-headless`), os utilitários de áudio (`espeak-ng`, `alsa-utils`), `chromium` e o gerenciador de janelas (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng alsa-utils git curl unzip chromium wmctrl
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
```
*(Nota: Avisos como `tar: Ignoring unknown extended header...` são marcas de metadados inofensivas do macOS e podem ser ignoradas com segurança).*

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
   sudo usermod -a -G dialout arduino
   ```

3. **Instalar e registrar serviços systemd**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Passo 4: Gravar o Firmware do Microcontrolador (com Suporte a FastLED)
Compile e envie o sketch de hardware para a MCU integrada:
```bash
# Verificar placas e portas detectadas
arduino-cli board list

# Instalar o core da placa Zephyr no arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Instalar as bibliotecas Arduino necessárias (bridge de roteador Uno Q e FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# Compilar racecoordinatorai_sketch para a MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Enviar para a MCU integrada através da ponte de rede interna
# (Digite a senha da placa 'arduino' quando solicitado, ou passe --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Nota: Como verificado via `arduino-cli board list`, o microcontrolador Uno Q executa o Zephyr OS sobre a ponte de rede interna `172.17.0.1` com FQBN `arduino:zephyr:unoq`. A biblioteca `Arduino_RouterBridge` é necessária para a comunicação serial através da ponte SoC. As fitas de LED FastLED não são suportadas atualmente na arquitetura STM32U5 / Zephyr Cortex-M33 devido a definições de registradores do CMSIS 6, mas todos os recursos essenciais da pista—sensores de volta, tempos de setor, botões de chamada e relés de pista—estão totalmente operacionais).*

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

## Configuração da Ponte de Luzes RGB FastLED

O FastLED é totalmente suportado no Uno Q. Fitas de LED RGB endereçáveis (WS2812B, NeoPixel, SK6812, APA102) conectam-se diretamente aos pinos de cabeçalho GPIO na MCU STM32.

- **Luzes de Largada**: Animação de contagem regressiva em 5 etapas (vermelho $\rightarrow$ amarelo $\rightarrow$ verde).
- **Pit Lane / Reabastecimento**: Indicador de porcentagem de nível de combustível em tempo real por pista.
- **Líder e Vitória**: Pulso dinâmico para o líder da bateria e animação de bandeira quadriculada.

---

## Atualizações Automáticas de Software

Quando conectado ao Wi-Fi, o Race Coordinator AI verifica automaticamente as versões do GitHub:
1. **Atualização do Aplicativo**: Baixa o novo pacote Linux ARM64 em segundo plano.
2. **Reinício do Serviço**: Reinicia o `racecoordinatorai.service` via systemd de forma transparente.
3. **Sincronização do Sketch da MCU**: Grava novamente o firmware do microcontrolador STM32 automaticamente usando o `arduino-cli` se o `racecoordinatorai_sketch.ino` tiver sido atualizado.
