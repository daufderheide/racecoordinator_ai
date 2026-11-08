# Temas

## Visão Geral {: #overview }

Os temas definem a apresentação audiovisual completa e a atmosfera estética dos seus eventos de corrida no Race Coordinator AI. Em vez de configurar elementos visuais, iluminação de partida e avisos sonoros individualmente para cada corrida, os temas agrupam esses elementos visuais e de áudio em perfis reutilizáveis.

Quando um tema está ativo, ele coordena:
- O layout de ecrã emparelhado no ecrã principal.
- Gráficos visuais sincronizados para bandeiras, luzes de partida e medidores de combustível.
- Efeitos sonoros globais, sinais de contagem decrescente e avisos de voz.
- Substituições de áudio centralizadas para os efeitos sonoros individuais dos pilotos.

---

## Configurações do Tema {: #top-selectors }

Localizadas na barra de controlos superior do Editor de Temas, estas configurações definem as propriedades principais e os layouts vinculados ao tema:

- **Nome do Tema:** O identificador exclusivo do tema. Os temas padrão do sistema (*RC AI*, *Formula*, *Endurance*) são protegidos e não podem ser eliminados ou renomeados.
- **Layout de Interface Vinculado:** Seleciona o layout de ecrã criado no [Editor de Layout](layout-editor.md) que é carregado automaticamente no ecrã principal da corrida quando este tema é selecionado.
- **Tema da Estação do Piloto:** Especifica o tema usado ao abrir uma estação de piloto de pista única ou quando um piloto se conecta através de um dispositivo móvel ou tablet.
- **Tema de Visualização do Piloto:** Especifica o tema usado para ecrãs de calendário de pistas múltiplas e monitores de espetadores.
- **Temas de Janela (Temas complementares):** Configura temas complementares para ecrãs secundários. Por padrão, todos os temas disponíveis estão selecionados. Durante uma corrida, a barra de menus apresenta estritamente os temas configurados no tema principal. Os temas podem ser geridos individualmente ou ativados/desativados de uma só vez com **Selecionar tudo** no Editor de Temas. Quando um novo tema é criado, ele é adicionado automaticamente a todos os temas existentes que têm todos selecionados.

---

## Imagens de Bandeiras {: #flags }

A secção Imagens de Bandeiras permite personalizar os gráficos exibidos no canvas de corrida, nos widgets de bandeiras e nas estações de pilotos para cada condição de corrida:

- **Em Corrida (`flag.racing`):** Exibida durante condições ativas de corrida quando a pista está verde e os carros rodam livremente.
- **Manga em Pausa (`flag.heat_paused`):** Bandeira amarela de advertência exibida durante uma interrupção da pista ou pausa da corrida.
- **Manga Terminada (`flag.heat_over`):** Bandeira axadrezada exibida quando a duração da bateria ou o número de voltas pretendido termina.
- **Corrida Terminada (`flag.race_over`):** Bandeira axadrezada final a assinalar a conclusão de todo o evento de corrida.
- **Não Iniciada (`flag.not_started`):** Bandeira exibida antes do início de uma manga ou corrida.
- **A Iniciar (`flag.starting`):** Bandeira vermelha exibida durante a sequência inicial de contagem decrescente antes de as luzes passarem a verde.
- **A Reiniciar (`flag.restarting`):** Bandeira exibida durante a contagem decrescente de reinício após uma bandeira amarela ou interrupção.
- **Última Volta (`flag.one_lap_to_go`):** Tradicional bandeira branca que indica que o líder da corrida está na sua última volta.
- **Manga a Concluir (`flag.heat_finishing`):** Bandeira exibida quando o líder cortou a meta e os carros seguintes estão a concluir a sua volta atual.
- **Aquecimento (`flag.warmup`):** Exibida durante os treinos e sessões de aquecimento dos pilotos antes da corrida.
- **Piloto Terminou (`flag.driver_finished`):** Indicador por pista ou individual exibido para os pilotos que completaram as suas voltas obrigatórias.
- **Penalidade (`flag.penalty`):** Indicador de bandeira preta exibido quando um piloto comete uma falsa partida ou infração de volta.

Para cada bandeira, pode escolher entre predefinições integradas ou carregar imagens personalizadas em SVG, PNG, WebP ou JPG da sua biblioteca através do [Gestor de Recursos](asset-manager.md).

---

## Luzes de Contagem Decrescente {: #countdown }

A secção Luzes de Contagem Decrescente configura os recursos visuais de lâmpadas utilizados pelo Widget de Contagem e pelas luzes de partida no ecrã:

- **Lâmpada Vermelha Apagada (`lamp.red.dim`):** Gráfico de lâmpada vermelha apagada ou atenuada mostrado quando as luzes estão inativas ou antes do início da contagem.
- **Lâmpada Vermelha Acesa (`lamp.red.on`):** Gráfico de lâmpada vermelha iluminada exibido durante cada etapa da sequência de contagem decrescente de partida.
- **Lâmpada Verde (`lamp.green`):** Gráfico de lâmpada verde brilhante exibido no momento da partida ou reinício quando a energia é ligada à pista.

Estes gráficos ajustam-se automaticamente a widgets de luzes de partida horizontais e verticais configurados nos seus layouts.

---

## Medidor de Combustível {: #fuel-gauge }

A secção Medidor de Combustível configura medidores visuais de vários fotogramas utilizados durante simulações analógicas e digitais de combustível:

- **Conjunto do Medidor de Combustível (`gauge.fuel`):** Um conjunto de imagens contendo vários fotogramas sequenciais que representam os níveis de combustível desde cheio (100%) até vazio (0%).

Durante uma corrida com simulação de combustível ativada, o Race Coordinator AI calcula continuamente o consumo com base no acelerador ou nas voltas e atualiza o fotograma do medidor em tempo real. Quando o combustível desce abaixo do limiar de reserva, o medidor ativa animações intermitentes e sinais de aviso para alertar os pilotos a entrar nas boxes.

---

## Efeitos Sonoros {: #audio }

Os temas permitem personalizar efeitos sonoros globais, áudio de contagem decrescente, avisos de tempo periódicos e mensagens de voz:

- **Contagem de Partida (`audio.countdown`):** Efeitos sonoros reproduzidos durante a sequência de contagem antes do início da manga.
- **Lâmpada Verde / PARTIDA (`audio.countdown.green`):** Som ou buzina reproduzida no momento em que as luzes passam a verde e a corrida começa.
- **Bandeira Amarela (`audio.yellowflag`):** Sirenes de aviso ou buzinas acionadas quando ocorre uma interrupção da pista ou fase de bandeira amarela.
- **Segundos Restantes para Início Automático (`audio.auto_start`):** Avisos de voz de contagem periódicos antes do início automático de uma manga.
- **Tempo de Manga (Segundos Restantes) (`audio.seconds_left`):** Avisos de voz periódicos que indicam o tempo restante da manga.
- **Metade da Manga (`audio.seconds_left.halfway`):** Notificação ao atingir o ponto médio de uma manga (metade da duração decorrida ou líder que completa metade das voltas exigidas).
- **Contagem de Voltas do Líder (`audio.laps_left`):** Avisos de voz para as voltas restantes do líder da manga.
- **Manga Concluída (`audio.heat_over`):** Sinal acústico que indica a conclusão da manga ativa.
- **Corrida Concluída (`audio.race_over`):** Fanfarra ou sinal sonoro de celebração que assinala o fim de todo o evento de corrida.
- **Segundos Restantes para Avanço Automático (`audio.auto_advance`):** Avisos de contagem periódicos antes do avanço automático para a próxima manga.
- **Infração do Tempo Mínimo por Volta (`audio.min_lap_time`):** Som de alerta reproduzido quando um carro aciona um sensor abaixo do limiar de tempo mínimo permitido por volta.

Cada slot de áudio pode ser configurado como:
1. **Som Predefinido:** Escolha a partir da biblioteca de efeitos sonoros integrada do Race Coordinator AI.
2. **Ficheiro de Áudio Personalizado:** Carregue ficheiros WAV, MP3 ou OGG personalizados através do Gestor de Recursos.
3. **Conversão de Texto em Voz (TTS):** Frases dinâmicas com interpolação de variáveis em tempo de execução (como `{time}` e `{laps}`).

Para detalhes completos sobre atenuação de áudio, níveis de prioridade e saída em múltiplos ecrãs, consulte a documentação do [Sistema de Áudio](audio.md).

---

## Substituições de Áudio do Piloto {: #driver-audio-overrides }

Em corridas normais, cada piloto pode ter sons de volta e avisos de voz personalizados configurados no [Editor de Pilotos](driver-editor.md). No entanto, para eventos de clube, pistas comerciais ou campeonatos temáticos, os organizadores de corridas frequentemente pretendem uma experiência de áudio uniforme para todos os participantes.

A secção **Substituições de Áudio do Piloto** permite que o tema substitua centralmente quaisquer ou todos os avisos sonoros de pilotos para todos os concorrentes da corrida.

### Substituições de Áudio de Piloto Disponíveis

O tema pode substituir qualquer um dos 13 eventos de áudio individuais do piloto:

#### Sons Pessoais de Volta
- **Volta Concluída (`lapAudio`):** Som reproduzido sempre que um piloto completa uma volta válida normal.
- **Melhor Volta Pessoal (`bestLapAudio`):** Som reproduzido quando um piloto bate o seu melhor tempo de volta anterior na sessão de corrida atual.

#### Sons de Volta da Corrida
- **Melhor Volta da Corrida (`raceBestLapAudio`):** Som reproduzido quando um piloto regista o melhor tempo de volta de todas as pistas e pilotos na corrida atual.
- **Melhor Volta da Pista na Corrida (`raceLaneBestLapAudio`):** Som reproduzido quando um piloto regista a volta mais rápida na sua pista específica na corrida atual.
- **Melhor Volta da Manga (`heatBestLapAudio`):** Som reproduzido quando um piloto estabelece a volta mais rápida da manga ativa.
- **Novo Líder da Corrida (`newRaceLeaderAudio`):** Aviso de voz ou som de celebração reproduzido quando um piloto assume a liderança geral da corrida.
- **Novo Líder da Manga (`newHeatLeaderAudio`):** Som reproduzido quando um piloto passa para o 1º lugar da manga ativa.

#### Sons de Melhor Volta Geral
- **Melhor Volta Geral (`overallBestLapAudio`):** Som de alta prioridade reproduzido quando um piloto estabelece um recorde histórico da pista em todas as pistas.
- **Melhor Volta da Pista Geral (`overallLaneBestLapAudio`):** Som reproduzido quando um piloto estabelece um recorde histórico para aquela pista específica.

#### Sons de Eventos
- **Entrada nas Boxes (`pitInAudio`):** Som reproduzido quando um carro entra na via das boxes ou aciona sensores de entrada nas boxes em pistas digitais.
- **Aviso de Combustível (`fuelAudio`):** Tom de advertência ou mensagem de voz ao atingir o nível de reserva ou esgotar o combustível.
- **Falsa Partida / Penalidade (`penaltyAudio`):** Sinal sonoro ou buzina emitida quando um carro comete uma falsa partida ou incorre numa penalização de volta.
- **Volta de Drift (`driftLapAudio`):** Efeito sonoro ou aviso de voz urgente reproduzido quando um carro cruza a linha de chegada por inércia sem energia dentro do tempo de deriva.

### Prioridade e Modos de Substituição

Cada evento de áudio do piloto na lista pode ser configurado de forma independente:

- **Desativado (Caixa Desmarcada):** O tema não altera o slot. O Race Coordinator AI reproduz o som personalizado do piloto individual (ou o padrão do sistema se não estiver configurado).
- **Ativado (Caixa Marcada):** O tema substitui o evento sonoro para **todos os pilotos** que participam em corridas com este tema, independentemente do que tiverem configurado no seu perfil individual.

Quando ativado, selecione entre quatro modos de saída:
1. **Som Predefinido:** Selecione um efeito sonoro padrão do catálogo integrado.
2. **Ficheiro de Áudio Carregado:** Selecione um ficheiro de áudio personalizado da sua biblioteca do Gestor de Recursos.
3. **Conversão de Texto em Voz (TTS):** Introduza uma frase personalizada com interpolação de variáveis específicas do piloto:
   - `{driver}` — O nome de exibição ou alcunha do piloto.
   - `{time}` — O tempo de volta formatado com três casas decimais (ex: `3.142`).
   - `{lane}` — O número da pista ativa (ex: `2`).
   - `{lap}` — A contagem atual de voltas concluídas.
   - `{gap}` — A diferença de tempo para o líder ou carro mais próximo.
4. **Nenhum (Silenciar):** Silencia completamente o evento a nível de tema, impedindo a reprodução de qualquer som ou anúncio.

### Redefinir Todas as Substituições

Clique no botão **Redefinir Todas as Substituições** no cabeçalho da secção Substituições de Áudio do Piloto para limpar todas as substituições do tema de uma só vez. Todos os 13 slots voltarão ao seu estado padrão desmarcado, restaurando totalmente o controlo de áudio para o perfil individual de cada piloto.
