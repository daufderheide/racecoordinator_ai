# Gerenciador de Bancos de Dados

O **Gerenciador de Bancos de Dados** permite organizar, fazer backup, restaurar e alternar entre bancos de dados SQLite isolados no Race Coordinator. Cada banco de dados mantém uma coleção autônoma de pilotos, equipes, pistas, corridas, eventos, temporadas, layouts de interface e recursos multimídia.

---

## Visão Geral {: #overview }

A tela do Gerenciador de Bancos de Dados está organizada em duas seções principais:

1. **Lista de Bancos de Dados (Barra lateral esquerda)**: Exibe todos os arquivos de banco de dados disponíveis na sua pasta local do aplicativo. O banco ativo é destacado com o selo **ATIVO**. Ao selecionar qualquer banco da lista, seus detalhes e estatísticas são carregados no painel direito.
2. **Painel de Detalhes (Lado direito)**: Exibe estatísticas abrangentes, métricas de armazenamento e o controle de ativação do banco atualmente selecionado.
3. **Barra de Ferramentas (Cabeçalho superior)**: Fornece ações para criar, importar, exportar, duplicar, redefinir ou excluir bancos de dados.

---

## Estatísticas do Banco de Dados {: #database-statistics }

Quando um banco de dados é selecionado na lista, o painel **Resumo do Banco de Dados** exibe estatísticas em tempo real e o uso do disco:

| Métrica | Descrição |
| :--- | :--- |
| **Pilotos** | Número total de perfis de pilotos configurados. |
| **Equipes** | Número total de equipes de corrida. |
| **Pistas** | Número total de configurações de pistas e interfaces de hardware. |
| **Corridas** | Número total de formatos de corridas e rotações de baterias. |
| **Eventos** | Número total de eventos com múltiplas rodadas. |
| **Temporadas** | Número total de campeonatos de temporada e pontuações. |
| **Recursos** | Número total de imagens, clipes de áudio, conjuntos de imagens, conjuntos de áudio e rotações. |
| **Registros de Corridas** | Número de registros de resultados de corridas concluídas e espaço em disco utilizado (em MB). |
| **Corridas Salvas** | Número de sessões de corrida salvas em andamento ou pausadas e espaço em disco utilizado (em MB). |
| **Tamanho Total** | O tamanho físico do arquivo de banco de dados SQLite no disco (em MB). |

---

## Alternando entre Bancos de Dados {: #switching-databases }

O Race Coordinator opera com apenas um banco de dados ativo por vez. O status do banco selecionado é exibido diretamente ao lado do seu nome no cabeçalho de detalhes:

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Banco Ativo (Marca de seleção verde)**: Indica o banco de dados utilizado atualmente pelo sistema para cronometragem em tempo real, corridas e armazenamento.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Banco Inativo (Marca de seleção cinza)**: Indica um banco de dados alternativo que não está ativo no momento.

### Como alternar

1. Clique em qualquer banco inativo na lista lateral esquerda.
2. No cabeçalho de detalhes, clique no botão da **Marca de Seleção Cinza**.
3. Confirme a alteração na caixa de diálogo.

> [!WARNING]
> Alternar entre bancos de dados redefine imediatamente o estado da sessão de corrida ativa e recarrega todos os recursos, pilotos e configurações a partir do novo banco ativado.

---

## Criando um Banco de Dados {: #creating-a-database }

Para criar um novo banco de dados:

1. Clique no botão **Adicionar** (<span class="material-icons" style="vertical-align: middle;">add</span>) na barra de ferramentas superior.
2. Insira um nome exclusivo para o novo banco de dados na janela modal.
3. Clique em **OK**. O Race Coordinator criará um banco SQLite limpo inicializado com o esquema padrão e recursos básicos.

---

## Copiando um Banco de Dados {: #copying-a-database }

Para duplicar um banco existente:

1. Selecione o banco de dados que deseja copiar na lista lateral.
2. Clique no botão **Copiar** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>) na barra de ferramentas.
3. Insira um nome exclusivo para a cópia.
4. Clique em **OK**. Todos os pilotos, pistas, corridas, temporadas, recursos e histórico serão clonados no novo arquivo.

---

## Excluindo um Banco de Dados {: #deleting-a-database }

Para excluir permanentemente um banco de dados:

1. Selecione o banco de dados que deseja remover na lista lateral.
2. Clique no botão **Excluir** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>) na barra de ferramentas.
3. Confirme a exclusão na janela modal.

> [!NOTE]
> O banco de dados atualmente ativo não pode ser excluído. Para excluí-lo, primeiro alterne para outro banco.

---

## Redefinição de Fábrica {: #factory-reset }

A ação **Redefinir** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) apaga todos os dados personalizados do banco ativo e restaura os padrões de fábrica:

1. Selecione o banco ativo e clique no botão **Redefinir** na barra de ferramentas.
2. Leia com atenção as mensagens de aviso e aprove a redefinição.
3. Todos os pilotos, pistas, corridas e recursos personalizados serão substituídos pelos valores padrão de fábrica.

---

## Backup e Restauração / Importação e Exportação {: #import-and-export }

### Exportação (Backup)

Para criar um arquivo portátil de backup de um banco de dados:

1. Selecione o banco que deseja exportar.
2. Clique no botão **Exportar** (<span class="material-icons" style="vertical-align: middle;">file_download</span>) na barra de ferramentas.
3. O Race Coordinator gerará um arquivo `.zip` com registro de data e hora contendo o arquivo SQLite e todos os recursos binários armazenados.

### Importação (Restauração)

Para importar um arquivo de banco de dados exportado anteriormente:

1. Clique no botão **Importar** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>) na barra de ferramentas.
2. Selecione um arquivo `.zip` no seu computador.
3. Insira um nome exclusivo para o banco importado.
4. O Race Coordinator descompactará e registrará o banco de dados na sua instalação local.
