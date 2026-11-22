# 06 - Cronograma de Entregas

Entregáveis definidos na Situação de Aprendizagem:

| # | Entregável | Prazo | Onde está no repositório | Situação |
|---|---|---|---|---|
| 1 | Modelagem de banco de dados (diagramas e scripts) | 07/08/2026 | [`docs/03-banco-de-dados.md`](03-banco-de-dados.md), [`database/`](../database) | ✅ |
| 2 | Protótipo de tela (Figma ou Marvel) | 07/08/2026 | [`docs/05-telas.md`](05-telas.md) | ⏳ |
| 3 | Módulo de gestão de usuários e permissões (Analista e Operador) | 30/10/2026 | `src/*/auth*`, `src/*/usuarios*` | ✅ backend |
| 4 | Módulo de gestão das vistorias (uma ou mais ocorrências por vistoria) | 06/11/2026 | `src/*/vistorias*` | ✅ backend |
| 5 | Módulo de gestão das ocorrências | 13/11/2026 | `src/*/ocorrencias*` | ✅ backend |
| 6 | **Extra:** importação e backup dos dados (reavaliação) | 18/12/2026 | — | ⏳ |

## Próximos passos

1. Protótipo das telas no Figma seguindo [05-telas.md](05-telas.md).
2. Frontend em `public/`: login com teclado virtual → lista de vistorias → demais telas.
3. Extra: rotas `GET /api/backup/exportar` (gera JSON com todos os dados) e `POST /api/backup/importar`.
