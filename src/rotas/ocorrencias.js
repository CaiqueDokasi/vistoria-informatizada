const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/ocorrencias - histórico de ocorrências
// Filtro opcional: /api/ocorrencias?idVistoria=1
router.get('/ocorrencias', async (req, res) => {
  const { idVistoria } = req.query;

  let sql = `
    SELECT ocorrencia.*, vistoria.endereco, usuario.nome AS operador
      FROM ocorrencia
      JOIN vistoria ON vistoria.id = ocorrencia.id_vistoria
      JOIN usuario ON usuario.id = ocorrencia.id_usuario_criador`;
  const valores = [];

  if (idVistoria) {
    sql += ' WHERE ocorrencia.id_vistoria = ?';
    valores.push(idVistoria);
  }

  sql += ' ORDER BY ocorrencia.data_criacao DESC';

  const [ocorrencias] = await db.query(sql, valores);
  res.json(ocorrencias);
});

// GET /api/ocorrencias/:id - detalhes da ocorrência com suas fotos
router.get('/ocorrencias/:id', async (req, res) => {
  const id = req.params.id;

  const [ocorrencias] = await db.query('SELECT * FROM ocorrencia WHERE id = ?', [id]);

  if (ocorrencias.length === 0) {
    return res.status(404).json({ erro: 'Ocorrência não encontrada' });
  }

  const [fotos] = await db.query('SELECT * FROM foto_ocorrencia WHERE id_ocorrencia = ?', [id]);

  const ocorrencia = ocorrencias[0];
  ocorrencia.fotos = fotos;

  res.json(ocorrencia);
});

// POST /api/ocorrencias - registra uma ocorrência em uma vistoria
// Corpo: { idVistoria, idUsuarioCriador, classificacao, descricao, urlFoto }
// classificacao: BAIXA, MEDIA, ALTA ou CRITICA
router.post('/ocorrencias', async (req, res) => {
  const { idVistoria, idUsuarioCriador, classificacao, descricao, urlFoto } = req.body || {};

  if (!idVistoria || !idUsuarioCriador || !classificacao || !descricao) {
    return res.status(400).json({ erro: 'Preencha vistoria, classificação e descrição' });
  }

  const [resultado] = await db.query(
    `INSERT INTO ocorrencia (id_vistoria, id_usuario_criador, classificacao, descricao)
     VALUES (?, ?, ?, ?)`,
    [idVistoria, idUsuarioCriador, classificacao, descricao]
  );

  // A foto é opcional
  if (urlFoto) {
    await db.query(
      'INSERT INTO foto_ocorrencia (id_ocorrencia, url_foto) VALUES (?, ?)',
      [resultado.insertId, urlFoto]
    );
  }

  res.status(201).json({ id: resultado.insertId });
});

// PUT /api/ocorrencias/:id - altera uma ocorrência
// Corpo: { classificacao, descricao }
router.put('/ocorrencias/:id', async (req, res) => {
  const { classificacao, descricao } = req.body || {};

  if (!classificacao || !descricao) {
    return res.status(400).json({ erro: 'Preencha classificação e descrição' });
  }

  await db.query(
    'UPDATE ocorrencia SET classificacao = ?, descricao = ? WHERE id = ?',
    [classificacao, descricao, req.params.id]
  );
  res.json({ mensagem: 'Ocorrência alterada' });
});

// DELETE /api/ocorrencias/:id - exclui uma ocorrência (as fotos saem junto)
router.delete('/ocorrencias/:id', async (req, res) => {
  await db.query('DELETE FROM ocorrencia WHERE id = ?', [req.params.id]);
  res.json({ mensagem: 'Ocorrência excluída' });
});

module.exports = router;
