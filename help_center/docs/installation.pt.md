# Guia de Instalação

Este guia orienta você no download, instalação e configuração do Race Coordinator AI no seu computador.

---

## Sistemas Operacionais Suportados

O Race Coordinator AI é totalmente multiplataforma e pode ser executado em sistemas operacionais modernos e legados:

| Plataforma | Versões Suportadas | Instalador Recomendado |
| :--- | :--- | :--- |
| **🪟 Windows (Moderno)** | Windows 10, Windows 11 (64 bits e 32 bits) | **Instalador Online** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Legado)** | Windows 8, Windows 7, Windows XP | **Instalador Offline Completo** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Necessário para instalação inicial no Win 8 e anteriores)* |
| **🍏 macOS** | macOS 10.15 (Catalina) até macOS 15+ (Intel e Apple Silicon) | **Imagem de Disco** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64 bits), Arduino Linux OS, Debian, Ubuntu | **Pacote ARM64 / Linux** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Escolhendo seu Canal de Lançamento

O Race Coordinator AI é distribuído em três canais:

* **🟢 Versões Estáveis Oficiais** *(Recomendado)*: Versões totalmente testadas e prontas para uso, recomendadas para corridas regulares, pistas domésticas e clubes.
* **🟡 Versões Beta**: Lançamentos prévios que incluem novos recursos, novos drivers e aprimoramentos experimentais para testes pela comunidade.
* **🔵 Compilações Alpha / Nightly**: Versões automáticas diárias do desenvolvimento ativo.

👉 Visite o **[Portal de Downloads e Lançamentos](downloads.pt.md)** para baixar qualquer versão ou consultar o histórico de versões.

---

## 🪟 Instalação no Windows

### 1. Baixar o Instalador
* Para **Windows 10 / 11**: Baixe `RaceCoordinatorAI_Online_Setup_*.exe`.
* Para **Windows 8 e versões anteriores** (ou computadores sem internet ativa): Baixe `RaceCoordinatorAI_Offline_Setup_*.exe`.

### 2. Executar o Instalador
1. Dê um duplo clique no arquivo `.exe` baixado.
2. Se o Windows SmartScreen exibir a mensagem *"O Windows protegeu o seu computador"*, clique em **Mais informações** e depois em **Executar mesmo assim**.
3. Siga o assistente de instalação Inno Setup para escolher a pasta de instalação (padrão: `C:\Program Files\RaceCoordinator AI`).
4. Escolha se deseja criar um atalho na Área de Trabalho.
5. Clique em **Instalar** para concluir.

### 3. Iniciar o Aplicativo
Dê um duplo clique no atalho do **Race Coordinator AI** na Área de Trabalho ou abra-o a partir do Menu Iniciar do Windows.

!!! note "Pré-requisitos para Windows Legado (XP / 7 / 8)"
    No Windows 7, 8 ou XP, certifique-se de que o pacote redistribuível [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784) esteja instalado.

---

## 🍏 Instalação no macOS

### 1. Baixar a Imagem de Disco
Baixe `RaceCoordinator_Mac_*.dmg` na página de lançamentos.

### 2. Instalar na Pasta Aplicativos
1. Dê um duplo clique no arquivo `RaceCoordinator_Mac_*.dmg` baixado para montar a imagem de disco.
2. Arraste o ícone do **Race Coordinator AI** para a sua pasta **Aplicativos** (Applications).
3. Ejete a imagem de disco.

### 3. Primeira Inicialização e Segurança do macOS
1. Abra a pasta **Aplicativos** e dê um duplo clique no **Race Coordinator AI**.
2. Se o macOS exibir uma mensagem informando que o aplicativo não pode ser aberto porque provém de um desenvolvedor não identificado:
   - Abra **Ajustes do Sistema** → **Privacidade e Segurança**.
   - Role até a seção **Segurança** e clique em **Abrir Mesmo Assim** ao lado do Race Coordinator AI.
   - Como alternativa, mantenha a tecla `Control` pressionada enquanto clica no ícone do app em Aplicativos e escolha **Abrir**.

---

## 🐧 Instalação no Linux, Raspberry Pi e Arduino Uno Q

Para dispositivos de hardware dedicados com serviços de sistema no systemd, modo tela quiosque e interfaces de pista, consulte nossos guias específicos:

* **[Guia de Configuração no Arduino UNO Q](arduino-uno-q.pt.md)**: Configuração completa para o aparelho dual-core Arduino Uno Q com microcontrolador STM32 em tempo real integrado.
* **[Guia de Configuração no Raspberry Pi (Experimental)](raspberry-pi.pt.md)**: Guia para Raspberry Pi 4 / 5 em arquitetura de duas placas combinada com um microcontrolador USB Arduino externo.

### 1. Baixar o Pacote Linux
Baixe `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` na página de downloads.

### 2. Descompactar e Executar
1. Abra um terminal e descompacte o arquivo na pasta de sua preferência:
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Certifique-se de que o inicializador possui permissão de execução:
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Execute o aplicativo:
   ```bash
   ./RaceCoordinatorAI
   ```

---

## Primeira Inicialização e Primeiros Passos

Ao iniciar o Race Coordinator AI pela primeira vez:

1. **Banco de Dados Padrão**: O aplicativo cria automaticamente um banco de dados SQLite embutido (`racecoordinator.db`) com pilotos e equipes de exemplo, uma pista padrão de 4 frestas e formatos clássicos de corrida (Todos contra todos, Treino livre).
2. **Modo Demonstração por Teclado**: Você pode testar e explorar os modos de corrida imediatamente simulando passagens pelo teclado sem conectar hardware físico.
3. **Configurar Sensores de Pista**: Acesse **Gerenciador de Pistas** → **Editar Pista** para configurar o hardware da sua interface (Arduino Uno / Uno Q, Phidget, Trak-Mate ou cronometragem via webcam).

---

## Atualizando Instalações Existentes

A atualização para uma versão mais recente do Race Coordinator AI é totalmente transparente:

* **Seus Dados Ficam Salvos**: O seu banco de dados (`racecoordinator.db`), estatísticas de corrida, perfis de pilotos, pistas e temas personalizados ficam armazenados na pasta do usuário e **não** são sobrescritos durante atualizações.
* **Para Atualizar no Windows**: Basta executar o novo instalador sobre a instalação existente ou clicar em **Instalar Agora** no banner de atualização dentro do próprio app.
* **Para Atualizar no Linux / Arduino Uno Q / Raspberry Pi**: Execute `sudo /opt/racecoordinatorai/scripts/update_app.sh /caminho/para/RaceCoordinatorAI-Linux-ARM64*.tar.gz` ou descompacte o arquivo e execute `sudo ./install.sh`. Consulte o [Guia do Arduino UNO Q](arduino-uno-q.pt.md#atualizando-uma-instalação-existente) ou o [Guia do Raspberry Pi](raspberry-pi.pt.md#atualizando-uma-instalação-existente) para obter o passo a passo.

---

## Relatando Problemas e Sugestões

Se encontrar algum problema durante a instalação ou quiser sugerir um novo recurso:

1. Visite nosso **[Portal de Problemas no GitHub](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Pesquise nos tópicos existentes para verificar se já existe uma solução ou orientação.
3. Clique em **New Issue** e informe:
   * Sistema operacional e versão.
   * Versão do Race Coordinator AI (ex: `v1.0.0` ou `v1.0.0-beta.1`).
   * Passos para reproduzir o problema e capturas de tela/logs, se aplicável.
