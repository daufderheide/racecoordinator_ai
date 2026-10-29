# Editor de Layouts

O **Editor de Layouts** fornece uma interface de tela cheia dedicada para personalizar, organizar e projetar layouts visuais de tela para o Race Coordinator AI. Ele compartilha a mesma barra de ferramentas unificada, seleção de objetos, proteção somente leitura e ciclo de vida do modo de edição usados nos editores de Pilotos, Pistas e Corridas.

---

## Visão Geral e Navegação

O Editor de Layouts pode ser acessado de vários locais no aplicativo:

- **Barra de Ferramentas de Configuração do Dia de Corrida**: Selecione **Config > Editor de Layouts** (`/layout-editor` ou `/layout-manager`).
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
- **Adicionar Layout (<span class="material-icons">add</span>)**: Cria um novo modelo de layout baseado no layout padrão do sistema.
- **Copiar Layout (<span class="material-icons">content_copy</span>)**: Duplica o layout atualmente selecionado com um nome exclusivo (por exemplo, *Nome do Layout (Cópia)*).
- **Excluir Layout (<span class="material-icons">delete</span>)**: Exclui o layout personalizado atual após confirmação. Layouts padrão do sistema são protegidos e não podem ser excluídos.
- **Tour Guiado (<span class="material-icons">help_outline</span>)**: Inicia um tour guiado interativo destacando o seletor de layout, ações do cabeçalho, a tela, a biblioteca de widgets e o inspetor de widgets.

---

## Controles de Tela e Resolução

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

### Pré-visualização da Contagem Regressiva de Largada
- Clique em **Pré-visualizar Luzes** (<span class="material-icons">timer</span>) para alternar uma prévia ao vivo da sequência de luzes de largada na tela sem iniciar uma corrida real.

### Biblioteca de widgets e caixa de ferramentas
- **Biblioteca de widgets (<span class="material-icons">widgets</span>)**: Alterna a visibilidade da caixa de ferramentas flutuante. Um clique também a restaura se estiver minimizada ou fora da tela visível.
- **Redefinir posição (<span class="material-icons">restart_alt</span>)**: Localizado no cabeçalho da caixa de ferramentas para retorná-la instantaneamente à origem padrão `(0, 0)` no canto superior esquerdo.
- **Minimizar (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Recolhe a caixa de ferramentas para uma barra de título compacta para liberar espaço na tela.

---

## Tela de Widgets e Inspetor

- **Posicionamento e Seleção**: Clique em qualquer widget na tela ou selecione-o no menu suspenso de widgets.
- **Reposicionamento e Dimensionamento**: Arraste os widgets livremente dentro dos limites da tela. Use a barra lateral do Inspetor para inserir valores numéricos exatos de **X**, **Y**, **Largura** e **Altura**.
- **Deslocamento pelo Teclado**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Move o widget selecionado em 1px.
  - <kbd>Shift</kbd> + Teclas de seta: Move o widget selecionado em 10px.
  - <kbd>Delete</kbd> ou <kbd>Backspace</kbd>: Remove o widget selecionado.
- **Replicar Pistas**: Replica um cartão de coluna de pista selecionado em todas as pistas ativas, posições, classificações gerais ou cabeças de chave de pilotos.
- **Detecção e Correção de Colunas Sobrepostas**:
  - O editor detecta automaticamente colunas duplicadas ou sobrepostas em grades de pistas.
  - Um banner de alerta oferece **Correção Rápida** em um clique ou **Revisar Problemas** em uma caixa de diálogo interativa.

---

## Importação, Exportação e Migração

- **Importar Layout**: Importe um arquivo JSON de layout existente via seleção de arquivos.
- **Exportar Layout**: Baixe o layout ativo como um arquivo JSON independente.
- **Backups Pré-Migração**: Para layouts atualizados de versões anteriores, restaure snapshots de backup pré-migração ou exporte diagnósticos de migração para solução de problemas.
