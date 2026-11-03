# Editor de Temporada

O **Editor de Temporada** permite criar, gerenciar e revisar temporadas de campeonato. Uma temporada acompanha a pontuação ao longo de várias corridas e eventos, acumula pontos para os pilotos, aplica regras de descarte e calcula classificações em tempo real.

## Visão Geral

O Editor de Temporada conta com uma interface completa para gerenciar o campeonato:

- **Seletor de Temporadas**: Localizado no cabeçalho superior ao lado do título da página, este menu suspenso lista todas as temporadas salvas e permite alternar rapidamente entre elas com os botões anterior e próximo.
- **Modo Somente Leitura**: Por padrão, o editor abre em modo somente leitura para evitar alterações acidentais nas classificações e corridas registradas.
- **Modo de Edição**: Clicar no ícone de **Editar** (lápis) na barra de ferramentas desbloqueia os campos e os controles para adicionar ou remover corridas.
- **Salvamento Automático Contínuo**: As alterações de nome, descartes e inclusão de corridas são salvas automaticamente em segundo plano.
- **Sair do Modo de Edição**: Clicar no ícone **Edição Concluída** (marca de seleção) valida a temporada, salva os dados e retorna ao modo somente leitura.

---

## Ações da Barra de Ferramentas

A barra de ferramentas superior oferece ações fundamentais para gerenciar o campeonato:

- **Voltar**: Retorna à tela anterior ou à Configuração do Dia de Corrida.
- **Adicionar Temporada (+)**: Cria um novo modelo de temporada com configurações padrão e entra em Modo de Edição.
- **Duplicar Temporada**: Clona a temporada atual com um novo nome exclusivo.
- **Editar / Edição Concluída**: Alterna entre Modo Somente Leitura e Modo de Edição (atalho de teclado: `Cmd/Ctrl+E`).
- **Excluir Temporada**: Exclui permanentemente a temporada de campeonato selecionada após confirmação.
- **Desfazer / Refazer**: Reverte ou reaplica alterações recentes feitas durante a sessão.
- **Ajuda (?)**: Inicia o tour guiado interativo destacando cada seção do editor.

---

## Configuração da Temporada {: #season-configuration }

O painel esquerdo configura as regras gerais do campeonato e parâmetros de pontuação:

- **Nome da Temporada**: Um nome exclusivo para o campeonato exibido em tabelas, relatórios e no Dia de Corrida.
- **Corridas Descartadas (Drops)**: O número de piores resultados descartados do total de pontos de cada piloto.

---

## Informações da Temporada e Gestão de Corridas {: #season-info-bar }

A barra acima do painel direito traz métricas de status e comandos para adicionar corridas:

- **Corridas Realizadas**: Exibe o total de corridas e eventos concluídos incluídos na temporada.
- **Selo de Corridas Demo**: Indica se corridas de treino ou demonstração foram registradas no histórico da temporada.
- **Adicionar Corrida**: No Modo de Edição, clique no botão **+ Adicionar Corrida** para escolher corridas finalizadas do histórico e adicioná-las à temporada.

---

## Classificação da Temporada {: #season-standings }

A seção de classificação calcula e exibe as posições do campeonato em tempo real:

- **Posição e Pódio**: Pilotos são ordenados por pontuação total; medalhas de ouro, prata e bronze destacam os três primeiros colocados.
- **Nome do Piloto**: Nome completo de cada piloto participante.
- **Pontos Líquidos**: Pontuação oficial usada para a classificação (pontos brutos menos deduções de descartes).
- **Pontos Descartados**: Soma dos pontos descartados conforme a regra de descartes.
- **Pontos Brutos**: Total de pontos acumulados em todas as corridas disputadas.
- **Corridas Realizadas**: Número de corridas em que o piloto participou.

---

## Detalhamento das Corridas {: #race-breakdowns }

A seção de detalhamento fornece cartões para cada corrida incluída na temporada:

- **Cartões de Corrida Expansíveis**: Clique em qualquer cartão para ver a tabela de resultados por piloto com pontos de posição e bônus.
- **Remover Corridas**: No Modo de Edição, clique no ícone da lixeira (<span class="material-icons">delete</span>) para remover uma corrida da temporada.

