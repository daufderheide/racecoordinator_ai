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
- **Editar / Concluir Edição**: Alterna entre o modo somente leitura e o modo de edição (atalho de teclado: Cmd/Ctrl+E).
- **Excluir Equipe**: Exclui a equipe selecionada após confirmação.
- **Desfazer / Refazer**: Reverte ou reaplica edições recentes realizadas durante a sessão.
- **Ajuda (?)**: Abre o tour guiado interativo destacando cada seção do editor.

## Perfil da Equipe {: #team-profile }

O painel esquerdo reúne as principais configurações de identidade e categorização da equipe:

- **Nome da Equipe**: O nome exclusivo da equipe exibido em tabelas de classificação, placares e telas do dia de corrida.
- **Imagem / Logotipo da Equipe**: Escolha um ícone predefinido ou envie um logotipo personalizado para representar a equipe.
- **Etiquetas da Equipe**: Atribua etiquetas codificadas por cores (semelhantes às etiquetas do GitHub) para organizar as equipes em categorias personalizadas (como "GT3", "Pro" ou "Amateur"). As equipes podem pertencer a várias etiquetas. No modo de edição, clique em **Gerenciar etiquetas** para criar, editar, recolorir, excluir ou atribuir etiquetas. Na tela de Configuração do Dia de Corrida, você pode filtrar as equipes disponíveis por etiqueta para preencher rapidamente as escalações.

## Membros da Equipe & Escalação {: #team-members }

A seção superior do painel direito exibe os pilotos atualmente designados para esta equipe:

- **Gestão da Escalação**: No modo de edição, você pode arrastar e soltar os pilotos usando a alça (`☰`) para reordenar a sequência da equipe, ou clicar no botão excluir (<span class="material-icons">delete</span>) para remover um piloto da equipe.
- **Rotação Round-Robin**: Quando uma equipe participa de uma corrida, os pilotos atribuídos são rotacionados automaticamente pelas baterias da equipe em ordem round-robin de acordo com esta lista.
- **Revezamento no Meio da Bateria**: Dependendo da configuração de corrida por equipe, os pilotos também podem se revezar no meio de uma bateria, seja durante um pit stop ou em qualquer ponto da pista.
- **Etiquetas de Piloto**: Cada piloto exibe suas etiquetas atribuídas como selos ao lado do seu nome para verificar com facilidade qualificações e níveis de habilidade.

## Pilotos Disponíveis {: #available-drivers }

A seção inferior do painel direito lista todos os pilotos registrados que não estão atualmente atribuídos a esta equipe:

- **Adicionar Pilotos**: No modo de edição, clique no cartão de qualquer piloto ou no botão de adicionar (<span class="material-icons">add</span>) para adicioná-lo imediatamente à escalação da equipe.
- **Membro de Múltiplas Equipes**: Um piloto pode pertencer a mais de uma equipe em seu banco de dados.
- **Prevenção de Conflitos na Corrida**: Embora um piloto possa pertencer a várias equipes, nenhum piloto pode participar mais de uma vez na mesma corrida, seja correndo por duas equipes rivais ou participando simultaneamente de forma individual e em equipe.
