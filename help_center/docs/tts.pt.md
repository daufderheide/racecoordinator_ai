# Interpolação de Variáveis Texto-para-Voz (TTS)

O Race Coordinator AI suporta substituição dinâmica de variáveis em frases de Texto-para-Voz para anúncios de áudio personalizados de pilotos, tempos de volta e estatísticas.

## Sintaxe

As variáveis TTS suportam chaves simples ou duplas: `{variable.path}` ou `{{variable.path}}`.

A interpolação **não diferencia maiúsculas de minúsculas** (ex.: `{driver.lastLapTime}` e `{DRIVER.LASTLAPTIME}`). Espaços dentro das chaves (ex.: `{{ driver.nickname }}`) também são suportados.

## Variáveis Disponíveis

As seguintes variáveis estão disponíveis no contexto TTS:

| Caminho da Variável | Descrição |
| :--- | :--- |
| `{driver.name}` | Nome completo do piloto. |
| `{driver.nickname}` | Apelido do piloto (recorre ao nome se não definido). |
| `{driver.lastLapTime}` | Tempo da última volta completada. |
| `{driver.bestLapTime}` | Volta mais rápida do piloto na bateria atual. |
| `{driver.averageLapTime}` | Tempo médio de volta do piloto na bateria. |
| `{driver.lapCount}` | Número total de voltas completadas na bateria. |

## Regras de Formatação

*   **Inteiros**: Falados diretamente.
*   **Decimais**: Arredondados e formatados automaticamente com **3 casas decimais**.
