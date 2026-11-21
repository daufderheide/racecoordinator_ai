# Editor de carros slot

O **editor de carros slot** mantém uma lista dos seus carros slot: o que são, a classe em que correm, a escala e a configuração. Abra-o no Race Day Setup com **Gerenciar → Carros slot**.

!!! note
    Este é o primeiro passo do suporte a carros. Os carros ainda não estão ligados a pilotos ou corridas, então nada muda no dia da corrida.

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
