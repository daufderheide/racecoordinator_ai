# Editor de Interface

## Visão Geral

O Editor de Interface permite criar layouts personalizados para o dia de corrida, configurar colunas da classificação dos pilotos, personalizar efeitos sonoros e imagens de temas e carregar [Widgets Personalizados](custom-widgets.md) modulares.

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
- **Pré-visualização**: O inspetor inclui uma pré-visualização instantânea que demonstra a formatação das opções selecionadas em diferentes fases da corrida (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).

## Widgets de Coluna de Pista e Duplicação

O widget **Coluna de Pista** permite posicionar colunas individuais de dados da visualização de pista (como informações do piloto, tempo da última volta, melhor volta / recorde pessoal, combustível %, histórico de voltas, velocidades de setor, posição, etc.) em qualquer lugar da tela como cartões modulares independentes.

- **Modos de Associação**:
  - **Pista Física**: Vincula o cartão a uma pista específica do circuito (Pista 1 a Pista 8). O cartão mantém os dados dessa pista durante toda a corrida.
  - **Posição na Classificação**: Vincula o cartão a uma classificação atual (1º Lugar, 2º Lugar, etc.). O cartão acompanha dinamicamente ultrapassagens e alterações de posição, adaptando as cores de fundo e texto à pista do piloto que ocupa essa colocação.
- **Orientação**: Suporta layouts **Vertical** (cabeçalho acima do valor) e **Horizontal** (cabeçalho e valor lado a lado).
- **Herança de Cores e Personalização**: Por padrão, os cartões herdam as cores de fundo e texto da pista atribuída (`Usar Cores da Pista`), ou podem receber cores personalizadas de fundo, texto e borda.
- **Duplicar em Pistas / Posições**:
  - Em vez de criar e alinhar cartões manualmente para cada pista, configure um único cartão para uma pista ou posição e clique em **Duplicar em Pistas / Posições...** no inspetor.
  - Escolha a direção (**Horizontal** lado a lado ou **Vertical** empilhado), o número total de pistas/posições de destino (2 a 8), o modo de espaçamento (**Ajustar à Tela** ou **Preservar Espaçamento**) e a substituição opcional dos widgets existentes.
  - O editor de layout duplica, reposiciona, renumera e vincula automaticamente os cartões em todas as pistas ou posições selecionadas com um único clique.

