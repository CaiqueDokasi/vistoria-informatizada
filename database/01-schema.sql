-- =====================================================================
-- Vistoria Informatizada - Script de criação do banco de dados (MySQL 8)
-- =====================================================================

DROP DATABASE IF EXISTS vistoria_informatizada;
CREATE DATABASE vistoria_informatizada
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE vistoria_informatizada;

-- ---------------------------------------------------------------------
-- Usuários e permissões
-- ---------------------------------------------------------------------

CREATE TABLE cargo (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE permissao (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela associativa N:N entre cargo e permissão
CREATE TABLE cargo_permissao (
    id_cargo     INT NOT NULL,
    id_permissao INT NOT NULL,
    PRIMARY KEY (id_cargo, id_permissao),
    CONSTRAINT fk_cp_cargo     FOREIGN KEY (id_cargo)     REFERENCES cargo (id)     ON DELETE CASCADE,
    CONSTRAINT fk_cp_permissao FOREIGN KEY (id_permissao) REFERENCES permissao (id) ON DELETE CASCADE
);

CREATE TABLE usuario (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(100) NOT NULL,
    email    VARCHAR(100) NOT NULL UNIQUE,
    senha    VARCHAR(100) NOT NULL,          -- hash bcrypt (nunca a senha pura)
    id_cargo INT NOT NULL,
    CONSTRAINT fk_usuario_cargo FOREIGN KEY (id_cargo) REFERENCES cargo (id)
);

-- ---------------------------------------------------------------------
-- Vistorias
-- ---------------------------------------------------------------------

CREATE TABLE vistoria (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_criador      INT NOT NULL,     -- analista que cadastrou
    id_operador_responsavel INT NOT NULL,     -- operador (vistoriador) responsável
    data_criacao            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao               TEXT NOT NULL,    -- informações iniciais para o vistoriador
    endereco                VARCHAR(255) NOT NULL,
    status                  ENUM('ABERTA', 'EM_ANDAMENTO', 'FINALIZADA') NOT NULL DEFAULT 'ABERTA',
    CONSTRAINT fk_vistoria_criador     FOREIGN KEY (id_usuario_criador)      REFERENCES usuario (id),
    CONSTRAINT fk_vistoria_responsavel FOREIGN KEY (id_operador_responsavel) REFERENCES usuario (id)
);

CREATE TABLE foto_vistoria (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_vistoria  INT NOT NULL,
    url_foto     VARCHAR(255) NOT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_foto_vistoria FOREIGN KEY (id_vistoria) REFERENCES vistoria (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Ocorrências
-- ---------------------------------------------------------------------

CREATE TABLE ocorrencia (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    id_vistoria        INT NOT NULL,
    id_usuario_criador INT NOT NULL,          -- operador que relatou
    classificacao      ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL,
    data_criacao       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao          TEXT NOT NULL,
    CONSTRAINT fk_ocorrencia_vistoria FOREIGN KEY (id_vistoria)        REFERENCES vistoria (id) ON DELETE CASCADE,
    CONSTRAINT fk_ocorrencia_usuario  FOREIGN KEY (id_usuario_criador) REFERENCES usuario (id)
);

CREATE TABLE foto_ocorrencia (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    url_foto      VARCHAR(255) NOT NULL,
    data_criacao  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_foto_ocorrencia FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencia (id) ON DELETE CASCADE
);
