# 04 - API REST

URL base: `http://localhost:3000/api`

- Corpo das requisições em **JSON**, exceto as que enviam fotos (**multipart/form-data**, campo `fotos`, até 5 imagens de 5 MB).
- Todas as rotas, exceto `/auth/login` e `/status`, exigem o cabeçalho:
  ```
  Authorization: Bearer <token>
  ```
- Erros são retornados no formato `{ "erro": "mensagem" }`.

| Código | Significado |
|---|---|
| 200 / 201 | Sucesso / criado |
| 400 | Dados inválidos |
| 401 | Não logado ou token inválido |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (e-mail duplicado, registro vinculado) |

## Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Faz login e retorna o token |
| GET | `/auth/me` | Dados do usuário logado |

**Exemplo — login**
```json
POST /api/auth/login
{ "email": "analista@vistoria.com", "senha": "123456" }
```
Resposta:
```json
{
  "token": "eyJhbGciOi...",
  "usuario": {
    "id": 1, "nome": "Ana Analista", "cargo": "Analista",
    "permissoes": ["GERENCIAR_USUARIOS", "VISUALIZAR_VISTORIAS", "GERENCIAR_VISTORIAS", "VISUALIZAR_OCORRENCIAS"],
    "email": "analista@vistoria.com"
  }
}
```

## Usuários e cargos

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/cargos` | GERENCIAR_USUARIOS | Lista cargos |
| GET | `/usuarios?nome=&idCargo=` | GERENCIAR_USUARIOS | Lista usuários |
| GET | `/usuarios/operadores` | GERENCIAR_VISTORIAS | Lista operadores (para escolher responsável) |
| GET | `/usuarios/:id` | GERENCIAR_USUARIOS | Busca usuário |
| POST | `/usuarios` | GERENCIAR_USUARIOS | Cria usuário |
| PUT | `/usuarios/:id` | GERENCIAR_USUARIOS | Altera usuário (senha opcional) |
| DELETE | `/usuarios/:id` | GERENCIAR_USUARIOS | Exclui usuário |

```json
POST /api/usuarios
{ "nome": "Maria Souza", "email": "maria@vistoria.com", "senha": "123456", "idCargo": 2 }
```

## Vistorias

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/vistorias?status=&endereco=&idResponsavel=&dataInicio=&dataFim=` | VISUALIZAR_VISTORIAS | Lista com filtros |
| GET | `/vistorias/:id` | VISUALIZAR_VISTORIAS | Detalhes + fotos + ocorrências |
| POST | `/vistorias` | GERENCIAR_VISTORIAS | Cria vistoria (multipart) |
| PUT | `/vistorias/:id` | GERENCIAR_VISTORIAS | Altera vistoria / status |
| DELETE | `/vistorias/:id` | GERENCIAR_VISTORIAS | Exclui vistoria |
| POST | `/vistorias/:id/fotos` | GERENCIAR_VISTORIAS | Adiciona fotos (multipart) |

**Criar vistoria** (multipart/form-data):

| Campo | Tipo | Obrigatório |
|---|---|---|
| descricao | texto | ✅ |
| endereco | texto | ✅ |
| idOperadorResponsavel | número | ✅ |
| fotos | arquivo(s) de imagem | |

Exemplo com `curl`:
```bash
curl -X POST http://localhost:3000/api/vistorias \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "descricao=Vistoria de entrega" \
  -F "endereco=Rua A, 10" \
  -F "idOperadorResponsavel=2" \
  -F "fotos=@fachada.jpg"
```

**Alterar vistoria** (JSON):
```json
PUT /api/vistorias/1
{ "descricao": "...", "endereco": "...", "idOperadorResponsavel": 2, "status": "FINALIZADA" }
```

**Item da lista** (`GET /vistorias`):
```json
{
  "id": 1,
  "descricao": "Vistoria de entrega do apartamento 101...",
  "endereco": "Rua das Flores, 123 - Apto 101 - Centro",
  "status": "EM_ANDAMENTO",
  "data_criacao": "2026-11-22 12:00:00",
  "id_operador_responsavel": 2,
  "nome_responsavel": "Otávio Operador",
  "id_usuario_criador": 1,
  "nome_criador": "Ana Analista",
  "foto_capa": "/uploads/1700000000000-123.jpg",
  "total_ocorrencias": 1
}
```

## Ocorrências

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/vistorias/:id/ocorrencias` | VISUALIZAR_OCORRENCIAS | Ocorrências de uma vistoria |
| POST | `/vistorias/:id/ocorrencias` | REGISTRAR_OCORRENCIAS | Registra ocorrência (multipart) |
| GET | `/ocorrencias?idVistoria=&classificacao=&dataInicio=&dataFim=` | VISUALIZAR_OCORRENCIAS | Histórico com filtros |
| GET | `/ocorrencias/:id` | VISUALIZAR_OCORRENCIAS | Detalhes + fotos |
| PUT | `/ocorrencias/:id` | REGISTRAR_OCORRENCIAS | Altera (somente o autor) |
| DELETE | `/ocorrencias/:id` | REGISTRAR_OCORRENCIAS | Exclui (somente o autor) |

**Registrar ocorrência** (multipart/form-data):

| Campo | Tipo | Obrigatório |
|---|---|---|
| classificacao | BAIXA, MEDIA, ALTA ou CRITICA | ✅ |
| descricao | texto | ✅ |
| fotos | arquivo(s) de imagem | |

## Fotos

As imagens enviadas ficam disponíveis em `http://localhost:3000/uploads/<arquivo>` — use o valor de `url_foto` / `foto_capa` direto no `<img src="...">`.

## Testando

Use o arquivo [`requisicoes.http`](requisicoes.http) com a extensão **REST Client** do VS Code, ou o Postman/Insomnia.
