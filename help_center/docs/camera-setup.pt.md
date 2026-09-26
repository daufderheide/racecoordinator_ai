# Guia de Configuração da Câmera Web Móvel

Este guia explica como configurar um smartphone ou tablet (iOS ou Android) como câmera óptica de cronometragem de voltas de alta velocidade no **Race Coordinator AI (RC AI)**.

---

## Visão Geral

O Race Coordinator AI permite usar qualquer smartphone moderno como ponte de cronometragem óptica. Ao montar o dispositivo diretamente sobre a linha de chegada ou entrada dos boxes da pista, a câmera detecta os carros cruzando cada fenda e transmite os eventos em tempo real para o servidor via WebSockets.

Como esta interface opera diretamente no navegador sem a necessidade de instalar aplicativos nativos, aplicam-se as políticas de segurança dos navegadores.

---

## Por que o acesso à câmera na rede local é restrito

Os navegadores modernos aplicam requisitos rigorosos de segurança para dispositivos multimídia (`navigator.mediaDevices.getUserMedia`).

Para garantir a privacidade do usuário, o acesso à câmera só é permitido em um **Contexto Seguro (Secure Context)**:

1. **Conexões HTTPS criptografadas** (`https://...`).
2. **Endereços de loopback local** (`http://localhost` ou `http://127.0.0.1`).

Quando o seu dispositivo móvel se conecta ao Race Coordinator AI na rede Wi-Fi local através de um endereço IP (por exemplo, `http://192.168.1.150:4200`), o navegador classifica a conexão como uma origem HTTP insegura e bloqueia o acesso à câmera por padrão.

---

## Compatibilidade e Diferenças entre Navegadores

| Sistema Operacional | Navegador | Motor Web | Flag de exceção disponível? | Câmera via HTTP local? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Sim** (`chrome://flags`) | **Sim** (com flag ativada) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Sim** (`edge://flags`, etc.) | **Sim** (com flag ativada) |
| **Android** | Firefox | Gecko | Não | HTTPS obrigatório |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **Não** | HTTPS obrigatório |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **Não** | HTTPS obrigatório |

!!! warning "Nota Importante sobre o Chrome no iOS"
    No Apple iOS, a Apple exige que todos os navegadores web (incluindo Google Chrome, Edge e Firefox) utilizem o motor **WebKit** da Apple internamente.
    
    Portanto, o **iOS Chrome NÃO suporta `chrome://flags`**. Digitar `chrome://flags` no iOS não terá efeito ou abrirá uma pesquisa na web. Dispositivos iOS exigem obrigatoriamente uma conexão HTTPS, independentemente do navegador utilizado.

---

## Configuração Passo a Passo para Android (Google Chrome)

O Google Chrome no Android permite autorizar endereços IP locais específicos como origens seguras por meio de uma flag interna de desenvolvimento.

### Passo 1: Obter o IP e a Porta do Servidor
1. No Race Coordinator AI no seu computador principal, abra o **Editor de Pistas** > **Configuração da Câmera**.
2. Expanda a seção **Emparelhamento Móvel** e clique em **Mostrar Código QR de Emparelhamento**.
3. Anote a URL exibida (por exemplo, `http://192.168.1.150:4200`).

### Passo 2: Configurar a Flag de Segurança no Chrome
1. Abra o **Google Chrome** no seu dispositivo Android.
2. Na barra de endereços do Chrome, digite a seguinte URL e pressione Enter:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Localize a flag destacada chamada **"Insecure origins treated as secure"**.
4. Altere a opção no menu para **Enabled**.
5. No campo de texto logo abaixo, digite o protocolo, IP e porta do seu servidor:
   ```text
   http://192.168.1.150:4200
   ```
   *(Substitua pelo seu endereço IP e porta reais).*
6. Toque no botão azul **Relaunch** na parte inferior para reiniciar o Chrome.

### Passo 3: Conectar e Conceder Permissões
1. Escaneie o **Código QR de Emparelhamento** com seu telefone ou acesse a URL no Chrome.
2. Quando solicitado pelo navegador, toque em **Permitir** para liberar o acesso à câmera.
3. A imagem de vídeo ao vivo e as zonas de detecção interativas surgirão na tela.

---

## Configuração Passo a Passo para iOS (iPhone e iPad)

Como o Apple WebKit exige o contexto seguro em todos os navegadores no iOS sem opções de exceção por flag, o uso de iPhone ou iPad requer a distribuição da aplicação via **HTTPS**.

### Método 1: Reverse Proxy HTTPS Local com mkcert (Recomendado)
1. **Instale o mkcert** no computador principal.
2. **Crie uma Autoridade Certificadora local**: `mkcert -install`
3. **Gere um certificado para seu IP local**: `mkcert 192.168.1.150 localhost 127.0.0.1`
4. **Execute um reverse proxy** (ex.: Caddy) direcionando o tráfego seguro para `localhost:4200`.
5. **Instale a autoridade raiz no dispositivo iOS**:
   - Envie o arquivo `rootCA.pem` para o iPhone.
   - Abra **Ajustes** > **Perfil Baixado** > **Instalar**.
   - Ative a confiança total em **Ajustes** > **Geral** > **Sobre** > **Certificados Confiáveis**.
6. Acesse a URL segura no Safari ou Chrome do iOS.

### Método 2: Túnel HTTPS Seguro (Mais Rápido para Testes)
Para testar um iPhone sem instalar certificados SSL locais, um túnel HTTPS disponibiliza um endereço público fidedigno:

#### Opção A: LocalTunnel (Sem necessidade de registo)
Execute diretamente no terminal sem criar qualquer conta:
```bash
npx -y localtunnel --port 4200
```
Abra o link gerado `https://...loca.lt` no seu iPhone.

#### Opção B: Túnel SSH integrado (Sem instalação nem registo)
Utilize o comando SSH padrão do sistema operativo:
```bash
ssh -R 80:localhost:4200 localhost.run
```
Copie o endereço `https://...` apresentado no terminal e abra-o no seu iPhone.

#### Opção C: ngrok (Requer conta gratuita)
O ngrok exige uma conta e um token de autenticação:
1. Crie uma conta gratuita em [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
2. Configure o seu token:
   ```bash
   npx ngrok config add-authtoken <O_SEU_TOKEN>
   ```
3. Inicie o túnel:
   ```bash
   npx ngrok http 4200
   ```
4. Abra o endereço `https://...ngrok-free.app` no seu iPhone.

### Método 3: Câmera de Continuidade Sem Fio da Apple (macOS + iPhone)
Se o computador principal for um Mac e pretender utilizar um iPhone como câmera de pista, pode usufruir da funcionalidade nativa **Câmera de Continuidade (Continuity Camera)** da Apple. Funciona **completamente sem fios**, sem qualquer cabo ligado:

1. **Verificar ID Apple e conectividade sem fios**:
   - Assegure-se de que o Mac e o iPhone têm sessão iniciada com o mesmo ID Apple (com autenticação de dois fatores ativa).
   - Mantenha **Wi-Fi** e **Bluetooth** ativados em ambos os dispositivos.
   - No iPhone, aceda a **Ajustes** > **Geral** > **AirPlay e Continuidade** e confirme que **Câmera de Continuidade** está ativada.
2. **Montar o iPhone sobre a pista**:
   - Fixe o iPhone na horizontal sobre a linha de meta com a câmera traseira apontada para baixo.
   - Bloqueie o ecrã do iPhone. Não é necessário qualquer cabo (o cabo apenas é útil para manter o carregamento contínuo em eventos longos).
3. **Iniciar a interface localmente no Mac**:
   - No Editor de Pistas do Mac, clique em **Testar neste dispositivo** (ou abra `http://localhost:4200/camera_interface`).
   - Sendo o `localhost` um contexto seguro, o navegador do Mac permite o acesso à câmera sem certificados SSL nem flags.
   - Selecione a **Câmera do iPhone** nas definições de câmera do navegador ou do macOS. A ligação de vídeo sem fios é estabelecida automaticamente.
4. **Alcance sem fios**: A Câmera de Continuidade funciona através de ligação direta ponto a ponto (alcance típico de cerca de 10 metros na mesma divisão). Se o Mac estiver noutra divisão distante, utilize o **Método 1 (HTTPS local)**, o **Método 2 (Túnel HTTPS)** ou um dispositivo Android na sua rede Wi-Fi normal.

---

## Testes neste Computador (Webcams de Mesa e Portáteis)

Para testar a interface diretamente no computador principal sem ligar um dispositivo móvel, clique em **Testar neste dispositivo** no Editor de Pistas (`http://localhost:4200/camera_interface`).

Como o `localhost` é reconhecido como um contexto seguro por todos os navegadores, não são necessários certificados SSL nem flags. No entanto, é fundamental autorizar as permissões no sistema operativo e no navegador.

### macOS: Configuração e Resolução de Problemas

Se a câmera não inicializar no macOS mesmo após conceder permissão:

1. **Verificar as permissões do site no navegador**:
   - Na barra de endereços (ao lado de `localhost:4200`), clique no **ícone de ajustes/cadeado** (Configurações do site).
   - Certifique-se de que a **Câmera** está definida como **Permitir**.
2. **Conceder permissões de sistema no macOS**:
   - Quando surgir o aviso do macOS (*«Google Chrome deseja acessar a câmera»*), clique em **OK**.
   - Se perdeu o aviso ou clicou em não permitir: aceda a **Ajustes do Sistema** > **Privacidade e Segurança** > **Câmera** e ative o botão do **Google Chrome** (ou do seu navegador).
3. **Reiniciar o navegador (`Cmd + Q`)**:
   - **Crucial**: O mecanismo de segurança do macOS (TCC) exige **fechar totalmente (`Cmd + Q`) e reabrir o navegador** após conceder as permissões do sistema para que o processo possa aceder à câmera.
4. **Clicar no botão «Repetir»**:
   - O pedido inicial na página costuma expirar enquanto a janela do macOS aguarda confirmação. Após autorizar o acesso, clique em **Repetir** no ecrã.
5. **Verificar bloqueio de hardware (Câmera em uso)**:
   - A câmera FaceTime HD integrada no Mac só pode ser utilizada por uma aplicação de cada vez. Feche totalmente aplicações como **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth** ou **OBS** e clique em **Repetir**.

### Windows: Configuração e Resolução de Problemas

1. Abra **Configurações** > **Privacidade e segurança** > **Câmera**.
2. Verifique se o **Acesso à câmera** está **Ativado**.
3. Ative **Permitir que os aplicativos acessem sua câmera** e **Permitir que os aplicativos da área de trabalho acessem sua câmera**.
4. No Chrome ou Edge, autorize o acesso para `localhost:4200`.

---

## Dicas de Montagem e Ajuste

1. **Posição Superior**: Posicione o dispositivo a 30-60 cm diretamente acima da linha de chegada apontado para baixo.
2. **Evitar Vibrações**: Utilize suporte rígido para evitar disparos falsos causados pela trepidação dos carros.
3. **Iluminação Uniforme**: Garanta luz constante sem sombras de participantes ou luzes fluorescentes oscilantes.
4. **Taxa de Quadros**: Selecione **60 FPS** nas configurações para máxima precisão de detecção.
