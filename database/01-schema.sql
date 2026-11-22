-- =====================================================================
-- Vistoria Informatizada - Criação do banco de dados (MySQL)
-- =====================================================================

DROP DATABASE IF EXISTS vistoria_informatizada;
CREATE DATABASE vistoria_informatizada;
USE vistoria_informatizada;

-- ---------------------------------------------------------------------
-- Usuários e permissões
-- ---------------------------------------------------------------------

CREATE TABLE cargo (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL
);

CREATE TABLE permissao (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

-- Liga cada cargo às permissões que ele possui
CREATE TABLE cargo_permissao (
    id_cargo     INT NOT NULL,
    id_permissao INT NOT NULL,
    PRIMARY KEY (id_cargo, id_permissao),
    FOREIGN KEY (id_cargo)     REFERENCES cargo (id),
    FOREIGN KEY (id_permissao) REFERENCES permissao (id)
);

CREATE TABLE usuario (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(100) NOT NULL,
    email    VARCHAR(100) NOT NULL UNIQUE,
    senha    VARCHAR(100) NOT NULL,
    id_cargo INT NOT NULL,
    FOREIGN KEY (id_cargo) REFERENCES cargo (id)
);

-- ---------------------------------------------------------------------
-- Vistorias
-- ---------------------------------------------------------------------

CREATE TABLE vistoria (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_criador      INT NOT NULL,   -- analista que cadastrou
    id_operador_responsavel INT NOT NULL,   -- operador que fará a vistoria
    data_criacao            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao               TEXT NOT NULL,
    endereco                VARCHAR(255) NOT NULL,
    status                  ENUM('ABERTA', 'FINALIZADA') NOT NULL DEFAULT 'ABERTA',
    FOREIGN KEY (id_usuario_criador)      REFERENCES usuario (id),
    FOREIGN KEY (id_operador_responsavel) REFERENCES usuario (id)
);

-- ON DELETE CASCADE: ao excluir a vistoria, suas fotos são excluídas junto
CREATE TABLE foto_vistoria (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_vistoria  INT NOT NULL,
    url_foto     VARCHAR(255) NOT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vistoria) REFERENCES vistoria (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Ocorrências
-- ---------------------------------------------------------------------

CREATE TABLE ocorrencia (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    id_vistoria        INT NOT NULL,
    id_usuario_criador INT NOT NULL,        -- operador que registrou
    classificacao      ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL,
    data_criacao       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao          TEXT NOT NULL,
    FOREIGN KEY (id_vistoria)        REFERENCES vistoria (id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_criador) REFERENCES usuario (id)
);

CREATE TABLE foto_ocorrencia (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    url_foto      VARCHAR(255) NOT NULL,
    data_criacao  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencia (id) ON DELETE CASCADE
);
