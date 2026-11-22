const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/vistorias - lista as vistorias
// Filtros opcionais na URL: /api/vistorias?status=ABERTA&endereco=Rua
router.get('/vistorias', async (req, res) => {
  const { status, endereco } = req.query;

  // Busca também o nome do responsável e a primeira foto da vistoria
  let sql = `
    SELECT vistoria.id, vistoria.descricao, vistoria.endereco, vistoria.status,
           vistoria.data_criacao, usuario.nome AS responsavel,
           (SELECT url_foto FROM foto_vistoria
             WHERE foto_vistoria.id_vistoria = vistoria.id LIMIT 1) AS foto
      FROM vistoria
      JOIN usuario ON usuario.id = vistoria.id_operador_responsavel
     WHERE 1 = 1`;
  const valores = [];

  // Os filtros só entram no SQL se forem informados
  if (status) {
    sql += ' AND vistoria.status = ?';
    valores.push(status);
  }
  if (endereco) {
    sql += ' AND vistoria.endereco LIKE ?';
    valores.push('%' + endereco + '%');
  }

  sql += ' ORDER BY vistoria.data_criacao DESC';

  const [vistorias] = await db.query(sql, valores);
  res.json(vistorias);
});

// GET /api/vistorias/:id - detalhes da vistoria com suas fotos e ocorrências
router.get('/vistorias/:id', async (req, res) => {
  const id = req.params.id;

  const [vistorias] = await db.query(
    `SELECT vistoria.*, usuario.nome AS responsavel
       FROM vistoria
       JOIN usuario ON usuario.id = vistoria.id_operador_responsavel
      WHERE vistoria.id = ?`,
    [id]
  );

  if (vistorias.length === 0) {
    return res.status(404).json({ erro: 'Vistoria não encontrada' });
  }

  const [fotos] = await db.query('SELECT * FROM foto_vistoria WHERE id_vistoria = ?', [id]);
  const [ocorrencias] = await db.query('SELECT * FROM ocorrencia WHERE id_vistoria = ?', [id]);

  const vistoria = vistorias[0];
  vistoria.fotos = fotos;
  vistoria.ocorrencias = ocorrencias;

  res.json(vistoria);
});

// POST /api/vistorias - cadastra uma vistoria
// Corpo: { idUsuarioCriador, idOperadorResponsavel, descricao, endereco, urlFoto }
router.post('/vistorias', async (req, res) => {
  const { idUsuarioCriador, idOperadorResponsavel, descricao, endereco, urlFoto } = req.body || {};

  if (!idUsuarioCriador || !idOperadorResponsavel || !descricao || !endereco) {
    return res.status(400).json({ erro: 'Preencha responsável, descrição e endereço' });
  }

  const [resultado] = await db.query(
    `INSERT INTO vistoria (id_usuario_criador, id_operador_responsavel, descricao, endereco)
     VALUES (?, ?, ?, ?)`,
    [idUsuarioCriador, idOperadorResponsavel, descricao, endereco]
  );

  // A foto é opcional: se vier o link, salva na tabela de fotos
  if (urlFoto) {
    await db.query(
      'INSERT INTO foto_vistoria (id_vistoria, url_foto) VALUES (?, ?)',
      [resultado.insertId, urlFoto]
    );
  }

  res.status(201).json({ id: resultado.insertId });
});

// POST /api/vistorias/:id/fotos - adiciona mais uma foto à vistoria
// Corpo: { urlFoto }
router.post('/vistorias/:id/fotos', async (req, res) => {
  const { urlFoto } = req.body || {};

  if (!urlFoto) {
    return res.status(400).json({ erro: 'Informe o link da foto' });
  }

  await db.query(
    'INSERT INTO foto_vistoria (id_vistoria, url_foto) VALUES (?, ?)',
    [req.params.id, urlFoto]
  );
  res.status(201).json({ mensagem: 'Foto adicionada' });
});

// PUT /api/vistorias/:id - altera uma vistoria (inclusive o status)
// Corpo: { idOperadorResponsavel, descricao, endereco, status }
router.put('/vistorias/:id', async (req, res) => {
  const { idOperadorResponsavel, descricao, endereco, status } = req.body || {};

  if (!idOperadorResponsavel || !descricao || !endereco || !status) {
    return res.status(400).json({ erro: 'Preencha responsável, descrição, endereço e status' });
  }

  await db.query(
    `UPDATE vistoria
        SET id_operador_responsavel = ?, descricao = ?, endereco = ?, status = ?
      WHERE id = ?`,
    [idOperadorResponsavel, descricao, endereco, status, req.params.id]
  );
  res.json({ mensagem: 'Vistoria alterada' });
});

// DELETE /api/vistorias/:id - exclui a vistoria (fotos e ocorrências saem junto)
router.delete('/vistorias/:id', async (req, res) => {
  await db.query('DELETE FROM vistoria WHERE id = ?', [req.params.id]);
  res.json({ mensagem: 'Vistoria excluída' });
});

module.exports = router;
