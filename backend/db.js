// db.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Supabase project settings
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;