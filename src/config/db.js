const { Pool } = require("pg");
const fs = require("fs-extra");

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./ca.pem").toString(),
  },
});

// Test connection on startup
pool
  .connect()
  .then((client) => {
    console.log("Connected to Aiven PostgreSQL!");
    return client.query("SELECT VERSION()");
  })
  .then((result) => {
    console.log("Database version:", result.rows[0].version);
  })
  .catch((err) => {
    console.error("Error connecting to Aiven PostgreSQL:", err.message);
  });

module.exports = pool;
