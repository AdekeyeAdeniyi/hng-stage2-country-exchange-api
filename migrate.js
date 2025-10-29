#!/usr/bin/env node

require("dotenv").config();
const db = require("./src/config/db");

const migrate = async () => {
  try {
    console.log("Running database migration...\n");

    // Check if UNIQUE constraint exists
    const checkConstraint = await db.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'countries' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name LIKE '%name%'
    `);

    if (checkConstraint.rows.length === 0) {
      console.log("Adding UNIQUE constraint on name column...");
      await db.query("ALTER TABLE countries ADD CONSTRAINT countries_name_key UNIQUE (name)");
      console.log("✓ UNIQUE constraint added successfully!");
    } else {
      console.log("✓ UNIQUE constraint already exists");
    }

    console.log("\n✓ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Migration failed:", error.message);
    process.exit(1);
  }
};

migrate();
