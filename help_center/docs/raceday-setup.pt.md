# Configuração do Dia de Corrida

A tela de **Configuração do Dia de Corrida** é o ponto de partida de todas as provas no Race Coordinator AI. A partir dela, você configura os pilotos participantes, seleciona formatos de corrida e temporadas, verifica as rotações de baterias e inicia corridas oficiais ou de demonstração.

## Visão Geral {: #overview }

A tela é organizada em dois espaços principais:

- **Painel de Pilotos (Esquerda)**: Dividido em **Pilotos Disponíveis** (todos os pilotos disponíveis para correr) e **Pilotos na Corrida** (os participantes ativos e sua ordem de largada).
- **Configuração e Controles (Direita)**: Cartões de Início Rápido para corridas recentes, seletores de corrida e temporada, resumos de configuração em tempo real e botões de largada.
- **Barra de Menus Superior**: Acesso rápido a todos os gerenciadores, gerenciamento de arquivos e configurações gerais.

## Pilotos Disponíveis {: #available-drivers }

A seção **Pilotos Disponíveis** lista todos os pilotos e equipes elegíveis no seu banco de dados:

- **Adicionar Pilotos**: Arraste e solte um piloto para a lista da corrida ou dê um clique duplo para adicioná-lo ao final da lista.
- **Busca & Filtros**: Filtre em tempo real por nome ou apelido. Navegue com as setas e pressione Enter para adicionar.
- **Filtros por Etiquetas**: Filtre participantes através de etiquetas coloridas.
- **Gerenciamento de Pilotos e Equipes**: Clique nos botões **Equipes** ou **Pilotos** para abrir os gerenciadores correspondentes.
- **Validação de Escalação**: Pilotos selecionados não podem ser adicionados duas vezes. Se uma equipe participa, seus membros individuais são ocultados da lista de disponíveis.

## Pilotos na Corrida {: #racing-drivers }

A seção **Pilotos na Corrida** reúne os competidores da prova atual:

- **Ordem de Largada (Seeding)**: A ordem nesta lista define as posições de largada nas baterias. Arraste os pilotos para ajustar as posições.
- **Remover Pilotos**: Dê um clique duplo em um piloto ou arraste-o para fora da lista para removê-lo da corrida.
- **Barra de Ações**:
    - **Ver Lista Completa**: Abre a listagem com todos os pilotos e equipes.
    - **Adicionar Todos (+)**: Adiciona todos os pilotos disponíveis com um clique.
    - **Remover Todos (-)**: Limpa toda a lista da corrida.
    - **Embaralhar (Shuffle)**: Sorteia aleatoriamente as posições de largada.
- **Buscar Pilotos na Corrida**: Pesquise na lista de participantes ou pressione Enter para removê-los.

## Seleção de Corrida e Temporada {: #race-and-season-selection }

Permite escolher o formato da prova a ser disputada:

- **Seletor de Corrida**: Escolha entre corridas individuais ou eventos de várias etapas. Cada formato define regras de rotação, pontuação e condições de término.
- **Busca de Corrida**: Filtre corridas e eventos rapidamente pelo nome.
- **Seletor de Temporada**: Associe a corrida a um campeonato ou escolha **Nenhuma** para corrida avulsa.
- **Resumo de Configurações e Classificação**: Mostra detalhes (regras, combustível, modo mãos livres, pista, tema) ou a classificação atual da temporada.
- **Editar Corrida Selecionada**: Clique no ícone de lápis para ajustar parâmetros no Editor de Corrida.

## Corridas de Início Rápido {: #quick-start-races }

Acima do seletor de corridas, dois cartões de **Início Rápido** mostram as configurações utilizadas mais recentemente para seleção imediata.

## Iniciar uma Corrida {: #starting-a-race }

Quando a escalação e a configuração estiverem prontas, use os botões no canto inferior direito:

- **Iniciar Corrida**: Começa a prova oficial com o hardware de sensores ativo (ex: Arduino, Phidget, Trakmate).
- **Corrida Demo**: Simula uma corrida sem sensores físicos para testar telas e áudio.
- **Retornar / Encerrar Corrida**: Durante uma corrida ativa, retorne à transmissão ou encerre a prova.

## Barra de Menus {: #menu-bar }

A barra superior centraliza todas as funcionalidades do sistema:

- **Arquivo**: Carregar corridas, ver histórico, exportar/importar configurações ou sair.
- **Configuração**: Gerenciadores para pilotos, equipes, pistas, corridas, temporadas, temas e layouts.
- **Opções**: Interface de usuário, servidor, idioma, atualizações e modo de demonstração.
- **Ajuda**: Níveis de log, janela Sobre e Central de Ajuda.
