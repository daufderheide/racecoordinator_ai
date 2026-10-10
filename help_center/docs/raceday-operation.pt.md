# Operação no Dia de Corrida

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
