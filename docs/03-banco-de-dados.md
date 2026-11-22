# 03 - Banco de Dados

Banco MySQL chamado `vistoria_informatizada`. Os scripts estão na pasta [`database/`](../database):

- `01-schema.sql` — cria o banco e as tabelas
- `02-seed.sql` — insere cargos, permissões, usuários de teste e um exemplo de vistoria

## Diagrama

```mermaid
erDiagram
    CARGO ||--o{ CARGO_PERMISSAO : "atribui"
    PERMISSAO ||--o{ CARGO_PERMISSAO : "concede"
    CARGO ||--o{ USUARIO : "agrupa"
    USUARIO ||--o{ VISTORIA : "cadastra"
    USUARIO ||--o{ VISTORIA : "é responsável"
    VISTORIA ||--o{ FOTO_VISTORIA : "possui"
    VISTORIA ||--o{ OCORRENCIA : "registra"
    USUARIO ||--o{ OCORRENCIA : "relata"
    OCORRENCIA ||--o{ FOTO_OCORRENCIA : "contém"

    CARGO {
        int id PK
        varchar nome
    }
    PERMISSAO {
        int id PK
        varchar nome
    }
    CARGO_PERMISSAO {
        int id_cargo FK
        int id_permissao FK
    }
    USUARIO {
        int id PK
        varchar nome
        varchar email
        varchar senha
        int id_cargo FK
    }
    VISTORIA {
        int id PK
        int id_usuario_criador FK
        int id_operador_responsavel FK
        datetime data_criacao
        text descricao
        varchar endereco
        enum status
    }
    FOTO_VISTORIA {
        int id PK
        int id_vistoria FK
        varchar url_foto
        datetime data_criacao
    }
    OCORRENCIA {
        int id PK
        int id_vistoria FK
        int id_usuario_criador FK
        enum classificacao
        datetime data_criacao
        text descricao
    }
    FOTO_OCORRENCIA {
        int id PK
        int id_ocorrencia FK
        varchar url_foto
        datetime data_criacao
    }
```

## Tabelas

| Tabela | Para que serve |
|---|---|
| `cargo` | Perfis do sistema: Analista e Operador |
| `permissao` | Ações que podem ser liberadas para um cargo |
| `cargo_permissao` | Diz quais permissões cada cargo tem |
| `usuario` | Pessoas que acessam o sistema |
| `vistoria` | Vistorias cadastradas pelo analista |
| `foto_vistoria` | Fotos do local da vistoria (link da imagem) |
| `ocorrencia` | Problemas registrados pelo operador em uma vistoria |
| `foto_ocorrencia` | Fotos de cada ocorrência (link da imagem) |

## Permissões de cada cargo

| Permissão | Analista | Operador |
|---|:---:|:---:|
| GERENCIAR_USUARIOS | ✅ | |
| GERENCIAR_VISTORIAS | ✅ | |
| VISUALIZAR_VISTORIAS | ✅ | ✅ |
| REGISTRAR_OCORRENCIAS | | ✅ |
| VISUALIZAR_OCORRENCIAS | ✅ | ✅ |

## Valores fixos (ENUM)

| Campo | Valores |
|---|---|
| `vistoria.status` | `ABERTA`, `FINALIZADA` |
| `ocorrencia.classificacao` | `BAIXA`, `MEDIA`, `ALTA`, `CRITICA` |

## Observações

- As fotos são salvas como **link** (texto) no campo `url_foto`.
- `ON DELETE CASCADE`: ao excluir uma vistoria, o MySQL exclui automaticamente suas fotos e ocorrências.
