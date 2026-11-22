# 🏢 Vistoria Informatizada

Sistema web para **gerenciamento de vistorias prediais** e das **ocorrências** encontradas em cada vistoria, mantendo o histórico completo por imóvel.

> Projeto acadêmico — Situação de Aprendizagem (SA) "Vistorias" — 2º período.

## 📌 Sobre o projeto

O **Analista** cadastra as vistorias que serão realizadas (endereço, foto do local, informações iniciais e o operador responsável). O **Operador** (vistoriador) vai a campo e registra uma ou mais **ocorrências** em cada vistoria, com classificação, data, descrição e fotos.

| Perfil | O que pode fazer |
|---|---|
| **Analista** | Ver, incluir, alterar e excluir vistorias · gerenciar usuários · ver ocorrências |
| **Operador** | Ver a lista de vistorias · registrar ocorrências · ver o histórico de ocorrências |

## 🛠️ Tecnologias

Somente as tecnologias definidas na arquitetura da SA:

| Camada | Tecnologia |
|---|---|
| Frontend | HTML, CSS, JavaScript, Bootstrap |
| Backend | Node.js (com Express) |
| Banco de dados | MySQL |

Bibliotecas auxiliares do Node: `express`, `mysql2`, `bcryptjs` (hash de senha), `jsonwebtoken` (login), `multer` (upload de fotos), `dotenv` (configuração).

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [01 - Conceito](docs/01-conceito.md) | Visão do produto, problema, perfis e fluxo |
| [02 - Requisitos](docs/02-requisitos.md) | Requisitos funcionais, não funcionais e regras de negócio |
| [03 - Banco de dados](docs/03-banco-de-dados.md) | DER e dicionário de dados |
| [04 - API](docs/04-api.md) | Endpoints da API REST |
| [05 - Telas](docs/05-telas.md) | Descrição das telas para o protótipo |
| [06 - Cronograma](docs/06-cronograma.md) | Entregáveis e prazos da SA |

## 📁 Estrutura de pastas

```
vistoria-informatizada/
├── database/
│   ├── 01-schema.sql          # criação do banco e tabelas
│   └── 02-seed.sql            # cargos, permissões e usuários de teste
├── docs/                      # documentação do projeto
├── public/                    # frontend (HTML/CSS/JS/Bootstrap)
├── src/
│   ├── config/db.js           # conexão com o MySQL
│   ├── controllers/           # regras de cada módulo
│   ├── middlewares/           # login, permissões, upload, erros
│   ├── routes/                # definição das rotas da API
│   └── server.js              # ponto de entrada
├── uploads/                   # fotos enviadas (não vão para o Git)
├── .env.example
└── package.json
```

## ▶️ Como rodar

**Pré-requisitos:** [Node.js](https://nodejs.org) 18+ e [MySQL](https://dev.mysql.com/downloads/) 8.

1. Clone o repositório e instale as dependências:
   ```bash
   git clone https://github.com/CaiqueDokasi/vistoria-informatizada.git
   cd vistoria-informatizada
   npm install
   ```
2. Crie o banco executando os scripts no MySQL Workbench (ou terminal), **nesta ordem**:
   ```bash
   mysql -u root -p < database/01-schema.sql
   mysql -u root -p < database/02-seed.sql
   ```
3. Copie `.env.example` para `.env` e preencha a senha do MySQL e o `JWT_SECRET`.
4. Inicie o servidor:
   ```bash
   npm run dev     # reinicia sozinho ao salvar arquivos
   # ou
   npm start
   ```
5. Acesse http://localhost:3000/api/status

### 👤 Usuários de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Analista | analista@vistoria.com | 123456 |
| Operador | operador@vistoria.com | 123456 |

## ✅ Status

- [x] Conceito e documentação
- [x] Modelagem do banco (DER + scripts)
- [x] API: login e permissões
- [x] API: usuários
- [x] API: vistorias (com fotos e filtros)
- [x] API: ocorrências (com fotos e histórico)
- [ ] Protótipo de telas (Figma)
- [ ] Frontend (HTML + Bootstrap + teclado virtual de senha)
- [ ] Extra: importação e backup dos dados
