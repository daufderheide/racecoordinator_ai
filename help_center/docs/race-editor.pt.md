# Editor de Corrida

## Configurações de combustível

O Race Coordinator AI oferece suporte a simulação abrangente de combustível para pistas analógicas e digitais, incluindo capacidade personalizável, nível inicial, atrasos de paragem nas boxes, taxas de reabastecimento, penalidades por falta de combustível e modelos de consumo.

### Modelos de consumo de combustível

O consumo de combustível por volta (analógico) ou por segundo (digital) pode ser determinado por predefinições matemáticas ou por um perfil personalizado interativo:

- **Linear**: O consumo de combustível varia linearmente com a velocidade ou aceleração.
- **Quadrático**: O consumo de combustível aumenta quadraticamente para tempos de volta mais rápidos ou níveis de aceleração mais altos.
- **Cúbico**: O consumo de combustível sobe abruptamente em velocidades extremas e aceleração total.
- **Curva personalizada**: Permite controlo detalhado sobre a curva de consumo através do arrastamento de pontos de controlo interativos diretamente no gráfico.

### Edição interativa de curvas personalizadas

Quando **Curva personalizada** é selecionada como tipo de consumo, os pontos de controlo surgem diretamente na curva SVG:

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
