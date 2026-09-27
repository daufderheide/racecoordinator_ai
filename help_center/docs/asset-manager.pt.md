# Gerenciador de Assets

O **Gerenciador de Assets** permite que você carregue, organize e gerencie todos os seus assets digitais de corrida, incluindo arquivos de áudio, imagens personalizadas, conjuntos de imagens e esquemas de rotação.

## Visão Geral

Assets são recursos personalizados usados em todo o aplicativo para personalizar a experiência de corrida:

- **Arquivos de Som:** Chamadas de áudio personalizadas, bipes de início, buzinas de chegada e clipes de narração.
- **Conjuntos de Áudio:** Coleções agrupadas de arquivos de áudio ou chamadas de conversão de texto em fala (TTS) mapeadas para valores de ativação específicos (tempo em segundos, voltas restantes ou porcentagem de combustível).
- **Imagens:** Gráficos de carros, avatares de pilotos, bandeiras personalizadas, logotipos de patrocinadores e imagens de fundo.
- **Conjuntos de Imagens:** Coleções de imagens relacionadas (como medidores de combustível ou sequências de contagem regressiva).
- **Rotações Personalizadas:** Assets de rotação de baterias definidos pelo usuário para formatos complexos.

## Carregar Ativos

Para carregar novos assets para sua biblioteca:

1. Abra o **Gerenciador de Assets** no menu principal ou na barra de ferramentas de configuração.
2. Arraste e solte um ou mais arquivos na seção **Carregar Ativos**, ou clique para navegar no seu computador.
3. Os formatos suportados incluem `.wav`, `.mp3`, `.ogg` para áudio e `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` para imagens.

## Conjuntos de Áudio e Valores de Ativação

Um **Conjunto de Áudio** permite configurar uma sequência de sons ou avisos falados acionados em limites numéricos específicos. Dependendo de onde o conjunto de áudio é atribuído no Race Coordinator AI, os valores representam unidades diferentes:

*   **Tempo em Segundos:** Usado nas configurações de Tema para **Contagem regressiva de largada**, **Segundos restantes**, **Início automático** e **Avanço automático** (por exemplo, entradas em `5`, `4`, `3`, `2`, `1` e `0` segundos).
*   **Contagem de Voltas:** Usado nas configurações de Tema para anúncios de **Voltas restantes**. As entradas definem avisos quando o líder atinge contagens específicas de voltas restantes (por exemplo, `10`, `5`, `1` e `0` voltas restantes).
*   **Porcentagem de Combustível (%):** Usado nas configurações de Piloto para **Sons de nível de combustível**. As entradas definem avisos quando o nível de combustível atinge limites de aviso, crítico ou cheio (por exemplo, `20%`, `10%`, `0%` vazio ou `100%` abastecido).

No **Editor de Conjuntos de Áudio**, você pode adicionar entradas, selecionar arquivos de áudio predefinidos ou escrever frases TTS (com variáveis de modelo como `{driver.nickname}`), definir valores de ativação e usar o botão **Extrair valores automaticamente dos nomes** para preencher automaticamente os valores a partir de nomes de arquivos numerados (por exemplo, `10.mp3`, `5.mp3`).

### Modos de ativação duplos: Restante vs. Decorrido

Cada entrada em um Conjunto de Áudio pode ser configurada com um **Modo de ativação**:

*   **Restante (Contagem regressiva):** É acionado quando a corrida se aproxima de zero ou da linha de chegada (por exemplo, quando restam 10 voltas ou 30 segundos na bateria). Este é o modo padrão para contagens regressivas.
*   **Decorrido (Contagem progressiva):** É acionado à medida que a corrida avança a partir da largada (por exemplo, quando o líder completa 10 voltas ou após 30 segundos decorridos).

#### Dois avisos com o mesmo valor numérico
O Race Coordinator AI suporta configurar duas entradas com exatamente o mesmo valor numérico (por exemplo, valor `10`):
- Uma entrada configurada como **Decorrido** tocará quando o líder alcançar esse marco inicial (ex. aos 10 giros completados).
- Outra entrada configurada como **Restante** tocará quando a corrida se aproximar do final (ex. quando restarem 10 giros).

#### Pré-visualização na ordem natural da corrida
Ao pré-visualizar ou reproduzir automaticamente um Conjunto de Áudio no Gerenciador de Assets ou no Seletor de Áudio, os sons são executados na ordem cronológica da corrida:
1. Todas as entradas **Decorrido** tocam primeiro em ordem crescente (0 → N).
2. Todas as entradas **Restante** tocam em seguida em ordem decrescente de contagem regressiva (N → 0).
