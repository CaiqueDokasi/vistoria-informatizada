// Arquivo principal: é ele que inicia o servidor (npm start)
const express = require('express');

const app = express();

// Permite que o servidor leia dados em JSON enviados pelo frontend
app.use(express.json());

// Entrega os arquivos do frontend (HTML, CSS, JS) que ficam na pasta "public"
app.use(express.static('public'));

// Rotas da API: cada arquivo cuida de um assunto
app.use('/api', require('./rotas/login'));
app.use('/api', require('./rotas/usuarios'));
app.use('/api', require('./rotas/vistorias'));
app.use('/api', require('./rotas/ocorrencias'));

// Se ocorrer um erro inesperado (ex.: banco desligado ou e-mail repetido),
// devolve JSON em vez de uma página HTML de erro
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ erro: 'Erro no servidor: ' + err.message });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
