# Editor de Corridas

O **Editor de corridas** permite criar, personalizar e gerenciar configurações de corrida. Aqui você pode configurar regras de pontuação, rotações de baterias, simulações de combustível e opções de corrida.

---

## Visão Geral e Salvamento Automático

O Editor de Corridas oferece uma interface unificada para selecionar, visualizar, configurar e testar seus formatos de corrida:

- **Seletor de Corrida**: Localizado no cabeçalho superior ao lado do título da página, este menu suspenso lista todas as corridas configuradas e permite alternar rapidamente entre elas.
- **Modo Somente Leitura**: Por padrão, ao abrir o editor são exibidas as propriedades da corrida, regras de pontuação e opções em modo somente leitura. Os campos do formulário ficam bloqueados para evitar alterações acidentais, enquanto os acordeões e pré-visualizações de baterias permanecem interativos.
- **Modo de Edição**: Clicar no ícone **Editar** (lápis) na barra de ferramentas desbloqueia todos os controles. Durante a edição, o seletor de corrida fica bloqueado.
- **Salvamento Automático Contínuo**: Todas as alterações são salvas automaticamente em segundo plano no servidor sem sair do modo de edição.
- **Sair do Modo de Edição**: Clicar no ícone **Concluído** (marca de seleção) valida as alterações e retorna ao modo somente leitura.
- **Descartar Alterações**: Clicar em Descartar restaura todas as alterações para a última versão salva e sai do modo de edição.

O espaço de trabalho é dividido em dois painéis sincronizados:

- **Painel Esquerdo (Configuração da Corrida)**: Propriedades gerais, formato da corrida, métodos de pontuação, tipo de rotação, opções de grupo e simulação de combustível analógico/digital.
- **Painel Direito (Pré-visualização de Baterias ao Vivo)**: Gera dinamicamente a lista completa de baterias com base na rotação ativa e no número de pilotos.

---

---

## Configuração da corrida {: #race-setup }

O painel esquerdo configura o formato principal e a pista associada para sua corrida:

- **Nome da corrida**: Nome exclusivo para identificar o formato no dia da corrida e em estatísticas.
- **Pista**: A pista física vinculada a esta corrida. Determina se a simulação analógica ou digital de combustível estará disponível.
- **Tema**: Tema visual aplicado à exibição no dia da corrida.
- **Formato de rotação de baterias**: Escolha entre rotações padrão (**Round Robin**, **Escada**, **Torneio**) ou sequências personalizadas.
- **Passagens por bateria**: Especifica quantas vezes cada piloto completa a rotação inteira de baterias.
- **Baterias invertidas**: Inverte a ordem das baterias para que os pilotos corram em sequência contrária.
- **Prévia da contagem de pilotos**: Exibe uma prévia dinâmica da lista de baterias gerada com base no número de pilotos.

O painel direito exibe a **Prévia ao vivo de baterias**, gerando a lista completa de baterias, rotações de pilotos e pistas em tempo real conforme você altera as configurações.

---

## Guias de navegação {: #navigation-tabs }

A barra de guias superior oferece atalhos com um clique para navegar diretamente para qualquer seção de configuração:

- **Geral**: Temas, alertas de voz, filtros de tempo de volta e preferências de interface.
- **Baterias**: Tempos de largada e avanço automático, repetições de baterias e ordem invertida.
- **Pontuação**: Métodos de classificação, desempates, baterias descartadas e ajustes manuais.
- **Grupos**: Separação de pilotos em grupos, programações de rotação independentes e avanço na classificação.
- **Método de largada**: Contagens regressivas automáticas/manuais, largadas escalonadas e regras de queima de largada.
- **Opções de equipe**: Corridas de endurance em equipe, troca de pilotos e limites de turnos.
- **Combustível analógico**: Consumo por volta, capacidade do tanque e taxas de reabastecimento.
- **Combustível digital**: Consumo contínuo baseado no acelerador e curvas personalizadas.
- **Pontos da temporada**: Tabela de pontuação do campeonato, pontos por bateria e pontos de bônus.

Ao clicar em uma guia, a página rola imediatamente até aquela seção do acordeão e a expande.

---

## Configurações gerais {: #general-settings }

O acordeão de Configurações gerais controla a apresentação, filtros de tempo e o comportamento do diretor de prova:

- **Seleção de tema**: Esquemas de cores e layouts de placar personalizados.
- **Alertas de voz**: Avisos sonoros automatizados para mudanças de liderança, voltas mais rápidas, pit stops e chegadas.
- **Tempo mínimo de volta (s)**: Tempo mínimo permitido para filtrar falhas elétricas ou acionamentos falsos de sensores.
- **Tempo de derrapagem (s)**: Janela de detecção para gerenciar carros derrapando sobre a linha de chegada.
- **Excluir voltas com drift dos recordes**: Quando ativado, as voltas concluídas com drift são excluídas dos recordes de corrida, bateria e piloto.
- **Regras de bandeira amarela**: Pausas automáticas ou manuais sob bandeira amarela com corte de energia na pista.
- **Opções de interface personalizada**: Tabelas de classificação e widgets de telemetria dedicados.

### Mecânica de Deriva e Cronometragem de Drift {: #drifting-and-drift-timing }

No automobilismo de fenda (autorama / slot car racing), os carros são propulsionados pela voltagem elétrica fornecida através de calhas metálicas na pista. Quando a energia da pista é cortada – como durante uma pausa por bandeira amarela, no encerramento de uma bateria (**Heat Over**) ou ao final da corrida (**Race Over**) –, os carros não param instantaneamente com velocidade zero. Devido à inércia física, massa, atração magnética do motor e atrito, os carros continuam rolando para a frente por inércia residual após a interrupção da corrente.

No Race Coordinator AI e no jargão do slot car, esse movimento por inércia sem tração elétrica é denominado **"drift"** ou **"deriva"**.

!!! note "Definição de Drift no Slot Car"
    No slot car racing, o termo "drift" ou "deriva" **não** se refere a derrapagens laterais de traseira, curvas de lado ou manobras acrobáticas. Refere-se estritamente ao rolamento por inércia para a frente do carro impulsionado pelo seu movimento residual após o desligamento da energia da pista.

Quando um carro se aproxima da linha de chegada ou do sensor de cronometragem no exato instante em que a energia cai, o seu embalo pode fazê-lo cruzar o sensor antes de parar completamente. O Race Coordinator AI oferece cronometragem por hardware de alta precisão e configurações dedicadas para gerenciar essas situações com total justiça e rigor esportivo.

#### A Distinção Fundamental: "Volta de Drift" vs. "Volta com Drift Envolvido"

Existe uma distinção essencial no Race Coordinator AI entre uma **Volta de Drift** (`isDrift = true`) e uma **Volta com Drift Envolvido** (`driftInvolved = true`):

##### 1. Uma "Volta de Drift" (`isDrift = true`)
Uma **Volta de Drift** é uma volta fisicamente registrada e contabilizada quando um carro cruza a linha de chegada ou o sensor **ENQUANTO a energia da pista está DESLIGADA** (especificamente durante os estados `Paused` / bandeira amarela, `HeatOver` ou `RaceOver`), dentro da janela de **Tempo de deriva** configurada.

- **Evento Físico**: O carro cruza a linha de chegada rolando por inércia sem energia na pista.
- **Indicador Visual**: A coluna da calha na tela principal da corrida e o diálogo de inspeção de voltas exibem um badge destacado **`DRIFT`** ao lado do tempo da volta.
- **Anúncio de Voz**: Dispara o **Som de volta de drift** (`driftLapAudio`) configurado para o piloto como anúncio de voz de prioridade urgente (`urgent`) (ex.: *"Drift lap for {driver.nickname}"*).
- **Crédito da Volta**: A volta é creditada integralmente ao total de voltas do piloto para a bateria e classificação geral. O tempo de volta registrado combina o tempo parcial acumulado antes da interrupção com a fração de segundo rolando sobre o sensor.
- **Estatísticas**: Incrementa o contador de voltas de drift nas estatísticas da corrida (`driftLapCount`). Segmentos parciais calculados automaticamente são zerados.

##### 2. Uma "Volta com Drift Envolvido" (`driftInvolved = true`, mas `isDrift = false`)
Uma **Volta com Drift Envolvido** é uma volta completada e registrada sob **condições normais de BANDEIRA VERDE com energia ligada**, mas cuja duração total decorrida contém um período de interrupção ou tempo herdado decorrente de uma pausa na pista ou transição de bateria.

- **Evento Físico**: O carro cruza a linha de chegada com a energia **LIGADA** em ritmo de corrida sob bandeira verde. Contudo, no decorrer dessa mesma volta, a energia foi interrompida e posteriormente restabelecida.
- **Cenários Típicos**:
    - **Pausa e Retomada por Bandeira Amarela Durante a Volta**: Um piloto cumpre 3,2 segundos de uma volta de 5,0 segundos quando uma bandeira amarela é acionada. A energia cai e o carro para por inércia na reta oposta (não cruza o sensor, portanto não é uma volta de drift). O cronômetro de hardware congela e esses 3,2 segundos são armazenados no tempo pendente do piloto, com marcação interna de tempo de drift (`markDriftTime()`). Na retomada sob bandeira verde, os cronômetros reiniciam do zero. O carro percorre os 1,8 segundos restantes com tração e cruza a linha de chegada. O tempo total registrado é de 5,0 segundos ($3{,}2\,\text{s} + 1{,}8\,\text{s}$). Como a linha foi cruzada sob bandeira verde, **não é uma Volta de Drift** (não há badge `DRIFT` e toca o áudio habitual de volta), mas é uma **Volta com Drift Envolvido** porque sua duração foi dividida por uma paralisação.
    - **Largada na Posição Atual (`Start at Current`)**: Em modalidades contínuas em que os carros param onde estão no término da bateria e recomeçam dessa mesma posição física na bateria seguinte (`start_at_current = true`), o tempo parcial incompleto da bateria anterior é transferido. Quando o piloto conclui a sua primeira volta na nova bateria sob bandeira verde, essa volta incorpora o tempo herdado da bateria anterior: trata-se de uma **Volta com Drift Envolvido**.

---

#### As Duas Opções de Configuração da Corrida

No acordeão **Configurações gerais**, o Race Coordinator AI fornece duas opções dedicadas para controlar o drift e a validação de recordes:

```
+---------------------------------------------------------------------------------+
| Tempo mínimo de volta (s): [ 2.0 ]   Tempo de deriva (s): [ 0.5 ]               |
|                                                                                 |
| [ ] Modo de treino    [X] Excluir voltas com drift dos recordes                 |
+---------------------------------------------------------------------------------+
```

##### Opção 1: Tempo de deriva (`drift_time`)
- **Tipo de Configuração**: Número decimal em segundos (ex.: `0.0`, `0.5`, `1.0`, `2.0`).
- **Valor Padrão**: `0.5` segundos.
- **Descrição**: Define a janela máxima de tempo imediatamente posterior a um corte de energia (bandeira amarela, fim de bateria ou fim de corrida) durante a qual a passagem pelo sensor será aceita como uma volta válida por inércia.

!!! warning "Pistas sem Relés de Controlo de Corrente"
    Se a sua pista não possuir relés de hardware para cortar a corrente, a pista permanece energizada durante pausas, finais de bateria e encerramento da corrida. Nestas pistas, **o Tempo de deriva deve ser definido como `0` (nenhuma volta de drift)**. Caso contrário, os pilotos que continuem acelerando durante uma pausa poderiam receber indevidamente voltas de drift sob tração.

No momento do corte de energia, o sistema grava o registro exato em milissegundos. Se um sensor for acionado com a pista parada:

$$\Delta t = \text{Momento do Disparo} - \text{Momento da Parada}$$

$$\begin{aligned}
\text{Se } \Delta t \le \text{Tempo de deriva} &\implies \textbf{Aceita como Volta de Drift } (\text{isDrift} = \text{true}) \\
\text{Se } \Delta t > \text{Tempo de deriva} &\implies \textbf{Rejeitada e ignorada}
\end{aligned}$$

- **Por que um Limite de Tempo de Deriva é Essencial**:
    - **Justiça com Carros em Embalo**: Um carro que estava a poucos centímetros da linha de chegada ao soar a bandeira merece a volta se o seu embalo o levar a cruzar o sensor instantes depois.
    - **Prevenção de Voltas Falsas por Fiscais de Pista**: Sem um limite rígido, um fiscal recolocando um carro capotado na fenda poderia acidentalmente empurrá-lo sobre o sensor segundos ou minutos depois, concedendo uma volta indevida.
- **Recomendações Práticas**:
    - **Pistas sem Relés de Corrente**: Se a sua pista não possuir relés para cortar a corrente, **o Tempo de deriva deve ser definido como `0` (0.0s)** (nenhuma volta de drift). Como a energia nunca cai, os carros podem continuar andando sob tração; qualquer janela de deriva diferente de zero contaria erroneamente essas voltas tracionadas como voltas de drift.
    - **Carros com Ímã (HO, 1/32 com ímã de tração)**: O forte efeito magnético contra os trilhos de aço freia os carros muito rápido. Recomendado: `0.3` a `0.8` segundos.
    - **Carros sem Ímã / Categorias Pesadas (1/24, pistas de madeira)**: Elevada inércia e rolamento livre sem freio magnético permitem longos deslizamentos. Recomendado: `1.0` a `2.5` segundos.
    - **Desativado (`0.0s`)**: Desativa totalmente as voltas de drift; qualquer passagem sem energia é descartada.

##### Opção 2: Excluir voltas com drift dos recordes (`adjust_drift_laps`)
- **Tipo de Configuração**: Caixa de seleção (`true` / `false`).
- **Valor Padrão**: Desativado (`false`).
- **Descrição**: Determina se voltas que envolveram qualquer modalidade de drift têm permissão para concorrer a recordes pessoais, de bateria, de corrida ou de pista.

Ao término de uma volta, o sistema avalia:

$$\text{driftInvolved} = \text{isDrift} \lor \text{hasDriftTime}$$

$$\text{countTowardsRecords} = \neg(\text{adjust\_drift\_laps} \land \text{driftInvolved})$$

- **Quando ativado (`true`)**:
    - Qualquer volta com drift envolvido – seja uma **Volta de Drift** (`isDrift = true`) OU uma **Volta com Drift Envolvido** (por interrupção ou transição entre baterias) – é desqualificada para recordes (`countTowardsRecords = false`).
    - A volta é excluída de:
        1. **Melhor Volta Pessoal do Piloto (`bestLapTime`)**: A marca pessoal não é atualizada.
        2. **Melhor Volta da Bateria**: Não é computada como a volta mais rápida da bateria atual.
        3. **Melhor Volta da Corrida**: Não é computada como a volta mais rápida da corrida.
        4. **Recordes de Pista e de Calha**: Fica de fora das tabelas históricas de recordes.
        5. **Anúncios de Áudio de Recorde**: Locuções comemorativas de recorde e voltas rápidas são suprimidas.
    - **Princípio Fundamental**: A volta **continua contando a 100% para a contagem de voltas do piloto, a posição na bateria e a classificação final da corrida**. Apenas o status de recorde é negado.
- **Quando desativado (`false`)**:
    - Qualquer volta que atenda ao filtro de tempo mínimo pode registrar recordes, mesmo que tenha atravessado uma bandeira amarela ou tenha sido completada por inércia sem energia.
- **Por que Campeonatos Oficiais Ativam Esta Opção**:
    - Voltas interrompidas alteram as temperaturas de motores e pneus; reacelerar a partir da inércia zero diverge de uma volta lançada a plena potência sob bandeira verde.
    - Cruzar a linha por inércia também reflete uma dinâmica anômala de desaceleração.
    - Esta opção garante que os recordes da pista representem unicamente voltas limpas, contínuas e em velocidade máxima de competição.

---

#### Tabela Comparativa de Resumo

| Característica / Comportamento | Volta Normal sob Bandeira Verde | Volta de Drift (`isDrift = true`) | Volta com Drift Envolvido (`hasDriftTime = true`, `isDrift = false`) |
| :--- | :--- | :--- | :--- |
| **Energia na Pista ao Cruzar o Sensor** | **LIGADA** (Bandeira Verde) | **DESLIGADA** (Amarela, Fim Bateria/Corrida) | **LIGADA** (Bandeira Verde) |
| **Condição de Disparo do Sensor** | Sob tração em ritmo de corrida | Por inércia dentro do `drift_time` | Sob tração após pausa ou transição de bateria |
| **Flag de Dados `isDrift`** | `false` | `true` | `false` |
| **Estado Interno `driftInvolved`** | `false` | `true` | `true` |
| **Badge na Tela de Corrida** | Nenhum | Badge **`DRIFT`** na coluna da calha | Nenhum |
| **Notificação Sonora** | Som normal de volta / recorde | **Som de volta de drift** (`urgent`) | Som normal (sem anúncio de drift) |
| **Conta para Total de Voltas & Classificação** | **Sim** (crédito total) | **Sim** (crédito total) | **Sim** (crédito total) |
| **Válida para Recordes (`adjust_drift_laps` = DESATIVADO)** | **Sim** | **Sim** (se mais rápida) | **Sim** (se mais rápida) |
| **Válida para Recordes (`adjust_drift_laps` = ATIVADO)** | **Sim** | **Excluída / Desqualificada** | **Excluída / Desqualificada** |

---

## Opções de bateria {: #heat-options }

O acordeão de Opções de bateria configura os tempos automatizados, ciclos de corrida e sequência de rotação:

- **Tempo de avanço automático (s)**: Segundos de espera após o término de uma bateria antes de avançar automaticamente para a próxima.
- **Tempo de aquecimento para avanço (s)**: Intervalo de preparação antes do avanço automático entrar em vigor.
- **Tempo de largada automática (s)**: Atraso de contagem regressiva antes de iniciar automaticamente a próxima bateria.
- **Tempo de aquecimento para largada (s)**: Duração do aquecimento antes de iniciar a contagem da largada automática.
- **Passagens por bateria**: Especifica quantas vezes cada piloto completa o ciclo inteiro de baterias.
- **Baterias invertidas**: Inverte a sequência programada das baterias para correr em ordem contrária.
---

## Regras de pontuação {: #scoring-rules }

#### Ajustes de Voltas e Tempo (Impacto nas Classificações e Métricas)

- **Método de classificação da bateria**: Classifique os pilotos em cada bateria por **Mais voltas**, **Volta mais rápida** ou **Tempo total mais rápido**, com desempates configuráveis.
- **Método de término**: Define como o final de uma bateria é determinado (por **Contagem de voltas** ou **Tempo** decorrido em segundos).
- **Permitir chegada**: Escolha como os carros concluem suas voltas quando o líder termina ou o tempo se esgota (por exemplo, término imediato, permitir que todos terminem, volta única ou crédito de segmentos automáticos).
- **Método de classificação geral**: Classifique a classificação geral da corrida em todas as baterias com desempates e baterias descartadas personalizáveis.
- **Avanço por degraus (Step-Up)**: Configura uma corrida progressiva em escada. O padrão é `0` (desativado). Com valores $S > 0$, as baterias são divididas em degraus progressivos onde pilotos dos degraus superiores aguardam os classificados promovidos dos degraus inferiores.

### Corridas em Escada (Step-Up)

Quando o **Avanço por degraus (Step-Up)** é configurado com um valor inteiro positivo ($S > 0$), o Race Coordinator AI reorganiza as baterias e classificações em uma escada progressiva:

- **Degraus da escada**: Os pilotos são distribuídos em degraus de acordo com sua colocação inicial. Os pilotos de menor colocação competem no Degrau 1 (o degrau inferior).
- **Distribuição dos pilotos**:
  - O degrau inferior contém entre 2 e o número de pistas do circuito ($2 \le N_{bottom} \le L$) pilotos.
  - Cada degrau superior subsequente contém $L - S$ pilotos designados e $S$ vagas de avanço reservadas para os classificados do degrau anterior.
  - O degrau superior representa a Final, onde os melhores classificados aguardam os qualificados promovidos.
- **Rotações completas por degrau**: Cada degrau executa a rotação completa de baterias conforme configurada para a corrida (por exemplo, Round Robin ou rotação personalizada).
- **Avanço e reinício de pontuação**: Ao término de um degrau (marcado pela bateria limite do degrau), os $S$ melhores pilotos avançam para o próximo degrau. As estatísticas gerais dos promovidos são zeradas: apenas as baterias do degrau mais alto alcançado contam para a classificação geral final.
- **Classificação geral em níveis**: Pilotos de degraus inferiores nunca podem ficar à frente de pilotos de degraus superiores na classificação geral final, independentemente de voltas ou tempos individuais. O vencedor do degrau final é o vencedor da corrida.
- **Corridas por grupos**: Em corridas por grupos com avanço habilitado, cada grupo sobe sua própria escada de forma independente.
- **Suporte em Modificar baterias**: Na tela Modificar baterias, os pilotos promovidos são identificados com emblemas próprios e os limites de degrau podem ser inspecionados e alternados.

### Configurações de Temporizador
- **Atraso de Início / Reinício**: Segundos de contagem regressiva prévia.
- **Tempo Mínimo de Volta**: Tempo mínimo permitido para filtrar acionamentos falsos de sensores.
- **Tempo de Drift**: Janela de detecção para deslizamento de carros sobre a linha de chegada.
- **Iniciar Atrás do Sensor**: Exige que os carros comecem atrás do sensor na volta zero.

---

## Grupos e etapas {: #groups-and-stages }

O acordeão de Grupos e etapas separa os pilotos em grupos distintos que não competem diretamente na pista entre si:

- **Separação de grupos**: Os pilotos são organizados em grupos isolados e disputam suas baterias de maneira independente segundo a rotação configurada.
- **Máximo de grupos**: Define o número máximo de grupos permitidos para a corrida.
- **Equilibrar grupos**: Distribui automaticamente os pilotos de forma equilibrada entre todos os grupos.
- **Permitir frestas vazias**: Permite baterias com frestas/pistas desocupadas quando os grupos não preenchem todas as frestas da pista.
- **Forçar múltiplo do máximo**: Garante que o total de baterias seja disputado em múltiplos da capacidade máxima do grupo.
- **Alternar baterias de grupo**: Alterna as baterias entre diferentes grupos em vez de concluir um grupo inteiro antes de iniciar o próximo.
- **Mínimo de classificados**: Coloca automaticamente os melhores pilotos de cada grupo no topo da classificação geral.
- **Nomes dos grupos**: Atribui nomes personalizados a cada grupo (ex.: Pro, Semi-Pro, Grupo A/B/C).
---

## Métodos de largada {: #start-methods }

O acordeão de Métodos de largada configura o início das baterias, posicionamento dos carros na pista e penalidades:

- **Tempo de largada / reinício (s)**: Duração da contagem regressiva antes de iniciar ou reiniciar uma bateria.
- **Atraso aleatório (s)**: Atraso aleatório adicionado à contagem para evitar antecipação ao sinal verde.
- **Largada atrás do sensor**: Exige que os carros fiquem posicionados atrás do sensor de chegada na volta zero.
- **Largada na posição atual**: Permite retomar a corrida a partir da posição física atual na pista após uma pausa.
- **Largadas lançadas**: Mantém a energia ligada na pista para acelerar imediatamente ao término da contagem.
- **Reiniciar em queima de largada**: Interrompe e reinicia automaticamente a contagem ao detectar queima de largada.
- **Penalidades por queima de largada**: Deduções de volta ou penalidades de tempo para quem queimar a largada.
---

## Opções de corrida em equipe {: #team-racing }

O acordeão de Opções de corrida em equipe habilita formatos de endurance com múltiplos pilotos por equipe:

- **Modo corrida em equipe**: Ativa pontuação por equipe na qual os pilotos compartilham as baterias.
- **Estratégia de revezamento de pilotos**: Alterna automaticamente os pilotos em round-robin ao longo das baterias.
- **Trocas de piloto durante a bateria**: Permite a troca de pilotos durante paradas nos boxes ou em voltas pré-definidas.
- **Limites de turno (stints)**: Tempos mínimos e máximos de condução por piloto para garantir participação equilibrada.
- **Trocas obrigatórias**: Exige um número mínimo de pit stops e trocas de piloto por bateria ou corrida.

---

## Editor de corridas - Simulação de combustível analógico {: #analog-fuel-simulation }

O combustível analógico simula o consumo **por volta**. Como as pistas analógicas detetam os carros na passagem pelos sensores de cronometragem da linha de meta, o combustível é calculado e deduzido sempre que uma volta é concluída.

#### Opções de configuração

- **Ativar combustível analógico**: Interruptor principal da monitorização analógica. Quando desmarcado, a simulação de combustível é desativada para a corrida e os carros correm sem restrições.
- **Tipo de consumo de combustível**: Determina a curva matemática utilizada para calcular o consumo com base no ritmo por volta:
    - **Linear**: O consumo varia linearmente com o tempo de volta. Voltas mais rápidas queimam mais combustível, enquanto voltas duas vezes mais lentas consomem metade do combustível base.
    - **Quadrático**: O consumo varia com o inverso do quadrado do tempo de volta, penalizando fortemente voltas muito rápidas.
    - **Cúbico**: O consumo sobe abruptamente em voltas rápidas, penalizando severamente os pilotos que arriscam à procura de voltas recorde.
    - **Curva personalizada**: Permite modelar interativamente a curva ponto a ponto diretamente no gráfico SVG.
- **Tempo mais rápido (s)**: O tempo de volta mais rápido esperado para a pista e categoria de carros (em segundos).
- **Tempo mais lento (s)**: O tempo de volta mais lento (em segundos) para o consumo mínimo de combustível.
- **Consumo máx. de combustível por volta mais rápida**: Unidades de combustível consumidas por volta ao conduzir no **Tempo mais rápido** ou mais rápido.
- **Consumo mín. de combustível por volta mais lenta**: Unidades de combustível consumidas por volta ao conduzir no **Tempo mais lento** ou mais lento.
    - Para tempos de volta entre o tempo mais rápido e o tempo mais lento, o consumo varia de forma suave de acordo com o **Tipo de consumo** selecionado (Linear, Quadrático, Cúbico ou Curva personalizada).
- **Capacidade**: O volume total do depósito de combustível em unidades arbitrárias (por exemplo, 100).
- **Nível inicial (%)**: Percentagem de capacidade disponível no depósito no início de uma manga (por exemplo, 100% para depósito cheio, ou menos para mangas de sprint ou handicap).
- **Taxa de reabastecimento (%/s)**: Velocidade a que o combustível é reposto durante uma paragem nas boxes, expressa em percentagem da capacidade total do depósito reposta por segundo.
- **Atraso de paragem nas boxes (s)**: Tempo de paragem obrigatório em segundos antes de começar o reabastecimento após a entrada na linha de boxes.
- **Repor combustível no início da manga**:
    - **Ativado**: O nível de combustível de cada piloto é reposto para o **Nível inicial** configurado no arranque de cada manga.
    - **Desativado**: O combustível remanescente é transitado entre mangas ao longo das rotações, exigindo uma gestão estratégica durante toda a corrida.
- **Ação por falta de combustível**: Penalidade aplicada quando o combustível de um piloto chega a 0:
    - **Não contar voltas**: O carro continua em pista com corrente, mas as voltas efetuadas com o depósito vazio não são contabilizadas até que vá às boxes reabastecer.
    - **Terminar manga**: A manga termina de imediato para esse carro, a alimentação da calha é cortada e o piloto é classificado.
    - **Engasgamento de potência (Power Stutter)**: Simula o motor a falhar por falta de combustível através da interrupção e retoma rápida da alimentação da calha.
        - *Requer relés por calha*: Esta opção só está disponível se a interface da pista tiver relés de controlo de alimentação dedicados por calha.
        - **Tempo ligado (s)**: Duração durante a qual a alimentação da calha permanece ligada em cada impulso.
        - **Tempo desligado (s)**: Duração durante a qual a alimentação da calha permanece desligada em cada impulso.

#### Paragens nas boxes e tempo de corrida no combustível analógico

Para evitar que o tempo parado nas boxes seja interpretado como uma volta anormalmente lenta (o que reduziria erradamente o consumo calculado), o Race Coordinator AI contabiliza o **tempo acumulado de reabastecimento**. O tempo passado parado na linha de boxes é subtraído da duração total da volta antes de calcular o consumo:

$$\text{Tempo de corrida} = \text{Tempo de volta} - \text{Tempo acumulado de reabastecimento}$$

#### Pré-visualizações gráficas (Analógico)

- **Comparação simultânea multimodelo**: Todos os 3 modelos matemáticos predefinidos (**Linear**, **Quadrático** e **Cúbico**) são traçados simultaneamente em ambos os gráficos. O tipo selecionado é destacado a negrito com um brilho vibrante, enquanto os modelos restantes servem de linhas de referência atenuadas (~40% de opacidade).
- **Consumo de combustível por volta**: Exibe as unidades exatas consumidas ao longo do espetro de tempos de volta (do Tempo mais rápido ao Tempo mais lento). No modo Curva personalizada, os pontos de controlo e botões de reposição permitem remodelar a curva instantaneamente enquanto os 3 modelos base continuam visíveis para referência.
- **Tempo até paragem nas boxes**: Estima o tempo total de corrida (ou número de voltas) até esgotar o depósito a um ritmo constante em todos os modelos.
- **Legenda interativa e visibilidade**: Clique com o botão esquerdo em qualquer curva da legenda para a ativar ou desativar. Ocultar uma curva redimensiona dinamicamente as escalas dos eixos, permitindo inspecionar as restantes em maior detalhe.
- **Cartões flutuantes comparativos**: Passar o cursor pelos gráficos apresenta a telemetria comparativa de todas as curvas visíveis no ponto analisado, com amostras de cor, valores e o indicador `(Ativo)` no modelo selecionado.

---

---

## Editor de corridas - Simulação de combustível digital {: #digital-fuel-simulation }

O combustível digital simula o consumo **continuamente em tempo real** com base na telemetria de aceleração transmitida por comandos e descodificadores digitais.

#### Consumo contínuo baseado na aceleração

Ao contrário do analógico (que calcula o combustível apenas na linha de meta), o digital recalcula o consumo a cada pacote de telemetria recebido:

$$\text{Combustível consumido} = \text{Consumo por segundo} \times \Delta t$$

Pilotos com condução suave que desaceleram nas curvas consomem consideravelmente menos combustível do que aqueles que mantêm aceleração máxima nas retas.

#### Opções de configuração

- **Ativar combustível digital**: Interruptor principal da monitori

---

## Pontuação da temporada {: #season-scoring }

O acordeão de Pontuação da temporada define a distribuição de pontos para campeonatos:

- **Tabela de pontos por posição**: Atribua pontos para cada posição final (por exemplo, 25 para 1º, 18 para 2º, etc.).
- **Pontos por bateria**: Conceda opcionalmente pontos para resultados de baterias individuais além da classificação geral.
- **Pontos de bônus**:
    - *Volta mais rápida*: Pontos adicionais concedidos ao piloto com a melhor volta da corrida.
    - *Pole position*: Pontos de bônus pela melhor posição na qualificação.
    - *Mais voltas na liderança*: Pontos de bônus por liderar o maior número de voltas.
- **Totalização do campeonato**: Totalização automática de pontos da temporada com suporte ao descarte de piores resultados.
