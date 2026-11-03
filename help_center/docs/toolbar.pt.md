# Ações da Barra de Ferramentas

A **Barra de Ferramentas do Editor** oferece controles unificados e padronizados em todas as telas de gerenciamento do Race Coordinator AI (Pilotos, Equipes, Pistas, Corridas, Layouts, Temas e Bancos de Dados).

## Visão Geral {: #overview }

A barra de ferramentas organiza o ciclo de edição:

- **Modo Somente Leitura**: Ao abrir um editor, os formulários ficam bloqueados para evitar alterações acidentais enquanto você inspeciona propriedades e testa áudios.
- **Modo de Edição**: Clicar no ícone **Editar** (lápis) desbloqueia os campos. O seletor superior é bloqueado para proteger o trabalho não salvo.
- **Salvar e Concluir**: Clicar em **Concluído** (marca de seleção) valida e grava os dados no SQLite e retorna ao modo somente leitura.

## Referência de Ícones {: #icons }

Abaixo segue a descrição de cada ícone de ação da barra de ferramentas:

### Editar / Concluído {: #edit }
- **Ícones**: `edit` (lápis) / `check` (marca de seleção)
- **Atalho**: `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Descrição**: Alterna entre o modo somente leitura e o modo de edição.

### Criar Novo {: #add }
- **Ícone**: `add` (mais)
- **Descrição**: Cria um novo item em branco e entra imediatamente no modo de edição.

### Duplicar / Salvar como Novo {: #copy }
- **Ícone**: `content_copy` (documentos sobrepostos)
- **Descrição**: Duplica o item selecionado sob um novo nome para facilitar a edição.

### Excluir {: #delete }
- **Ícone**: `delete` (lixeira)
- **Descrição**: Remove permanentemente o item selecionado após confirmação.

### Desfazer {: #undo }
- **Ícone**: `undo` (seta anti-horária)
- **Atalho**: `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Descrição**: Desfaz a última alteração feita na sessão atual de edição.

### Refazer {: #redo }
- **Ícone**: `redo` (seta horária)
- **Atalho**: `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` ou `Ctrl+Y` (Windows/Linux)
- **Descrição**: Reaplica a alteração desfeita anteriormente.

### Expandir / Recolher Tudo {: #expand-collapse }
- **Ícone**: `unfold_more` / `unfold_less` (setas verticais)
- **Descrição**: Expande ou recolhe todas as seções sanfonadas do editor de uma só vez.

### Ativar {: #activate }
- **Ícone**: `check_circle` (círculo com marcação)
- **Descrição**: Define o tema selecionado como o tema ativo para as corridas.

### Importar {: #import }
- **Ícone**: `download` / `file_upload` (seta para baixo)
- **Descrição**: Abre caixa de diálogo para importar arquivos externos (`.json`, `.zip`, `.csv`).

### Exportar {: #export }
- **Ícone**: `upload` / `file_download` (seta para cima)
- **Descrição**: Exporta a configuração para um arquivo comprimido (`.zip`, `.xlsx`, `.csv`).

### Restaurar Padrões de Fábrica {: #reset }
- **Ícone**: `restart_alt` (seta de reinício)
- **Descrição**: Restaura o banco de dados ou configurações aos padrões originais de fábrica.

### Limpar Layout {: #clear }
- **Ícone**: `delete_sweep` (vassoura)
- **Descrição**: Limpa completamente a tela de trabalho no Editor de Layouts.

### Regenerar Baterias {: #regenerate }
- **Ícone**: `sync` (setas circulares)
- **Descrição**: Recalcula as rotações de baterias e alocação de pistas.

### Checagem de Pistas {: #lane-check }
- **Ícone**: `check` (marcação / balança)
- **Descrição**: Verifica se todas as pistas estão distribuídas de forma equilibrada nas baterias.

### Controle de Zoom {: #zoom }
- **Ícones**: `zoom_in` / `zoom_out` com controle deslizante
- **Descrição**: Ajusta o nível de ampliação da tela de design entre 50% e 150%.

### Métricas de Uso (Analytics) {: #analytics }
- **Ícone**: `analytics` (gráfico de barras)
- **Descrição**: Habilita ou desabilita o envio anônimo de diagnósticos e estatísticas de uso.

### Ajuda Guiada {: #help }
- **Ícone**: `lightbulb` (lâmpada)
- **Descrição**: Inicia um passo a passo interativo explicando as seções da página.

