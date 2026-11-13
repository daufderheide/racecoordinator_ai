# Conjuntos de Rotações Personalizadas

## Visão Geral {: #overview }

O **Editor de Conjuntos de Rotações Personalizadas** permite conceber, editar e organizar esquemas de rotação de baterias sob medida para a sua pista. Enquanto o Race Coordinator AI fornece rotações algorítmicas padrão como **Round Robin**, **Round Robin Europeu**, **Bateria Única** e **Corridas Step Up**, os conjuntos de rotações personalizadas oferecem aos diretores de prova controlo manual total, pista por pista, sobre o escalonamento dos pilotos, a ordem das baterias e as atribuições de pistas.

Um **Ativo de Conjunto de Rotações Personalizadas** representa uma coleção (ou conjunto) de configurações de rotação individuais especificamente adaptadas ao número de pistas físicas de um traçado (como 2, 4, 6 ou 8 pistas). Dentro de um único ativo de conjunto de rotações personalizadas, pode definir múltiplos padrões de rotação otimizados para diferentes quantidades de participantes.

Os conjuntos de rotações personalizadas são ideais para:

- **Configurações de Pistas Irregulares:** Pistas com características de calha específicas, configurações com handicap ou exigências de via das boxes.
- **Formatos de Clube e Regras Internas:** Cronogramas tradicionais de clubes em que determinados emparelhamentos de pilotos ou sequências de pistas devem ser rigorosamente mantidos.
- **Sequências de Etapas e Turnos Fixos:** Corridas de exibição especiais, derbies ou formatos de equipas em que as sequências algorítmicas Round Robin não se ajustam ao regulamento do evento.

---

## Como Funcionam os Conjuntos de Rotações Personalizadas {: #how-custom-rotations-work }

### Capacidade Máxima de Pilotos por Rotação {: #maximum-driver-capacity }

Um ativo de conjunto de rotações personalizadas não define apenas um cronograma estático individual; contém um **conjunto de rotações**, onde **cada rotação especifica uma rotação para um número máximo de pilotos** (`numDrivers`).

Dentro de cada rotação:

- **Cabeças de Série de Pilotos Virtuais:** Os pilotos são identificados por números de cabeça de série: `Piloto 1`, `Piloto 2`, ... até `Piloto N` (em que `N` é a capacidade máxima de pilotos da rotação).
- **Atribuições de Pista:** Para cada bateria, a cada pista física é atribuída uma cabeça de série virtual específica (por ex. Pista 1: Piloto 1, Pista 2: Piloto 2), ou deixada vazia/não atribuída.
- **Alocação de Participantes:** Quando uma corrida tem início, os pilotos inscritos são alocados às cabeças de série 1 a $M$ de acordo com a sua ordem de qualificação (ou sorteio).

Por exemplo, um ativo "Sprint de Clube de 4 Pistas" pode conter:

- Uma **Rotação para 4 Pilotos:** Um cronograma de 4 baterias em que 4 pilotos competem uma vez em cada uma das 4 pistas.
- Uma **Rotação para 5 Pilotos:** Um cronograma de 5 baterias em que 5 pilotos alternam nas 4 pistas, descansando um piloto em cada bateria.
- Uma **Rotação para 6 Pilotos:** Um cronograma de 6 baterias garantindo tempo de pista equilibrado.
- Uma **Rotação para 8 Pilotos:** Um cronograma de 8 baterias adequado a grelhas de partida mais extensas.

---

### Algoritmo de Seleção de Rotação {: #rotation-selection-algorithm }

Quando começa uma corrida configurada com um formato de rotação personalizada (ou durante a geração da pré-visualização ao vivo das baterias no editor de corridas), o Race Coordinator AI determina automaticamente qual rotação do conjunto do ativo deve ser utilizada.

O sistema conta o número de pilotos ativos participantes (`driverCount`) e seleciona a rotação ideal através de uma rigorosa **estratégia de priorização de três níveis**:

#### 1. Nível 1: Correspondência Exata {: #selection-tier-1 }
O sistema procura primeiro uma rotação cuja capacidade máxima de pilotos configurada (`numDrivers`) **corresponda exatamente** ao número de pilotos ativos (`numDrivers == driverCount`).

- **Resultado:** A rotação com correspondência exata é selecionada.
- **Mapeamento de Pistas:** Cada piloto participante corresponde 1:1 à sua cabeça de série virtual (o Piloto 1 corre como Cabeça de série 1, o Piloto 2 como Cabeça de série 2, etc.). Não existem pistas vazias, a menos que a própria rotação tenha sido desenhada com pistas desocupadas.

#### 2. Nível 2: Mais Próxima Superior (Menor Rotação Maior que o Número de Pilotos) {: #selection-tier-2 }
Caso nenhuma rotação corresponda ao número exato de pilotos, o sistema procura todas as rotações do conjunto cuja capacidade máxima de pilotos seja **maior** do que o número de pilotos ativos (`numDrivers > driverCount`). De entre estas, seleciona a rotação com a **menor diferença**:

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Resultado:** A rotação superior mais próxima é selecionada para garantir que todos os pilotos presentes possam correr.
- **Tratamento de Pistas Vazias:** Uma vez que existem menos pilotos presentes do que aqueles para os quais a rotação foi concebida, qualquer posição de pista atribuída a uma cabeça de série virtual superior ao número de pilotos ativos (`Cabeça de série > driverCount`) é automaticamente preenchida com uma **posição de piloto vazio** (`Driver.EMPTY_DRIVER`). Essa pista ficará desocupada nessa bateria, enquanto todos os participantes competem nas suas posições programadas.

#### 3. Nível 3: Mais Próxima Inferior (Maior Rotação Menor que o Número de Pilotos) {: #selection-tier-3 }
Se o número de pilotos ativos exceder a capacidade máxima de **todas** as rotações definidas no conjunto (por exemplo, se participarem 9 pilotos, mas a maior rotação do ativo suportar apenas 8), o sistema recorre à rotação com a **maior capacidade inferior ao número de pilotos ativos**:

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Resultado:** A rotação inferior mais próxima é selecionada.
- **Limitação de Capacidade:** Apenas os pilotos cuja cabeça de série se situe dentro da capacidade da rotação selecionada (Pilotos 1 a `numDrivers`) serão agendados para as baterias. Os pilotos com índices superiores a `numDrivers` não receberão alocação de bateria.

!!! tip "Dica de Criação: Cubra Todas as Dimensões da Grelha"
    Para garantir que todos os pilotos competem sem participantes excluídos nem pistas vazias imprevistas, crie uma rotação para cada dimensão esperada da grelha (por ex., 4, 5, 6, 7 e 8 pilotos) dentro do mesmo ativo de conjunto de rotações personalizadas.

---

### Exemplos Práticos de Seleção {: #selection-examples }

Suponha um ativo de conjunto de rotações personalizadas com três rotações definidas: **4 Pilotos**, **6 Pilotos** e **8 Pilotos**. A tabela abaixo ilustra qual rotação é selecionada pelo Race Coordinator AI consoante o número de participantes:

| Pilotos Registados | Disponíveis no Conjunto | Rotação Selecionada | Regra de Seleção | Comportamento na Pista e Pistas Vazias |
| :---: | :---: | :---: | :---: | :--- |
| **4 Pilotos** | 4, 6, 8 | **Rotação para 4 Pilotos** | **Nível 1 (Correspondência Exata)** | Ajuste perfeito. Todas as pistas ocupadas; competem os 4 pilotos. |
| **5 Pilotos** | 4, 6, 8 | **Rotação para 6 Pilotos** | **Nível 2 (Mais Próxima Superior)** | As posições de cabeça de série 6 correm vazias. Competem os pilotos 1–5. |
| **6 Pilotos** | 4, 6, 8 | **Rotação para 6 Pilotos** | **Nível 1 (Correspondência Exata)** | Ajuste perfeito. Todas as pistas ocupadas; competem os 6 pilotos. |
| **7 Pilotos** | 4, 6, 8 | **Rotação para 8 Pilotos** | **Nível 2 (Mais Próxima Superior)** | As posições de cabeça de série 8 correm vazias. Competem os pilotos 1–7. |
| **8 Pilotos** | 4, 6, 8 | **Rotação para 8 Pilotos** | **Nível 1 (Correspondência Exata)** | Ajuste perfeito. Todas as pistas ocupadas; competem os 8 pilotos. |
| **9 Pilotos** | 4, 6, 8 | **Rotação para 8 Pilotos** | **Nível 3 (Mais Próxima Inferior)** | Competem os pilotos 1–8. O piloto 9 não é agendado. |

---

## Criação de um Conjunto de Rotações Personalizadas {: #creating-custom-rotations }

Para criar um novo ativo de conjunto de rotações personalizadas:

1. Abra o **Gestor de Ativos** a partir do menu principal ou do ecrã de configuração.
2. No painel esquerdo, clique no botão **Novo Conjunto de Rotações Personalizadas** (ou filtre por **Conjuntos de Rotações Personalizadas** e selecione um cartão existente para editar).
3. O **Editor de Rotações** é aberto:
   - Ao criar um novo ativo, o editor apresenta inicialmente um cartão de estado vazio com orientações e uma hiperligação **Saiba mais sobre conjuntos de rotações personalizadas** para esta documentação.
   - Introduza um **Nome do Ativo** exclusivo no painel de configuração.
   - Selecione a sua **Pista** de destino. A escolha da pista define automaticamente o número de pistas para todas as rotações do conjunto.

---

## Desenho de Baterias e Pistas {: #designing-heats }

### Adição de Rotações ao Conjunto {: #adding-rotations }

1. Clique no botão **Adicionar Rotação** (`+`) na barra de ferramentas superior para criar o seu primeiro cartão de rotação.
2. Defina o campo **Número de Pilotos** no cabeçalho do cartão. Este valor estabelece a capacidade máxima de pilotos para essa rotação específica.
3. Opcionalmente, introduza uma **Descrição** (rótulo) no cabeçalho para identificar a rotação (por exemplo, `EURO D18 G3-666 X>1`, `Formato Sprint` ou `Exibição`). Ao criar uma nova rotação, este campo começa em branco; ao importar um ficheiro, assume automaticamente o nome do ficheiro importado por defeito.
4. O cartão é preenchido automaticamente com uma bateria inicial contendo as pistas do seu circuito.

### Adição e Reordenação de Baterias {: #adding-heats }

- **Adicionar Bateria:** Clique no ícone `+` no cabeçalho da rotação para acrescentar baterias adicionais.
- **Reordenar Baterias:** Arraste e solte os cartões de bateria na grelha para alterar a sequência de corrida.
- **Eliminar Bateria:** Clique no ícone de caixote do lixo de uma bateria para a remover.

### Atribuição de Pilotos às Pistas {: #assigning-drivers }

- **Conjunto de Pilotos Virtuais:** O painel esquerdo disponibiliza uma reserva de pilotos virtuais (`Piloto 1`, `Piloto 2`, etc.). Pode ajustar o número de pilotos para gerar todas as cabeças de série necessárias.
- **Grupo de Pilotos de Avanço:** Situado logo abaixo da reserva de pilotos virtuais; disponibiliza fichas dinâmicas de avanço para corridas Step Up (consulte [Corridas Step Up e Degraus de Progressão](#step-up-races) abaixo).
- **Arrastar e Largar:** Arraste as fichas de pilotos do conjunto diretamente para os lugares de pista de qualquer bateria.
- **Troca de Pista:** Arraste a ficha de um piloto de uma pista para outra para trocar as suas posições.
- **Esvaziar Pista:** Arraste um piloto para fora de uma pista para deixá-la desocupada (vazia).

### Atribuição de Grupos {: #group-assignments }

Cada cartão de bateria inclui um campo para o **Grupo**:

- Atribua baterias a diferentes números de grupo (por ex., Grupo 1, Grupo 2) quando organizar corridas por etapas ou grupos.
- Os pilotos de grupos diferentes correm independentemente, e as classificações podem ser separadas por grupo na configuração da corrida.

### Validação da Igualdade de Pistas {: #lane-equality-validation }

A equidade é fundamental no slot car racing. O Race Coordinator AI valida continuamente a distribuição de pistas em cada rotação:

- **Selo de Verificação (Verde):** Indica que cada piloto corre o mesmo número de vezes em cada pista ao longo da rotação.
- **Selo de Aviso (Laranja):** Indica que as atribuições de pistas estão desequilibradas (por exemplo, o Piloto 1 corre duas vezes na Pista 1, mas nunca na Pista 4).
- **Relatório de Igualdade:** Clique no selo de igualdade para abrir o **Relatório Detalhado de Igualdade de Pistas**, que apresenta uma matriz com o número exato de presenças de cada piloto em cada pista.

### Ordenação de Rotações {: #sorting-rotations }

Clique no botão **Ordenar Rotações** (`swap_vert`) na barra de ferramentas superior para organizar automaticamente todos os cartões de rotação por ordem crescente de acordo com a sua capacidade máxima de pilotos.

---

## Corridas Step Up e Degraus de Progressão {: #step-up-races }

O Race Coordinator AI suporta integralmente as **corridas Step Up** (também denominadas corridas em escada, progressão por finais principais ou bump-up) nos conjuntos de rotações personalizadas. Num formato step up, a competição é estruturada em degraus ou fases ascendentes—tais como **Final D $\rightarrow$ Final C $\rightarrow$ Final B $\rightarrow$ Final A**. Os pilotos com cabeças de série inferiores correm nos primeiros degraus e os primeiros classificados avançam ("Step Up") para as fases seguintes a fim de enfrentar os pilotos diretamente qualificados nessas categorias superiores.

### Grupo de Pilotos de Avanço {: #step-up-driver-pool }

A barra lateral esquerda inclui uma reserva dedicada ao **Avanço** situada logo abaixo da lista de pilotos virtuais:

- **Configuração do Número de Avanços:** Introduza o número de vagas de avanço pretendido no campo **Número de pilotos**. Por predefinição, este valor inicializa-se com o número de pistas menos uma ($\text{numLanes} - 1$), mas pode ser ajustado livremente entre 1 e 99.
- **Fichas de Avanço:** Os pilotos virtuais de avanço são identificados por um ícone de seta para cima (`arrow_upward`) e designações numeradas (`Avanço 1`, `Avanço 2`, etc.).
- **Atribuição às Pistas:** Arraste e solte fichas de avanço nos lugares de pista de baterias correspondentes ao Degrau 2 ou superior. Durante a corrida, estas vagas provisórias serão preenchidas automaticamente pelos pilotos qualificados no degrau anterior.

### Limites de Avanço e Degraus {: #step-up-boundaries }

A transição entre degraus é coordenada através de **Limites de Avanço**:

- **Ativação de Limites:** O cabeçalho de cada cartão de bateria dispõe de um botão **Limite de avanço**. Clique neste botão para assinalar a bateria como a manga decisiva de encerramento desse degrau.
- **Destaque Visual:** As baterias limite são destacadas com um selo ativo e um contorno realçado para identificar com clareza os pontos de corte da prova.
- **Cálculo Automático dos Degraus:** Ao marcar uma bateria como limite, todas as baterias subsequentes desse grupo avançam automaticamente para o degrau seguinte da escada (por ex., baterias do Degrau 1 passam ao **Degrau 2**, depois **Degrau 3**, etc.). O degrau atual é apresentado no selo do título da bateria (`- Degrau N`).
- **Avanço Dinâmico no Dia da Corrida:** Assim que a bateria limite se conclui durante a prova, o motor calcula a classificação acumulada do degrau e promove de imediato os pilotos mais bem classificados para os lugares `Avanço 1`, `Avanço 2`, etc. do degrau seguinte.

### Avanços Variáveis por Degrau {: #variable-step-ups }

Ao contrário das corridas step up algorítmicas padrão que impõem um número fixo e uniforme de avanços em todas as rondas (por ex., avançam sempre exatamente 2 pilotos), os conjuntos de rotações personalizadas permitem **avanços variáveis por degrau**:

- **Esquemas Personalizados de Avanço:** Pode definir números distintos de pilotos promovidos em cada nível. Por exemplo:
  - **Degrau 1 (Final D):** Os 2 melhores pilotos avançam para o Degrau 2 (`Avanço 1` e `Avanço 2`).
  - **Degrau 2 (Final C):** Os 3 melhores pilotos avançam para o Degrau 3 (`Avanço 1`, `Avanço 2` e `Avanço 3`).
  - **Degrau 3 (Final B):** Apenas o melhor 1 piloto avança para a Final A (`Avanço 1`).
- O motor de corrida verifica as fichas de avanço atribuídas em cada degrau e promove com precisão o número estipulado de participantes.

### Regras e Validação de Avanço {: #step-up-validation }

O editor assegura regras estritas para garantir o rigor desportivo:

- **Sem Pilotos de Avanço no Degrau 1:** O Degrau 1 é a ronda de abertura onde todos os concorrentes têm de ser pilotos inscritos regularmente. Inserir um piloto de avanço no Degrau 1 é inválido dado que não existe qualquer fase anterior para apurar concorrentes. O editor exibe um ícone de aviso (`warning`) com a mensagem *"O degrau 1 não pode conter pilotos de avanço."*, e o servidor recusará guardar configurações inválidas no degrau 1.
- **Grupos Independentes:** Na presença de vários grupos (por ex., Grupo 1 e Grupo 2), as progressões e as transições de limites são calculadas de forma totalmente autónoma em cada grupo.
- **Segurança da Ordem Cronológica:** As corridas step up exigem uma realização rigorosamente sequencial das baterias para apurar os qualificados antes de iniciar o degrau seguinte. Deste modo, opções como **Ciclos Completos de Baterias** ($> 1$) e **Inverter Baterias** são desativadas automaticamente em corridas com avanços para não corromper a tabela de qualificação.

---

## Importação e Exportação de Rotações {: #importing-exporting }

Pode partilhar rotações entre computadores ou arquivá-las:

- **Exportar Ativo Completo:** Clique no botão **Exportar** na barra de ferramentas superior para descarregar todo o ativo de conjunto de rotações personalizadas em formato `.json`.
- **Exportar Rotação Individual:** Clique no ícone de exportação (`upload`) no cartão de uma rotação para exportar unicamente essa configuração.
- **Importar Rotações:** Clique em **Importar** para carregar ficheiros `.json` ou ficheiros legados do Race Coordinator (`.txt` em formato RC1) no seu ativo. A descrição da rotação assume automaticamente o nome do ficheiro importado como padrão.

---

## Utilização de Conjuntos de Rotações Personalizadas em Corridas {: #using-in-races }

Após guardar o seu ativo de conjunto de rotações personalizadas:

1. Abra o [Editor de Corridas](race-editor.md).
2. Na secção **Configuração da Corrida** do painel esquerdo, defina o **Formato de Rotação de Baterias** para **Conjunto de rotações personalizadas**.
3. Selecione o seu ativo de conjunto de rotações personalizadas no menu pendente **Conjunto de rotações personalizadas**.
4. Ajuste as opções da corrida:
   - **Ciclos Completos de Baterias:** Repete a sequência completa de rotação personalizada $N$ vezes (desativado se houver avanços).
   - **Inverter Baterias:** Inverte a ordem das baterias para realizar a sequência ao contrário (desativado se houver avanços).
5. **Integração Step Up:** Se o seu conjunto de rotações personalizadas contiver limites de avanço e pilotos de avanço, o Race Coordinator AI coordena as promoções de concorrentes ao longo da prova de modo automático. Na **Pré-visualização de Baterias ao Vivo**, os degraus iniciais indicam os pilotos atribuídos enquanto os degraus seguintes apresentam vagas transitórias que se preencherão no dia da corrida.
6. Utilize a barra de deslocamento de **Pré-visualização do Número de Pilotos** e analise a **Pré-visualização de Baterias ao Vivo** no painel direito para conferir as atribuições antes do dia da corrida.
