import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST,
  DB_PORT = 3306,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  MYSQLHOST,
  MYSQLPORT,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE,
} = process.env;

const host = DB_HOST || MYSQLHOST;
const port = Number(MYSQLPORT || DB_PORT || 3306);
const user = DB_USER || MYSQLUSER;
const password = DB_PASSWORD || MYSQLPASSWORD;
const database = DB_NAME || MYSQLDATABASE;

if (!host || !user || !database) {
  console.warn('[DB] Missing DB env vars; set DB_HOST/DB_USER/DB_NAME (or Railway MYSQLHOST/MYSQLUSER/MYSQLDATABASE)');
}

export const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt 
     FROM information_schema.columns 
     WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
    [database, table, column]
  );
  return rows[0]?.cnt > 0;
}

async function ensureColumn(table, column, ddl) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

export async function migrate() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      verification_code VARCHAR(10),
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      is_admin TINYINT(1) NOT NULL DEFAULT 0,
      code_expires_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(createSql);

  // Backfill columns on older MySQL versions that lack ADD COLUMN IF NOT EXISTS
  await ensureColumn('users', 'verification_code', 'verification_code VARCHAR(10)');
  await ensureColumn('users', 'is_verified', 'is_verified TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('users', 'is_admin', 'is_admin TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('users', 'code_expires_at', 'code_expires_at DATETIME NULL');
}
