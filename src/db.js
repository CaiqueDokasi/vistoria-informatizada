// Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME no ambiente.
const mysql = require('mysql2/promise');

const porta = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error('DB_PORT deve ser um número entre 1 e 65535.');
}

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: porta,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vistoria_informatizada',
  dateStrings: true // devolve as datas como texto: "2026-11-22 10:30:00"
});

module.exports = db;
