// Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME no ambiente.
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database:'vistoria_informatizada',
  dateStrings: true // devolve as datas como texto: "2026-11-22 10:30:00"
});

module.exports = db;
