const path = require("path");
const fs = require("fs-extra");
const db = require("../config/db");
const refreshService = require("../services/refreshService");
const imageUtil = require("../utils/image");

const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, "..", "..", "cache");
const SUMMARY_PATH = path.join(CACHE_DIR, "summary.png");

const refresh = async (req, res) => {
  try {
    const result = await refreshService.fetchAndCacheAll();

    if (!result.ok) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: result.message,
      });
    }

    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      await imageUtil.generateSummaryImage(SUMMARY_PATH);
    } catch (err) {
      console.error("Image generation failed:", err.message);
    }

    return res.json({ success: true, total: result.count });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const list = async (req, res) => {
  try {
    const { region, currency, sort } = req.query;
    const params = [];
    const conditions = ["1=1"];

    if (region) {
      conditions.push(`region = $${params.length + 1}`);
      params.push(region);
    }

    if (currency) {
      conditions.push(`currency_code = $${params.length + 1}`);
      params.push(currency);
    }

    let sql = `SELECT * FROM countries WHERE ${conditions.join(" AND ")}`;

    if (sort === "gdp_desc") {
      sql += " ORDER BY estimated_gdp DESC NULLS LAST";
    }

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error("List error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getByName = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM countries WHERE LOWER(name) = LOWER($1) LIMIT 1", [req.params.name]);

    if (!result.rows?.length) {
      return res.status(404).json({ error: "Country not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Get by name error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteByName = async (req, res) => {
  try {
    const result = await db.query("DELETE FROM countries WHERE LOWER(name) = LOWER($1) RETURNING id", [req.params.name]);

    if (!result.rows?.length) {
      return res.status(404).json({ error: "Country not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const status = async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) as total, MAX(last_refreshed_at) as last FROM countries");

    return res.json({
      total_countries: parseInt(result.rows[0].total) || 0,
      last_refreshed_at: result.rows[0].last,
    });
  } catch (err) {
    console.error("Status error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const image = async (req, res) => {
  try {
    if (!fs.existsSync(SUMMARY_PATH)) {
      return res.status(404).json({ error: "Summary image not found" });
    }
    return res.sendFile(SUMMARY_PATH);
  } catch (err) {
    console.error("Image error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { refresh, list, getByName, deleteByName, status, image };
