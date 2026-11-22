const bcrypt = require('bcryptjs');
const db = require('../config/db');

const SELECT_USUARIO = `
  SELECT u.id, u.nome, u.email, u.id_cargo, c.nome AS cargo
    FROM usuario u
    JOIN cargo c ON c.id = u.id_cargo`;

// GET /api/cargos
async function listarCargos(req, res) {
  const [cargos] = await db.query('SELECT id, nome FROM cargo ORDER BY nome');
  res.json(cargos);
}

// GET /api/usuarios?nome=&idCargo=
async function listar(req, res) {
  const { nome, idCargo } = req.query;
  let sql = `${SELECT_USUARIO} WHERE 1 = 1`;
  const params = [];

  if (nome) {
    sql += ' AND u.nome LIKE ?';
    params.push(`%${nome}%`);
  }
  if (idCargo) {
    sql += ' AND u.id_cargo = ?';
    params.push(idCargo);
  }

  const [usuarios] = await db.query(`${sql} ORDER BY u.nome`, params);
  res.json(usuarios);
}

// GET /api/usuarios/operadores
async function listarOperadores(req, res) {
  const [usuarios] = await db.query(`${SELECT_USUARIO} WHERE c.nome = 'Operador' ORDER BY u.nome`);
  res.json(usuarios);
}

// GET /api/usuarios/:id
async function buscarPorId(req, res) {
  const [linhas] = await db.query(`${SELECT_USUARIO} WHERE u.id = ?`, [req.params.id]);
  if (!linhas[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(linhas[0]);
}

// POST /api/usuarios  { nome, email, senha, idCargo }
async function criar(req, res) {
  const { nome, email, senha, idCargo } = req.body || {};
  if (!nome || !email || !senha || !idCargo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha, idCargo.' });
  }
  if (String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const hash = await bcrypt.hash(String(senha), 10);
  const [resultado] = await db.query(
    'INSERT INTO usuario (nome, email, senha, id_cargo) VALUES (?, ?, ?, ?)',
    [nome, email, hash, idCargo]
  );
  res.status(201).json({ id: resultado.insertId, nome, email, idCargo });
}

// PUT /api/usuarios/:id  { nome, email, idCargo, senha? }
async function atualizar(req, res) {
  const { nome, email, senha, idCargo } = req.body || {};
  if (!nome || !email || !idCargo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, idCargo.' });
  }

  let sql = 'UPDATE usuario SET nome = ?, email = ?, id_cargo = ?';
  const params = [nome, email, idCargo];

  // A senha só é alterada se for enviada
  if (senha) {
    if (String(senha).length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    sql += ', senha = ?';
    params.push(await bcrypt.hash(String(senha), 10));
  }

  sql += ' WHERE id = ?';
  params.push(req.params.id);

  const [resultado] = await db.query(sql, params);
  if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json({ mensagem: 'Usuário atualizado com sucesso.' });
}

// DELETE /api/usuarios/:id
async function excluir(req, res) {
  if (Number(req.params.id) === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode excluir o próprio usuário.' });
  }

  const [resultado] = await db.query('DELETE FROM usuario WHERE id = ?', [req.params.id]);
  if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json({ mensagem: 'Usuário excluído com sucesso.' });
}

module.exports = { listarCargos, listar, listarOperadores, buscarPorId, criar, atualizar, excluir };
