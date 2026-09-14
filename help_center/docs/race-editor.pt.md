# Editor de Corrida

## Configurações de combustível

O Race Coordinator AI oferece suporte a simulação abrangente de combustível para pistas analógicas e digitais, incluindo capacidade personalizável, nível inicial, atrasos de paragem nas boxes, taxas de reabastecimento, penalidades por falta de combustível e modelos de consumo.

### Compatibilidade de pistas e seleção do sistema de combustível

O editor de corridas disponibiliza duas secções dedicadas à configuração do combustível: **Combustível analógico** e **Combustível digital**. O sistema disponível e ativo é determinado automaticamente pela pista selecionada para a corrida:

- **Pistas analógicas**: Pistas de slot car tradicionais onde os carros são alimentados diretamente pelos carris da calha, sem descodificadores digitais nem telemetria entre o carro e a pista. Quando uma pista analógica é selecionada, a secção **Combustível analógico** fica ativada e a secção **Combustível digital** é automaticamente desativada.
- **Pistas digitais**: Sistemas digitais de slot car (como Carrera Digital, Scalextric Digital, Scorpius ou oXigen) onde a interface comunica telemetria digital (ID do carro, percentagem de aceleração, sensores de entrada na linha de boxes). Quando uma pista digital é selecionada, a secção **Combustível digital** fica ativada e a secção **Combustível analógico** é automaticamente desativada.

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
- **Taxa de consumo**: Quantidade base de unidades de combustível consumidas por volta quando um piloto atinge o **Tempo de referência**.
- **Tempo de referência (s)**: O tempo de volta de referência base para a pista e categoria de carros (em segundos).
    - Voltas mais rápidas (abaixo do tempo de referência) queimam mais combustível.
    - Voltas mais lentas (acima do tempo de referência) queimam menos combustível.
    - O intervalo ativo de cálculo estende-se de $0,5 \times \text{Tempo de referência}$ a $1,5 \times \text{Tempo de referência}$.
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

- **Consumo de combustível por volta**: Exibe as unidades exatas consumidas ao longo do espetro de tempos de volta ($0,5 \times \text{ref}$ a $1,5 \times \text{ref}$). No modo Curva personalizada, os pontos de controlo e botões de reposição permitem remodelar a curva instantaneamente.
- **Tempo até paragem nas boxes**: Estima o tempo total de corrida (ou número de voltas) até esgotar o depósito a um ritmo constante.

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

- **Consumo de combustível digital**: Representa a percentagem de aceleração ($0\,\%$ a $100\,\%$) em relação ao consumo por segundo.
- **Tempo até esgotar**: Representa a percentagem de aceleração em relação aos segundos contínuos de condução até esvaziar totalmente o depósito.

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
