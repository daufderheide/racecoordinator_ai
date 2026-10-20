# Cálculos de Diferenças & Widgets de Intervalo (Gaps)

O Race Coordinator AI inclui um mecanismo automatizado no servidor para cálculo de diferenças (`GapCalculator`), determinando em tempo real os intervalos de tempo e as diferenças de voltas entre concorrentes. Todos os cálculos são executados continuamente no servidor e sincronizados com a interface do cliente, widgets personalizados, anúncios de voz (TTS) e exportações em folhas de cálculo.

---

## Visão Geral dos Cálculos de Diferenças

Sempre que a classificação da corrida é atualizada, o sistema ordena todos os concorrentes pela sua posição atual de acordo com as regras de pontuação ativas (Maior Número de Voltas, Tempo Total Mais Rápido ou Pontos). Em seguida, as métricas de diferença são calculadas em relação a dois referenciais distintos:

- **Diferença para o Líder (`gapLeader` / `overallGapLeader`)**: O intervalo de tempo entre um concorrente e o 1.º classificado da corrida (P1). A diferença do líder para si próprio é sempre `0.0` (apresentada como `--`).
- **Diferença para o Carro da Frente (`gapPosition` / `overallGapPosition`)**: O intervalo de tempo entre um concorrente e o carro imediatamente à sua frente na classificação (por exemplo, P3 em relação a P2). A diferença do 1.º classificado é sempre `0.0` (apresentada como `--`).

### Âmbitis de Dados: Diferenças da Manga vs. Diferenças Gerais

O Race Coordinator AI suporta o cálculo de diferenças em dois âmbitos distintos:

| Âmbito | Chaves de Colunas | Descrição | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **Dados da Manga (Heat Data)** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Avalia as diferenças estritamente entre os carros que estão a competir na pista na manga ativa. Pilotos em descanso apresentam traços (`--`). | Corridas ao vivo, cartões de pista, tabelas de classificação da manga. |
| **Dados Gerais (Overall Data)** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Avalia as diferenças acumuladas do torneio entre todos os participantes inscritos, abrangendo todas as mangas concluídas. | Grelhas de classificação geral, acompanhamento de campeonatos. |

---

## Os 4 Widgets de Diferença Suportados

O Race Coordinator AI disponibiliza **4 widgets de diferença específicos** (disponíveis como colunas de grelha, cartões de coluna independentes e inserções personalizadas), divididos por método de cálculo e alvo de referência:

```
                          ┌──────────────────────────────────────────────┐
                          │            WIDGETS DE DIFERENÇA              │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │   DIFERENÇAS PADRÃO     │                                 │  DIFERENÇAS FÓRMULA 1   │
      │   Projeção de Ritmo     │                                 │ Passagem Linha de Meta  │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │ (Líder P1)  │     │(Carro Frente│                         │ (Líder P1)  │     │(Carro Frente│
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Diferença para o Líder (Padrão)
- **Chaves da Caixa de Ferramentas**: `gapLeader` (Manga) / `overallGapLeader` (Geral)
- **Grupo da Caixa de Ferramentas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Rótulos Predefinidos**: `HEAT GAP LEADER`, `OVERALL GAP LEADER` ou `GAP LEADER`
- **Modelo de Medição**: Projeção matemática contínua de ritmo.
- **Apresentação**: Formatado como `+X.XXX` segundos com casas decimais configuráveis (1 a 3 decimais). O líder apresenta `--`.
- **Objetivo**: Fornece uma estimativa em tempo real da desvantagem temporal para o líder. Mesmo que o líder tenha completado mais voltas, projeta o intervalo com base no ritmo médio do perseguidor.

### 2. Diferença para o Carro da Frente (Padrão)
- **Chaves da Caixa de Ferramentas**: `gapPosition` (Manga) / `overallGapPosition` (Geral)
- **Grupo da Caixa de Ferramentas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Rótulos Predefinidos**: `HEAT GAP POSITION`, `OVERALL GAP POSITION` ou `GAP POSITION`
- **Modelo de Medição**: Projeção matemática contínua de ritmo.
- **Apresentação**: Formatado como `+X.XXX` segundos. O 1.º classificado apresenta `--`.
- **Objetivo**: Exibe o tempo necessário para ultrapassar o concorrente imediatamente à frente. Essencial para duelos diretos em pista.

### 3. Diferença Fórmula 1 para o Líder (`F1`)
- **Chaves da Caixa de Ferramentas**: `gapLeaderF1` (Manga) / `overallGapLeaderF1` (Geral)
- **Grupo da Caixa de Ferramentas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Rótulos Predefinidos**: `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP` ou `GAP LEADER`
- **Modelo de Medição**: Medição cronométrica física exata na linha de meta.
- **Apresentação**:
  - **Na mesma volta**: `+X.XXX` segundos de diferença física ao cruzar a linha.
  - **Pilotos dobrados**: Substitui o tempo por `+1 Volta` ou `+N Voltas` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Líder**: Apresenta `--`.
- **Objetivo**: Reproduz as transmissões oficiais de Fórmula 1. Evita números gigantescos de tempo estimado para carros dobrados, indicando claramente a desvantagem em voltas.

### 4. Diferença Fórmula 1 para o Carro da Frente (`F1`)
- **Chaves da Caixa de Ferramentas**: `gapPositionF1` (Manga) / `overallGapPositionF1` (Geral)
- **Grupo da Caixa de Ferramentas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Rótulos Predefinidos**: `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP` ou `GAP POSITION`
- **Modelo de Medição**: Medição cronométrica física exata na linha de meta.
- **Apresentação**:
  - **Na mesma volta**: Formatado como `+X.XXX` segundos atrás do concorrente da frente.
  - **Dobrado pelo carro da frente**: Apresenta `+1 Volta` ou `+N Voltas`.
  - **Líder**: Apresenta `--`.
- **Objetivo**: Proporciona uma experiência autêntica em disputas diretas, indicando prontamente as voltas perdidas em relação ao carro anterior.

---

## Fórmulas de Cálculo Detalhadas

Todo o processamento matemático é realizado em `com.antigravity.race.GapCalculator` no servidor Java.

Considere `leadParticipant` o piloto da frente e `curParticipant` o piloto perseguidor.

### Matemática da Projeção de Diferença Padrão

São tratados três cenários:

#### Cenário A: Mesmo Número de Voltas
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Cenário B: Nenhuma Volta Completa Realizada
Se o piloto perseguidor ainda não completou uma volta cronometrada (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Cenário C: Diferente Número de Voltas
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

A fórmula adapta-se consoante o **Método de Fim de Prova (Finish Method)**:

1. **Corridas por Tempo (Timed Finish)**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Corridas por Voltas (Lap Finish)**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Se $\text{ProjectedGap}$ resultar num valor negativo devido a anomalias de cronometragem, o sistema utiliza automaticamente $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$.

---

### Matemática das Diferenças Fórmula 1

#### 1. Voltas Perdidas (Laps Down)
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Se $\text{LapsDown} > 0$: O perseguidor foi dobrado. O tempo é fixado em `0.0` e a interface apresenta `+X Voltas`.
- Se $\text{LapsDown} \le 0$: O perseguidor está na volta do líder ($\text{LapsDown} = 0$).

#### 2. Diferença na Volta do Líder
- **Mesmo Número de Voltas Físicas Realizadas**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **O Líder Completou uma Volta Adicional**: A diferença é calculada no momento exato em que o líder completou a mesma volta:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> Se o tempo calculado for negativo, é fixado em `0.0`.

---

## Comparação: Diferenças Padrão vs. Diferenças Fórmula 1

| Característica | Diferenças Padrão (`gapLeader`, `gapPosition`) | Diferenças Fórmula 1 (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Abordagem de Cálculo** | Projeção estatística contínua de ritmo | Comparação exata ao passar pela meta |
| **Carros Dobrados** | Segundos projetados (ex. `+14.820`) | Texto de voltas perdidas (ex. `+1 Volta`, `+2 Voltas`) |
| **Na Mesma Volta** | Diferença temporal em segundos (`+1.450`) | Diferença exata na linha da mesma volta (`+1.450`) |
| **Tipo de Fim de Corrida** | Diferencia provas por tempo e por voltas | Baseado no cruzamento da linha de meta |
| **Aplicação Ideal** | Controlo de ritmo contínuo no slot car | Gráficos televisivos, ecrãs de espectadores |

---

## Utilização dos Widgets no Editor de IU

### 1. Em Grelhas e Classificações
No Editor de IU, selecione o widget Grid e aceda ao separador **Colunas**. Nos subgrupos **Gaps & Intervals** ou **Overall Gaps & Intervals**, ative as colunas pretendidas.

### 2. Cartões de Coluna Independentes
Arraste um widget de diferença a partir da Caixa de Ferramentas para a tela e vincule-o a uma **Pista Específica**, uma **Posição na Manga** ou à **Classificação Geral**.

### 3. Inserções (Insets) noutros Cartões
Adicione o valor da diferença como um distintivo secundário noutros cartões através dos 8 pontos de fixação em **Card Insets**.

---

## Integração com Voz (TTS), Áudio e Exportação

- **Conversão de Texto em Voz (TTS)**:
  - `{driver.gapLeader}`: Diferença para o líder vocalizada em segundos.
  - `{driver.gapPosition}`: Diferença para o carro da frente vocalizada em segundos.
- **Widgets HTML/JS Personalizados**: `driver.gap_leader` e `driver.gap_position`.
- **Modelos Excel (XLS)**:
  - `${driver.gapLeader}` e `${driver.gapPosition}` (Classificação geral).
  - `${heatDriver.gapLeader}` e `${heatDriver.gapPosition}` (Resultados da manga).
