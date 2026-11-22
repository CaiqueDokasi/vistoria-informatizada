// Conexão com o MySQL usando um "pool" (várias conexões reaproveitáveis)
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vistoria_informatizada',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // devolve datas como texto "AAAA-MM-DD HH:MM:SS"
});

module.exports = db;
