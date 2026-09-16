# Sistema de Áudio

O Race Coordinator AI integra um motor de áudio inteligente de dois canais concebido para proporcionar efeitos sonoros envolventes, comentários de voz dinâmicos e anúncios cruciais de controlo de corrida, sem sobreposições caóticas nem sinais perdidos.

---

## Arquitetura de Áudio de Canal Duplo

O motor de áudio divide os sons em dois canais independentes:

```
                      ┌────────────────────────────────────────┐
                      │          Distribuidor de Áudio         │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   Efeitos Sonoros (SFX)│                      │    Avisos de Voz       │
     │   (Toques Não Verbais) │                      │   (TTS e Comentários)  │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
        Reprodução Polifónica                          Voz Única Prioritária
      (Vários sons em simultâneo)                    ("Reproduzir, Substituir,
                  │                                         Descartar")       
                  │◄──────── Atenuação Automática (Ducking) ──────┤
                  │ (Os SFX descem automaticamente para 20%       │
                  │   do volume enquanto a voz estiver a falar)   │
```

### 1. Efeitos Sonoros (SFX)
- **O que inclui:** Sons curtos não verbais, como bips de passagem de volta (`default_beep`), sons de passagem rápida (`default_driveby`) ou campainhas.
- **Reprodução Polifónica:** São reproduzidos de imediato através de elementos HTML5. Se vários carros cortarem a meta em simultâneo, cada um dispara o seu próprio som sem cortes.
- **Atenuação Automática (Audio Ducking):** Enquanto um aviso de voz estiver ativo, o volume dos efeitos sonoros é temporariamente reduzido para **20%**. Quando a voz termina, os SFX voltam logo aos 100% de volume.

### 2. Avisos de Voz Falada
- **O que inclui:** Mensagens de texto para voz (TTS) e ficheiros áudio pré-gravados (comentários, sirenes de bandeira amarela, alertas de paragem nas boxes e contagens decrescentes).
- **Motor de Voz Única:** É gerido através da regra **"Reproduzir, Substituir ou Descartar"**, evitando que várias vozes falem ao mesmo tempo.

---

## O Sistema de Prioridades

Para lidar com eventos simultâneos, o Race Coordinator AI utiliza uma hierarquia com 4 níveis de prioridade:

### Níveis de Prioridade

| Nível | Peso | Eventos Típicos | Comportamento em Conflito |
| :--- | :---: | :--- | :--- |
| **`urgent`** (Urgente) | 4 | Bandeira amarela, manga concluída, corrida terminada, falsa partida, tempo mínimo por volta, volta de drift, paragem nas boxes, alertas de combustível (aviso, crítico, vazio). | **Interrompe** imediatamente avisos de menor prioridade. Se já houver um aviso urgente a falar, os novos avisos entram na **Fila Urgente**. Ignora a pausa de cadência. |
| **`high`** (Alta) | 3 | Recorde absoluto da pista, recorde da calha, novo líder da corrida, melhor volta da corrida. | **Interrompe** avisos de prioridade `normal` ou `low`. É **descartado** se soar um aviso `urgent` ou de prioridade igual/superior. |
| **`normal`** (Normal) | 2 | Anúncios de tempo (ex. "30 segundos restantes"), metade da manga, melhor volta da manga, melhor volta da calha na corrida, novo líder da manga, recorde pessoal do piloto (em modo TTS). | **Interrompe** avisos de prioridade `low`. É **descartado** se soar um aviso `urgent`, `high` ou outro aviso `normal`. |
| **`low`** (Baixa) | 1 | Som de volta padrão do piloto (em modo TTS). | Toca apenas se o canal de voz estiver livre. É **descartado** se qualquer outro aviso estiver ativo. |

### Regras de Conflito

1. **Substituição (Preemption):** Se surgir um evento com prioridade mais alta do que a voz atual, a fala em curso é interrompida imediatamente para dar lugar à nova mensagem.
2. **Descarte (Dropping):** Se um evento recebido tiver prioridade igual ou inferior à voz ativa, é ignorado para que os discursos não colidam.
3. **Fila Urgente (Urgent Queueing):** Os alertas urgentes envolvem segurança e regras de corrida. Se um alerta urgente surgir enquanto outro fala, fica na fila e é reproduzido logo a seguir.
4. **Pausa de Cadência (Callout Spacing):** Após o término de cada mensagem falada, existe um curto silêncio antes de autorizar o próximo aviso não urgente, garantindo boa clareza auditiva.

### Prioridade de Conquistas e Reserva (Milestone Priority & Fallback)

Quando um piloto completa uma volta que ativa uma ou mais conquistas (como recorde de pista, melhor volta da manga ou mudança de líder):

1. **Cascata de prioridade para eventos simultâneos:** Os sons de conquista candidatos são avaliados por ordem rigorosa de prioridade (Recorde absoluto -> Recorde absoluto de calha -> Novo líder de corrida -> Novo líder de manga -> Melhor volta de corrida -> Melhor volta de calha de corrida -> Melhor volta de manga -> Recorde pessoal). Se o som de maior prioridade estiver configurado como `none` (ou não configurado), o sistema passa para o som seguinte de maior prioridade ativado nessa volta e reproduz-o se estiver configurado.
2. **Avisos descartados por canal ocupado:** Se uma mensagem de voz selecionada for **descartada** porque outro aviso de prioridade mais alta está a falar (ou durante uma pausa de cadência), nenhuma outra mensagem de voz será tentada nessa volta. O sistema recorre diretamente ao som de **recorde pessoal** (se foi volta PB) ou ao som de **volta padrão**.
3. **Recurso polifónico SFX:** Se o som de recurso for um efeito sonoro (SFX), toca de forma polifónica, garantindo ao piloto feedback sonoro imediato ao passar na meta.

---

## Opções de Configuração de Áudio

Ajuste estas definições no **Editor de Interface**, na secção **Definições de Áudio**:

### Volume Principal (Master Volume)
- **Intervalo:** 0% a 100% (Padrão: `100%`)
- **Descrição:** Define o teto de volume geral para toda a aplicação, abrangendo efeitos sonoros e voz.

### Tempo Limite da Fila Urgente (TTL)
- **Opções:** `3 segundos`, `5 segundos (Padrão)`, `10 segundos`
- **Descrição:** Duração máxima que um alerta urgente pode esperar na fila. Avisos expirados são descartados para não anunciar situações já ultrapassadas.

### Espaçamento entre Avisos (Pausa de Cadência)
- **Opções:** `Nenhum (0s)`, `Curto (500ms - Padrão)`, `Normal (1000ms)`, `Relaxado (1500ms)`
- **Descrição:** Intervalo mínimo de silêncio entre avisos falados sucessivos. Avisos urgentes ignoram esta pausa imediatamente.

---

## Configuração de Texto para Voz (TTS)

O Race Coordinator AI tira partido da Web Speech API nativa do navegador para sintetizar fala em tempo real sem latência, sem nuvem e sem necessidade de ligação à internet.

### Parâmetros de Voz TTS

| Definição | Opções / Intervalo | Padrão | Descrição |
| :--- | :--- | :---: | :--- |
| **Voz TTS** | Vozes do navegador / SO | `-- Padrão do Sistema --` | Seleciona a voz utilizada para os avisos falados (com códigos de idioma como `pt-PT`, `pt-BR`, `en-US`). |
| **Velocidade (Rate)** | `0.1x` a `2.0x` | `1.0x` | Controla a rapidez da fala. Velocidades ligeiramente superiores (`1.1x`–`1.3x`) são ideais para pistas rápidas. |
| **Tom (Pitch)** | `0.0x` a `2.0x` | `1.0x` | Ajusta a tonalidade ou frequência da voz. |
| **Volume TTS** | `0%` a `100%` | `100%` | Volume próprio da voz antes da multiplicação com o Volume Principal (`masterVolume * ttsVolume`). |
| **Testar Voz** | Botão | — | Reproduz uma frase de teste com as opções atuais. |

### Variáveis Dinâmicas em TTS

Os textos de TTS aceitam variáveis entre chavetas `{...}` ou `${...}`:
- `{driver.name}`, `{driver.nickname}`: Nome e alcunha do piloto.
- `{driver.lastLapTime}`, `{driver.bestLapTime}`: Tempos de volta (arredondados automaticamente a 3 casas decimais).
- `{driver.totalLaps}` / `{driver.lapCount}`: Total de voltas completadas.
- `{driver.gapLeader}`, `{driver.gapPosition}`: Diferenças de tempo para o líder ou carro da frente.
- `{race.name}`, `{track.name}`, `{heat.number}`: Detalhes da prova.

Para mais exemplos, consulte o [Guia de Texto para Voz (TTS)](tts.md).

---

## Relevância de Áudio e Filtragem Multiecrãs

Em ambientes com vários monitores (ecrã principal, postos de piloto, monitores das boxes), a **Relevância de Áudio** assegura que cada ecrã emite apenas os sons associados ao seu conteúdo.

### 1. Associações de Áudio (Audio Associations)
Cada som inclui metadados de contexto:
- **`widgetType`**: Tipo de widget (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`**: Número da calha (iniciando em 0).
- **`driverId`**: Identificador único do piloto.

### 2. Filtragem pelo Esquema no Ecrã Principal
- **Calhas (`lane-view`):** Se o esquema não contiver nenhum widget de calha, os sons de volta dos pilotos são silenciados.
- **Contagem Decrescente (`countdown`):** Sem o widget da contagem, os bips de partida são desativados.
- **Temporizador (`timer`):** Sem o widget do cronómetro, os avisos de tempo restante são silenciados.
- **Bandeiras (`flag`):** Sem o widget de bandeiras, os sons de bandeira amarela e fim de corrida são desativados.

### 3. Postos de Piloto em Modo Delimitado (`scoped`)
No ecrã de um posto de piloto (`/driver-station/:lane`):
- O filtro funciona no modo **`scoped`**.
- Apenas são emitidos os sons, recordes e avisos de combustível do **piloto dessa calha**.
- Os sons dos concorrentes são filtrados para não desconcentrar o piloto.
- Os avisos globais (partida, bandeira amarela, fim de manga) continuam audíveis.

### 4. Motores de Áudio Isolados por Janela
Cada separador ou janela executa uma instância própria de `AudioService` (`providers: [AudioService]`). Os sons num posto de piloto nunca interferem com o ecrã da direção de prova.

---

---

## Catálogo Completo de Recursos de Áudio

As seguintes tabelas detalham todos os eventos de áudio no Race Coordinator AI, a classificação do som (SFX não verbal vs. aviso de voz verbal), o nível de prioridade e o âmbito de relevância no ecrã.

### Eventos de Áudio do Piloto (Configurados no Editor de Pilotos)

| Evento de Áudio do Piloto | Quando é reproduzido | Ficheiro / Recurso Padrão | Tipo de Som | Nível de Prioridade | Relevância e Ecrã |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Som de Volta** | Tocado a cada volta regular completada (ou como reserva caso um som de marco seja descartado ou não esteja disponível). | `default_beep` | **SFX** (Predefinido) / **Aviso de Voz** (TTS) | `low` (Peso 1 em TTS; Polifónico em SFX) | `lane-view`: Toca no Ecrã Principal (se houver widget de calha) e no Posto de Piloto dessa calha/piloto. |
| **Som de Melhor Volta Pessoal** | Tocado quando o piloto faz a sua volta mais rápida na bateria ou sessão atual. | `default_driveby` | **SFX** (Predefinido) / **Aviso de Voz** (TTS) | `normal` (Peso 2 em TTS; Polifónico em SFX) | `lane-view`: Toca no Ecrã Principal (se houver widget de calha) e no Posto de Piloto dessa calha/piloto. |
| **Som de Melhor Volta da Corrida** | Tocado ao cravar a melhor volta de toda a corrida entre todas as baterias e raias. | `default_best_race_lap` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de Melhor Volta de Raia da Corrida** | Tocado ao cravar a volta mais rápida naquela raia específica durante a corrida atual. | `default_best_race_lane_lap` | **Aviso de Voz** | `normal` (Peso 2) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de Melhor Volta da Bateria** | Tocado ao fazer a volta mais rápida entre todos os pilotos na bateria ativa. | `default_best_heat_lap` | **Aviso de Voz** | `normal` (Peso 2) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de novo líder da corrida** | Tocado quando um piloto assume a liderança geral da classificação da corrida. | `default_new_race_leader` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de novo líder da bateria** | Tocado quando um piloto assume a liderança na bateria ativa. | `default_new_heat_leader` | **Aviso de Voz** | `normal` (Peso 2) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de Recorde de Volta Geral** | Tocado quando o recorde histórico absoluto da pista em qualquer raia é quebrado. | `default_record_lap` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de Recorde de Volta de Raia Geral** | Tocado quando o recorde histórico da pista naquela raia específica é quebrado. | `default_record_lane_lap` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de Entrada nos Boxes** | Tocado quando o carro entra na faixa de boxes ou área de reabastecimento. | `default_pit_in` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Sons de Nível de Combustível** | Tocado quando o nível de combustível atinge os limites de aviso, crítico ou vazio. | `default_fuel_level` (Conjunto de Áudio) | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Som de Queima de Largada** | Tocado quando uma queima de largada ou infração de partida é detectada. | `default_penalty` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |

### Eventos de Áudio de Temas (Configurados no Editor de Temas)

| Ranhura de Áudio | Chave Padrão | Tipo de Som | Nível de Prioridade | Relevância e Ecrã |
| :--- | :--- | :--- | :---: | :--- |
| **Contagem de Partida** | `audio.countdown` | **Aviso de Voz** / Conjunto de Áudio | `urgent` | `countdown`: Toca no Ecrã Principal (se houver widget de contagem) e em todos os Postos de Piloto. |
| **Luz Verde / PARTIDA** | `audio.countdown.green` | **Aviso de Voz** / Toque Predefinido | `urgent` | `countdown`: Toca no Ecrã Principal (se houver widget de contagem) e em todos os Postos de Piloto. |
| **Bandeira Amarela** | `audio.yellowflag` | **Aviso de Voz** (Sirene de Aviso) | `urgent` (Peso 4) | `flag`: Toca no Ecrã Principal (se houver widget de bandeira) e em todos os Postos de Piloto. |
| **Segundos Restantes para Início Automático** | `audio.auto_start` | **Aviso de Voz** / Conjunto de Áudio (Padrão: TTS) | `normal` (Peso 2) | `timer`: Toca no Ecrã Principal (se houver widget de cronómetro) e em todos os Postos de Piloto. |
| **Segundos Restantes** | `audio.seconds_left` | **Aviso de Voz** | `normal` (Peso 2) | `timer`: Toca no Ecrã Principal (se houver widget de cronómetro) e em todos os Postos de Piloto. |
| **Voltas Restantes** | `audio.laps_left` | **Aviso de Voz** | `normal` (Peso 2) | `timer`: Toca no Ecrã Principal (se houver widget de cronómetro) e em todos os Postos de Piloto. |
| **Metade da Manga** | `audio.seconds_left.halfway` | **Aviso de Voz** | `normal` (Peso 2) | `timer`: Toca no Ecrã Principal (se houver widget de cronómetro) e em todos os Postos de Piloto ao atingir a metade da bateria (por tempo ou quando o líder completa metade das voltas). |
| **Manga Terminada** | `audio.heat_over` | **Aviso de Voz** | `urgent` (Peso 4) | `flag`: Toca no Ecrã Principal (se houver widget de bandeira) e em todos os Postos de Piloto. |
| **Segundos Restantes para Avanço Automático** | `audio.auto_advance` | **Aviso de Voz** / Conjunto de Áudio (Padrão: TTS) | `normal` (Peso 2) | `timer`: Toca no Ecrã Principal (se houver widget de cronómetro) e em todos os Postos de Piloto. |
| **Corrida Terminada** | `audio.race_over` | **Aviso de Voz** | `urgent` (Peso 4) | `flag`: Toca no Ecrã Principal (se houver widget de bandeira) e em todos os Postos de Piloto. |
| **Tempo Mínimo por Volta** | `audio.min_lap_time` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |
| **Volta de Drift** | `audio.drift_lap` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Toca no Ecrã Principal e no Posto de Piloto dessa calha/piloto. |

---

## Onde Configurar o Áudio

| Local | O que pode configurar |
| :--- | :--- |
| **Editor de Interface -> Definições de Áudio** | Volume principal, tempo de espera urgente, espaçamento de avisos, voz TTS, velocidade, tom, volume TTS e teste de fala. |
| **Editor de Temas** | Sons de sistema: contagem decrescente, luz verde, sirene de bandeira amarela, tempo restante, meio da manga, fim da manga, fim da corrida, tempo mínimo e volta de drift. |
| **Editor de Pilotos** | Sons específicos do piloto: Som de Volta, Som de Melhor Volta Pessoal, Som de Melhor Volta da Corrida, Som de Melhor Volta de Raia da Corrida, Som de Melhor Volta da Bateria, Som de novo líder da corrida, Som de novo líder da bateria, Som de Recorde de Volta Geral, Som de Recorde de Volta de Raia Geral, Som de Entrada nos Boxes, Sons de Nível de Combustível e Som de Queima de Largada. |
| **Gestor de Ativos** | Envio e gestão de ficheiros WAV, MP3 e OGG com pré-escuta imediata. |
