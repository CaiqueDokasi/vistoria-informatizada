const db = require('../config/db');
const { urlsDasFotos, removerArquivos } = require('../middlewares/upload');

const STATUS_VALIDOS = ['ABERTA', 'EM_ANDAMENTO', 'FINALIZADA'];

// Verifica se o id informado pertence a um usuário com cargo Operador
async function ehOperador(idUsuario) {
  const [linhas] = await db.query(
    `SELECT u.id FROM usuario u JOIN cargo c ON c.id = u.id_cargo
      WHERE u.id = ? AND c.nome = 'Operador'`,
    [idUsuario]
  );
  return linhas.length > 0;
}

async function salvarFotos(idVistoria, urls) {
  for (const url of urls) {
    await db.query('INSERT INTO foto_vistoria (id_vistoria, url_foto) VALUES (?, ?)', [idVistoria, url]);
  }
}

// GET /api/vistorias?status=&endereco=&idResponsavel=&dataInicio=&dataFim=
async function listar(req, res) {
  const { status, endereco, idResponsavel, dataInicio, dataFim } = req.query;

  let sql = `
    SELECT v.id, v.descricao, v.endereco, v.status, v.data_criacao,
           v.id_operador_responsavel, op.nome AS nome_responsavel,
           v.id_usuario_criador, cr.nome AS nome_criador,
           (SELECT f.url_foto FROM foto_vistoria f WHERE f.id_vistoria = v.id ORDER BY f.id LIMIT 1) AS foto_capa,
           (SELECT COUNT(*) FROM ocorrencia o WHERE o.id_vistoria = v.id) AS total_ocorrencias
      FROM vistoria v
      JOIN usuario op ON op.id = v.id_operador_responsavel
      JOIN usuario cr ON cr.id = v.id_usuario_criador
     WHERE 1 = 1`;
  const params = [];

  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  if (endereco) {
    sql += ' AND v.endereco LIKE ?';
    params.push(`%${endereco}%`);
  }
  if (idResponsavel) {
    sql += ' AND v.id_operador_responsavel = ?';
    params.push(idResponsavel);
  }
  if (dataInicio) {
    sql += ' AND DATE(v.data_criacao) >= ?';
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ' AND DATE(v.data_criacao) <= ?';
    params.push(dataFim);
  }

  const [vistorias] = await db.query(`${sql} ORDER BY v.data_criacao DESC`, params);
  res.json(vistorias);
}

// GET /api/vistorias/:id  -> vistoria + fotos + ocorrências
async function buscarPorId(req, res) {
  const [linhas] = await db.query(
    `SELECT v.*, op.nome AS nome_responsavel, cr.nome AS nome_criador
       FROM vistoria v
       JOIN usuario op ON op.id = v.id_operador_responsavel
       JOIN usuario cr ON cr.id = v.id_usuario_criador
      WHERE v.id = ?`,
    [req.params.id]
  );
  const vistoria = linhas[0];
  if (!vistoria) return res.status(404).json({ erro: 'Vistoria não encontrada.' });

  const [fotos] = await db.query(
    'SELECT id, url_foto, data_criacao FROM foto_vistoria WHERE id_vistoria = ? ORDER BY id',
    [vistoria.id]
  );
  const [ocorrencias] = await db.query(
    `SELECT o.id, o.classificacao, o.descricao, o.data_criacao, u.nome AS nome_criador
       FROM ocorrencia o
       JOIN usuario u ON u.id = o.id_usuario_criador
      WHERE o.id_vistoria = ?
      ORDER BY o.data_criacao DESC`,
    [vistoria.id]
  );

  res.json({ ...vistoria, fotos, ocorrencias });
}

// POST /api/vistorias  (multipart/form-data)
// campos: descricao, endereco, idOperadorResponsavel, fotos (arquivos)
async function criar(req, res) {
  const { descricao, endereco, idOperadorResponsavel } = req.body || {};
  const urls = urlsDasFotos(req);

  if (!descricao || !endereco || !idOperadorResponsavel) {
    removerArquivos(urls);
    return res.status(400).json({ erro: 'Campos obrigatórios: descricao, endereco, idOperadorResponsavel.' });
  }
  if (!(await ehOperador(idOperadorResponsavel))) {
    removerArquivos(urls);
    return res.status(400).json({ erro: 'O responsável informado não é um operador válido.' });
  }

  const [resultado] = await db.query(
    `INSERT INTO vistoria (id_usuario_criador, id_operador_responsavel, descricao, endereco)
     VALUES (?, ?, ?, ?)`,
    [req.usuario.id, idOperadorResponsavel, descricao, endereco]
  );
  await salvarFotos(resultado.insertId, urls);

  res.status(201).json({ id: resultado.insertId, mensagem: 'Vistoria cadastrada com sucesso.', fotos: urls });
}

// PUT /api/vistorias/:id  { descricao, endereco, idOperadorResponsavel, status }
async function atualizar(req, res) {
  const { descricao, endereco, idOperadorResponsavel, status } = req.body || {};

  if (!descricao || !endereco || !idOperadorResponsavel || !status) {
    return res.status(400).json({ erro: 'Campos obrigatórios: descricao, endereco, idOperadorResponsavel, status.' });
  }
  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}.` });
  }
  if (!(await ehOperador(idOperadorResponsavel))) {
    return res.status(400).json({ erro: 'O responsável informado não é um operador válido.' });
  }

  const [resultado] = await db.query(
    `UPDATE vistoria
        SET descricao = ?, endereco = ?, id_operador_responsavel = ?, status = ?
      WHERE id = ?`,
    [descricao, endereco, idOperadorResponsavel, status, req.params.id]
  );
  if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Vistoria não encontrada.' });
  res.json({ mensagem: 'Vistoria atualizada com sucesso.' });
}

// DELETE /api/vistorias/:id  (apaga também fotos e ocorrências - ON DELETE CASCADE)
async function excluir(req, res) {
  // Guarda as URLs das fotos antes de excluir para apagar os arquivos do disco
  const [fotosVistoria] = await db.query('SELECT url_foto FROM foto_vistoria WHERE id_vistoria = ?', [req.params.id]);
  const [fotosOcorrencias] = await db.query(
    `SELECT fo.url_foto FROM foto_ocorrencia fo
       JOIN ocorrencia o ON o.id = fo.id_ocorrencia
      WHERE o.id_vistoria = ?`,
    [req.params.id]
  );

  const [resultado] = await db.query('DELETE FROM vistoria WHERE id = ?', [req.params.id]);
  if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Vistoria não encontrada.' });

  removerArquivos([...fotosVistoria, ...fotosOcorrencias].map((f) => f.url_foto));
  res.json({ mensagem: 'Vistoria excluída com sucesso.' });
}

// POST /api/vistorias/:id/fotos  (multipart/form-data, campo "fotos")
async function adicionarFotos(req, res) {
  const urls = urlsDasFotos(req);
  if (urls.length === 0) return res.status(400).json({ erro: 'Envie pelo menos uma foto no campo "fotos".' });

  const [linhas] = await db.query('SELECT id FROM vistoria WHERE id = ?', [req.params.id]);
  if (!linhas[0]) {
    removerArquivos(urls);
    return res.status(404).json({ erro: 'Vistoria não encontrada.' });
  }

  await salvarFotos(req.params.id, urls);
  res.status(201).json({ mensagem: 'Fotos adicionadas com sucesso.', fotos: urls });
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, adicionarFotos };
