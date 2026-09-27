# Editor de Equipe

O **Editor de Equipe** permite criar, visualizar e personalizar perfis de equipe, atribuir pilotos, carregar logotipos e gerenciar as escalações.

## Visão Geral

O Editor de Equipe integra a seleção e a edição da equipe em uma interface unificada:

- **Seletor de Equipe**: Localizado no cabeçalho superior ao lado do título da página, este menu suspenso lista todas as equipes existentes e permite alternar rapidamente entre elas.
- **Modo Somente Leitura**: Por padrão, ao abrir o editor, os detalhes da equipe e os pilotos atribuídos são exibidos no modo somente leitura. Os campos de formulário, a seleção de logotipo e as ações de atribuição ficam bloqueados para evitar alterações acidentais.
- **Modo de Edição**: Clicar no ícone **Editar** (lápis) na barra de ferramentas desbloqueia os campos de entrada e os controles de atribuição. No modo de edição, o seletor de equipe fica bloqueado para evitar sair acidentalmente com alterações não salvas.
- **Salvamento Automático Contínuo**: Conforme você faz alterações (editar o nome, selecionar um logotipo ou reordenar/atribuir pilotos), suas edições são salvas automaticamente em segundo plano no servidor sem sair do modo de edição.
- **Concluir Edição**: Clicar no ícone **Concluir Edição** (marca de seleção) valida suas alterações, garante sua persistência no servidor e retorna ao modo somente leitura.
- **Descartar Alterações**: Se você tentar sair do editor com alterações não salvas ou inválidas, a caixa de diálogo solicitará confirmação. Descartar reverte todas as modificações para a última versão salva.

## Ações da Barra de Ferramentas

A barra de ferramentas superior oferece as seguintes ações:

- **Voltar**: Retorna à visualização anterior ou à Configuração do Dia de Corrida.
- **Adicionar Equipe (+)**: Cria um novo modelo de equipe e entra no modo de edição.
- **Duplicar Equipe**: Duplica a equipe atualmente selecionada com um nome exclusivo.
- **Editar / Concluir Edição**: Alterna entre o modo somente leitura e o modo de edição.
- **Excluir Equipe**: Exclui a equipe selecionada após confirmação.
- **Desfazer / Refazer**: Reverte ou reaplica edições recentes realizadas durante a sessão.
- **Ajuda (?)**: Abre o tour guiado interativo destacando cada seção do editor.

## Configuração da Equipe

- **Nome da Equipe**: O nome exclusivo da equipe exibido em tabelas de classificação e telas de corrida.
- **Imagem / Logotipo da Equipe**: Escolha um ícone predefinido ou envie um logotipo personalizado para representar a equipe.

## Membros da Equipe & Escalação

- **Pilotos Atribuídos**: Pilotos atualmente designados para esta equipe. No modo de edição, arraste e solte os pilotos para reordenar a escalação ou clique no botão Remover (X) para desatribuir um piloto.
- **Pilotos Disponíveis**: Pilotos que ainda não estão atribuídos a esta equipe. No modo de edição, clique em um piloto para adicioná-lo à escalação da equipe.
