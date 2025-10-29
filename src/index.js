require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const countriesRouter = require("./routes/countries");
const { initDatabase } = require("./initDb");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/countries", countriesRouter);

app.get("/status", require("./controllers/countriesController").status);

app.get("/", (req, res) => res.json({ message: "Country Currency & Exchange API" }));

const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, "..", "cache");
app.use("/cache", express.static(CACHE_DIR));

const PORT = process.env.PORT || 3000;

// Initialize database schema before starting server
// initDatabase();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
