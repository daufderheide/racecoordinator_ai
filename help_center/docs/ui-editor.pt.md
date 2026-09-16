# Editor de Interface

## Visão Geral

O Editor de Interface permite criar layouts personalizados para o dia de corrida, configurar colunas da classificação dos pilotos, personalizar efeitos sonoros e imagens de temas e carregar [Widgets Personalizados](custom-widgets.md) modulares.

## Configuração do Widget de Cronómetro

O widget **Cronómetro** exibe o tempo decorrido ou restante da manga/corrida com estilos de apresentação configuráveis:

- **Formato de exibição**:
  - **Dinâmico (1:23 / 45s)**: Exibição compacta que omite zeros à esquerda e descarta a unidade de minutos quando inferior a um minuto.
  - **Minutos e segundos (01:23 / 00:45)**: Dois dígitos constantes para minutos e segundos, evitando saltos de comprimento de texto e redimensionamento brusco de tamanho de fonte em modo de escala automática.
  - **Minutos e segundos (1:23 / 0:45)**: Mantém os minutos abaixo de um minuto (`0:45`), utilizando apenas um dígito para minutos quando superior a um minuto (`1:23`).
  - **Relógio completo (00:01:23 / 00:00:45)**: Relógio digital fixo de oito carateres (`HH:MM:SS`), ideal para corridas de resistência.
  - **Segundos totais (83s / 45s)**: Exibe os segundos totais decorridos ou restantes sem subdivisão em minutos ou horas.
- **Sub-segundos**:
  - **Abaixo do limite**: Exibe frações de segundo (1 a 3 casas decimais) assim que o tempo desce abaixo do limite configurado (por exemplo, últimos 10 segundos).
  - **Sempre**: Exibe frações de segundo continuamente durante toda a manga.
  - **Nunca**: Limita o cronómetro exclusivamente a segundos inteiros.
- **Pré-visualização**: O inspetor inclui uma pré-visualização instantânea que demonstra a formatação das opções selecionadas em diferentes fases da corrida (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).
