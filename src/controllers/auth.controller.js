const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/login  { email, senha }
async function login(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const [linhas] = await db.query(
    `SELECT u.id, u.nome, u.email, u.senha, u.id_cargo, c.nome AS cargo
       FROM usuario u
       JOIN cargo c ON c.id = u.id_cargo
      WHERE u.email = ?`,
    [email]
  );
  const usuario = linhas[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  // Busca as permissões do cargo do usuário
  const [perms] = await db.query(
    `SELECT p.nome
       FROM permissao p
       JOIN cargo_permissao cp ON cp.id_permissao = p.id
      WHERE cp.id_cargo = ?`,
    [usuario.id_cargo]
  );
  const permissoes = perms.map((p) => p.nome);

  const dadosToken = { id: usuario.id, nome: usuario.nome, cargo: usuario.cargo, permissoes };
  const token = jwt.sign(dadosToken, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.json({ token, usuario: { ...dadosToken, email: usuario.email } });
}

// GET /api/auth/me  -> dados do usuário logado (lidos do token)
function me(req, res) {
  res.json(req.usuario);
}

module.exports = { login, me };
