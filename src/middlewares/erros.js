const multer = require('multer');

// Middleware central de erros: transforma erros comuns em respostas amigáveis
// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const mensagens = {
      LIMIT_FILE_SIZE: 'Foto muito grande (máximo 5 MB).',
      LIMIT_FILE_COUNT: 'Envie no máximo 5 fotos.',
      LIMIT_UNEXPECTED_FILE: 'Campo de arquivo inválido. Use o campo "fotos" (máximo 5 fotos).'
    };
    return res.status(400).json({ erro: mensagens[err.code] || err.message });
  }

  // JSON mal formatado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Erros lançados pelo próprio sistema com status definido (ex.: arquivo não é imagem)
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ erro: err.message });
  }

  // Erros do MySQL
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return res.status(409).json({ erro: 'Registro duplicado (ex.: e-mail já cadastrado).' });
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(409).json({ erro: 'Não é possível excluir: existem registros vinculados.' });
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ erro: 'Referência inválida (ex.: cargo ou usuário inexistente).' });
    case 'ECONNREFUSED':
      return res.status(500).json({ erro: 'Não foi possível conectar ao banco de dados.' });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
}

module.exports = tratarErros;
