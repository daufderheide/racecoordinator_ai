# Editor de Interface

## Visão Geral

O Editor de Interface permite criar layouts personalizados para o dia de corrida, configurar colunas da classificação dos pilotos, personalizar efeitos sonoros e imagens de temas e carregar [Widgets Personalizados](custom-widgets.md) modulares.

## Widgets personalizados e pasta de widgets

Widgets personalizados podem ser adicionados aos seus layouts de interface personalizados:
- **Pasta de widgets personalizados**: Defina a sua pasta local de widgets na seção **Interface personalizada** na parte inferior do editor.
- **Atualizar widgets de amostra**: Clique em **Atualizar widgets de amostra** para gerar ou atualizar widgets de amostra prontos a usar numa pasta `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Grupos da biblioteca de widgets**: A biblioteca de widgets organiza os widgets em grupos (**Race Coordinator AI**, **Raiz personalizada** e pastas personalizadas como **sample**) com subgrupos aninhados (como **Ações** e **Dados da manga** com subpastas categorizadas) e um filtro de pesquisa instantâneo.
- **Configuração dinâmica**: Quando um widget personalizado é selecionado na tela, as suas propriedades personalizadas (cores, limites, seletores, campos de texto) aparecem dinamicamente na Configuração de widgets.

Para mais detalhes sobre o desenvolvimento de widgets, consulte o [Guia de widgets personalizados](custom-widgets.md).

## Configuração de layout e colunas

- Arraste e solte widgets da paleta no ecrã.
- Redimensione, reposicione e alinhe widgets de acordo com a resolução do ecrã. Todos os widgets permanecem delimitados dentro do ecrã.
- **Controlos da Configuração de Widgets**:
  - **Posição e tamanho**: Posicione e dimensione com precisão o widget selecionado utilizando os campos numéricos **X**, **Y**, **Largura** e **Altura**.
  - **Excluir widget**: Clique no ícone do lixo no cabeçalho de configuração.
- **Atalhos de teclado**:
  - <kbd>Delete</kbd> ou <kbd>Backspace</kbd>: Remove o widget selecionado do layout.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Move o widget selecionado 1px (ou 10px mantendo <kbd>Shift</kbd> pressionado).
  - <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Desfazer a ação anterior.
  - <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>: Refazer.
- Configure ordem de colunas, visibilidade, âncoras e preferências de largura.

## Configuração do Widget de Cronómetro

O widget **Cronómetro** exibe o tempo decorrido ou restante da manga/corrida com estilos de apresentação configuráveis:

- **Formato de exibição**:
  - **Dinâmico (1:23 / 45s)**: Exibição compacta que omite zeros à esquerda e descarta a unidade de minutos quando inferior a um minuto.
  - **Minutos e segundos (01:23 / 00:45)**: Dois dígitos constantes para minutos e segundos, evitando saltos de comprimento de texto e redimensionamento brusco de tamanho de fonte em modo de escala automática.
  - **Minutos e segundos (1:23 / 0:45)**: Mantém os minutos abaixo de um minuto (`0:45`), utilizando apenas um dígito para minutos quando superior a um minuto (`1:23`).
  - **Relógio completo (00:01:23 / 00:00:45)**: Relógio digital fixo de oito carateres (`HH:MM:SS`), ideal para corridas de resistência.
  - **Segundos totais (83s / 45s)**: Exibe os segundos totais decorridos ou restantes sem subdivisão em minutos ou horas.
- **Sub-segundos**:
  - **Abaixo do limite**: Exibe frações de segundo (1 a 3 casas decimais) assim que o tempo desce abaixo do limite configurado (por exemplo, últimos 10 segundos).
  - **Sempre**: Exibe frações de segundo continuamente durante toda a manga.
  - **Nunca**: Limita o cronómetro exclusivamente a segundos inteiros.
- **Pré-visualização**: O painel de configuração inclui uma pré-visualização instantânea que demonstra a formatação das opções selecionadas em diferentes fases da corrida (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).

> [!NOTE]
> Estas opções exatas de formatação de tempo (predefinições de formato de exibição, modos de frações de segundo, limite e controlo deslizante de casas decimais com pré-visualização ao vivo) também são suportadas nos widgets de **Tempo Total** (Tempo Total da Bateria e Tempo Total da Corrida/Geral) e nas colunas de **Tempo Total** na Vista de Pistas. Na lista de colunas da Vista de Pistas, clique no ícone de opções de tempo (<span class="material-icons">more_time</span>) junto a qualquer coluna de Tempo Total para personalizar o seu formato.

## Configuração do widget de contagem decrescente

O widget **Contagem Decrescente** exibe o semáforo visual de partida e aciona os efeitos sonoros correspondentes durante o procedimento de largada:

- **Lâmpadas máximas**: Define o número máximo de luzes a apresentar (predefinição 5, intervalo de 1 a 10). Quando a duração da contagem ultrapassa este valor (por exemplo, uma partida de 6 segundos com o máximo de 5 lâmpadas), todas as luzes permanecem apagadas/atenuadas durante a diferença inicial (1 segundo) antes de acenderem sequencialmente.
- **Animação de fade-in**: Controla se a sobreposição do semáforo e o desfoque de fundo aparecem com uma transição suave. Quando desmarcado, as luzes e o fundo surgem de imediato.
- **Orientação**: Alterne entre a disposição **Horizontal** e **Vertical** do semáforo.
- **Efeitos de brilho e desfoque**: Personalize o halo luminoso das lâmpadas, a sobreposição de escala das luzes vermelhas/verdes e a intensidade ou área do desfoque de fundo.

## Widgets de Coluna de Pista e Duplicação

O widget **Coluna de Pista** permite posicionar colunas individuais de dados da visualização de pista (como informações do piloto, tempo da última volta, melhor volta / recorde pessoal, combustível %, histórico de voltas, velocidades de setor, posição, etc.) em qualquer lugar da tela como cartões modulares independentes.

- **Piloto Alvo e Cartões Individuais**:
  - Cartões individuais colocados fora de uma grade escolhem qual piloto exibir: por **Pista** (Pista 1 a Pista 8), por **Posição da Bateria** (1º, 2º, etc.), por posto na **Classificação Geral** ou por **Chaveamento do Piloto**.

### Widgets de inserção (Insets) e alinhamento

Cada cartão de coluna de pista suporta até 8 **espaços de inserção (Insets)** secundários dispostos ao redor do perímetro do dado principal (Superior esquerdo, Superior centro, Superior direito, Centro esquerdo, Centro direito, Inferior esquerdo, Inferior centro, Inferior direito):

- **Vinculação de dados**: Os insets podem exibir métricas secundárias (ex.: melhor volta, contagem de voltas, combustível %, baterias disputadas, nome do piloto), imagens/avatares ou widgets personalizados incorporados.
- **Alinhamento horizontal e vertical**:
  - Na aba Inset do inspetor, cada inserção posicionada oferece opções de **Alinhamento horizontal** (**Esquerda**, **Centro**, **Direita**) e **Alinhamento vertical** (**Superior**, **Centro**, **Inferior**).
  - Os insets adotam por padrão sua posição perimétrica natural (ex.: `Superior esquerdo` padroniza como Esquerda/Superior, `Inferior direito` como Direita/Inferior), assegurando total compatibilidade visual com layouts existentes enquanto possibilita ajuste fino dentro de cada espaço.
- **Estilos personalizados**: Os insets podem herdar fontes e cores da coluna ou definir tipografia, cores de texto, casas decimais e limites de formato personalizados.

### Origens de Dados da Grade: Dados da Bateria vs. Dados Gerais da Corrida

Toda grade de dados no Editor de UI possui uma configuração de **Origem de dados** na aba Grade, que define quais pilotos preenchem as linhas da grade:

- **Dados da Bateria (`heat`)**:
  - **Escopo de Pilotos**: Vinculado exclusivamente aos participantes que competem ativamente na bateria atual na pista (`heatDrivers`).
  - **Comportamento de Exibição**: Apenas os pilotos atualmente na pista na bateria ativa são mostrados. Pilotos em descanso ou escalados em outras baterias são omitidos.
  - **Paginação e Rolagem**: A contagem de linhas é estritamente limitada aos pilotos da bateria ativa e às pistas físicas. A grade nunca rola além dos participantes ativos para linhas vazias.
- **Dados Gerais da Corrida (`overall`)**:
  - **Escopo de Pilotos**: Vinculado a **todos os participantes inscritos** em todo o torneio ou evento (`participants`).
  - **Comportamento de Exibição**: Qualquer piloto inscrito no evento pode ser exibido na grade, esteja correndo na pista na bateria atual ou aguardando nos boxes.
  - **Paginação e Rolagem**: A contagem de linhas reflete todo o grid do torneio (ex. 16, 24 ou 32 pilotos distribuídos em várias baterias). Se a grade tiver menos linhas visíveis do que o total de participantes, ela suporta rolagem automática multipágina para percorrer toda a classificação geral.
  - **Pilotos Fora da Pista**: Para os pilotos que não estão na pista no momento, estatísticas acumuladas da competição são fornecidas automaticamente.

### Widgets: Widgets de Dados da Bateria vs. Widgets de Dados Gerais

A Caixa de ferramentas organiza as colunas e cartões de dados nos grupos **Dados da Bateria** e **Dados Gerais**. A escolha do widget determina quais estatísticas são calculadas e exibidas em cada linha:

- **Widgets de Dados da Bateria** (ex. *Contador de Voltas, Tempo da Última Volta, Melhor Volta da Bateria, Tempo de Setor, Tempo de Reação, Posição / Colocação na Bateria, Diferenças da Bateria, Combustível / Telemetria, Ritmo Fantasma*):
  - Extraem métricas de desempenho estritamente da **bateria ativa**.
  - **Em uma Grade de Dados da Bateria**: Cada linha exibe telemetria em tempo real e tempos de volta dos carros que estão competindo na pista.
  - **Em uma Grade de Dados Gerais**: Os pilotos em pista exibem sua telemetria ao vivo; pilotos inativos ou descansando exibem traços (`--`) ou zeros para métricas específicas da bateria, pois não produzem dados na bateria em andamento.
- **Widgets de Dados Gerais da Corrida** (ex. *Classificação Geral, Total de Voltas, Voltas Físicas Totais, Tempo Total Geral, Melhor Volta da Corrida, Média Geral, Mediana Geral, Consistência Geral, Diferenças Gerais, Probabilidade de Vitória / Previsões, Baterias Disputadas / Baterias Restantes*):
  - Extraem métricas de desempenho acumuladas de **todas as baterias concluídas** no evento.
  - **Em uma Grade de Dados Gerais**: Cada linha de piloto (na pista ou nos boxes entre baterias) exibe suas estatísticas gerais completas, total de voltas no torneio, melhor volta da prova e colocação na classificação geral.
  - **Em uma Grade de Dados da Bateria**: Os pilotos ativos exibem sua classificação geral e estatísticas acumuladas ao lado de suas voltas na bateria ao vivo (ex. acompanhar a classificação global do evento durante a corrida ativa).

#### Widget de Baterias Disputadas e Restantes

O widget **Baterias Disputadas** (`heatsRaced`) exibe o progresso de participação nas baterias de cada piloto:

- **Baterias Disputadas (Modo Padrão)**: Exibe a quantidade de baterias que o piloto já disputou ou está disputando no momento no evento.
- **Modo Baterias Restantes**: Quando a opção **Modo de exibição de baterias** é alternada de *Baterias disputadas* para *Baterias restantes*, o cartão exibe quantas baterias programadas o piloto ainda tem por disputar. Se nenhum rótulo de cabeçalho personalizado for definido, o título muda automaticamente de `BATERIAS DISPUTADAS` para `BATERIAS RESTANTES`.
- Essa configuração também está disponível para itens inset vinculados a qualquer cartão de coluna.

#### Widgets de Diferença (Gaps e Intervalos)

O Race Coordinator AI fornece **2 widgets de diferença configuráveis** para Dados da Bateria e Dados Gerais:

1. **Diferença da Bateria (`gap`)**: Avalia os intervalos em tempo real estritamente entre os carros que competem na bateria atual.
2. **Diferença Geral (`overallGap`)**: Avalia os intervalos acumulados entre todos os participantes do evento.

Cada widget de diferença pode ser configurado no Inspetor de Colunas por meio de duas opções principais:
- **Alvo**:
  - **Líder**: Intervalo em relação ao líder atual da corrida (P1).
  - **Posição à frente**: Intervalo em relação ao concorrente imediatamente à frente na classificação (ex.: P3 vs P2).
- **Modo de cálculo**:
  - **Sempre tempo**: Projeção matemática contínua de ritmo em segundos (`+X.XXX`).
  - **Tempo e voltas atrás**: Estilo Fórmula 1 exibindo o tempo na mesma volta ou o déficit de voltas (`+1 Volta`, `+N Voltas`) em caso de volta perdida.
  - **Sempre voltas**: Diferença exata de voltas calculada ao completar cada volta, incorporando o progresso de volta parcial do piloto comparado.

> [!NOTE]
> Vários widgets de diferença com configurações distintas (por exemplo, uma coluna para Diferença para o Líder e outra para o Carro da Frente) podem ser inseridos simultaneamente na mesma grade ou layout.

Para consultar as fórmulas matemáticas completas e as especificações de cronometragem, consulte o [Guia de Cálculos de Diferenças](gap-calculations.md).

#### Widget de Últimas Voltas (`lastLaps`)

O widget **Últimas Voltas** (`lastLaps`) exibe os tempos das voltas recentes completadas pelo piloto na bateria ativa:

- **Últimas voltas a exibir**: Configura quantas voltas recentes renderizar no widget (controle deslizante 1–20, campo numérico 1–50). O padrão é `5`.
- **Separação de voltas e bordas**: Configura como as voltas individuais são separadas. As opções incluem estilo de borda (sólido, tracejado, pontilhado, duplo), cor da borda, largura da borda (1–10px), margem da borda (-20px a 40px+ para controlar a distância interna ou externa da borda e alinhá-la perfeitamente com as bordas das colunas adjacentes), raio dos cantos (0–32px) e modo de separação (linha divisória entre as voltas ou caixa de borda ao redor de cada volta).
- **Destaque da melhor volta**: Destaca se uma volta na lista representa o melhor tempo do piloto. As opções incluem cor do texto, cor de fundo do emblema, peso da fonte (normal, negrito, mais negrito/900), sublinhado, itálico e bordas de destaque exclusivas para a melhor volta.
- **Ajuste e dimensionamento dinâmicos**: O cartão ajusta automaticamente os tamanhos de fonte e espaçamento para encaixar perfeitamente a quantidade configurada de voltas na geometria da coluna.
- **Sincronização na grade**: Em grades de pistas, configurar ou aplicar formatos de tempo sincroniza o total de últimas voltas e sua estilização em todas as pistas concorrentes.

### Ordenação da Grade e Matriz de Interação

O menu suspenso **Classificação da Grade** na aba Grade controla a ordem das linhas. Seu comportamento depende diretamente da **Origem de dados** selecionada (**Dados da Bateria** ou **Dados Gerais**):

| Opção de Ordenação | Em Grade de Dados da Bateria (`gridType: heat`) | Em Grade de Dados Gerais (`gridType: overall`) |
| :--- | :--- | :--- |
| **Pista** | Ordenação estática por pista física (Pista 1, Pista 2, ...). Cada linha está vinculada a uma pista específica e ao seu piloto designado. | Pilotos ativos na pista aparecem primeiro por número de pista (Pista 1, Pista 2, ...), seguidos por todos os participantes inativos ordenados por sua posição na classificação geral. |
| **Posição da Bateria** | Reordenação dinâmica em tempo real por posição na bateria ativa (1º, 2º, 3º na bateria). As linhas alternam de posição ao vivo nas ultrapassagens ou passagens na linha de chegada. | Pilotos ativos aparecem no topo ordenados pela posição na bateria (1º, 2º, ...), seguidos por todos os participantes inativos ordenados pela classificação geral. |
| **Classificação Geral** | Ordena **exclusivamente os pilotos da bateria ativa** por sua posição na classificação geral do torneio. (Por exemplo, se competem na bateria os pilotos 2º, 5º, 8º e 14º na geral, as 4 linhas os ordenam #2, #5, #8, #14). Nunca exibe pilotos fora da bateria nem gera linhas vazias. | Ordena **todo o grid de participantes** de acordo com a classificação geral da prova (1º geral, 2º geral, 3º geral, ...). Todo o painel se reordena ao vivo conforme pontos e voltas são atualizados. |
| **Chaveamento do Piloto** | Ordena os pilotos da bateria ativa por sua posição inicial de qualificação/chaveamento (menor número primeiro). | Ordena todos os participantes da prova por sua posição inicial de chaveamento (1, 2, 3, ...) em todo o grid. |
- **Orientação**: Suporta layouts **Vertical** (cabeçalho acima do valor) e **Horizontal** (cabeçalho e valor lado a lado).
- **Estilo e Personalização da Barra de Título**:
  - A barra de título segue por padrão o mesmo estilo do cabeçalho de coluna da visualização de pista (fundo escuro semitransparente `rgba(68, 68, 68, 0.7)`, texto branco em negrito, cantos superiores arredondados e borda divisória).
  - **Mostrar Cabeçalho**: Ativa ou desativa a barra de título. Ao ser desativada, a barra de título é totalmente removida do cartão, maximizando a área para os valores principais e inserções.
  - **Rótulo Personalizado**: Substitui o nome padrão do ponto de dados por um título personalizado.
  - **Tipografia e Alinhamento**: Configure a fonte, o tamanho do texto e o alinhamento (Esquerda, Centralizado, Direita).
  - **Cor do Texto e do Fundo**: Personalize a cor de fundo e a cor do texto do cabeçalho com seletores de cores dedicados e botão de restauração padrão em um clique.
- **Herança de Cores e Personalização**: Por padrão, os cartões herdam as cores de fundo e texto da pista atribuída (`Usar Cores da Pista`), ou podem receber cores personalizadas de fundo, texto e borda.
- **Duplicar em Pistas / Posições**:
  - Em vez de criar e alinhar cartões manualmente para cada pista, configure um único cartão para uma pista ou posição e clique em **Duplicar em Pistas / Posições...** no painel de configuração.
  - Escolha a direção (**Horizontal** lado a lado ou **Vertical** empilhado), o número total de pistas/posições de destino (por padrão o número máximo de pistas em todos os circuitos no banco de dados), o modo de espaçamento (**Ajustar à Tela** ou **Preservar Espaçamento**) e a substituição opcional dos widgets existentes.
  - **Modo de Replicação em Tempo Real**: Ao duplicar, o editor entra em um modo interativo de modelo com guias visuais de pista e alinhamento magnético. Nesse modo, você posiciona, redimensiona e edita widgets diretamente na Pista 1 (Mestre), e as alterações são espelhadas imediatamente em tempo real para todas as demais pistas. Os widgets espelhados nas pistas 2..N são pré-visualizações ativas somente leitura; clicar em qualquer widget espelhado direciona o foco para o mestre da Pista 1.
  - **Área Inteligente e Redimensionamento**: O espaço de replicação expande-se automaticamente em todas as quatro direções para preencher o espaço disponível na tela até encontrar os limites de qualquer widget existente fora da grade. Você pode ajustar a área total dinamicamente usando as 8 alças de redimensionamento no perímetro da sobreposição.
  - Clique em **Concluído** para consolidar a grade em widgets independentes.
  - **Editar Modelo e Desvincular**: Ao selecionar qualquer widget da grade posteriormente, a Configuração de widgets exibe um cartão permitindo clicar em **Editar Modelo da Grade** (para reentrar no modo de replicação em tempo real a qualquer momento) ou **Desvincular da Grade** (para quebrar permanentemente o vínculo).

### Sincronização de Grade: Espelhar Colunas vs. Espelhar Linhas

Uma grade no Race Coordinator AI é uma matriz bidimensional organizada em posições de competidores e métricas de dados:

- **Orientação Vertical (Padrão)**:
  - **Linhas (Posições dos Competidores)**: Representam cada pista física individual (**Pista 1, Pista 2, ...**) ou posição na corrida (**Posição 1, Posição 2, ...**).
  - **Colunas (Campos de Dados)**: Representam cada métrica de dados exibida em uma posição (por exemplo, *Nome do Piloto, Voltas da Bateria, Tempo da Última Volta, Melhor Volta, Diferença, Imagem do Carro*).
  - **Espelhar Colunas**: Controla a sincronização do estilo visual entre todas as colunas de dados.
  - **Espelhar Linhas**: Gerencia a replicação e a geometria linha a linha partindo da **Linha Mestre (Pista 1 / Posição 1)** para todas as demais linhas (**Pistas 2..N**).
- **Orientação Horizontal**:
  - **Colunas (Posições dos Competidores)**: Representam cada pista física individual (**Pista 1, Pista 2, ...**) ou posição na corrida (**Posição 1, Posição 2, ...**). Cada pista em uma visualização de bateria é uma coluna.
  - **Linhas (Campos de Dados)**: Representam as métricas de dados empilhadas verticalmente dentro de cada pista.
  - **Espelhar Colunas**: Gerencia a replicação de coluna a coluna, a geometria e o estilo a partir da **Coluna Mestre (Pista 1 / Posição 1)** para todas as demais colunas (**Pistas 2..N**). Quando desmarcado, as colunas (pistas) tornam-se independentes e surge o botão **Reespelhar em todas as colunas**.
  - **Espelhar Linhas**: Controla a sincronização do estilo visual entre todas as linhas de dados (métricas).

O Inspetor de grade oferece dois controles primordiais na seção **Estrutura e layout da grade**: **Espelhar Colunas** e **Espelhar Linhas**.

#### Espelhar Colunas

**Espelhar Colunas** sincroniza colunas em toda a grade:
- Na **Orientação Vertical**, as colunas representam diferentes campos/métricas de dados. Espelhar Colunas harmoniza o estilo visual entre essas colunas de métricas.
- Na **Orientação Horizontal**, as colunas representam pistas ou posições individuais da pista. Espelhar Colunas gerencia a replicação, o dimensionamento e o estilo a partir da **Coluna Mestre (Pista 1 / Posição 1)** para todas as pistas competidoras.

- **Marcado (Padrão)**:
  - As colunas compartilham estilos vinculados (na orientação vertical) ou replicação completa do modelo mestre (na orientação horizontal).
  - Qualquer alteração feita no mestre propaga-se imediatamente para todas as colunas.
  - **Propriedades Sincronizadas**:
    - **Estilo do Cabeçalho**: Família da fonte, tamanho da fonte, cor do texto, cor de fundo, alinhamento do texto e dimensões do cabeçalho.
    - **Estilo da Célula de Dados**: Família da fonte, tamanho da fonte, cor do texto, cor de fundo, alternância de cores de pista (`useLaneColors`) e alinhamento dos valores.
    - **Estilo de Borda**: Exibição de borda, cor da borda, espessura da borda e raio dos cantos.
    - **Formatação de Tempo**: Casas decimais, formato de exibição e limites de precisão de subsegundos.
    - **Destaque de Telemetria**: Destaque na passagem de volta.
- **Desmarcado**:
  - Desacopla a sincronização de colunas.
  - Na orientação vertical, cada coluna de dados pode ter tamanhos de fonte, cores e bordas independentes, e surgem botões para aplicar estilos manualmente a todas as colunas.
  - Na orientação horizontal, cada coluna de pista torna-se independente, os widgets passam a exibir o indicador **Independente** (por exemplo, `Pista 2 (Independente)`), e surge o botão **Reespelhar em todas as colunas**.
- **Comportamento ao Marcar Novamente**:
  - Reativa a sincronização de colunas. Na orientação horizontal, remarcar a caixa ou clicar em **Reespelhar em todas as colunas** sincroniza imediatamente todas as colunas com a pista mestre.

#### Espelhar Linhas

**Espelhar Linhas** sincroniza as linhas em toda a grade:
- Na **Orientação Vertical**, as linhas representam pistas ou posições individuais da pista. Espelhar Linhas gerencia a replicação e a geometria linha a linha partindo da **Linha Mestre (Pista 1 / Posição 1)** para todas as demais linhas (**Pistas 2..N**).
- Na **Orientação Horizontal**, as linhas representam diferentes campos ou métricas empilhados em cada pista. Espelhar Linhas gerencia a sincronização do estilo visual entre as linhas de métricas.

- **Marcado (Padrão)**:
  - As linhas seguem rigorosamente o modelo mestre (na orientação vertical) ou compartilham estilos sincronizados (na orientação horizontal).
  - Qualquer movimentação, redimensionamento ou alteração na célula mestre replica-se imediatamente em tempo real para todas as outras pistas ou posições.
  - Na orientação vertical, os widgets não mestres exibem o indicador **Espelhado** (por exemplo, `Pista 2 (Espelhado)`).
- **Desmarcado**:
  - Desacopla as linhas.
  - Na orientação vertical, as linhas não mestres exibem o indicador **Independente** (por exemplo, `Pista 2 (Independente)`), as pistas podem ser personalizadas individualmente e surge o botão **Reespelhar em todas as linhas**.
  - Na orientação horizontal, cada linha de métrica pode ter estilos independentes sem afetar as demais linhas.
- **Comportamento ao Marcar Novamente**:
  - Reativa a replicação e a sincronização de linhas. Na orientação vertical, clicar em **Reespelhar em todas as linhas** ou remarcar a caixa alinha imediatamente todas as linhas à linha mestre.

#### Linhas extras

Quando uma grade contém linhas desocupadas (como quando há menos pilotos em uma corrida ou bateria do que linhas/pistas configuradas), a configuração **Linhas extras** no Inspetor de grade define como essas linhas são tratadas:

- **Remover**: Remove automaticamente as linhas e colunas desocupadas, ajustando a grade à quantidade real de pilotos participantes. (Padrão para grades de **Classificação Geral** e **Chaveamento do Piloto**).
- **Mostrar vazio**: Mantém as linhas extras visíveis exibindo `--` para todos os valores e campos embutidos, preservando cabeçalhos e molduras dos cartões. (Padrão para grades de **Bateria** e **Pista**).
- **Mostrar em branco**: Mantém as linhas extras visíveis exibindo apenas as bordas e o fundo dos cartões, sem qualquer valor ou cabeçalho.

#### Tabela Comparativa

| Controle | Orientação | Escopo | O Que Sincroniza | Comportamento ao Desmarcar | Comportamento ao Marcar Novamente |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Espelhar Colunas** | Vertical | Colunas (Métricas de Dados) | Estilo visual: fontes, tamanhos, cores, bordas, cabeçalhos, formatos | As colunas tornam-se independentes; estilos existentes são mantidos; botões manuais «Aplicar a todas» aparecem | Reativa a sincronização automática para alterações futuras |
| **Espelhar Colunas** | Horizontal | Colunas (Pistas / Competidores) | Geometria, replicação e estilos da Pista 1 Mestre para todas as colunas de pista | As colunas de pista tornam-se independentes; indicador `Independente` exibido; botão `Reespelhar em todas as colunas` aparece | Restabelece a replicação mestre; alinha todas as colunas ao Mestre |
| **Espelhar Linhas** | Vertical | Linhas (Pistas / Competidores) | Geometria, replicação e configurações da Pista 1 Mestre para todas as linhas de pista | As linhas de pista tornam-se independentes; indicador `Independente` exibido; botão `Reespelhar em todas as linhas` aparece | Restabelece a replicação mestre; alinha todas as linhas ao Mestre |
| **Espelhar Linhas** | Horizontal | Linhas (Métricas de Dados) | Estilo visual: fontes, tamanhos, cores, bordas entre linhas de métricas | Linhas de métricas tornam-se independentes; estilos existentes são mantidos | Reativa a sincronização automática para alterações futuras |


