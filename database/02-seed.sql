-- =====================================================================
-- Vistoria Informatizada - Dados iniciais
-- Execute DEPOIS do 01-schema.sql
-- =====================================================================

USE vistoria_informatizada;

-- Cargos (perfis) exigidos pela SA
INSERT INTO cargo (id, nome) VALUES
    (1, 'Analista'),
    (2, 'Operador');

-- Permissões do sistema
INSERT INTO permissao (id, nome) VALUES
    (1, 'GERENCIAR_USUARIOS'),      -- cadastrar/alterar/excluir usuários
    (2, 'VISUALIZAR_VISTORIAS'),    -- ver lista e detalhes de vistorias
    (3, 'GERENCIAR_VISTORIAS'),     -- incluir/alterar/excluir vistorias
    (4, 'VISUALIZAR_OCORRENCIAS'),  -- ver histórico de ocorrências
    (5, 'REGISTRAR_OCORRENCIAS');   -- incluir/alterar/excluir as próprias ocorrências

-- Analista: usuários + vistorias + ver ocorrências
INSERT INTO cargo_permissao (id_cargo, id_permissao) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4);

-- Operador: ver vistorias + ver e registrar ocorrências
INSERT INTO cargo_permissao (id_cargo, id_permissao) VALUES
    (2, 2), (2, 4), (2, 5);

-- Usuários de teste (senha de ambos: 123456)
INSERT INTO usuario (id, nome, email, senha, id_cargo) VALUES
    (1, 'Ana Analista',    'analista@vistoria.com', '$2b$10$cP6s5Vl1vYdPyIDVqYanX.GH05dAl961gV5la.jSBH78w94ZpZD4m', 1),
    (2, 'Otávio Operador', 'operador@vistoria.com', '$2b$10$cP6s5Vl1vYdPyIDVqYanX.GH05dAl961gV5la.jSBH78w94ZpZD4m', 2);

-- Exemplo de vistoria e ocorrência
INSERT INTO vistoria (id, id_usuario_criador, id_operador_responsavel, descricao, endereco, status) VALUES
    (1, 1, 2, 'Vistoria de entrega do apartamento 101. Verificar parte elétrica, hidráulica e acabamento.',
     'Rua das Flores, 123 - Apto 101 - Centro', 'EM_ANDAMENTO');

INSERT INTO ocorrencia (id_vistoria, id_usuario_criador, classificacao, descricao) VALUES
    (1, 2, 'MEDIA', 'Infiltração na parede do banheiro social, próximo ao box.');
