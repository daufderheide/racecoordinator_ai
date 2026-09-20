# Editor de Pistas

O **Editor de Pistas** é a interface central de configuração para modelar a sua pista de slot car física, personalizar as dimensões e cores das calhas e estabelecer a comunicação com o hardware de cronometragem, relés de corte de corrente, sensores e sistemas de iluminação visual.

O Race Coordinator AI integra uma avançada arquitetura multi-interface que permite a execução simultânea de múltiplos controladores de cronometragem e gestão (como Arduino, Trackmate, Phidget ou BART) numa única pista.

---

## Visão Geral & Gravação Automática

O Editor de Pistas disponibiliza uma interface unificada para selecionar, visualizar, configurar e testar as suas pistas de slot car:

- **Seletor de Pista**: Localizado no cabeçalho superior junto ao título da página, este menu suspenso lista todas as pistas configuradas e permite alternar rapidamente entre elas.
- **Modo Somente Leitura**: Por padrão, ao abrir o editor, as propriedades da pista, a disposição das calhas e as interfaces de hardware são exibidas no modo somente leitura. Os campos de formulário, a gestão de calhas e as ações de interface estão bloqueados para evitar alterações acidentais.
- **Modo de Edição**: Clicar no ícone **Editar** (lápis) na barra de ferramentas desbloqueia todos os controlos de configuração, reordenação de calhas e configuração de hardware. No modo de edição, o seletor de pistas permanece bloqueado para evitar sair acidentalmente de alterações não gravadas.
- **Gravação Automática Contínua**: À medida que faz alterações (renomear, ajustar dimensões de calhas, reordenar calhas ou alterar atribuições de pinos), as edições são automaticamente gravadas em segundo plano no servidor sem sair do modo de edição.
- **Concluir Edição**: Clicar no ícone **Concluir Edição** (marca de verificação) valida as alterações, assegura a sua persistência no servidor e regressa ao modo somente leitura.
- **Descartar Alterações**: Se tentar sair do editor com alterações não gravadas ou inválidas, uma caixa de diálogo solicita confirmação. O descarte reverte todas as modificações para a última versão gravada e restaura o modo somente leitura.

A área de trabalho está dividida em duas áreas sincronizadas:

- **Painel Esquerdo (Propriedades Gerais & Calhas)**: Configure o nome da pista, número de setores, escala física e as propriedades individuais de cada calha (comprimento, ordenação e cores). Adicione novas interfaces de hardware na parte inferior deste panel.
- **Painel Direito (Interfaces de Hardware & Testes Interativos)**: Configure os controladores de hardware ligados, mapeie pinos e canais às funções da pista, configure tiras LED RGB endereçáveis e teste sensores e relés em tempo real.

Todas as alterações efetuadas no Editor de Pistas são **automaticamente validadas e gravadas em tempo real**. Se for detetada uma configuração inválida (como um nome em branco ou duplicado, ou um pino obrigatório por atribuir), a gravação é temporariamente suspensa e avisos visuais destacam os campos que necessitam de correção.

---

## Configuração Geral da Pista

A secção superior define as propriedades fundamentais do seu circuito:

### Nome da Pista (Track Name)
O identificador exclusivo da sua pista na base de dados do Race Coordinator AI. Cada pista deve ter um nome distinto.

### Número de Seções de Pista (Number of Track Sections)
Define o número de segmentos em que a pista é dividida. Desempenha duas funções essenciais:

1. **Pontuação de Volta Parcial no Final da Manga**:
   - O valor padrão **100** representa uma divisão percentual, permitindo aos diretores de prova atribuir voltas parciais com duas casas decimais de precisão (ex.: $14{,}65$ voltas) com base na posição onde o carro imobiliza ao sinal de fim de manga.
   - Caso utilize marcos ou marcas físicas ao longo da pista, defina este número para a quantidade exata de marcas (ex.: 20 marcas numa pista de 18 metros). No final da manga, os comissários registam o número da marca mais próxima ultrapassada por cada carro.
2. **Cronometragem de Setores / Tempos Intermédios**:
   - Quando são configurados sensores de setor, este valor define a repartição lógica dos setores do circuito.

### Escala da Pista (Track Scale)
Selecione a escala física da pista no menu pendente:

- **1:1 (Escala Real)**
- **Escala 1:24** (Grandes slot cars comerciais / carroçarias rígidas)
- **Escala 1:32** (Padrão de clubes e pistas caseiras, Carrera, Scalextric, Policar)
- **Escala 1:43** (Pistas compactas analógicas e digitais)
- **Escala 1:64 (HO)** (Slot cars escala HO, AFX, Auto World, Tyco)

!!! info "Telemetria de Velocidade à Escala"
    O Race Coordinator AI utiliza a **Escala da Pista** em conjunto com o **Comprimento de cada Calha** para calcular velocidades à escala autênticas (em km/h ou mph) apresentadas nas tabelas de classificação, ecrãs de posto de piloto e exportações XLS.

---

## Configuração de Calhas (Lane Configuration)

A secção **Editor de Calhas (Lane Editor)** permite personalizar a geometria, a ordem de partida na grelha e o aspeto visual de cada calha.

```
+---------------+-------------------+--------------------+-------------------+
|  Reordenar/X  |  Calha # e Comp.  |  Cor de Fundo      |  Cor do Texto     |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |     [ Vermelho ]   |    [ Branco ]     |
|  [::]   [X]   |  #2  [ 50.25 ] ft |     [ Branco ]     |     [ Preto ]     |
|  [::]   [X]   |  #3  [ 52.00 ] ft |      [ Azul ]      |    [ Branco ]     |
|  [::]   [X]   |  #4  [ 53.75 ] ft |     [ Amarelo ]    |     [ Preto ]     |
+---------------+-------------------+--------------------+-------------------+
```

### Adicionar e Eliminar Calhas
- **Adicionar Calha (`+`)**: Clique no botão **`+`** no cabeçalho do Editor de Calhas para acrescentar uma calha. O sistema atribui automaticamente cores de contraste recomendadas.
- **Eliminar Calha (`X`)**: Clique no **`X`** vermelho junto a uma calha para a remover. Todas as interfaces de hardware reajustam automaticamente as suas atribuições.

### Reordenação por Arrastar e Largar (Drag-and-Drop)
Segure no ícone de arrasto (**`::`**) à esquerda de uma calha para a puxar para cima ou para baixo. A reordenação atualiza de imediato as rotações de mangas, os postos de piloto e os ecrãs de tempos.

### Comprimento da Calha (Pés / Metros)
Introduza o comprimento físico pela linha central de cada calha em **pés (ft)**.

Em pistas sem pontes de compensação, as calhas interiores são mais curtas do que as exteriores. Indicar comprimentos exatos assegura que:
- Os cálculos de velocidade à escala (km/h) são rigorosos para cada calha.
- Os registos de distância e consumo de combustível refletem a distância real percorrida.

!!! tip "Conversão de Metros para Pés"
    Se mediu a sua pista em metros, converta para pés multiplicando:
    
    $$\text{Comprimento (pés)} = \text{Comprimento (metros)} \times 3{,}28084$$
    
    $$(1\text{ pé} = 0{,}3048\text{ metros})$$

### Cores da Calha (Fundo e Texto)
Cada calha possui dois seletores de cor:

- **Cor de Fundo**: Cor principal de identificação da calha (ex.: Vermelho, Branco, Azul, Amarelo, Laranja, Verde, Roxo, Preto).
- **Cor do Texto / Primeiro Plano**: Cor de contraste para números e inscrições na calha.

!!! note "Sincronização de Cores com o Hardware"
    A alteração da cor de fundo de uma calha sincroniza-se automaticamente com as tiras LED RGB FastLED no Arduino, atualizando os indicadores de estado e abastecimento de acordo com a sua pista real.

---

## Arquitetura de Interfaces de Hardware

O Race Coordinator AI permite ligar vários equipamentos de cronometragem em simultâneo.

### Suporte Multi-Interface
Pode combinar diferentes controladores na mesma pista:
- Usar uma placa **Trackmate** para deteção ótica de voltas e corte geral de corrente.
- Ligar em simultâneo um **Arduino** com o sketch do Race Coordinator AI para semáforos de partida FastLED RGB, gráficos de abastecimento nas boxes e avisos de bandeira amarela.
- Adicionar um módulo digital **Phidget** para botões de pausa dos pilotos ou sensores de tempo intermédio.

### Separadores de Interface & Navegação Rápida
Na barra superior do painel direito encontram-se separadores para cada interface, permitindo deslocar a vista diretamente para a secção pretendida.

### Indicadores de Ligação em Tempo Real
Cada interface apresenta um distintivo visual de estado:

| Indicador | Significado | Ação |
| :--- | :--- | :--- |
| **Ligado** (Verde) | Comunicação ativa estabelecida; fluxo de dados bidirecional. | Pronto para corridas e testes interativos. |
| **Sem Dados** (Âmbar) | Dispositivo detetado mas sem fluxo de dados nem batimento. | Verificar velocidade em bauds, cabo USB ou sketch. |
| **Desligado** (Cinzento / Vermelho) | Hardware não encontrado, porta fechada ou sem alimentação. | Verificar porta COM, cabo USB e alimentação elétrica. |

---

## Interfaces de Hardware Suportadas

### 1. Interface Arduino

A interface **Arduino** é a solução mais flexível e extensível. Com um Arduino Uno, Mega ou compatível, controla voltas, relés, botões de chamada, tempos de setor, telemetria de acelerador e iluminação LED RGB endereçável com FastLED.

#### Modelos de Placa
- **Arduino Uno**: Ideal para 2 a 4 calhas (14 pinos digitais 2–13 e 6 entradas analógicas A0–A5).
- **Arduino Mega 2560**: Recomendado para 6 a 8 calhas, múltiplos setores de cronometragem ou sistemas extensos de iluminação LED (54 pinos digitais 2–53 e 16 entradas analógicas A0–A15).

#### Ligação & Compatibilidade de Firmware
- **Porta COM Série**: Porta USB atribuída pelo seu sistema operativo.
- **Velocidade**: `115200` bauds recomendado.
- **Compatibilidade com Sketches**:
    - **Sketch Race Coordinator AI (`v2.1.0.x`)**: Compatível com iluminação FastLED RGB, divisores de tensão e telemetria avançada.
    - **Sketch Legado Race Coordinator 1.0 (`v1.0.0.x`)**: Totalmente retrocompatível para voltas, relés e botões. As opções LED RGB ficam desativadas com um aviso informativo.

#### Filtro Antirressalto / Debounce ($\mu\text{s}$)
Define o tempo de filtragem em **microssegundos** ($1\text{ ms} = 1000\,\mu\text{s}$). As flutuações elétricas rápidas são ignoradas.
- Sensores óticos infravermelhos ou fototransístores: **100 a 500 $\mu\text{s}$**.
- Pistas de contacto metálico (dead strips) ou ampolas reed: **1000 a 5000 $\mu\text{s}$**.

#### Lógica Invertida (Normalmente Fechado / NC)
- **Sensores de Calha Normalmente Fechados (NC)**: Ativar se o sensor fornecer nível alto em repouso e baixar para nível baixo ao passar o carro (típico em sensores óticos). Desativar em dead strips ou reed switches.
- **Relés Normalmente Fechados (NC)**: Ativar se o relé atuar para cortar a corrente e desativar para ligar a corrente. Garante pista alimentada mesmo com o computador desligado.

#### Comportamento das Boxes no Pino de Volta
Permite ao sensor de meta atuar em corridas com combustível:
- **Nenhum (None)**: Apenas contagem de voltas normal.
- **Entrada nas Boxes (Pit In)**: A passagem inicia o reabastecimento.
- **Saída das Boxes (Pit Out)**: A passagem conclui o reabastecimento.
- **Entrada / Saída (Pit In/Out)**: A passagem inicia o reabastecimento; após sair, a passagem seguinte volta a contar como volta normal.

#### Atribuição de Pinos Digitais e Analógicos
- **Contagem de Voltas**: Sensor de passagem por calha.
- **Controlo de Corrente**: Relé principal (Master Relay) e relés individuais por calha (Lane Relays).
- **Controlo de Prova**: Botão de bandeira amarela geral ou por posto de piloto.
- **Setores e Boxes**: Sensores de tempo intermédio e sensores de entrada/saída de boxes.
- **Iluminação RGB**: Linha de dados para tiras LED endereçáveis.

!!! tip "Testes de Hardware Interativos"
    Junto a cada seletor de pino existe uma **Insígnia de Estado em Tempo Real**:
    - **Entradas (Sensores/Botões)**: Ao acionar um sensor, a insígnia acende a verde vivo durante 500 ms.
    - **Saídas (Relés)**: Ao clicar na insígnia comuta diretamente o relé para testar a instalação elétrica.

#### Divisores de Tensão e Telemetria de Acelerador
Monitoriza a voltagem do punho ($0\text{--}5\text{V}$) para corridas com combustível digital:
- **Indicador em Tempo Real**: Valor analógico bruto lido ($0\text{--}1023$).
- **Voltagem Máxima**: Calibra o valor correspondente a 100% de aceleração.
- **«Definir Máximo no Indicador»**: Guarda diretamente o pico registado a fundo.
- **Ligar Calhas**: Aplica a calibração a todas as calhas de uma só vez.

#### Iluminação LED RGB Endereçável (FastLED)
1. **Configuração da Tira**: Pino de dados, número de LEDs, brilho ($0\text{--}255$), frequência de intermitência e ordem de cores (`GRB`, `RGB`, etc.).
2. **Funções por LED**:
   - **Semáforo de Partida**: Contagem decrescente progressiva, Verde de partida e Vermelho de partida em falso.
   - **Estado da Bandeira**: Verde (corrida ativa), Amarelo intermitente (precaução), Vermelho/Xadrez (fim de manga).
   - **Alimentação da Calha**: Ilumina-se na cor da calha enquanto tiver corrente ativa.
   - **Barra de Reabastecimento**: Barra luminosa que enche progressivamente durante a paragem nas boxes.
   - **Líder da Manga**: Mostra a cor do piloto que lidera a manga atual.
   - **Piscar de Volta**: Pisca na cor da calha em cada passagem pela meta.

---

### 2. Interface Trackmate

Suporte nativo para placas comerciais Trackmate ligadas por porta série COM (USB ou RS-232).

- **Filtro Antirressalto (Níveis 1 a 4)**: Filtragem por hardware contra voltas falsas (nível 2 ou 3 recomendado).
- **Lógica Normalmente Fechada**: Inversão para fotocélulas infravermelhas e relés.
- **Relés Individuais por Calha**: Ativar se possuir placa com corte independente por calha.
- **8 Canais de Sensores**: Atribuição dos 8 canais de hardware a calhas ou boxes.
- **Teste de Relés**: Botões interativos no ecrã para comutar manualmente os relés.
- **Botão de Chamada**: Canal dedicado com indicador de atividade em tempo real.

---

### 3. Interface Phidget

Integração de módulos industriais USB e VINT da Phidgets (ex.: InterfaceKit 0/16/16, 8/8/8, 1014 Relays e concentradores VINT).

- **Deteção Automática**: Reconhecimento automático por Número de Série e Porta de Hub.
- **Entradas Digitais**: Canais optoisolados de alta velocidade para voltas, botões e setores.
- **Saídas Digitais / Relés**: Controlo de corte de corrente geral e individual.
- **Entradas Analógicas**: Medição de voltagem para acelerador e combustível digital.
- **Inversão de Polaridade**: Ajuste independente para sensores e relés.

!!! warning "Controladores Phidget22 Obrigatórios"
    Requer a instalação prévia dos controladores oficiais **Phidget22** no seu computador.

---

### 4. Interface BART (Cronómetro Bluetooth Policar)

Ligação sem fios a pontes de cronometragem e transponders Policar BART Bluetooth Low Energy (BLE).

- **Deteção Sem Fios BLE**: Procura automática de dispositivos Bluetooth LE sem necessidade de portas COM.
- **Canais de Hardware (até 32)**: Atribuição dinâmica a calhas e boxes.
- **Filtro de Tempo Mínimo de Volta (ms)**: Limite por hardware para eliminar leituras falsas.
- **Atividade em Tempo Real**: Confirmação visual imediata de cada deteção na pista.

---

### 5. Interface Demonstração / Simulação

Permite testar formatos de prova, rotações, temas visuais, mensagens de voz e classificações sem necessidade de ligar hardware.

- **Simulação Realista**: Gera tempos por volta, diferenças e paragens nas boxes simuladas com base nas calhas e escala configuradas.
- **Pronta a Usar**: Funciona de imediato em qualquer circuito.

---

## Operações do Editor & Barra de Ferramentas

A barra de ferramentas superior do Editor de Pistas disponibiliza ferramentas essenciais de gestão:

- **Voltar**: Regressa à vista anterior ou à Configuração do Dia de Corrida.
- **Adicionar Pista (+)**: Cria um novo modelo de pista e entra no modo de edição.
- **Duplicar Pista**: Cria uma cópia exata com outro nome único, ideal para testar configurações sem alterar a original.
- **Editar / Concluir Edição**: Alterna entre o modo somente leitura e o modo de edição. Ao sair do modo de edição, as alterações são validadas e gravadas.
- **Eliminar Pista**: Elimina a pista selecionada após confirmação.
- **Anular (`Ctrl+Z`) / Refazer (`Ctrl+Y`)**: Reversão imediata de qualquer alteração nas calhas, cores ou pinos.
- **Ajuda (`?`)**: Inicia uma visita guiada interativa no ecrã demonstrando todos os comandos.

---

## Resolução de Problemas Comuns de Hardware

### Corrente Invertida na Pista (Relé Invertido)
- **Sintoma**: A pista tem corrente sob bandeira amarela e desliga-se sob bandeira verde.
- **Solução**: Altere a opção **Relés Normalmente Fechados (Normally Closed Relays)**.

### Abastecimento Contínuo em Provas com Combustível
- **Symptom**: Os carros começam a abastecer ininterruptamente assim que são colocados na calha.
- **Solução**: Altere a opção **Sensores de Calha Normalmente Fechados (Normally Closed Lane Sensors)**.

### Voltas Duplas ou Não Detetadas
- **Solução**: Aumente o antirressalto (Debounce) caso surjam contagens duplas; reduza-o caso carros muito velozes não sejam lidos e verifique o alinhamento das fotocélulas.

### Tiras LED FastLED Não Acendem
- **Solução**: Certifique-se de que o Arduino está a correr o **sketch oficial `v2.1.0.x`**, que o tipo de LED e a ordem de cores estão corretos e que a massa (GND) da fonte de alimentação de 5V está ligada à massa do Arduino.
