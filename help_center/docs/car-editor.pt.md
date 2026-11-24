# Editor de carros slot

O **editor de carros slot** mantém uma lista dos seus carros slot: o que são, a classe em que correm, a escala e a configuração. Abra-o no Race Day Setup com **Gerenciar → Carros slot**.

!!! note
    Escolha um carro para cada piloto no Race Day Setup e troque carros entre as baterias. Cada bateria guarda o carro como estava na pista, então os resultados mantêm o carro certo mesmo depois de você editá-lo.

    O selo **Prévia** ao lado do título indica que esta função ainda está tomando forma. Ela pode mudar muito, ou até ser removida, enquanto recolhemos opiniões. Conte o que acha no GitHub ou no SlotForum.

## Visão geral

O editor de carros slot funciona como o editor de equipes:

- **Seletor de carro**: a lista ao lado do título da página mostra todos os seus carros, ordenados por nome.
- **Modo somente leitura**: ao abrir, o carro escolhido aparece com todos os campos bloqueados.
- **Modo de edição**: clique no ícone **Editar** (lápis) para desbloquear os campos. Durante a edição, o seletor fica bloqueado.
- **Salvamento automático**: as alterações são salvas em segundo plano enquanto você as faz.
- **Descartar alterações**: se sair com alterações não salvas ou inválidas, será pedida uma confirmação. Descartar volta o carro à última versão salva.

## Ações da barra de ferramentas

- **Voltar**: volta ao Race Day Setup.
- **Adicionar carro (+)**: cria um carro novo e o abre para edição.
- **Duplicar**: copia o carro escolhido com um nome novo e único. Útil para um segundo carro do mesmo tipo.
- **Editar / Concluir**: alterna entre somente leitura e edição.
- **Excluir**: exclui o carro escolhido após confirmação.
- **Exportar**: salva seus carros slot em um arquivo ZIP. Veja [Exportar carros slot](#car-export).
- **Desfazer / Refazer**: volta ou avança pelas alterações recentes.
- **Ajuda (?)**: inicia o tour guiado.

## O carro {: #car-profile }

O painel esquerdo mostra o que é o carro:

- **Foto**: escolha uma imagem ou envie uma foto do carro.
- **Nome**: obrigatório e único entre os seus carros (por exemplo "Porsche 911 RSR #92").
- **Marca / fabricante**: por exemplo Scalextric, Carrera, Slot.it ou NSR.
- **Classe**: a classe em que o carro corre, como GT3 ou Classic. Enquanto você digita, as classes dos seus outros carros são sugeridas, para que a mesma classe seja sempre escrita da mesma forma.
- **Escala**: 1/24, 1/32, 1/43, 1/64 (HO), Outra ou Não definida.

## Configuração {: #car-setup }

O painel direito mostra como o carro está preparado. Cada campo é texto livre, para descrever como o seu clube faz:

- **Motor**: por exemplo "Slot.it V12/4 21.5k", ou pancake / inline no HO.
- **Ímã**: tipo e força, ou "nenhum" para corridas sem ímã.
- **Chassi**, **Relação** (por exemplo 9/27) e **Pneus**.
- **Modificado**: marque se o carro foi alterado em relação à versão de fábrica; deixe vazio para um carro de série.
- **Notas**: qualquer outra coisa sobre o carro.

## Seus campos {: #car-custom-fields }

Abaixo da configuração você pode adicionar seus próprios campos, para tudo o que o seu clube acompanha (por exemplo peso, pinhão ou guia). No modo de edição, clique em **Gerenciar campos**:

- **Novo campo**: dê um nome e escolha um tipo: **Texto**, **Número**, **Sim / não** ou **Escolha de uma lista** (uma opção por linha).
- **Editar**: renomeie um campo ou mude as opções. O tipo não pode ser alterado depois que o campo é adicionado.
- **Mover para cima / baixo**: muda a ordem dos campos.
- **Excluir**: remove o campo, e o seu valor de todos os carros, após a confirmação.

Todos os carros têm os mesmos campos e guardam seus próprios valores. Um campo deixado vazio continua vazio.

## Carros slot numa corrida {: #car-in-race }

- **Race Day Setup**: na lista de pilotos que vão correr, clique no ícone de carro de uma linha para escolher um carro slot. Uma equipe escolhe **Um carro para a equipe** ou **Um carro por piloto**. Um carro corre para um só piloto: um carro que outro piloto já tem fica em cinza, e uma linha mostra um aviso se uma escolha lembrada entrar em conflito. O RC AI lembra a sua escolha para a próxima corrida.
- **Trocar entre baterias**: no dia da corrida, abra **Diretor de Prova → Carros slot…**. Ele mostra a próxima bateria pista por pista; escolha outro carro e ele é trocado na hora. Durante uma bateria, as listas ficam bloqueadas.
- **Modificar baterias**: o ícone de carro de um piloto muda o carro dele para todas as baterias que ainda não foram corridas.
- **Resultados**: cada bateria guarda uma cópia do carro como ele correu, então editar ou excluir um carro depois não muda os resultados anteriores.

O ícone de carro e o item Carros slot… só aparecem quando há carros slot no banco de dados.

## Os carros ficam na sua pista (IROC) {: #cars-in-lanes }

Numa corrida IROC os carros ficam na sua pista a corrida toda e os pilotos rodam pelas pistas, assim cada piloto corre com cada carro.

- **Editor de corridas**: marque **Os carros ficam na sua pista (IROC)** na secção **Baterias**.
- **Configuração do Dia de Corrida**: abaixo da lista **Pilotos na Corrida** aparece uma caixa **Carros por pista**. Clique nela para escolher o carro de cada pista. O RC AI lembra os carros por traçado. Os ícones de carro dos pilotos ficam ocultos, porque o carro acompanha a pista.
- **Trocar entre baterias**: **Diretor de Prova → Carros slot…** mostra cada pista com o seu carro. Um carro novo conta a partir da próxima bateria que ainda não correu.
- **Resultados**: cada bateria guarda o carro de cada pista, assim vê qual piloto correu com qual carro.

## Carros nos resultados {: #cars-in-results }

Os resultados mostram o carro com que cada piloto correu, tal como estava nessa bateria. Editar um carro depois não muda os resultados anteriores.

- **Resultados de bateria** e a página de resultados de um piloto: cada cartão de bateria mostra o carro ao lado da pista. Passe o rato por cima para ver a classe, a escala e a afinação.
- **Resultados de corrida**: cada piloto mostra o seu carro sob o nome. Se correu com mais de um carro (uma corrida IROC ou uma troca), indica quantos; passe o rato por cima para ver a lista.

## Estatísticas dos carros {: #car-stats }

**Estatísticas dos carros** mostra como os seus carros slot se saíram nas corridas guardadas. Abra-o com o botão do gráfico no topo do Editor de carros slot; começa com o carro que está no ecrã.

- **Agrupar por**: uma linha por carro, classe, campo de afinação (marca, escala, motor, íman, chassis, relação, pneus), um dos seus próprios campos, pista ou piloto. Escolha um carro e agrupe por pista ou piloto para ver onde e com quem foi mais rápido.
- **Filtros**: limite os resultados a um carro, classe, pista ou piloto.
- **Corridas demo**: marque para ver os resultados das corridas demo.
- Os números usam o carro de cada bateria tal como correu, por isso editar um carro depois não os altera. Não contam as voltas abaixo do tempo mínimo de volta da corrida nem as voltas excluídas dos recordes.

## Exportar carros slot {: #car-export }

Clique em **Exportar** na barra de ferramentas para salvar todos os seus carros slot em um arquivo ZIP, como backup ou para compartilhá-los com outro clube.

- **Formato**: escolha **CSV** ou **Excel** para uma planilha, ou **JSON** para um arquivo estruturado.
- **Conteúdo**: uma linha por carro com todos os detalhes: nome, foto, marca, classe, escala, acerto, Modificado (Yes/No) e notas.
- **Seus campos**: cada um dos seus próprios campos ganha uma coluna com o nome do campo.
- **Fotos**: as fotos dos carros vão para uma pasta `images` no ZIP, cada foto uma só vez. A coluna Picture indica o arquivo.
- **Sem IDs**: carros e campos são reconhecidos pelo nome, então o arquivo funciona em qualquer banco de dados.
