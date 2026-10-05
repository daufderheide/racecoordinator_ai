# Editor de Pilotos

O **Editor de Pilotos** permite criar, visualizar e personalizar perfis de pilotos, apelidos, avatares e avisos de áudio personalizados.

## Visão Geral

O Editor de Pilotos unifica a seleção e a edição de pilotos numa interface consolidada:

- **Seletor de Piloto**: Localizado no cabeçalho superior junto ao título, este menu suspenso lista todos os pilotos existentes e permite alternar rapidamente entre eles.
- **Modo Somente Leitura**: Por padrão, o editor exibe os detalhes em modo somente leitura. Os campos estão bloqueados para evitar alterações acidentais, enquanto as prévias de áudio continuam disponíveis.
- **Modo de Edição**: Clicar no ícone **Editar** (lápis) na barra de ferramentas desbloqueia os campos para edição. Enquanto estiver no modo de edição, o seletor de piloto fica bloqueado para evitar perda de dados.
- **Salvar Alterações**: Clicar no ícone **Concluir Edição** (olho / concluído) valida as alterações, salva-as no servidor e retorna o editor ao modo somente leitura.
- **Descartar Alterações**: Se tentar sair com alterações não salvas, a caixa de diálogo de confirmação solicitará sua decisão. Ao descartar, todas as alterações retornarão à versão salva anteriormente.

## Ações da Barra de Ferramentas

A barra de ferramentas superior oferece as seguintes ações:

- **Voltar**: Retorna à tela anterior ou à Configuração do Dia de Corrida.
- **Adicionar Piloto (+)**: Cria um novo modelo de piloto e entra no modo de edição.
- **Copiar Piloto**: Duplica o perfil do piloto selecionado.
- **Editar / Concluir**: Alterna entre modo somente leitura e modo de edição.
- **Importar Pilotos**: Abre o diálogo para importar perfis de pilotos, avatares e configurações de áudio de arquivos externos.
- **Expandir / Recolher tudo**: Expande ou recolhe todas as seções acordeão de uma vez.
- **Excluir Piloto**: Remove o perfil do piloto selecionado após confirmação.
- **Ajuda (?)**: Inicia o tour guiado interativo sobre as seções do editor.

## Detalhes do Piloto

- **Nome**: O nome completo do piloto exibido nas classificações.
- **Apelido**: Nome abreviado ou falado usado para anúncios de voz (TTS).
- **Vincular Nome e Apelido**: Quando ativado, o texto digitado no nome é copiado automaticamente para o apelido.
- **Avatar**: Escolha uma imagem ou ícone para o piloto.

## Avisos de Áudio e Efeitos Sonoros

Configure efeitos sonoros ou anúncios de voz (TTS) para este piloto:

- **Áudio de Volta**: Tocado ao completar uma volta padrão.
- **Melhor Volta Pessoal**: Tocado quando o piloto faz sua melhor volta.
- **Marcos e Recordes**: Sons personalizados para recordes de pista, de bateria e liderança.
- **Ouvir Áudios**: O botão de reprodução permanece ativo em ambos os modos para testar os sons a qualquer momento.

## Importar Pilotos

O Race Coordinator AI suporta a importação em lote de pilotos a partir de arquivos externos, incluindo criação em massa, resolução de conflitos, recursos de mídia personalizados e padrões para slots de áudio vazios.

### Formatos de Arquivo Suportados

- **CSV (`.csv`)**: Arquivos de texto delimitados por vírgulas, ponto e vírgulas ou tabulações. Os cabeçalhos de coluna são mapeados de forma flexível (sem distinção entre maiúsculas/minúsculas, espaços e sublinhados).
- **Excel (`.xlsx`, `.xls`)**: Planilhas do Microsoft Excel. A primeira planilha é processada usando os nomes das colunas.
- **JSON (`.json`)**: Uma lista de objetos de piloto ou um objeto contendo uma propriedade `"drivers"`.
- **Pacote ZIP (`.zip`)**: Um arquivo compactado ZIP contendo um arquivo de dados (`drivers.csv`, `drivers.xlsx` ou `drivers.json`) juntamente com arquivos de áudio (`.wav`, `.mp3`, `.ogg`) e imagens de avatar (`.png`, `.jpg`, `.jpeg`) referenciados.

### Mapeamento de Colunas e Campos

As seguintes colunas e campos JSON são reconhecidos:

| Campo | Sinônimos de Coluna Reconhecidos | Descrição | Padrão / Alternativa |
| :--- | :--- | :--- | :--- |
| **Nome** | `Name`, `Driver`, `Driver Name`, `Full Name` | Nome completo do piloto (obrigatório). | Nenhum (erro de linha se vazio) |
| **Apelido** | `Nickname`, `Nick`, `Callout`, `Display Name` | Nome abreviado ou falado para anúncios. | Usa o **Nome** se vazio. Validado contra duplicatas. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Nome relativo do arquivo (ex: `john.png`), nome do recurso ou URL. | Nenhum |
| **Áudio Padrão** | `Default Audio`, `Blank Audio`, `Audio Default` | Diretiva para slots de áudio vazios: `none` / `muted` ou `system` / `default`. | Da diretiva do arquivo ou seletor do modal |
| **Áudio de Volta** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Som tocado ao completar uma volta padrão. | Padrão conforme modo de áudio |
| **Melhor Volta Pessoal** | `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Som ao registrar a melhor volta pessoal. | Padrão conforme modo de áudio |
| **Recorde da Pista** | `Track Record Audio`, `Track Record`, `Record Audio` | Som ao quebrar o recorde da pista. | Padrão conforme modo de áudio |
| **Líder da Corrida** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Som ao assumir a liderança da corrida. | Padrão conforme modo de áudio |
| **Tempo Mínimo de Volta** | `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Som ao virar abaixo do tempo mínimo de volta. | Padrão conforme modo de áudio |
| **Volta de Drift** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Som durante volta de drift. | Padrão conforme modo de áudio |
| **Queima de Largada** | `False Start Audio`, `False Start`, `Penalty Audio` | Som de largada falsa ou penalidade. | Padrão conforme modo de áudio |
| **Entrada nos Boxes** | `Pit In Audio`, `Pit In`, `Pit Stop` | Som ao entrar no pit lane. | Padrão conforme modo de áudio |
| **Aviso de Combustível** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Som de aviso de pouco combustível. | Padrão conforme modo de áudio |
| **Sem Combustível** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Som ao acabar o combustível do veículo. | Padrão conforme modo de áudio |

### Sintaxe de Slots de Áudio

Os valores de áudio podem usar os seguintes formatos:
- **`none`** ou **`off`** / **`mute`**: O slot fica mudo (sem áudio).
- **`tts:<texto>`** ou **`${nickname} assume a ponta`**: Anúncio Text-to-Speech (TTS). Chaves simples `{nickname}` e `${driver}` são suportadas.
- **`preset:<som>`**: Usa som do sistema integrado (ex: `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Nome de arquivo (ex: `cheer.wav`, `v8_rev.mp3`)**: Arquivo de mídia complementar enviado no upload ou dentro de um pacote ZIP.

### Diretivas de Arquivo para Áudio Vazio

Você pode declarar como slots vazios devem ser tratados diretamente no arquivo:
- Em CSV: `# default-audio: none` ou `# default-audio: system` nas linhas de comentário do cabeçalho.
- Em JSON: `"default_audio": "none"` no objeto raiz.
- Em Excel/CSV: Coluna `Default Audio` por linha de piloto.
- Na interface: Menu suspenso **Slots de áudio vazios** no modal de importação.

### Importação Automática de Mídia e Recursos

Ao importar pilotos com avatares ou efeitos sonoros personalizados:
1. **Arrastar e soltar múltiplo**: Arraste seu arquivo `.csv` ou `.xlsx` junto com os arquivos `.wav`, `.mp3`, `.png` ou `.jpg` complementares simultaneamente na área de upload.
2. **Pacote ZIP**: Reúna seu arquivo de dados e arquivos de mídia em um arquivo `.zip` e faça o upload.
3. **Registro automático**: O servidor processa os arquivos no Gerenciador de Recursos, calcula os hashes SHA-256 e vincula automaticamente os recursos criados aos respectivos avatares e slots de áudio.

### Resolução de Conflitos

Quando um piloto no arquivo coincidir com um nome ou apelido existente no banco de dados, a tabela de visualização interativa detecta o conflito e oferece três opções:
- **Renomear automaticamente**: Renomeia o novo piloto (ex: `Alice Walker (1)`), preservando o perfil existente intacto.
- **Substituir existente**: Atualiza o perfil existente com os novos atributos, avatares e configurações de áudio importados.
- **Ignorar**: Desconsidera a linha em conflito durante a importação.

As resoluções podem ser definidas individualmente por linha, aplicadas a todos os conflitos de uma vez ou resolvidas editando nome e apelido diretamente na tabela.
