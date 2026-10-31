# Cálculos de Diferenças e Widgets de Diferença (Gaps)

O Race Coordinator AI inclui um mecanismo automatizado no servidor para cálculo de diferenças (`GapCalculator`), que determina em tempo real os intervalos de tempo e voltas entre competidores. Todos os cálculos são executados continuamente no servidor e sincronizados com os painéis dos clientes, widgets personalizados, chamadas de voz e exportações para planilhas.

---

## Visão Geral dos Cálculos de Diferenças

Sempre que a classificação da corrida é atualizada, o mecanismo classifica todos os competidores de acordo com a ordem da corrida e as regras de pontuação ativas (Mais Voltas, Menor Tempo Total ou Pontos). Em seguida, as métricas de diferença são calculadas em relação a dois referenciais distintos:

- **Diferença para o Líder (`leader`)**: O intervalo entre um competidor e o líder atual da corrida (P1). A diferença do líder para si mesmo é sempre `0.0` (exibida como `--`).
- **Diferença para o Carro da Frente (`position`)**: O intervalo entre um competidor e o carro imediatamente à frente na classificação (ex.: P3 em relação a P2). A diferença do líder é sempre `0.0` (exibida como `--`).

### Escopos de Dados: Diferenças da Bateria vs. Diferenças Gerais

O Race Coordinator AI suporta a avaliação de diferenças em dois escopos:

| Escopo | Chave da Coluna | Descrição | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **Dados da Bateria (Heat Data)** | `gap` | Avalia intervalos estritamente entre os carros que competem na bateria atual. Pilotos aguardando exibem traços (`--`). | Corridas ao vivo, cartões de pista, placares de bateria. |
| **Dados Gerais (Overall Data)** | `overallGap` | Avalia intervalos cumulativos entre todos os participantes do torneio, em todas as baterias disputadas. | Grades gerais, classificações de campeonato. |

> [!NOTE]
> Os layouts existentes que utilizam chaves de coluna legadas (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, etc.) são migrados automaticamente ao carregar para `gap` ou `overallGap` com as configurações correspondentes de alvo e modo de cálculo.

---

## Os 2 Widgets de Diferença Configuráveis

O Race Coordinator AI oferece **2 widgets de diferença configuráveis** (disponíveis como colunas de grade, cartões de pista individuais e inserções personalizadas):

```
                          ┌──────────────────────────────────────────────┐
                          │         WIDGETS DE DIFERENÇA DE CORRIDA      │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │DIFERENÇA BATERIA (`gap`)│                                 │DIFERENÇA GERAL(`overallGap`)│
      │ Pilotos Bateria Ativa   │                                 │Todos os Participantes   │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │   SELETOR DE ALVO     │           │    MODO DE CÁLCULO    │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Líder (P1)          │           │ • Sempre tempo        │
                   │ • Posição à frente    │           │ • Tempo e voltas (F1) │
                   │                       │           │ • Sempre voltas       │
                   └───────────────────────┘           └───────────────────────┘
```

### Seleção de Alvo
- **Líder (`leader`)**: Intervalo relativo ao líder atual da corrida (P1). O líder exibe traços (`--`).
- **Posição à frente (`position`)**: Intervalo relativo ao concorrente imediatamente à frente (ex.: P3 vs P2). O líder exibe traços (`--`).

### Modos de Cálculo
1. **Sempre tempo (`always_time`)**:
   - Projeção matemática contínua de ritmo em segundos.
   - Formatado como `+X.XXX` com casas decimais de tempo configuráveis (1 a 3 casas).
2. **Tempo e voltas atrás (`laps_and_time`)**:
   - Formato estilo transmissão Fórmula 1.
   - Exibe segundos (`+X.XXX`) quando os carros estão na mesma volta.
   - Exibe déficit de voltas (`+1 Volta`, `+N Voltas`) quando houver volta perdida.
3. **Sempre voltas (`always_laps`)**:
   - Diferença exata de voltas calculada a cada volta completada pelo competidor na linha de chegada.
   - Incorpora o progresso de volta parcial do piloto alvo naquele momento exato.
   - Formatado com casas decimais de volta configuráveis (0 a 3 casas).

---

## Fórmulas de Cálculo Detalhadas

Todos os cálculos são executados em `com.antigravity.race.GapCalculator` no servidor Java.

Seja `leadParticipant` o piloto à frente (líder ou posição $N-1$) e `curParticipant` o piloto perseguidor.

### 1. Fórmula: Sempre Tempo (`always_time`)

As diferenças de tempo padrão avaliam três cenários:

#### Cenário A: Mesmo Número de Voltas Concluídas
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Cenário B: Nenhuma Volta Concluída
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Cenário C: Número Diferente de Voltas
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

A fórmula de projeção adapta-se ao **Método de Encerramento**:
1. **Corridas por Tempo**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$
2. **Corridas por Voltas**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

---

### 2. Fórmula: Fórmula 1 (`laps_and_time`)

#### 1. Verificação de Voltas Perdidas
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$
- Se $\text{LapsDown} > 0$: O piloto levou volta (`+X Voltas`).
- Se $\text{LapsDown} \le 0$: Na mesma volta do líder.

#### 2. Diferença na Volta do Líder
- **Mesmo número de voltas concluídas**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Líder completou uma volta adicional**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

---

### 3. Fórmula: Sempre Voltas (`always_laps`)

Mede a diferença exata de voltas ao completar cada volta:

#### 1. Disparo de Conclusão de Volta
Ao cruzar a linha de chegada, o servidor registra as voltas ajustadas do competidor e identifica o piloto de referência.

#### 2. Cálculo de Volta Parcial
Para garantir uma comparação justa e precisa, o progresso de volta parcial do piloto de referência é calculado a partir do tempo decorrido desde a última volta dele:
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> Caso o piloto de referência ainda não tenha um tempo mediano válido ($\le 0$) ou $\text{TimeSinceLastLap} \le 0$, a volta parcial é avaliada em $0.0$. O progresso é limitado a $0.99$ para evitar arredondamentos indevidos antes do cruzamento físico da linha.

#### 3. Diferença Efetiva de Voltas
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

O competidor retém esse valor até a conclusão da sua própria volta seguinte.

---

### 4. Modo de Classificação Volta Mais Rápida

Quando o método de classificação da bateria ou geral está configurado como **Volta Mais Rápida** (`FASTEST_LAP`), os cálculos de intervalo avaliam a diferença entre as melhores voltas pessoais dos pilotos em vez de contagens de voltas ou projeções de tempo:

#### 1. Diferença para o Líder
$$\text{Gap}_{\text{lead}} = \text{BestLap}_{\text{cur}} - \text{BestLap}_{\text{lead}}$$

#### 2. Diferença para a Posição Anterior
$$\text{Gap}_{\text{ahead}} = \text{BestLap}_{\text{cur}} - \text{BestLap}_{\text{ahead}}$$

- **Sem volta cronometrada**: Se um competidor ou o piloto de referência ainda não concluiu uma volta cronometrada ($\text{BestLap} \le 0$), a diferença é avaliada como `0.0` (exibida como `--`).
- **Fórmula 1 e voltas atrás**: Como a classificação se baseia estritamente no ritmo de qualificação em volta única, os competidores não podem tomar volta de atraso ($\text{LapsDown} = 0$). As métricas de diferença estilo Fórmula 1 (`gapLeaderF1`, `gapPositionF1`) equivalem ao delta da volta mais rápida, e as métricas de diferença em voltas (`gapLeaderLaps`, `gapPositionLaps`) são avaliadas como `0.0`.

---

## Comparação dos Modos de Cálculo

| Característica | Sempre tempo (`always_time`) | Tempo e voltas atrás (`laps_and_time`) | Sempre voltas (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Abordagem** | Projeção matemática contínua de ritmo | Comparações exatas na linha de chegada | Diferença de voltas com volta parcial |
| **Carros com Volta Perdida**| Segundos projetados (ex.: `+14.820`) | Texto de voltas perdidas (`+1 Volta`) | Delta decimal de voltas (ex.: `+2.45`) |
| **Na Volta do Líder** | Diferença em segundos (`+1.450`) | Diferença exata na linha (`+1.450`) | Delta decimal de voltas (ex.: `+0.28`) |
| **Base Decimal** | Casas decimais de tempo (1 a 3) | Casas decimais de tempo (1 a 3) | Casas decimais de volta (0 a 3) |
| **Momento de Atualização** | Atualizações contínuas | Cruzamento da linha de chegada | Cruzamento pessoal de volta concluída |
| **Aplicação Ideal** | Pacing em autorama, tomada de tempos | Telas de transmissão estilo Fórmula 1 | Corridas de endurance por voltas |

---

## Usando Widgets de Diferença no Editor de Interface

### 1. Em Grades e Classificações
No Editor de Interface, selecione o widget de Grade e acesse a aba **Colunas**. Em **Gaps e Intervalos**, ative **Diferença da Bateria** (`gap`) ou **Diferença Geral** (`overallGap`):
- Selecione a coluna para abrir o **Inspetor de Colunas**.
- Em **Configuração de diferença**, defina o **Alvo** (*Líder* ou *Posição à frente*) e o **Modo de cálculo** (*Sempre tempo*, *Tempo e voltas atrás* ou *Sempre voltas*).
- Podem ser adicionadas simultaneamente à mesma grade várias colunas de diferença com alvos ou modos distintos.

### 2. Cartões de Pista Individuais
Arraste widgets de diferença da caixa de ferramentas diretamente para a tela e configure alvo e modo no inspetor.

### 3. Inserções (Insets)
As métricas de diferença podem ser inseridas como sub-badges em cartões de pista atribuindo `gap` ou `overallGap` a qualquer uma das 8 posições de ancoragem.

---

## Integração com TTS, Áudio e Exportação

- **Texto para Voz (TTS)**: `{driver.gapLeader}` e `{driver.gapPosition}`.
- **Widgets personalizados HTML/JS**: `driver.gap_leader` e `driver.gap_position`.
- **Exportações para Excel**: `${driver.gapLeader}` e `${driver.gapPosition}`.
