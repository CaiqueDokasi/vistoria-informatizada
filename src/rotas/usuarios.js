const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/cargos - lista os cargos (usado no formulário de usuário)
router.get('/cargos', async (req, res) => {
  const [cargos] = await db.query('SELECT * FROM cargo');
  res.json(cargos);
});

// GET /api/usuarios - lista todos os usuários com o nome do cargo
router.get('/usuarios', async (req, res) => {
  const [usuarios] = await db.query(
    `SELECT usuario.id, usuario.nome, usuario.email, usuario.id_cargo, cargo.nome AS cargo
       FROM usuario
       JOIN cargo ON cargo.id = usuario.id_cargo
      ORDER BY usuario.nome`
  );
  res.json(usuarios);
});

// GET /api/usuarios/:id - busca um usuário
router.get('/usuarios/:id', async (req, res) => {
  const [usuarios] = await db.query(
    'SELECT id, nome, email, id_cargo FROM usuario WHERE id = ?',
    [req.params.id]
  );

  if (usuarios.length === 0) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  res.json(usuarios[0]);
});

// POST /api/usuarios - cadastra um usuário
// Corpo: { nome, email, senha, idCargo }
router.post('/usuarios', async (req, res) => {
  const { nome, email, senha, idCargo } = req.body || {};

  if (!nome || !email || !senha || !idCargo) {
    return res.status(400).json({ erro: 'Preencha nome, email, senha e cargo' });
  }

  const [resultado] = await db.query(
    'INSERT INTO usuario (nome, email, senha, id_cargo) VALUES (?, ?, ?, ?)',
    [nome, email, senha, idCargo]
  );
  res.status(201).json({ id: resultado.insertId });
});

// PUT /api/usuarios/:id - altera um usuário
// Corpo: { nome, email, senha, idCargo }
router.put('/usuarios/:id', async (req, res) => {
  const { nome, email, senha, idCargo } = req.body || {};

  if (!nome || !email || !senha || !idCargo) {
    return res.status(400).json({ erro: 'Preencha nome, email, senha e cargo' });
  }

  await db.query(
    'UPDATE usuario SET nome = ?, email = ?, senha = ?, id_cargo = ? WHERE id = ?',
    [nome, email, senha, idCargo, req.params.id]
  );
  res.json({ mensagem: 'Usuário alterado' });
});

// DELETE /api/usuarios/:id - exclui um usuário
router.delete('/usuarios/:id', async (req, res) => {
  await db.query('DELETE FROM usuario WHERE id = ?', [req.params.id]);
  res.json({ mensagem: 'Usuário excluído' });
});

module.exports = router;
