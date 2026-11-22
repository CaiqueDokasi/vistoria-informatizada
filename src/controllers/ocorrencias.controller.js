const db = require('../config/db');
const { urlsDasFotos, removerArquivos } = require('../middlewares/upload');

const CLASSIFICACOES_VALIDAS = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

const SELECT_OCORRENCIA = `
  SELECT o.id, o.id_vistoria, v.endereco, o.classificacao, o.descricao, o.data_criacao,
         o.id_usuario_criador, u.nome AS nome_criador
    FROM ocorrencia o
    JOIN vistoria v ON v.id = o.id_vistoria
    JOIN usuario u ON u.id = o.id_usuario_criador`;

// Busca uma ocorrência e verifica se o usuário logado é quem a criou
async function buscarOcorrenciaDoUsuario(req, res) {
  const [linhas] = await db.query('SELECT * FROM ocorrencia WHERE id = ?', [req.params.id]);
  const ocorrencia = linhas[0];
  if (!ocorrencia) {
    res.status(404).json({ erro: 'Ocorrência não encontrada.' });
    return null;
  }
  if (ocorrencia.id_usuario_criador !== req.usuario.id) {
    res.status(403).json({ erro: 'Apenas o operador que registrou a ocorrência pode alterá-la.' });
    return null;
  }
  return ocorrencia;
}

// GET /api/ocorrencias?idVistoria=&classificacao=&dataInicio=&dataFim=  (histórico)
async function listar(req, res) {
  const { idVistoria, classificacao, dataInicio, dataFim } = req.query;
  let sql = `${SELECT_OCORRENCIA} WHERE 1 = 1`;
  const params = [];

  if (idVistoria) {
    sql += ' AND o.id_vistoria = ?';
    params.push(idVistoria);
  }
  if (classificacao) {
    sql += ' AND o.classificacao = ?';
    params.push(classificacao);
  }
  if (dataInicio) {
    sql += ' AND DATE(o.data_criacao) >= ?';
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ' AND DATE(o.data_criacao) <= ?';
    params.push(dataFim);
  }

  const [ocorrencias] = await db.query(`${sql} ORDER BY o.data_criacao DESC`, params);
  res.json(ocorrencias);
}

// GET /api/vistorias/:id/ocorrencias
async function listarPorVistoria(req, res) {
  const [ocorrencias] = await db.query(
    `${SELECT_OCORRENCIA} WHERE o.id_vistoria = ? ORDER BY o.data_criacao DESC`,
    [req.params.id]
  );
  res.json(ocorrencias);
}

// GET /api/ocorrencias/:id  -> ocorrência + fotos
async function buscarPorId(req, res) {
  const [linhas] = await db.query(`${SELECT_OCORRENCIA} WHERE o.id = ?`, [req.params.id]);
  const ocorrencia = linhas[0];
  if (!ocorrencia) return res.status(404).json({ erro: 'Ocorrência não encontrada.' });

  const [fotos] = await db.query(
    'SELECT id, url_foto, data_criacao FROM foto_ocorrencia WHERE id_ocorrencia = ? ORDER BY id',
    [ocorrencia.id]
  );
  res.json({ ...ocorrencia, fotos });
}

// POST /api/vistorias/:id/ocorrencias  (multipart/form-data)
// campos: classificacao, descricao, fotos (arquivos)
async function criar(req, res) {
  const { classificacao, descricao } = req.body || {};
  const urls = urlsDasFotos(req);
  const falhar = (codigo, erro) => {
    removerArquivos(urls);
    return res.status(codigo).json({ erro });
  };

  if (!classificacao || !descricao) {
    return falhar(400, 'Campos obrigatórios: classificacao, descricao.');
  }
  if (!CLASSIFICACOES_VALIDAS.includes(classificacao)) {
    return falhar(400, `Classificação inválida. Use: ${CLASSIFICACOES_VALIDAS.join(', ')}.`);
  }

  const [vistorias] = await db.query('SELECT id, status FROM vistoria WHERE id = ?', [req.params.id]);
  const vistoria = vistorias[0];
  if (!vistoria) return falhar(404, 'Vistoria não encontrada.');
  if (vistoria.status === 'FINALIZADA') {
    return falhar(400, 'Não é possível registrar ocorrências em uma vistoria finalizada.');
  }

  const [resultado] = await db.query(
    'INSERT INTO ocorrencia (id_vistoria, id_usuario_criador, classificacao, descricao) VALUES (?, ?, ?, ?)',
    [vistoria.id, req.usuario.id, classificacao, descricao]
  );
  for (const url of urls) {
    await db.query('INSERT INTO foto_ocorrencia (id_ocorrencia, url_foto) VALUES (?, ?)', [resultado.insertId, url]);
  }

  // Ao receber a primeira ocorrência, a vistoria passa de ABERTA para EM_ANDAMENTO
  if (vistoria.status === 'ABERTA') {
    await db.query("UPDATE vistoria SET status = 'EM_ANDAMENTO' WHERE id = ?", [vistoria.id]);
  }

  res.status(201).json({ id: resultado.insertId, mensagem: 'Ocorrência registrada com sucesso.', fotos: urls });
}

// PUT /api/ocorrencias/:id  { classificacao, descricao }
async function atualizar(req, res) {
  const { classificacao, descricao } = req.body || {};
  if (!classificacao || !descricao) {
    return res.status(400).json({ erro: 'Campos obrigatórios: classificacao, descricao.' });
  }
  if (!CLASSIFICACOES_VALIDAS.includes(classificacao)) {
    return res.status(400).json({ erro: `Classificação inválida. Use: ${CLASSIFICACOES_VALIDAS.join(', ')}.` });
  }

  const ocorrencia = await buscarOcorrenciaDoUsuario(req, res);
  if (!ocorrencia) return;

  await db.query('UPDATE ocorrencia SET classificacao = ?, descricao = ? WHERE id = ?', [
    classificacao,
    descricao,
    ocorrencia.id
  ]);
  res.json({ mensagem: 'Ocorrência atualizada com sucesso.' });
}

// DELETE /api/ocorrencias/:id
async function excluir(req, res) {
  const ocorrencia = await buscarOcorrenciaDoUsuario(req, res);
  if (!ocorrencia) return;

  const [fotos] = await db.query('SELECT url_foto FROM foto_ocorrencia WHERE id_ocorrencia = ?', [ocorrencia.id]);
  await db.query('DELETE FROM ocorrencia WHERE id = ?', [ocorrencia.id]);
  removerArquivos(fotos.map((f) => f.url_foto));

  res.json({ mensagem: 'Ocorrência excluída com sucesso.' });
}

module.exports = { listar, listarPorVistoria, buscarPorId, criar, atualizar, excluir };
