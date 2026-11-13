# Interpolação de Variáveis em Texto para Voz (TTS)

O Race Coordinator AI suporta a substituição dinâmica de variáveis em textos de síntese de voz para gerar avisos auditivos personalizados sobre pilotos, tempos e estatísticas de corrida.

## Sintaxe

As variáveis TTS utilizam uma sintaxe uniforme entre chavetas: `{variable.path}` ou `${variable.path}`. Esta formatação é idêntica à adotada nos **Modelos de Exportação Excel** e nos **Widgets Personalizados da Interface**.

A interpolação **não diferencia maiúsculas de minúsculas** (por exemplo, `{driver.lastLapTime}` e `{DRIVER.LASTLAPTIME}`). Espaços dentro das chavetas (ex. `{ driver.nickname }` ou `${ driver.nickname }`) também são aceites.

## Variáveis Disponíveis

| Caminho da Variável | Descrição |
| :--- | :--- |
| `{driver.name}` | Nome completo do piloto. |
| `{driver.nickname}` | Alcunha do piloto (ou nome se não definida). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Total de voltas completadas pelo piloto. |
| `{driver.totalTime}` | Tempo total decorrido da corrida em segundos. |
| `{driver.lastLapTime}` | Tempo da volta acabada de concluir. |
| `{driver.bestLapTime}` | Volta mais rápida do piloto na manga atual. |
| `{driver.averageLapTime}` | Tempo médio por volta do piloto na manga. |
| `{driver.medianLapTime}` | Mediana dos tempos por volta do piloto na manga. |
| `{driver.gapLeader}` | Diferença em segundos para o líder da corrida. |
| `{driver.gapPosition}` | Diferença em segundos para o piloto da frente. |
| `{race.name}` | Nome da corrida ativa. |
| `{track.name}` | Nome da pista atual. |
| `{heat.number}` | Número da manga ativa. |

## Regras de Formatação

### Números
*   **Inteiros**: Lidos normalmente (ex. `10`).
*   **Decimais**: Arredondados automaticamente a **3 casas decimais** (ex. `5.432`).

## Integração com o Sistema de Áudio

Os avisos falados de TTS são geridos pelo [Sistema de Áudio](audio.md) centralizado:

*   **Voz, Velocidade e Tom**: Configure a voz, velocidade (`0.1x`–`2.0x`), tom e volume no painel **Editor de Interface -> Definições de Áudio**.
*   **Níveis de Prioridade**: Avisos urgentes (como bandeira amarela ou fim de manga) sobrepõem-se aos comentários de rotina, evitando sobreposição de vozes.
*   **Relevância de Áudio**: Em postos de piloto e ecrãs secundários, os anúncios TTS são filtrados para que cada piloto ouça apenas o que diz respeito à sua calha.

## Navegadores Móveis e Estações de Pilotos

Ao visualizar uma estação de piloto ou tela de dia de corrida em um celular ou tablet (por exemplo, escaneando o código QR da estação de piloto com um iPhone ou dispositivo Android):

*   **Ativação com o primeiro toque**: Os sistemas operacionais móveis (iOS e Android) exigem uma interação física com a tela antes de permitir a reprodução de áudio da web ou conversão de texto em fala. Toque na tela uma vez (ou toque no aviso **Toque na tela para ativar o áudio**) ao abrir a página. Uma vez ativado, o Race Coordinator AI mantém uma sessão de áudio ativa para que você só precise tocar uma vez para ouvir anúncios contínuos de TTS durante toda a corrida.
*   **Interruptor de silêncio físico (iOS / iPhone)**: Os iPhones roteiam o Web Speech através do canal de áudio ambiente do dispositivo. Se o seu iPhone tiver um interruptor físico de Toque/Silencioso, certifique-se de que ele esteja desligado (não no modo silencioso), caso contrário a saída de voz será silenciada.
