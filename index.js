require('dotenv').config();
const mysql = require('mysql2/promise');

const PRIMARY_DB_CONFIG = {
  host: process.env.WRITE_DB_HOST,
  port: process.env.WRITE_DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const REPLICA_DB_CONFIG = {
  host: process.env.READ_DB_HOST,
  port: process.env.READ_DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const GROUP_NAME = process.env.GROUP_NAME;

// Inserir produto no primário
async function insertProduto(descricao, categoria, valor) {
  const conn = await mysql.createConnection(PRIMARY_DB_CONFIG);
  const [result] = await conn.execute(
    'INSERT INTO produto (descricao, categoria, valor, criado_por) VALUES (?, ?, ?, ?)',
    [descricao, categoria, valor, GROUP_NAME]
  );
  await conn.end();
  return result.insertId;
}


