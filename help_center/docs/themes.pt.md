# Temas

!!! note "Conteúdo em desenvolvimento"
    Este artigo está em desenvolvimento. A documentação completa estará disponível em breve.

## Temas

Cada tema reúne recursos visuais (bandeiras, luzes de partida, medidores de combustível), avisos sonoros e atribuições de layout:

- **Layout de interface personalizado:** O layout de ecrã emparelhado carregado durante a corrida.
- **Tema da estação do piloto:** O tema utilizado ao abrir ou ler uma janela ou dispositivo de posto de piloto de pista única.
- **Tema de visualização do piloto:** O tema utilizado ao abrir ou ler a janela de calendário do piloto ou exibição em dispositivo pessoal.

## Áudio

Os temas permitem personalizar efeitos sonoros globais e avisos de voz para eventos de controlo de corrida:

- **Contagem de partida:** Sons durante a sequência de partida (`audio.countdown`).
- **Luz verde / PARTIDA:** Som emitido quando as luzes passam a verde (`audio.countdown.green`).
- **Bandeira amarela:** Sirenes de aviso durante uma fase de bandeira amarela (`audio.yellowflag`).
- **Segundos restantes para início automático:** Avisos de contagem regressiva para o tempo restante antes do início automático da bateria (`audio.auto_start`).
- **Tempo de manga (Segundos restantes):** Avisos com o tempo restante da manga (`audio.seconds_left`).
- **Contagem de voltas do líder (Voltas restantes):** Avisos com as voltas restantes do líder da manga (`audio.laps_left`).
- **Metade da manga:** Notificação ao atingir o ponto médio de uma bateria — tanto para corridas por tempo (metade da duração decorrida) quanto para corridas por voltas (quando o líder completa metade das voltas necessárias) (`audio.seconds_left.halfway`).
- **Manga e corrida terminadas:** Sinais acústicos de fim de manga (`audio.heat_over`) ou fim de corrida (`audio.race_over`).
- **Segundos restantes para avanço automático:** Avisos de contagem regressiva para o tempo restante antes do avanço automático para a próxima bateria (`audio.auto_advance`).
- **Alertas de infração:** Sons para violação do tempo mínimo por volta (`audio.min_lap_time`).

Para informações completas sobre atenuação de áudio, prioridades e relevância multiecrã, consulte a documentação do [Sistema de Áudio](audio.md).

## Substituições de áudio do piloto

Os temas podem substituir as configurações de áudio individuais dos pilotos para todos os participantes quando o tema estiver ativo. Por padrão, os sons personalizados de cada piloto (configurados no [Editor de Pilotos](driver-editor.md)) são reproduzidos. No entanto, um tema pode substituir seletivamente qualquer um dos 13 eventos de áudio do piloto:

- **Sons pessoais de volta:** Volta concluída (`lapAudio`), Melhor volta pessoal (`bestLapAudio`).
- **Sons de volta de corrida:** Melhor volta da corrida (`raceBestLapAudio`), Melhor volta da pista da corrida (`raceLaneBestLapAudio`), Melhor volta da bateria (`heatBestLapAudio`), Novo líder da corrida (`newRaceLeaderAudio`), Novo líder da bateria (`newHeatLeaderAudio`).
- **Sons de melhor volta geral:** Melhor volta geral (`overallBestLapAudio`), Melhor volta da pista geral (`overallLaneBestLapAudio`).
- **Sons de eventos:** Entrada nas boxes (`pitInAudio`), Nível de combustível (`fuelAudio`), Falsa partida / Penalidade (`penaltyAudio`), Volta de drift (`driftLapAudio`).

### Hierarquia de substituição e configuração
- **Desativado (Padrão):** O tema não altera o slot; a configuração individual do piloto é reproduzida.
- **Substituição ativada:** O tema tem precedência para esse evento de som específico em todos os pilotos que usam este tema. Pode configurá-lo como um **Som predefinido**, um **Ficheiro de áudio carregado**, uma frase de **Conversão de texto em voz (TTS)** personalizada ou **Nenhum** (para silenciar o evento em todo o tema).
- **Redefinir todas as substituições:** Limpa rapidamente todas as substituições ativas no tema, devolvendo o controlo total às configurações de cada piloto.
