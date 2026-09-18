# Editor de Corridas

O **Editor de Corridas** é a interface completa de configuração para desenhar, configurar e testar formatos de corrida de slot cars, regras de pontuação, rotações de baterias, simulações de combustível e configurações de temporizador.

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

## Configuração da Corrida & Opções

### Nome da Corrida & Associação de Pista
- **Nome da Corrida**: Nome exclusivo que identifica o formato de corrida.
- **Pista**: A pista física associada determina se a simulação de combustível analógica ou digital está disponível.
- **Tema**: Tema visual de interface aplicado durante o dia de corrida.

### Formato de Rotação de Baterias
- **Tipo de Rotação**: Rotações padrão (**Round Robin**, **Escada**, **Torneio**) ou sequências personalizadas.
- **Ciclos de Baterias**: Quantidade de vezes que cada piloto completa a rotação inteira de baterias.
- **Baterias Invertidas**: Inverte a ordem da sequência de baterias.

### Opções de Pontuação
- **Pontuação da Bateria**: Conclusão por voltas ou tempo limite, método de classificação e desempates.
- **Pontuação Geral**: Método de classificação geral, regras de desempate e baterias descartadas.
- **Pontuação da Temporada**: Distribuição de pontos por posição para campeonatos.

### Configurações de Temporizador
- **Atraso de Início / Reinício**: Segundos de contagem regressiva prévia.
- **Tempo Mínimo de Volta**: Tempo mínimo permitido para filtrar acionamentos falsos de sensores.
- **Tempo de Drift**: Janela de detecção para deslizamento de carros sobre a linha de chegada.
- **Iniciar Atrás do Sensor**: Exige que os carros comecem atrás do sensor na volta zero.

## Configurações de combustível

O Race Coordinator AI oferece suporte a simulação abrangente de combustível para pistas analógicas e digitais, incluindo capacidade personalizável, nível inicial, atrasos de paragem nas boxes, taxas de reabastecimento, penalidades por falta de combustível e modelos de consumo.

### Compatibilidade de pistas e seleção do sistema de combustível

O editor de corridas disponibiliza duas secções dedicadas à configuração do combustível: **Combustível analógico** e **Combustível digital**. O sistema disponível e ativo é determinado automaticamente pela pista selecionada para a corrida:

- **Pistas analógicas**: Pistas de slot car tradicionais onde os carros são alimentados diretamente pelos carris da calha, sem descodificadores digitais nem telemetria entre o carro e a pista. Quando uma pista analógica é selecionada, a secção **Combustível analógico** fica ativada e a caixa de seleção de **Combustível digital** é automaticamente desativada (ao passar o cursor sobre a caixa de seleção desativada, é apresentado um tooltip explicativo).
- **Pistas digitais**: Sistemas digitais de slot car (como Carrera Digital, Scalextric Digital, Scorpius ou oXigen) onde a interface comunica telemetria digital (ID do carro, percentagem de aceleração, sensores de entrada na linha de boxes). Quando uma pista digital é selecionada, a secção **Combustível digital** fica ativada e a caixa de seleção de **Combustível analógico** é automaticamente desativada (ao passar o cursor sobre a caixa de seleção desativada, é apresentado um tooltip explicativo).

---

### Simulação de combustível analógico

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

### Simulação de combustível digital

O combustível digital simula o consumo **continuamente em tempo real** com base na telemetria de aceleração transmitida por comandos e descodificadores digitais.

#### Consumo contínuo baseado na aceleração

Ao contrário do analógico (que calcula o combustível apenas na linha de meta), o digital recalcula o consumo a cada pacote de telemetria recebido:

$$\text{Combustível consumido} = \text{Consumo por segundo} \times \Delta t$$

Pilotos com condução suave que desaceleram nas curvas consomem consideravelmente menos combustível do que aqueles que mantêm aceleração máxima nas retas.

#### Opções de configuração

- **Ativar combustível digital**: Interruptor principal da monitorização digital.
- **Tipo de consumo de combustível**: Modelo matemático aplicado à aceleração ($0\,\%$ a $100\,\%$):
    - **Linear**: O consumo varia em proporção direta com a posição do acelerador.
    - **Quadrático**: O consumo sobe moderadamente a meio acelerador e acelera em direção à aceleração máxima.
    - **Cúbico**: As acelerações máximas consomem exponencialmente mais combustível do que a condução a meio regime.
    - **Curva personalizada**: Permite personalizar a resposta aceleração-consumo entre 0% e 100% de acelerador.
- **Taxa de consumo**: Consumo máximo em unidades por segundo a **100% de aceleração máxima**.
- **Capacidade**, **Nível inicial (%)**, **Taxa de reabastecimento (%/s)**, **Atraso de paragem nas boxes (s)**, **Repor combustível no início da manga**: Funcionamento idêntico ao combustível analógico.
- **Ação por falta de combustível**:
    - **Não contar voltas**: O carro continua operacional, mas as voltas efetuadas sem combustível não são registadas.
    - **Terminar manga**: O piloto é retirado da manga assim que o depósito fica vazio.

#### Pré-visualizações gráficas (Digital)

- **Comparação simultânea multimodelo**: Traça em simultâneo as curvas de resposta linear, quadrática e cúbica com o modelo selecionado em destaque e os restantes modelos visíveis em segundo plano.
- **Consumo de combustível digital**: Representa a percentagem de aceleração ($0\,\%$ a $100\,\%$) em relação ao consumo por segundo para todos os modelos.
- **Tempo até esgotar**: Representa a percentagem de aceleração em relação aos segundos contínuos de condução até esvaziar totalmente o depósito.
- **Legenda interativa e escala dinâmica**: Ative ou desative curvas clicando na legenda, recalculando automaticamente a escala dos eixos.
- **Cartões flutuantes comparativos**: Percorrer o gráfico exibe os valores em tempo real de cada curva visível para essa percentagem de acelerador.

---

### Edição interativa de curvas personalizadas

Quando **Curva personalizada** é selecionada como tipo de consumo (tanto no combustível analógico como digital), os pontos de controlo surgem diretamente na curva SVG:

- **Geração inicial da curva**: Ao mudar pela primeira vez para Curva personalizada, os 5 pontos iniciais são amostrados diretamente a partir do perfil ativo (Linear, Quadrático ou Cúbico) sem saltos visuais.
- **Arrastar e largar interativo**: Clique e arraste qualquer ponto para cima, baixo, esquerda ou direita para remodelar a curva.
- **Monotonia garantida**:
    - *Combustível analógico*: Voltas mais rápidas consomem sempre combustível igual ou superior a voltas mais lentas (curva monótona não crescente). O arrastamento é limitado para evitar inversões.
    - *Combustível digital*: Níveis de aceleração mais altos consomem sempre combustível igual ou superior a níveis mais baixos (curva monótona não decrescente).
- **Adicionar pontos**: Clique na linha da curva para inserir um novo ponto de controlo na posição interpolada exata.
- **Eliminar pontos**: Clique com o botão direito do rato num ponto intermédio para o remover (são preservados pelo menos os 2 pontos finais).
- **Botões de reposição**: Redefina rapidamente a curva para os modelos Linear, Quadrático ou Cúbico através dos botões na barra superior.
- **Persistência em segundo plano**: Se mudar para uma predefinição e mais tarde voltar à Curva personalizada, os seus pontos são mantidos.
- **Cálculos autoritários no servidor**: O servidor calcula o consumo durante as corridas utilizando o mesmo algoritmo de interpolação linear por troços, garantindo que a pré-visualização seja idêntica à corrida ativa.
