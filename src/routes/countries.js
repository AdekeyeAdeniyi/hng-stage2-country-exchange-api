const express = require("express");
const router = express.Router();
const controller = require("../controllers/countriesController");

router.post("/refresh", controller.refresh);
router.get("/image", controller.image);
router.get("/", controller.list);
router.get("/:name", controller.getByName);
router.delete("/:name", controller.deleteByName);

module.exports = router;
