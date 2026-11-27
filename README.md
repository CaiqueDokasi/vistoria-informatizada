# Vistoria Informatizada

Sistema web para gerenciamento de vistorias prediais e das ocorrências encontradas em cada vistoria.

Projeto da Situação de Aprendizagem (SA) "Vistorias" — 2º período.

## Sobre o projeto

O **Analista** cadastra as vistorias que serão realizadas, informando endereço, foto do local, descrição e o operador responsável. O **Operador** (vistoriador) consulta as vistorias e registra uma ou mais **ocorrências** em cada uma, com classificação, descrição e foto.

| Perfil | O que pode fazer |
|---|---|
| Analista | Ver, incluir, alterar e excluir vistorias; gerenciar usuários |
| Operador | Ver as vistorias; registrar ocorrências; ver o histórico de ocorrências |

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML, CSS e JavaScript puro |
| Backend | Node.js (com a biblioteca Express) |
| Banco de dados | MySQL |

## Documentação

1. [Conceito](docs/01-conceito.md) — o problema, a solução e os perfis de usuário
2. [Requisitos](docs/02-requisitos.md) — o que o sistema deve fazer
3. [Banco de dados](docs/03-banco-de-dados.md) — tabelas e relacionamentos
4. [Backend](docs/04-backend.md) — como o servidor funciona e lista de rotas
5. [Telas](docs/05-telas.md) — descrição das telas
6. [Cronograma](docs/06-cronograma.md) — entregas e prazos

## Estrutura de pastas

```
vistoria-informatizada/
├── database/
│   ├── 01-schema.sql      # cria o banco e as tabelas
│   └── 02-seed.sql        # insere dados iniciais
├── docs/                  # documentação
├── public/                # frontend (HTML, CSS, JS)
├── src/
│   ├── server.js          # inicia o servidor
│   ├── db.js              # conexão com o MySQL
│   └── rotas/             # rotas da API, uma por assunto
│       ├── login.js
│       ├── usuarios.js
│       ├── vistorias.js
│       └── ocorrencias.js
└── package.json
```

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) e [MySQL](https://dev.mysql.com/downloads/) instalados.

1. Clonar o repositório e instalar as dependências:
   ```powershell
   git clone https://github.com/CaiqueDokasi/vistoria-informatizada.git
   cd vistoria-informatizada
   npm install
   ```
2. No MySQL Workbench, abrir e executar os arquivos `database/01-schema.sql` e depois `database/02-seed.sql`.
3. Configure a conexão MySQL por variáveis de ambiente. No PowerShell do Windows:
   ```powershell
   $env:DB_HOST = "localhost"
   $env:DB_PORT = "3306"
   $env:DB_USER = "root"
   $env:DB_PASSWORD = "sua_senha_do_mysql"
   $env:DB_NAME = "vistoria_informatizada"
   ```
   `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_NAME` têm valores padrão para uma instalação local. Informe a senha configurada no seu MySQL em `DB_PASSWORD`.
4. No mesmo terminal, iniciar o servidor:
   ```bash
   npm start
   ```
5. Acessar http://localhost:3000

### Usuários de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Analista | analista@vistoria.com | 123456 |
| Operador | operador@vistoria.com | 123456 |

## Andamento

- [x] Conceito e documentação
- [x] Modelagem do banco de dados
- [x] Backend: login, usuários, vistorias e ocorrências
- [x] Protótipo de telas (Figma)
- [x] Frontend
- [x] Extra: importação e backup dos dados
