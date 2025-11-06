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

// Buscar produto na réplica
async function selectProdutoById(id) {
  const conn = await mysql.createConnection(REPLICA_DB_CONFIG);
  const [rows] = await conn.execute(
    'SELECT * FROM produto WHERE id = ?',
    [id]
  );
  await conn.end();
  return rows[0];
}

// Loop de inserts e selects
async function main() {
  let produtoCount = 1;

  while (true) {
    const descricao = `Produto-${produtoCount}`;
    const categoria = produtoCount % 2 === 0 ? 'ELETRO' : 'MOVEIS';
    const valor = Math.floor(Math.random() * 5000) + 100;

    try {
      // Inserir no primário
      const insertId = await insertProduto(descricao, categoria, valor);
      console.log(`INSERIDO no Primário: ID = ${insertId}, descricao = ${descricao}, categoria = ${categoria}, valor = ${valor}`);

      // Consultar 10 IDs anteriores na réplica
      for (let i = insertId - 1; i >= insertId - 10 && i > 0; i--) {
        const produto = await selectProdutoById(i);
        if (produto) {
          console.log(`LEITURA do Replica: ID = ${produto.id}, descricao = ${produto.descricao}, categoria = ${produto.categoria}, valor=${produto.valor}`);
        } else {
          console.log(`LEITURA do replica: ID=${i} Não encontrado`);
        }
      }
    } catch (err) {
      console.error('Error:', err.message);
    }

    produtoCount++;
    await new Promise(res => setTimeout(res, 1000)); // espera 1 segundo
  }
}

main();