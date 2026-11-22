# 02 - Requisitos

## Requisitos Funcionais (RF)

### Login e permissões

| ID | Requisito | Perfil |
|---|---|---|
| RF01 | O sistema deve permitir login com e-mail e senha | Todos |
| RF02 | A senha deve ser informada por um **teclado virtual** na tela (não pelo teclado físico) | Todos |
| RF03 | Após o login, o usuário deve ser direcionado à lista de vistorias | Todos |
| RF04 | O sistema deve liberar as funcionalidades conforme o cargo do usuário | Todos |

### Gestão de usuários

| ID | Requisito | Perfil |
|---|---|---|
| RF05 | Listar usuários com filtro por nome e cargo | Analista |
| RF06 | Cadastrar usuário (nome, e-mail, senha, cargo) | Analista |
| RF07 | Alterar dados de um usuário | Analista |
| RF08 | Excluir usuário (desde que não tenha registros vinculados) | Analista |

### Gestão de vistorias

| ID | Requisito | Perfil |
|---|---|---|
| RF09 | Listar vistorias exibindo: identificador único, status, data de abertura, nome do responsável, imagem do local e descrição | Analista, Operador |
| RF10 | Filtrar vistorias por status, endereço, responsável e período | Analista, Operador |
| RF11 | Cadastrar vistoria com endereço, descrição, operador responsável e foto(s) do local | Analista |
| RF12 | Alterar vistoria (inclusive o status) | Analista |
| RF13 | Excluir vistoria | Analista |
| RF14 | Visualizar os detalhes da vistoria com suas fotos e ocorrências | Analista, Operador |

### Gestão de ocorrências

| ID | Requisito | Perfil |
|---|---|---|
| RF15 | Registrar uma ou mais ocorrências em uma vistoria, com classificação, descrição e foto(s) | Operador |
| RF16 | Consultar o histórico de ocorrências com filtros (vistoria, classificação, período) | Analista, Operador |
| RF17 | Alterar ou excluir uma ocorrência registrada por ele mesmo | Operador |

### Extra (reavaliação)

| ID | Requisito | Perfil |
|---|---|---|
| RF18 | Exportar backup dos dados (usuários/perfis, vistorias e ocorrências) | Analista |
| RF19 | Importar dados a partir de um arquivo de backup | Analista |

## Requisitos Não Funcionais (RNF)

| ID | Requisito |
|---|---|
| RNF01 | Utilizar apenas HTML, CSS, JavaScript, Bootstrap, Node.js e MySQL |
| RNF02 | Interface responsiva (Bootstrap), utilizável em celular durante a vistoria |
| RNF03 | Senhas armazenadas com hash (bcrypt) |
| RNF04 | Comunicação frontend ↔ backend via API REST com JSON |
| RNF05 | Fotos em formato de imagem com até 5 MB cada (máx. 5 por envio) |
| RNF06 | Código e documentação em português |

## Regras de Negócio (RN)

| ID | Regra |
|---|---|
| RN01 | Existem dois cargos: **Analista** e **Operador**. As permissões de cada cargo ficam na tabela `cargo_permissao` |
| RN02 | O responsável por uma vistoria deve ser um usuário com cargo **Operador** |
| RN03 | Toda vistoria nasce com status **ABERTA** |
| RN04 | Ao registrar a primeira ocorrência, a vistoria passa automaticamente para **EM_ANDAMENTO** |
| RN05 | Não é permitido registrar ocorrências em vistoria **FINALIZADA** |
| RN06 | Somente o operador que registrou a ocorrência pode alterá-la ou excluí-la |
| RN07 | Ao excluir uma vistoria, suas fotos e ocorrências também são excluídas |
| RN08 | O e-mail do usuário é único no sistema |
| RN09 | Um usuário não pode excluir a si mesmo |
| RN10 | A classificação da ocorrência deve ser: BAIXA, MEDIA, ALTA ou CRITICA |
