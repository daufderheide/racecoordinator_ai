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
2. **Modo de Dispositivo Sem Cabeça (Atualmente não suportado - Disponível mediante solicitação)**: A placa executa apenas o servidor backend e se conecta ao hardware da pista, sem nenhum monitor ou navegador local em execução. Os usuários acessam a interface web através da rede local (`http://uno-q.local:7070`). Conforme observado acima, o modo headless no Uno Q não é suportado por padrão, mas pode ser adicionado mediante solicitação se o Uno Q tiver uma conexão de rede.

---

## Instalação Passo a Passo

### Passo 1: Preparar a Placa e Conectar via SSH
1. Instale o **Arduino Linux OS** (Debian 12 arm64) no Uno Q.
2. Conecte a placa à sua rede local via Wi-Fi ou Ethernet.
3. Abra uma sessão SSH:
   ```bash
   ssh arduino@uno-q.local
   ```

### Passo 2: Instalar Pré-requisitos
Instale o OpenJDK 11, `arduino-cli`, utilitários de exibição e Chromium:
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Passo 3: Gravar o Firmware do Microcontrolador (com Suporte a FastLED)
Compile e envie o sketch de hardware para a MCU STM32 integrada:
```bash
# Instalar o core da placa STM32 no arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:stm32

# Compilar e enviar racecoordinatorai_sketch
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Passo 4: Instalar o Pacote do Aplicativo e Serviços Systemd
1. Baixe `RaceCoordinatorAI-Linux-ARM64.tar.gz` e descompacte em `/opt/racecoordinatorai`:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Execute o script do instalador:
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Inicie os serviços:
   ```bash
   # Iniciar o servidor backend
   sudo systemctl start racecoordinatorai

   # (Opcional) Habilitar o quiosque de tela local no USB-C DisplayPort
   sudo systemctl enable --now racecoordinatorai-kiosk
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
