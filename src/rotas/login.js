const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/login
// Recebe { email, senha } e devolve os dados do usuário com seu cargo e permissões.
router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  const [usuarios] = await db.query(
    `SELECT usuario.id, usuario.nome, usuario.email, usuario.id_cargo, cargo.nome AS cargo
       FROM usuario
       JOIN cargo ON cargo.id = usuario.id_cargo
      WHERE usuario.email = ? AND usuario.senha = ?`,
    [email, senha]
  );

  if (usuarios.length === 0) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  }

  const usuario = usuarios[0];

  // Busca as permissões do cargo do usuário
  const [permissoes] = await db.query(
    `SELECT permissao.nome
       FROM permissao
       JOIN cargo_permissao ON cargo_permissao.id_permissao = permissao.id
      WHERE cargo_permissao.id_cargo = ?`,
    [usuario.id_cargo]
  );

  // Transforma [{ nome: 'X' }, { nome: 'Y' }] em ['X', 'Y']
  usuario.permissoes = permissoes.map((p) => p.nome);

  res.json(usuario);
});

module.exports = router;
