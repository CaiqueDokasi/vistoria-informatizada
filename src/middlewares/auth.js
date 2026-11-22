const jwt = require('jsonwebtoken');

// Verifica se a requisição tem um token JWT válido no cabeçalho:
// Authorization: Bearer <token>
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Token não informado. Faça login.' });
  }

  try {
    // O token guarda: id, nome, cargo e permissoes do usuário
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

// Verifica se o usuário logado possui a permissão exigida pela rota.
// Uso: router.post('/vistorias', autenticar, exigirPermissao('GERENCIAR_VISTORIAS'), ...)
function exigirPermissao(permissao) {
  return (req, res, next) => {
    const permissoes = req.usuario?.permissoes || [];
    if (!permissoes.includes(permissao)) {
      return res.status(403).json({ erro: `Acesso negado. Permissão necessária: ${permissao}` });
    }
    next();
  };
}

module.exports = { autenticar, exigirPermissao };
