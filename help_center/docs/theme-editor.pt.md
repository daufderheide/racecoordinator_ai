# Editor de Temas

O **Editor de Temas** oferece uma interface dedicada e simplificada para gerenciar bandeiras visuais, sequências de luzes de contagem regressiva, indicadores de combustível, avisos de áudio de controle de corrida e substituições de áudio do piloto para Race Coordinator AI. Compartilha a mesma barra de ferramentas unificada, seleção de objetos, proteção de somente leitura e ciclo de vida do modo de edição usados nos editores de Pilotos, Pistas, Corridas e Layouts.

---

## Visão Geral e Navegação

O Editor de Temas pode ser acessado de vários locais principais:

- **Barra de Ferramentas de Configuração do Dia de Corrida**: Selecione **Config > Editor de Temas** (`/theme-editor` ou `/theme-manager`).
- **Menu de Opções do Dia de Corrida**: Clique no menu de engrenagem na barra de ferramentas e selecione **Editor de Temas** (`/theme-editor`). A navegação durante uma corrida ativa preserva a conexão e o estado da corrida.
- **Editor de Interface (UI Editor)**: Clique em **Abrir Editor de Temas** no cartão de Temas no Editor de UI (`/ui-editor`).

### Ciclo de Vida de Somente Leitura e Modo de Edição

- **Modo Somente Leitura (Padrão)**: As propriedades do tema, slots de imagem, configurações de áudio e substituições de áudio do piloto estão protegidos contra modificações acidentais.
- **Modo de Edição**: Clicar no ícone de lápis (**Editar**) na barra de ferramentas desbloqueia o tema para edição.
- **Salvamento Automático e Validação**: Ao sair do modo de edição, as alterações são validadas (garantindo um nome exclusivo e não vazio) e salvas.
- **Descartar Alterações**: Navegar para fora com edições não salvas exibe a caixa de diálogo padrão de confirmação.
- **Desfazer / Refazer**: Totalmente integrado com os atalhos de teclado padrão (<kbd>Ctrl</kbd>+<kbd>Z</kbd> e <kbd>Ctrl</kbd>+<kbd>Y</kbd>).

---

## Ações da Barra de Ferramentas

- **Seletor de Temas**: Menu suspenso para selecionar qualquer tema do sistema ou personalizado.
- **Editar / Concluir Edição**: Alterna entre o modo somente leitura e o modo de edição.
- **Expandir / Recolher Tudo**: Alterna todas as seções configuráveis de uma só vez.
- **Adicionar Tema**: Cria um novo modelo de tema com base no tema padrão do sistema.
- **Copiar Tema**: Duplica o tema atualmente selecionado com um nome exclusivo.
- **Excluir Tema**: Exclui o tema personalizado atual após confirmação. Temas padrão do sistema são protegidos e não podem ser excluídos.
- **Tour de Ajuda**: Inicia um tour guiado interativo.

