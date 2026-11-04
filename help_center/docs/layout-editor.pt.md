# Editor de Layouts

O **Editor de Layouts** fornece uma interface de tela cheia dedicada para personalizar, organizar e projetar layouts visuais de tela para o Race Coordinator AI. Ele compartilha a mesma barra de ferramentas unificada, seleção de objetos, proteção somente leitura e ciclo de vida do modo de edição usados nos editores de Pilotos, Pistas e Corridas.

---

## Visão Geral e Navegação

O Editor de Layouts pode ser acessado de vários locais no aplicativo:

- **Barra de Ferramentas de Configuração do Dia de Corrida**: Selecione **Config > Editor de Layouts** (`/layout-editor` ou `/layout-manager`).
- **Menu de Gerenciamento do Dia de Corrida**: Selecione **Gerenciar > Editor de Layouts** (`/layout-editor`). A navegação durante uma corrida ativa preserva a conexão e o estado da corrida.
- **Editor de UI**: Clique em **Abrir Editor de Layouts** na seção de Layouts de UI no Editor de UI (`/ui-editor`).

### Ciclo de Vida do Modo Somente Leitura e Edição

- **Modo Somente Leitura (Padrão)**: Propriedades do layout, widgets da tela, dimensões e campos do inspetor são protegidos contra alterações acidentais.
- **Modo de Edição**: Clicar no ícone de lápis (**Editar**) na barra de ferramentas desbloqueia a tela de layout, controles de zoom, reposicionamento/redimensionamento de widgets e edição no inspetor.
- **Salvamento Automático e Validação**: Ao sair do modo de edição, as alterações são validadas (por exemplo, garantindo um nome de layout exclusivo e não vazio) e salvas. Configurações inválidas exibem um alerta e mantêm o editor no Modo de Edição.
- **Descartar Alterações**: Sair ou navegar para outra tela com edições não salvas exibe o modal padrão de confirmação de descarte, prevenindo perda de dados.
- **Desfazer / Refazer**: Totalmente integrado com os atalhos de teclado padrão (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> e <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Ações da Barra de Ferramentas

A barra de ferramentas superior oferece ações de gerenciamento padronizadas:

- **Seletor de Layout**: Menu suspenso para selecionar qualquer layout do sistema ou personalizado, ordenado naturalmente com nomes padrão traduzidos (*IU Padrão Dia de Corrida*, *IU Padrão Treino*, *IU Padrão Posto do Piloto*).
- **Editar / Concluir Edição**: Alterna entre o Modo Somente Leitura e o Modo de Edição.
- **Biblioteca de Widgets (<span class="material-icons">widgets</span>)**: Alterna a visibilidade da caixa de ferramentas flutuante.
- **Configuração de Widgets (<span class="material-icons">tune</span>)**: Alterna a visibilidade do painel lateral Configuração de Widgets.
- **Pré-visualização da Contagem Regressiva (<span class="material-icons">visibility</span>)**: Alterna uma prévia ao vivo das luzes de largada na tela sem iniciar uma corrida real.
- **Adicionar Layout (<span class="material-icons">add</span>)**: Abre uma caixa de diálogo de seleção de modelo que permite criar um novo layout a partir de qualquer layout padrão do Race Coordinator AI (*RC AI*, *Treino*, *Combustível*, *Posto do Piloto*) ou começar com um layout totalmente vazio.
- **Copiar Layout (<span class="material-icons">content_copy</span>)**: Duplica o layout atualmente selecionado com um nome exclusivo (por exemplo, *Nome do Layout (Cópia)*).
- **Excluir Layout (<span class="material-icons">delete</span>)**: Exclui o layout personalizado atual após confirmação. Layouts padrão do sistema são protegidos e não podem ser excluídos.
- **Tour Guiado (<span class="material-icons">help_outline</span>)**: Inicia um tour guiado interativo destacando o seletor de layout, ações do cabeçalho, a tela, a biblioteca de widgets e o inspetor de widgets.

---

## Controles de Tela e Resolução {: #layout-controls }

Localizados na barra de controles abaixo da barra de ferramentas:

### Predefinições de Proporção e Resolução
Selecione uma predefinição de proporção de tela (**16:9**, **16:10**, **4:3**, **21:9**, **Personalizado**) para dimensionar automaticamente as dimensões base da tela (por exemplo, 1920×1080, 1920×1200, 1440×1080).

### Modos de Dimensionamento
- **Ajuste Automático (Escala Uniforme)**: Preserva a proporção dos widgets enquanto se ajusta à tela de destino.
- **Esticar para Ajustar**: Estica os widgets de forma independente em largura e altura.
- **Fixo / Mapeamento 1:1 Pixel**: Mantém as dimensões exatas de coordenadas sem escala.

### Controles de Zoom
- Ajuste o zoom suavemente de **25%** a **400%** usando os botões **-** e **+** ou digitando uma porcentagem diretamente.
- Clique em **Redefinir Zoom** para restaurar para 100%.
- As configurações de zoom são salvas localmente no navegador para cada layout.

### Biblioteca de widgets e controles de configuração {: #widget-panels }
Localizados na barra de ferramentas principal à esquerda do ícone de pré-visualização da contagem regressiva:
- **Biblioteca de widgets (<span class="material-icons">widgets</span>)**: Alterna a visibilidade da caixa de ferramentas flutuante. Um clique também a restaura se estiver minimizada ou fora da tela visível.
- **Configuração de Widgets (<span class="material-icons">tune</span>)**: Alterna a visibilidade do painel lateral Configuração de Widgets. Quando oculto, a tela pode se estender por toda a largura da página se a proporção da tela permitir (assim como no modo somente leitura).
- **Redefinir posição (<span class="material-icons">restart_alt</span>)**: Localizado no cabeçalho da caixa de ferramentas para retorná-la instantaneamente à origem padrão `(0, 0)` no canto superior esquerdo.
- **Minimizar (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Recolhe a caixa de ferramentas para uma barra de título compacta para liberar espaço na tela.

---

## Tela de Widgets e Inspetor {: #canvas-and-widgets }

A tela serve como uma prévia autêntica em tempo real do seu layout, exatamente como pilotos e espectadores o verão durante uma corrida. No **Modo de Edição**, você pode adicionar, remover, reposicionar, redimensionar e configurar os widgets que compõem o layout.

### Interações na Tela
- **Posicionamento e Seleção**: Clique em qualquer widget diretamente na tela ou selecione-o no menu suspenso **Selecionar Widget** na barra de ferramentas superior.
- **Reposicionamento e Dimensionamento**: Arraste os widgets livremente dentro dos limites da tela. Use o painel Inspetor de Configuração para inserir valores numéricos exatos de **X**, **Y**, **Largura** e **Altura**.
- **Deslocamento pelo Teclado**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Move o widget selecionado em 1px.
  - <kbd>Shift</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Move o widget selecionado em 10px.
  - <kbd>Delete</kbd> ou <kbd>Backspace</kbd>: Remove o widget selecionado.
- **Replicar Pistas**: Replica um cartão de coluna de pista selecionado em todas as pistas ativas, posições da bateria, classificação geral ou cabeças de chave de pilotos.
- **Detecção e Correção de Colunas Sobrepostas**: O editor detecta automaticamente colunas duplicadas ou sobrepostas em grades de pistas. Um banner de alerta oferece **Correção Rápida** em um clique ou **Revisar Problemas** em uma caixa de diálogo interativa.

### Widgets Disponíveis e Opções de Configuração

O Race Coordinator AI inclui uma coleção abrangente de widgets integrados:

1. **Classificação / Grade (Leaderboard)**:
   - **Objetivo**: Exibe uma tabela de classificação ao vivo de pilotos, posições, voltas, métricas telemétricas e intervalos.
   - **Opções de Configuração**: Fonte de dados (**Dados da Bateria** vs. **Dados Gerais da Corrida**), ordem e visibilidade de colunas personalizadas, altura das linhas, regras de ordenação, paginação automática e tipografia.
2. **Coluna de Pista (Cartões Modulares)**:
   - **Objetivo**: Renderiza dados telemétricos de uma única pista, posição final ou classificação geral como um cartão modular independente.
   - **Opções de Configuração**: Vinculação de destino (**Pista 1–8**, **Posição da Bateria**, **Classificação Geral** ou **Cabeça de Chave do Piloto**), até 8 **Slots Internos** perimetrais (para avatares, métricas secundárias ou emblemas), alinhamento de texto e dimensionamento de fontes.
3. **Cronômetro e Tempo Total**:
   - **Objetivo**: Exibe o tempo restante da bateria, tempo decorrido ou a duração total do evento.
   - **Opções de Configuração**: Predefinições de exibição (**Dinâmico**, **Minutos e Segundos**, **Relógio Completo**, **Segundos Totais**), limites de precisão para frações de segundo e pré-visualização de formato.
4. **Widget de Contagem Regressiva (Luzes de Largada)**:
   - **Objetivo**: Sequência visual de luzes de largada com áudio sincronizado.
   - **Opções de Configuração**: Quantidade de lâmpadas (1 a 10), orientação horizontal ou vertical, animação de fade-in, desfoque de fundo e efeitos de brilho da lâmpada.
5. **Botões de Ação**:
   - **Objetivo**: Botões interativos de toque e clique para controle da corrida.
   - **Opções de Configuração**: Ações acionadas (**Iniciar/Pausar**, **Bandeira Amarela / Chamada de Pista**, **Chamada de Áudio**, **Redefinir**, **Alternar Layout**), texto personalizado do botão, ícones vetoriais Material Icons e estilos de cor.
6. **Widget de Recordes**:
   - **Objetivo**: Exibe recordes da pista e da sessão (volta mais rápida histórica, volta mais rápida na pista, recorde de voltas totais) e conquistas dos pilotos.
   - **Opções de Configuração**: Tipos de métricas de recorde, formatação de títulos, tipografia e estilo de fundo.
7. **Widget de Imagem**:
   - **Objetivo**: Renderiza mapas de circuitos, banners de patrocinadores, logotipos de clubes e recursos gráficos.
   - **Opções de Configuração**: URL ou caminho da imagem do gerenciador de mídia, modo de escala (**Ajustar**, **Preencher**, **Esticar**), opacidade e raio da borda.
8. **Widget de Texto Informativo**:
   - **Objetivo**: Exibe títulos estáticos, avisos ou tags dinâmicas de metadados da corrida (Nome da Corrida, Bateria Atual, Nome da Pista).
   - **Opções de Configuração**: Modelo de texto com interpolação de variáveis (`{race_name}`, `{heat_number}`), tamanho da fonte, alinhamento e cores.
9. **Widget de Menu**:
   - **Objetivo**: Menu sobreposto compacto durante a corrida para acesso rápido a configurações de som, troca de layout e controles de corrida.
   - **Opções de Configuração**: Estilo de ícone, visibilidade de itens de menu e posicionamento de âncora.
10. **Próximas Baterias (On Deck)**:
    - **Objetivo**: Informa os pilotos sobre a programação das próximas baterias e rotações planejadas de pistas.
    - **Opções de Configuração**: Número de baterias a serem pré-visualizadas, formatação de nomes de pilotos e espaçamento do layout.
11. **Widgets Personalizados**:
    - **Objetivo**: Carrega dinamicamente componentes web externos e medidores telemétricos de sua pasta de widgets personalizados.
    - **Opções de Configuração**: Campos de propriedades personalizadas (cores, limites, seletores, rótulos de texto) definidos no manifesto do widget.

Para obter detalhes completos sobre estilos de widgets, fórmulas e desenvolvimento de widgets personalizados, consulte o [Guia do Editor de UI](ui-editor.pt.md) e o [Guia de Widgets Personalizados](custom-widgets.pt.md).

---

## Importação, Exportação e Migração

- **Importar Layout**: Importe um arquivo JSON de layout existente via seleção de arquivos.
- **Exportar Layout**: Baixe o layout ativo como um arquivo JSON independente.
- **Backups Pré-Migração**: Para layouts atualizados de versões anteriores, restaure snapshots de backup pré-migração ou exporte diagnósticos de migração para solução de problemas.
