require('dotenv').config({ quiet: true });

const express = require('express');
const path = require('path');
const rotas = require('./routes');
const tratarErros = require('./middlewares/erros');

const app = express();

app.use(express.json());

// Frontend (HTML/CSS/JS/Bootstrap) servido pela pasta /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fotos enviadas ficam acessíveis em /uploads/<arquivo>
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API REST
app.use('/api', rotas);
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.use(tratarErros);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vistoria Informatizada rodando em http://localhost:${PORT}`);
});
