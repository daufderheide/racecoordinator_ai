# Operação no Dia de Corrida

## Início e Pausa de Corridas

No dia de corrida, as operações na pista passam por estados automatizados controlados pelo diretor de prova por meio de teclas de atalho, botões da barra de ferramentas ou botões de emergência na pista:

### Início de Baterias
- **Grid e Contagem Regressiva**: Ao iniciar uma bateria, o Race Coordinator AI ativa uma contagem regressiva automática (configurada no editor de corrida). Sinais sonoros e luzes de largada preparam os competidores.
- **Bandeira Verde**: Ao atingir zero, a energia da pista é ativada e a bateria entra no estado `Racing`.
- **Tempo de Reação**: Se "Largar atrás do sensor" estiver ativado, o primeiro acionamento do sensor registra o tempo de reação na largada em vez de uma volta completa.

### Pausas e Bandeiras Amarelas
- **Acionamento de uma Pausa**: Pressionando a barra de espaço, clicando no ícone de **Pausa** ou acionando um botão externo de pista, a bandeira amarela é imediatamente acionada (`Paused`).
- **Corte Imediato de Energia**: Os relés desligam instantaneamente a alimentação para imobilizar os carros.
- **Captura de Tempos Parciais**: No mesmo milissegundo, a interface de hardware congela o tempo parcial percorrido por cada carro ativo e o salva no tempo pendente.
- **Cruzando a Chegada por Inércia (Voltas de Drift)**: Se um carro estava próximo da linha ao cortar a energia, seu embalo pode levá-lo a cruzar o sensor.
    - Se o sensor for acionado dentro do **Tempo de deriva** configurado, a passagem é validada como **Volta de Drift** (`isDrift: true`). O badge **`DRIFT`** surge na coluna da calha, soa o aviso de voz urgente e a volta é creditada ao piloto.
    - Se ocorrer após o término do prazo, o disparo é ignorado para evitar voltas indevidas causadas por fiscais de pista.
    - Para detalhes completos, consulte [Editor de Corrida: Mecânica de Deriva e Cronometragem de Drift](race-editor.pt.md#drifting-and-drift-timing).

### Retomada da Corrida
- **Reinício sob Bandeira Verde**: Ao liberar a pausa, a contagem regressiva recomeça. Com a bandeira verde, a energia volta e os cronômetros reiniciam do zero.
- **Conclusão da Volta (Voltas com Drift Envolvido)**: Quando um carro parado na pista retoma a corrida e cruza a linha de chegada sob tração, seu tempo total soma o parcial anterior à pausa com o tempo pós-retomada. Trata-se de uma **Volta com Drift Envolvido**. Se "Excluir voltas com drift dos recordes" estiver ativado, a volta conta para a bateria mas não concorre a recordes.

## Ajustes de Voltas e Tempo

Os diretores de prova podem ajustar manualmente a contagem de voltas e os tempos de bateria dos pilotos diretamente na tela de corrida para resolver problemas de pista, falhas de sensores ou penalidades:

### Como Abrir o Diálogo de Ajuste
- **Clique na Célula**: Clique com o botão esquerdo em qualquer célula ou cartão de **Contagem de Voltas** (`lapCount`, `physicalLapCount`) ou **Tempo Total** (`totalTime`, `overallTotalTime`) para aquela pista.
- **Menu do Diretor de Prova**: Abra o **Menu do Diretor de Prova** e selecione **Ajustar seções de volta/tempo** para modificar qualquer piloto em baterias atuais, passadas ou ainda não iniciadas em lote.
- **Telas de Resultados**: Também acessível pelas telas de **Resultados da Bateria** e **Resultados da Corrida** para editar baterias após o término.

### Atalhos Rápidos (Voltas)
Ao clicar sobre uma célula interativa de voltas:
- **`Shift + Clique Esquerdo`**: Adiciona imediatamente +0.25 voltas (+1/4 de volta) sem abrir o diálogo.
- **`Alt + Clique Esquerdo`**: Subtrai imediatamente -0.25 voltas (-1/4 de volta) sem abrir o diálogo.

### Controles no Diálogo
1. **Seções de Volta**: Insira seções de pista (por exemplo, em uma base de 100 seções por volta) para ajustar a contagem de voltas. Uma prévia em tempo real indica a fração correspondente (ex. 25 seções = 0.25 voltas).
2. **Ajuste de Tempo**: Insira segundos positivos (tempo de penalidade, ex. `+5.000`) ou negativos (compensação de tempo, ex. `-2.500`) com precisão de milissegundos (`0.001s`).
3. **Prévia do Tempo Total em Tempo Real**: O diálogo calcula e exibe o tempo total ajustado do piloto em tempo real antes de aplicar as mudanças.

### Efeito nas Classificações e Métricas
- **Voltas Ajustadas**: Altera diretamente a posição em classificações por **Maior Número de Voltas** e atualiza as diferenças de volta (`gapLeader`, `gapPosition`). Não altera as voltas físicas dos sensores, a melhor volta, a volta mediana ou o ritmo médio físico.
- **Tempo Total Ajustado**: Altera a posição em classificações por **Tempo Total Mais Rápido**, serve como critério de desempate principal para pilotos empatados em voltas, e atualiza o **Tempo Médio de Volta** ($\text{Tempo Total Ajustado} / \text{Voltas Físicas}$) e as diferenças de tempo.
- **Métricas Protegidas**: A **Melhor Volta** e a **Volta Mediana** são rigorosamente preservadas a partir das voltas físicas registradas pelos sensores e nunca são alteradas por ajustes de tempo.

---

## Operações de Crash and Learn {: #crash-and-learn-operations }

Quando uma corrida é disputada com o **Crash and Learn (CNL)** ativado, o Race Coordinator AI monitora as saídas de pista (batidas) em tempo real, aplica limites de batidas, atribui penalidades automáticas e gerencia desqualificações.

### Detecção de Batidas e Botões de Chamada
- **Detecção Automática de Batidas**: Se configurada e o tempo de volta exceder o limite de **Tempo de Batida Automático**, o sistema detecta uma saída de pista e atribui uma batida ao piloto.
- **Bandeiras Amarelas Automáticas**: Se **Pausar bateria em batida** estiver ativado, uma batida automática aciona imediatamente uma bandeira amarela e corta a energia da pista.
- **Múltiplas Batidas por Volta**: Se **Permitir múltiplas batidas por volta** estiver ativado, um carro fora da pista acumulará uma batida adicional a cada vez que o tempo limite transcorrer sem cruzar a linha.
- **Botões de Chamada por Fita**: Em pistas equipadas com botões de chamada por fita, pressionar o botão pausa a bateria e credita uma batida à fita correspondente. Pressionar outros botões durante a pausa não credita batidas adicionais.

### Mecânica de Desqualificação (DQ)
Quando um piloto ultrapassa o limite de **Máximo de Batidas** (por exemplo, 4 batidas com limite de 3):
- **Bandeira Preta**: O status da fita muda imediatamente para a bandeira preta (`flag.disqualified`).
- **Corte de Energia da Fita**: Se houver relés por fita instalados, a alimentação daquela fita é desligada instantaneamente.
- **Contagem de Voltas Bloqueada**: Leituras do sensor e voltas são ignoradas para pilotos desqualificados durante o restante da bateria.
- **Zero segmentos automáticos**: Em corridas com segmentos automáticos (`NoneAutoSegments` ou `SingleLapAutoSegments`), um piloto desqualificado recebe $0$ segmentos automáticos. Como uma colisão ou detecção automática de desengate para o piloto na pista, atribuir segmentos automáticos recompensaria artificialmente um piloto desqualificado com até $0.99$ voltas.
- **Posição na Classificação**: Um piloto desqualificado não pode ser classificado à frente de um competidor não desqualificado na bateria. Havendo múltiplos desqualificados, a ordem é definida pela pontuação ajustada pela **Porcentagem de Pontuação na Bateria após Desqualificação**.

### Revisão e Ajuste de Batidas e Penalidades
Os diretores de prova mantêm controle manual completo:
- **Widgets de Contador de Batidas**: As colunas de fita exibem a contagem de batidas da bateria atual.
- **Ajustes Manuais**: Por meio dos controles ou do diálogo **Ajustar Seções de Volta / Tempo**, é possível adicionar ou subtrair batidas.
- **Reversão da Desqualificação**: Reduzir as batidas para o limite ou abaixo reverte a desqualificação de imediato: a bandeira volta a ser verde, a energia é restaurada e as penalidades são recalculadas.
- **Visibilidade de Penalidades**: Voltas e tempo de penalidade acumulados são exibidos no diálogo de ajuste ao lado dos campos de edição.
