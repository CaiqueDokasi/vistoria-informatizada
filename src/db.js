// Conexão com o banco de dados MySQL.
// Ajuste "user" e "password" de acordo com o MySQL instalado na sua máquina.
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'vistoria_informatizada',
  dateStrings: true // devolve as datas como texto: "2026-11-22 10:30:00"
});

module.exports = db;
