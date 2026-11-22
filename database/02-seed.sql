-- =====================================================================
-- Vistoria Informatizada - Dados iniciais
-- Executar DEPOIS do 01-schema.sql
-- =====================================================================

USE vistoria_informatizada;

INSERT INTO cargo (id, nome) VALUES
    (1, 'Analista'),
    (2, 'Operador');

INSERT INTO permissao (id, nome) VALUES
    (1, 'GERENCIAR_USUARIOS'),
    (2, 'GERENCIAR_VISTORIAS'),
    (3, 'VISUALIZAR_VISTORIAS'),
    (4, 'REGISTRAR_OCORRENCIAS'),
    (5, 'VISUALIZAR_OCORRENCIAS');

-- Analista: gerencia usuários e vistorias, visualiza tudo
INSERT INTO cargo_permissao (id_cargo, id_permissao) VALUES
    (1, 1), (1, 2), (1, 3), (1, 5);

-- Operador: visualiza vistorias e registra ocorrências
INSERT INTO cargo_permissao (id_cargo, id_permissao) VALUES
    (2, 3), (2, 4), (2, 5);

-- Usuários de teste
INSERT INTO usuario (id, nome, email, senha, id_cargo) VALUES
    (1, 'Ana Analista',    'analista@vistoria.com', '123456', 1),
    (2, 'Otávio Operador', 'operador@vistoria.com', '123456', 2);

-- Vistoria e ocorrência de exemplo
INSERT INTO vistoria (id, id_usuario_criador, id_operador_responsavel, descricao, endereco) VALUES
    (1, 1, 2, 'Vistoria de entrega do apartamento 101. Verificar parte elétrica, hidráulica e acabamento.',
     'Rua das Flores, 123 - Apto 101 - Centro');

INSERT INTO ocorrencia (id_vistoria, id_usuario_criador, classificacao, descricao) VALUES
    (1, 2, 'MEDIA', 'Infiltração na parede do banheiro social, próximo ao box.');
