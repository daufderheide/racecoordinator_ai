# Gestor de Recursos

## Visão Geral {: #overview }

O **Gestor de Recursos** permite carregar, organizar e gerir todos os ficheiros multimédia das suas corridas, incluindo ficheiros de áudio, imagens personalizadas, conjuntos de imagens e esquemas de rotação no Race Coordinator AI.

Os recursos são ficheiros personalizáveis que tornam as corridas únicas:

- **Ficheiros de som:** Avisos de áudio personalizados, sinais de partida, buzinas de meta e comentários.
- **Conjuntos de áudio:** Coleções agrupadas de ficheiros sonoros ou frases de conversão de texto em voz (TTS) associadas a limites específicos (segundos restantes, voltas restantes ou nível de combustível).
- **Imagens:** Gráficos de carros, avatares de pilotos, bandeiras personalizadas, logótipos e fundos.
- **Conjuntos de imagens:** Sequências de imagens relacionadas (como medidores de combustível ou luzes de partida).
- **Rotações personalizadas:** Esquemas de rotação de pistas definidos pelo utilizador para formatos especiais de corrida.

---

## Adicionar Recursos {: #adding-assets }

O painel esquerdo do Gestor de Recursos disponibiliza quatro controlos para adicionar novos recursos à biblioteca, individualmente ou em lote:

1. **Zona de carregamento (Drop Zone):** Arraste e solte ficheiros diretamente na área tracejada ou clique para abrir o explorador de ficheiros. Pode carregar vários ficheiros em simultâneo.
   - Formatos de imagem suportados: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Formatos de áudio suportados: `.wav`, `.mp3`, `.ogg`.
2. **Novo conjunto de imagens:** Abre o Editor de conjuntos de imagens para combinar várias imagens em animações e medidores visuais de estado.
3. **Novo conjunto de áudio:** Abre o Editor de conjuntos de áudio para programar sequências de sons acionadas por temporizadores, voltas restantes ou combustível.
4. **Nova rotação personalizada:** Abre o Editor de rotação para desenhar esquemas especializados de alternância de pistas.

---

## Biblioteca de Recursos & Ações {: #asset-library }

O painel principal da biblioteca apresenta todos os recursos visuais e sonoros armazenados na sua base de dados.

Ao passar o cursor sobre qualquer cartão de recurso são reveladas ações rápidas:
- **Reprodução de áudio:** Clique no botão de reprodução nos cartões de som para ouvir o áudio imediatamente sem abrir nenhum editor.
- **Pré-visualização de imagem:** Apresenta a imagem em resolução total e detalha cada fotograma dos conjuntos de imagens.
- **Renomear diretamente:** Clique no nome para renomear rapidamente o recurso na própria grelha.
- **Eliminar recurso:** Clique no ícone do caixote do lixo para remover ficheiros desnecessários da base de dados.

Também pode clicar nos recursos para os selecionar. Com elementos selecionados, a barra de ferramentas superior oferece ações para edição e eliminação em lote.

---

## Filtros e Opções de Visualização {: #filter-tabs }

O Gestor de Recursos disponibiliza ferramentas superiores para encontrar e organizar os seus ficheiros com facilidade:

- **Separadores de filtro:** Filtre a biblioteca por tipo de recurso:
  - **Todos:** Apresenta todos os ficheiros armazenados na base de dados.
  - **Imagens:** Ficheiros de imagem estáticos (`.png`, `.jpg`, `.svg`, etc.).
  - **Conjuntos de imagens:** Animações e medidores formados por várias imagens.
  - **Sons:** Ficheiros de som individuais (`.wav`, `.mp3`, `.ogg`).
  - **Conjuntos de áudio:** Coleções sonoras vinculadas a valores numéricos.
  - **Rotações personalizadas:** Esquemas de rotação de pistas das mangas.
- **Modos de visualização:** Alterne entre **Vista de lista**, **Miniaturas pequenas**, **Miniaturas médias** e **Miniaturas grandes**.
- **Filtrar por nome:** Campo de pesquisa em tempo real que filtra instantaneamente a lista à medida que escreve.

---

## Conjuntos de áudio e valores de acionamento

Um **Conjunto de áudio** permite programar sons ou mensagens de voz associadas a marcos concretos da corrida:

*   **Tempo em segundos:** Utilizado nos temas para contagens decrescentes e avisos de tempo restante da manga.
*   **Número de voltas:** Utilizado nos temas para anunciar as voltas restantes do líder da corrida.
*   **Percentagem de combustível (%):** Utilizado nas opções de piloto para alertas de reserva e abastecimento concluído.

### Modos duplos: Restante vs. Decorrido

Cada entrada pode ser configurada com um modo específico:
*   **Restante (Contagem decrescente):** É acionado à medida que a corrida se aproxima do final ou do zero.
*   **Decorrido (Contagem progressiva):** É acionado à medida que a corrida avança desde a partida.

---

## Utilização de recursos na aplicação

Assim que forem carregados ou criados, os seus ficheiros ficam imediatamente disponíveis em todos os módulos:

- Selecione efeitos sonoros no [Editor de Temas](themes.pt.md) para voltas rápidas e fanfarras de final de corrida.
- Associe imagens no [Editor de Pilotos](driver-editor.pt.md) para carros e avatares.
- Configure indicadores visuais no [Editor de Layout](layout-editor.pt.md).
- Associe ficheiros de rotação no [Editor de Corridas](race-editor.pt.md).
