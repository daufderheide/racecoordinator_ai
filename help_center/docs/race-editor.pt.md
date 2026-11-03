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
- **Regras de bandeira amarela**: Pausas automáticas ou manuais sob bandeira amarela com corte de energia na pista.
- **Opções de interface personalizada**: Tabelas de classificação e widgets de telemetria dedicados.

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
