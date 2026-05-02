const express = require("express");
const router = express.Router();

const {
  getResults,
  getResultById,
} = require("../controllers/resultController");

router.get("/", getResults);
router.get("/:id", getResultById);

module.exports = router;