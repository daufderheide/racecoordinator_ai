# Guia de Configuração no Raspberry Pi (Experimental)

Este guia explica como configurar o **Race Coordinator AI (RC AI)** em um computador de placa única **Raspberry Pi** utilizando uma arquitetura de duas placas.

---

> [!NOTE] Configuração de Hardware Experimental
> Embora o aplicativo principal Linux ARM64 do Race Coordinator AI seja executado de forma nativa e estável no Raspberry Pi OS de 64 bits, a execução no Raspberry Pi é classificada como **experimental**. Ao contrário da arquitetura integrada dual-core do Arduino Uno Q (que combina uma MPU de aplicativo e um microcontrolador STM32 em tempo real em uma única placa de circuito), a configuração no Raspberry Pi requer um **microcontrolador USB externo** (como um Arduino Uno, Nano, Mega ou RP2040) para controlar os sensores de pista e relés de energia.

---

## Arquitetura: Por que usar duas placas?

Para compreender por que o Race Coordinator AI utiliza duas placas no Raspberry Pi, é importante diferenciar computação de uso geral de temporização determinística em tempo real:

```
┌────────────────────────────────────────────────────────┐
│          Raspberry Pi 4 / 5 (Computador Host)          │
│                                                        │
│  - Raspberry Pi OS de 64 bits (Debian Linux)           │
│  - Runtime Servidor Java 21 e Banco de Dados SQLite    │
│  - Servidor de Aplicação Web (Porta 7070)              │
│  - Tela Quiosque Chromium em Tela Cheia (HDMI para TV) │
└───────────────────────────┬────────────────────────────┘
                            │ Conexão Serial USB
                            │ (/dev/ttyACM0 ou /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      Microcontrolador Externo (Arduino Uno / Nano)     │
│                                                        │
│  - Firmware em Tempo Real (racecoordinatorai_sketch)   │
│  - Tratamento de Interrupções com Precisão de µs       │
│  - Entradas Tolerantes a 5V (Fototransistores / IR)    │
│  - Controle de Relés de Energia da Pista e Botões Caos │
└────────────────────────────────────────────────────────┘
```

### Por que não utilizar diretamente os pinos GPIO do Raspberry Pi?

1. **Jitter de Agendamento do Kernel Linux**:
   O Raspberry Pi OS é um sistema operacional multitarefa preemptivo de uso geral. O kernel Linux alterna continuamente o tempo de CPU entre tarefas do sistema, E/S de rede, serviços em segundo plano e renderização gráfica. Isso introduz uma latência não determinística ("jitter") que varia tipicamente entre **5 e 30 milissegundos**. No automodelismo de fenda (autorama / slot car), um carro leve cruzando um sensor óptico ou dead strip em alta velocidade gera um pulso elétrico com duração de apenas **1 a 5 milissegundos**. Depender do monitoramento direto das GPIOs ou de interrupções no espaço de usuário do Linux causa perda de voltas e cronometragens imprecisas no nível de centésimos de segundo.
2. **Níveis de Tensão e Proteção Contra Transientes**:
   O conector GPIO de 40 pinos do Raspberry Pi opera estritamente com **níveis lógicos de 3,3V** sem proteção interna contra sobretensão. Conectar os fios da pista diretamente ao Pi expõe a placa ao risco de destruição por sensores ópticos de 5V, picos indutivos de bobinas de relé ou força contra-eletromotriz de 12V–18V gerada pelos motores dos carros.
3. **A Solução de Duas Placas**:
   Ao combinar o Raspberry Pi com um microcontrolador USB acessível (como Arduino Uno R3/R4, Nano, Mega 2560 ou Raspberry Pi Pico com firmware Arduino), você obtém o melhor dos dois mundos:
   - O **microcontrolador** executa firmware bare-metal em tempo real com interrupções de hardware na escala de submilissegundos e imunidade elétrica a 5V.
   - O **Raspberry Pi** atua como computador host de alta performance para o servidor Java 21, banco de dados SQLite embutido, rede, síntese de voz e saída de vídeo HDMI.

---

## Requisitos de Hardware e Variantes de Memória

### 1. Computador de Placa Única Raspberry Pi

* **Modelos Suportados**: **Raspberry Pi 4 Modelo B** ou **Raspberry Pi 5** (ARM Cortex-A72 ou Cortex-A76 de 64 bits).
* **Sistema Operacional**: **Raspberry Pi OS (64-bit)** é obrigatório. A versão de 32 bits não é suportada.
* **Armazenamento**: Cartão microSD de alta velocidade de 16 GB ou superior (Classe A1 ou A2 recomendada) ou um SSD USB 3.0.
* **Fonte de Alimentação**: Fonte oficial USB-C da Raspberry Pi (15W para Pi 4, 27W para Pi 5) para evitar limitações de desempenho por subtensão.

### 2 GB versus 4 GB / 8 GB de RAM

| Modelo | Modo Operacional Recomendado | Descrição |
| :--- | :--- | :--- |
| **Raspberry Pi (2 GB RAM)** | **Modo Dispositivo Sem Monitor (Headless)** | Ideal para funcionar puramente como servidor de pista sem monitor conectado. Pilotos e diretores de prova acessam a interface em tablets, iPads, celulares ou notebooks via Wi-Fi/LAN (`http://<pi-ip>:7070`). Desativar o navegador quiosque local libera memória RAM para o servidor Java e o banco de dados. |
| **Raspberry Pi (4 GB ou 8 GB RAM)** | **Modo Tela Quiosque** *(Recomendado)* | Recomendado ao conectar um monitor HDMI ou TV diretamente ao Pi. Executa o ambiente de trabalho completo, o navegador quiosque em tela cheia, Java e o banco de dados simultaneamente com excelente fluidez. |

### 2. Microcontrolador de Temporização Externo

Uma placa externa executando o firmware do Race Coordinator AI:

* **Placas Recomendadas**:
  * **Arduino Uno R3 ou R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (ideal para pistas de 4 ou 6 frestas com muitos sensores)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** com firmware Arduino
* **Cabo USB**: Cabo USB padrão para conectar o microcontrolador a qualquer porta USB do Raspberry Pi.
* **Sensores de Pista e Relés**: Conectados ao microcontrolador conforme detalhado no **[Guia de Configuração de Pistas](track-editor.pt.md)**.

---

## Instalação Passo a Passo

### Passo 1: Instalar o Raspberry Pi OS (64 bits)

1. Baixe e abra o **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** no seu computador PC ou Mac.
2. Selecione o modelo do seu Raspberry Pi (Pi 4 ou Pi 5).
3. Em **Sistema Operacional**, escolha **Raspberry Pi OS (64-bit)** (Debian Bookworm ou Bullseye).
4. Clique em **Editar configurações** (ícone de engrenagem) para pré-configurar:
   * **Nome do host (Hostname)**: Defina um nome identificável (ex: `racecoordinator` ou `slotcar-pi`).
   * **Usuário e Senha**: Crie a conta de usuário (ex: usuário `pi`).
   * **Wi-Fi**: Digite o SSID e a senha da sua rede sem fio.
   * **Serviços**: Marque **Ativar SSH** (com autenticação por senha ou chave pública).
5. Selecione o cartão microSD ou SSD de destino e clique em **Gravar**.

### Passo 2: Gravar o Firmware no Microcontrolador

Antes de conectar o Arduino ao Raspberry Pi:

1. Baixe o pacote de lançamento do Race Coordinator AI no seu computador ou localize `racecoordinatorai_sketch.ino` no arquivo comprimido dentro da pasta `firmware/`.
2. Abra o sketch na **Arduino IDE** no seu computador.
3. Selecione o tipo de placa (ex: *Arduino Uno* ou *Arduino Nano*) e a porta serial.
4. Clique em **Carregar** para compilar e gravar o firmware na placa.
5. Desconecte o microcontrolador do computador e conecte-o a qualquer porta USB do Raspberry Pi. Ele será reconhecido automaticamente como dispositivo serial (normalmente `/dev/ttyACM0` ou `/dev/ttyUSB0`).

### Passo 3: Instalar os Pré-requisitos no Raspberry Pi

Ligue o Raspberry Pi e conecte-se via SSH a partir do terminal do seu computador:

```bash
ssh pi@<hostname>.local
# Ou conecte-se através do endereço IP do Pi:
# ssh pi@192.168.1.xxx
```

Atualize a lista de pacotes e instale Java, utilitários de voz, navegador e o gerenciador de janelas:

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Nota: Em versões recentes do Debian/Raspberry Pi OS Bookworm, o pacote do navegador chama-se `chromium` em vez de `chromium-browser`. Caso `chromium-browser` não seja encontrado, instale `chromium`).*

### Passo 4: Baixar e Executar o Instalador Automatizado

1. Transfira o arquivo de lançamento Linux ARM64 para o seu Raspberry Pi:
   ```bash
   # A partir do terminal do seu PC / Mac:
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(Você também pode baixá-lo diretamente no Pi com `curl` ou `wget` a partir do [Portal de Downloads](downloads.pt.md)).*

2. Descompacte o arquivo e acesse o diretório do instalador:
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Execute o instalador com `sudo`:
   ```bash
   sudo ./install.sh
   ```

#### Detecção Automática de Hardware e Resumo Prévio

O instalador inspeciona `/proc/device-tree/model` e identifica automaticamente a execução em um Raspberry Pi:

- **Resolução de Plataforma**: Define `Hardware Platform: pi`.
- **Conta de Serviço**: Atribui a posse dos arquivos e a execução dos serviços ao usuário chamador (ex: `pi`), configurando os serviços systemd e permissões do grupo serial (`dialout`).
- **Envio de Firmware**: Pula automaticamente a compilação e envio do firmware Zephyr do Arduino Uno Q, já que no Raspberry Pi é utilizado um Arduino USB externo.

Antes de copiar arquivos ou registrar serviços, o instalador exibe o **Resumo da Resolução de Configuração Prévia**:

```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: pi
   Resolution:      Auto-detected (/proc/device-tree/model: Raspberry Pi 4 Model B Rev 1.5)
 Service Account:   pi
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/pi
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      SKIP (External USB microcontroller used on Raspberry Pi)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

#### Opções de Linha de Comando do Instalador

Você pode personalizar a instalação através de argumentos opcionais:

| Argumento | Descrição | Padrão |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Define explicitamente o tipo de placa de destino. | Detectado via `/proc/device-tree/model` (`pi`) |
| `--user=<usuário>` | Conta Linux proprietária de `/opt/racecoordinatorai` e dos serviços. | Detectado via `$SUDO_USER` (padrão `pi` no Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Pula explicitamente a compilação/envio do sketch do microcontrolador. | Pulado automaticamente em `pi` |
| `-v`, `--verbose` | Ativa registros detalhados no terminal. | Saída padrão (`false`) |
| `-h`, `--help` | Exibe o resumo de uso e opções. | - |

---

## Modos Operacionais: Quiosque versus Sem Monitor (Headless)

### 1. Modo Tela Quiosque (Pi de 4 GB / 8 GB)

Por padrão, o instalador habilita dois serviços de sistema no systemd:

1. `racecoordinatorai.service`: O servidor backend Java e o banco de dados SQLite embutido.
2. `racecoordinatorai-kiosk.service`: Uma sessão em tela cheia do Chromium iniciada na saída HDMI principal em `http://localhost:7070`.

Se você tiver uma TV ou monitor conectado à porta HDMI do Pi, o Race Coordinator AI iniciará automaticamente no boot em modo quiosque em tela cheia.

### 2. Modo Dispositivo Sem Monitor (Headless) (Pi de 2 GB ou Servidor Dedicado)

Se estiver utilizando um **Raspberry Pi de 2 GB** ou se o Pi estiver montado sob a pista sem monitor conectado:

```bash
# Interromper e desabilitar permanentemente o navegador quiosque:
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

Com o serviço de quiosque desabilitado:

- O servidor consome pouquíssima memória RAM (~250–350 MB).
- Você pode conectar qualquer dispositivo na mesma rede Wi-Fi ou cabeada abrindo o navegador em:
  ```text
  http://<ip-do-raspberry-pi>:7070
  # Exemplo: http://192.168.1.150:7070 ou http://racecoordinator.local:7070
  ```

---

## Configurando a Interface de Pista no Race Coordinator AI

Com o servidor em execução, configure a conexão serial com o microcontrolador externo:

1. Abra a interface web no seu navegador (`http://localhost:7070` ou `http://<pi-ip>:7070`).
2. Acesse **Gerenciador de Pistas** → **Editar Pista**.
3. Na aba **Interfaces de Hardware**:
   * **Tipo de Interface**: Selecione **Arduino**.
   * **Porta**: Selecione `/dev/ttyACM0` ou `/dev/ttyUSB0` (a porta USB do seu Arduino).
   * **Taxa de Baud**: `115200`.
4. Clique em **Conectar / Testar Interface** para validar a comunicação bidirecional.
5. Mapeie os sensores de fresta, botões de caos e relés de energia nos pinos correspondentes do Arduino.
6. Clique em **Salvar Pista**.

---

## Gerenciamento de Serviços Systemd

Controle os serviços em segundo plano utilizando comandos padrão do `systemctl`:

```bash
# Verificar o status do servidor e visualizar logs em tempo real:
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Reiniciar o aplicativo:
sudo systemctl restart racecoordinatorai.service

# Verificar o status do navegador quiosque (se habilitado):
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Atualizando uma Instalação Existente

A atualização do Race Coordinator AI no Raspberry Pi preserva todos os dados existentes:

* **Preservação de Dados**: O seu banco de dados (`racecoordinator.db`), histórico de corridas, pilotos e temas visuais ficam salvos em `/home/<usuário>/.racecoordinatorai/` e nunca são sobrescritos.
* **Atualizador Automático no Aplicativo**: Quando houver uma nova versão, clique em **Instalar Agora** no banner de notificação. O script `/opt/racecoordinatorai/scripts/update_app.sh` detecta automaticamente o Raspberry Pi e pula o envio do sketch.
* **Atualização Manual**: Baixe o novo arquivo `.tar.gz` e execute:
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
