# 02 - Requisitos

## Requisitos funcionais

| ID | Requisito | Perfil |
|---|---|---|
| RF01 | Fazer login com e-mail e senha | Todos |
| RF02 | Mostrar apenas as opções permitidas ao cargo do usuário | Todos |
| RF03 | Listar, cadastrar, alterar e excluir usuários | Analista |
| RF04 | Listar vistorias mostrando: código, status, data de abertura, responsável, foto e descrição | Todos |
| RF05 | Filtrar vistorias por status e endereço | Todos |
| RF06 | Cadastrar, alterar e excluir vistorias | Analista |
| RF07 | Ver os detalhes de uma vistoria com suas fotos e ocorrências | Todos |
| RF08 | Registrar, alterar e excluir ocorrências em uma vistoria (com classificação, descrição e foto) | Operador |
| RF09 | Consultar o histórico de ocorrências | Todos |
| RF10 | **(Extra)** Importar e fazer backup dos dados | Analista |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | Usar apenas HTML, CSS, JavaScript, Bootstrap, Node.js e MySQL |
| RNF02 | Telas responsivas (Bootstrap), para uso também no celular |
| RNF03 | O frontend se comunica com o backend usando JSON |

## Regras de negócio

| ID | Regra |
|---|---|
| RN01 | Os cargos são **Analista** e **Operador** |
| RN02 | Toda vistoria começa com status **ABERTA** |
| RN03 | Uma vistoria pode ter várias ocorrências |
| RN04 | A classificação da ocorrência é: BAIXA, MEDIA, ALTA ou CRITICA |
| RN05 | Ao excluir uma vistoria, suas fotos e ocorrências também são excluídas |
| RN06 | Não podem existir dois usuários com o mesmo e-mail |
