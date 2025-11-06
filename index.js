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

const GROUP_NAME = process.env.GROUP_NAME || 'GrupoA';

// Função utilitária para delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Buscar último ID no banco primário
async function getLastId() {
  const conn = await mysql.createConnection(PRIMARY_DB_CONFIG);
  const [rows] = await conn.execute('SELECT MAX(id) AS lastId FROM produto');
  await conn.end();
  return rows[0].lastId || 0;
}

// Inserir produto no primário (com verificação de duplicidade)
async function insertProduto(descricao, categoria, valor) {
  const conn = await mysql.createConnection(PRIMARY_DB_CONFIG);
  try {
    const [result] = await conn.execute(
      'INSERT INTO produto (descricao, categoria, valor, criado_por) VALUES (?, ?, ?, ?)',
      [descricao, categoria, valor, GROUP_NAME]
    );
    return result.insertId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log(`⚠️ Produto duplicado (${descricao}), pulando insert...`);
      return null;
    }
    throw err;
  } finally {
    await conn.end();
  }
}

// Buscar 10 últimos produtos na réplica
async function selectLast10Produtos() {
  const conn = await mysql.createConnection(REPLICA_DB_CONFIG);
  const [rows] = await conn.execute(
    'SELECT * FROM produto ORDER BY id DESC LIMIT 10'
  );
  await conn.end();
  return rows;
}

// Loop principal
async function main() {
  let produtoCount = (await getLastId()) + 1;

  console.log(`🚀 Iniciando inserções a partir do ID ${produtoCount}...`);

  while (true) {
    const descricao = `Produto-${produtoCount}`;
    const categoria = produtoCount % 2 === 0 ? 'ELETRO' : 'MOVEIS';
    const valor = Math.floor(Math.random() * 5000) + 100;

    try {
      const insertId = await insertProduto(descricao, categoria, valor);
      if (insertId) {
        console.log(
          `🟢 INSERIDO no Primário → ID=${insertId}, Descrição=${descricao}, Categoria=${categoria}, Valor=${valor}`
        );

        // Aguardar propagação
        await delay(1000);

        const produtos = await selectLast10Produtos();
        console.log('📘 Últimos 10 produtos na réplica:');

        // Leitura com intervalo entre linhas
        for (const p of produtos) {
          console.log(
            `  → ID=${p.id}, ${p.descricao}, ${p.categoria}, Valor=${p.valor}`
          );
          await delay(1000); // pausa 1 segundo entre as linhas
        }
      }
    } catch (err) {
      console.error('❌ Erro:', err.message);
    }

    produtoCount++;
    await delay(1000); // intervalo entre inserções
  }
}

main();
