# Personalizar interface

A página **Personalizar interface** permite configurar as opções gerais do sistema, locais de diretórios para arquivos de interface e widgets modulares personalizados, modelos de exportação do Excel pós-corrida, animações de transição de tela e parâmetros de áudio principal e conversão de texto em fala (TTS).

> [!NOTE]
> Para projetar visualmente telas de corrida e tabelas de classificação personalizadas, acesse o [Editor de layouts](layout-editor.pt.md). Para configurar conjuntos de imagens de bandeiras, contagens regressivas e marcadores de combustível ou efeitos sonoros de corrida, acesse o [Editor de temas](theme-editor.pt.md).

---

## Visão geral {: #overview }

A página de personalização da interface oferece controle centralizado sobre o comportamento global da interface e as configurações de áudio no nível do aplicativo:

- **Escopo global**: As alterações feitas nesta página aplicam-se a todo o aplicativo e a todas as sessões de corrida.
- **Salvamento automático contínuo**: Ajustes no volume, tom de voz, tempos de espera de fila, seleção de diretórios e transições entram em vigor imediatamente e são salvos automaticamente.
- **Seções expansíveis dedicadas**: As configurações estão organizadas em seções recolhíveis distintas para **Configurações de personalização da interface** e **Configurações de áudio**.
- **Suporte a Desfazer / Refazer**: Modificações feitas durante a sessão atual podem ser rapidamente desfeitas ou refeitas através da barra de ferramentas.

---

## Ações da barra de ferramentas {: #toolbar-actions }

A barra de ferramentas superior oferece ações essenciais de navegação e gerenciamento de sessão:

- **Voltar**: Retorna à tela ou menu de navegação anterior.
- **Desfazer / Refazer**: Reverte ou reaplica alterações recentes feitas durante a sessão atual.
- **Ajuda (?)**: Inicia o tour interativo destacando cada seção e painel da página.

---

## Configurações de personalização da interface {: #customize-ui-settings }

A seção **Configurações de personalização da interface** define diretórios locais do sistema de arquivos, modelos de exportação do Excel e animações de tela:

### Diretório de interface personalizada

Define uma pasta local usada para substituir os modelos padrão do aplicativo e armazenar logs do cliente quando necessário:

- **Caminho do diretório**: Exibe o nome da pasta ativa e o caminho absoluto do arquivo. Quando não configurado, o aplicativo usa os locais padrão internos.
- **Selecionar diretório**: Abre uma caixa de diálogo nativa para navegar e selecionar um diretório local.
- **Inserir caminho**: Abre uma janela modal para digitar ou colar manualmente um caminho absoluto do sistema de arquivos.
- **Restaurar padrão**: Limpa o caminho personalizado e restaura os valores padrão.

> [!WARNING]
> A configuração de um diretório de interface personalizado substitui os modelos principais do aplicativo e destina-se apenas a usuários avançados que desenvolvem interfaces personalizadas ou analisam logs.

### Diretório de widgets personalizados

Configura o diretório raiz onde o Race Coordinator AI pesquisa por [widgets personalizados](custom-widgets.pt.md) modulares:

- **Caminho do diretório**: Exibe o nome e o caminho da pasta de widgets selecionada.
- **Selecionar diretório**: Abre um seletor de pastas para escolher um diretório local contendo pacotes de widgets.
- **Inserir caminho**: Digite manualmente um caminho de pasta absoluto.
- **Exportar widgets iniciais**: Copia pacotes de widgets de exemplo prontos para uso para uma subpasta `sample/` dentro do diretório selecionado (incluindo `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner` e `sample-detailed-leaderboard`). Este botão fica ativo quando um diretório válido é selecionado.
- **Restaurar padrão**: Limpa o caminho do diretório de widgets personalizados.

Para especificações técnicas completas sobre a criação de widgets personalizados, consulte o [Guia de widgets personalizados](custom-widgets.pt.md).

### Modelo de exportação personalizado

Gerencia o modelo do Microsoft Excel (`.xlsx`) personalizado usado ao exportar resultados e estatísticas de corrida:

- **Status do modelo**: Exibe o nome do arquivo da pasta de trabalho do Excel atualmente ativo ou indica se o modelo padrão do sistema está em uso.
- **Selecionar modelo**: Envia uma pasta de trabalho `.xlsx` personalizada do seu computador para ser incorporada como modelo de exportação.
- **Baixar modelo**: Baixa o arquivo de modelo ativo em seu computador para visualização ou edição no Microsoft Excel.
- **Exportação de teste**: Gera e baixa um arquivo `.xlsx` de exemplo preenchido com dados fictícios para testar a formatação, fórmulas e gráficos do modelo.
- **Variáveis do modelo**: Abre uma janela modal listando todas as tags de substituição suportadas (como `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}`, etc.) que você pode colocar em células do Excel para inserir dinamicamente dados de corrida.
- **Restaurar padrão**: Retorna ao modelo de exportação padrão padrão do Excel.

> [!TIP]
> Se você editar seu arquivo de modelo externamente no Microsoft Excel ou em outro programa de planilha, certifique-se de enviá-lo novamente através de **Selecionar modelo** para salvar a pasta de trabalho atualizada no Race Coordinator AI. Para mais detalhes, consulte o [Guia de exportação personalizada em XLS](custom-xls-export.pt.md).

### Transições de página

Define o estilo de animação visual usado ao navegar entre telas e visualizações no aplicativo:

- **Deslizar (Slide)** (Padrão): Transição suave de deslizamento horizontal entre páginas.
- **Esmaecer (Fade)**: Dissolução suave de opacidade entre as visualizações.
- **Zoom**: Transição moderna com efeito de ampliação.
- **Girar (Flip)**: Efeito de rotação de cartão em 3D.
- **Nenhuma (None)**: Troca instantânea de tela sem animação (recomendado para dispositivos menos potentes ou quiosques).

---

## Configurações de áudio {: #audio-settings }

A seção **Configurações de áudio** gerencia o volume principal do sistema, os comportamentos da fila do despachante e as falas sintetizadas de conversão de texto em fala (TTS):

### Volume principal

Controla o volume principal geral (0% a 100%) para todas as saídas de áudio no Race Coordinator AI. Ajustar este controle deslizante dimensiona todos os efeitos sonoros, bipes de contagem regressiva, buzinas e avisos de voz simultaneamente.

### Tempo limite da fila urgente

Define por quanto tempo os alertas urgentes de alta prioridade (como *Bandeira Amarela*, *Bateria Finalizada* ou *Largada Queimada*) aguardarão na fila de áudio se outra mensagem urgente já estiver sendo falada:

- **3 Segundos**: Tempo limite curto; descarta alertas pendentes rapidamente para manter as notificações de voz sincronizadas com a ação na pista.
- **5 Segundos** (Padrão): Duração equilibrada que garante que os alertas urgentes sejam ouvidos sem atrasar em relação aos eventos ao vivo.
- **10 Segundos**: Tempo limite amplo; permite que anúncios mais longos terminem antes de ignorar notificações urgentes posteriores.

Alertas expirados que ultrapassam o limite de tempo são automaticamente descartados.

### Espaçamento de chamadas

Configura o intervalo mínimo de silêncio entre anúncios falados consecutivos para evitar sobreposição ou cortes de áudio:

- **Nenhum (0 ms)**: Anúncios consecutivos são reproduzidos imediatamente um após o outro.
- **Curto (500 ms)** (Padrão): Pausa curta de meio segundo entre avisos para um ritmo natural.
- **Normal (1000 ms)**: Pausa de 1 segundo entre anúncios para uma separação mais nítida.
- **Relaxado (1500 ms)**: Pausa de 1,5 segundo entre anúncios para um ritmo de comentário mais tranquilo.

### Voz de conversão de texto em fala (TTS)

Seleciona qual voz sintetizada é usada para tempos de volta falados, posições, anúncios de líder e alertas de combustível:

- **Padrão do sistema**: Usa a voz sintetizada padrão do sistema operacional ou navegador.
- **Vozes instaladas**: Lista todas as vozes detectadas no seu sistema operacional ou navegador com seu nome e código de idioma (por exemplo, `pt-BR`, `en-US`).

### Velocidade da fala

Controla a velocidade de reprodução dos anúncios de TTS por meio de um controle deslizante que varia de **0,1x** (muito lento) a **2,0x** (velocidade dupla) em incrementos de 0,05. A velocidade padrão é **1,0x**.

### Tom de voz (Pitch)

Controla o tom/frequência vocal dos anúncios de TTS por meio de um controle deslizante que varia de **0,0x** (tom grave) a **2,0x** (tom agudo) em incrementos de 0,05. O tom padrão é **1,0x**.

### Volume da voz

Controle deslizante independente (0% a 100%) especificamente para anúncios de voz TTS. Permite ajustar o nível de comentários falados em relação aos efeitos sonoros e buzinas.

### Testar voz

Clique no botão **Testar voz** para ouvir uma frase de teste de exemplo falada com suas configurações atuais de voz, velocidade, tom e volume.
