# Editor de Eventos

O **Editor de Eventos** permite criar, configurar e gerenciar eventos com múltiplas corridas. No Race Coordinator AI, um evento conecta várias configurações de corrida distintas em uma progressão sequencial—como baterias classificatórias que avançam para semifinais e finais, ou torneios com múltiplas fases.

## Visão Geral

O Editor de Eventos conta com uma interface clara de dois painéis para organizar competições por etapas:

- **Seletor de Eventos**: Localizado no cabeçalho superior ao lado do título, este menu suspenso lista todos os eventos salvos e permite alternar rapidamente entre eles com os botões anterior e próximo.
- **Modo Somente Leitura**: Por padrão, o editor abre em modo somente leitura para evitar alterações acidentais nas sequências de corrida.
- **Modo de Edição**: Clicar no ícone de **Editar** (lápis) na barra de ferramentas desbloqueia os campos do formulário e os controles de sequência.
- **Salvamento Automático Contínuo**: As alterações no nome, descrição, tempo de avanço automático e progressão são salvas automaticamente em segundo plano.
- **Sair do Modo de Edição**: Clicar no ícone **Edição Concluída** (marca de seleção) valida o evento, salva as alterações e retorna ao modo somente leitura.

---

## Ações da Barra de Ferramentas

A barra de ferramentas superior oferece ações fundamentais para gerenciar o evento:

- **Voltar**: Retorna à tela anterior ou à Configuração do Dia de Corrida.
- **Adicionar Evento (+)**: Cria um novo modelo de evento com configurações padrão e entra em Modo de Edição.
- **Duplicar Evento**: Clona o evento atual com um novo nome exclusivo.
- **Editar / Edição Concluída**: Alterna entre Modo Somente Leitura e Modo de Edição (atalho de teclado: `Cmd/Ctrl+E`).
- **Excluir Evento**: Exclui permanentemente o evento selecionado após confirmação.
- **Desfazer / Refazer**: Reverte ou reaplica alterações recentes feitas durante a sessão.
- **Ajuda (?)**: Inicia o tour guiado interativo destacando cada seção do editor.

---

## Configuração do Evento {: #event-configuration }

O painel esquerdo configura metadados gerais e a transição automática entre etapas:

- **Nome do Evento**: Um nome de exibição exclusivo que identifica o evento em todo o aplicativo e tabelas de classificação.
- **Descrição**: Uma área de texto opcional para observações, regulamentos de etapas ou instruções do torneio.
- **Tempo de Avanço Automático**: A contagem regressiva (em segundos) a aguardar após o término de uma corrida antes de carregar e avançar automaticamente para a próxima corrida da sequência. Definir `0` desativa o avanço automático.

---

## Sequência de Corridas {: #race-sequence }

O painel direito gerencia a progressão ordenada de corridas que compõem o evento:

- **Adicionar Corrida**: No Modo de Edição, clique no botão **+ Adicionar Corrida** para escolher corridas salvas e anexá-las à sequência.
- **Ordem de Progressão**: As corridas ocorrem ordenadamente de cima para baixo (Etapa #1, Etapa #2, etc.). No Modo de Edição, arraste a alça (<span class="material-icons">drag_indicator</span>) em qualquer cartão para reorganizar as etapas.
- **Limites de Pilotos**: Cada etapa pode restringir a quantidade de pilotos:
  - **Ilimitado (Todos os Pilotos)**: Todos os pilotos qualificados da etapa anterior participam desta corrida.
  - **Limite Numérico**: Defina o número exato dos melhores pilotos classificados que avançam para esta etapa (ex.: os 8 melhores para as semifinais). Clique em **Ilimitado** para alternar entre limite numérico e todos os pilotos.
- **Remover Corrida**: No Modo de Edição, clique no ícone da lixeira (<span class="material-icons">delete</span>) para remover uma etapa. Todo evento deve conter pelo menos uma corrida.

