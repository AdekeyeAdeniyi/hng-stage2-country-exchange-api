const db = require("./config/db");

const initDatabase = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS countries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      capital VARCHAR(255),
      region VARCHAR(255),
      population BIGINT NOT NULL,
      currency_code VARCHAR(10),
      exchange_rate DOUBLE PRECISION,
      estimated_gdp DOUBLE PRECISION,
      flag_url TEXT,
      last_refreshed_at TIMESTAMP
    );
  `;

  const createIndexesSQL = [
    "CREATE INDEX IF NOT EXISTS idx_region ON countries(region);",
    "CREATE INDEX IF NOT EXISTS idx_currency ON countries(currency_code);",
    "CREATE INDEX IF NOT EXISTS idx_gdp ON countries(estimated_gdp);",
  ];

  try {
    console.log("Initializing database schema...");

    // Create table
    await db.query(createTableSQL);
    console.log("✓ Countries table created/verified");

    // Create indexes
    for (const indexSQL of createIndexesSQL) {
      await db.query(indexSQL);
    }
    console.log("✓ Indexes created/verified");

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error.message);
    throw error;
  }
};

module.exports = { initDatabase };
