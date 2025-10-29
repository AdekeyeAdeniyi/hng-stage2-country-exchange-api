const fetch = require("node-fetch");
const db = require("../config/db");

const COUNTRIES_API = "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies";
const EXCHANGE_API = "https://open.er-api.com/v6/latest/USD";

const randMultiplier = () => Math.floor(Math.random() * 1001) + 1000;

const fetchAndCacheAll = async () => {
  // Fetch both APIs in parallel
  let countriesResp, exchangeResp;

  try {
    [countriesResp, exchangeResp] = await Promise.all([fetch(COUNTRIES_API), fetch(EXCHANGE_API)]);

    if (!countriesResp.ok) throw new Error("Countries API error");
    if (!exchangeResp.ok) throw new Error("Exchange API error");
  } catch (err) {
    return {
      ok: false,
      message: err.message.includes("Countries") ? "Could not fetch data from Countries API" : "Could not fetch data from Exchange Rates API",
    };
  }

  const [countries, exchange] = await Promise.all([countriesResp.json(), exchangeResp.json()]);

  const rates = exchange?.rates || {};
  const now = new Date().toISOString();
  const toUpsert = [];

  for (const c of countries) {
    const { name, capital, region, population, flag, currencies } = c;

    // Skip if missing required fields
    if (!name || typeof population !== "number") continue;

    const currency_code = currencies?.[0]?.code || null;
    let exchange_rate = null;
    let estimated_gdp = null;

    if (!currency_code) {
      estimated_gdp = 0;
    } else if (rates[currency_code]) {
      exchange_rate = rates[currency_code];
      estimated_gdp = (population * randMultiplier()) / exchange_rate;
    }

    toUpsert.push({
      name,
      capital: capital || null,
      region: region || null,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url: flag || null,
      last_refreshed_at: now,
    });
  }

  if (toUpsert.length === 0) {
    return { ok: true, count: 0 };
  }

  // Use PostgreSQL UPSERT (ON CONFLICT) for efficiency
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Build batch upsert query
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (let i = 0; i < toUpsert.length; i++) {
      const row = toUpsert[i];
      const rowPlaceholders = [];

      for (let j = 0; j < 9; j++) {
        rowPlaceholders.push(`$${paramIndex++}`);
      }

      placeholders.push(`(${rowPlaceholders.join(", ")})`);
      values.push(row.name, row.capital, row.region, row.population, row.currency_code, row.exchange_rate, row.estimated_gdp, row.flag_url, row.last_refreshed_at);
    }

    const upsertQuery = `
      INSERT INTO countries (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (name) 
      DO UPDATE SET 
        capital = EXCLUDED.capital,
        region = EXCLUDED.region,
        population = EXCLUDED.population,
        currency_code = EXCLUDED.currency_code,
        exchange_rate = EXCLUDED.exchange_rate,
        estimated_gdp = EXCLUDED.estimated_gdp,
        flag_url = EXCLUDED.flag_url,
        last_refreshed_at = EXCLUDED.last_refreshed_at
    `;

    await client.query(upsertQuery, values);
    await client.query("COMMIT");

    return { ok: true, count: toUpsert.length };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database upsert failed:", error.message);
    return { ok: false, message: "Could not save data to database" };
  } finally {
    client.release();
  }
};

module.exports = { fetchAndCacheAll };
