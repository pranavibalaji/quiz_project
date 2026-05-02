const express = require("express");
const router = express.Router();

const {
  createQuiz,
  getQuiz,
  getQuizById,
} = require("../controllers/quizController");

// routes
router.post("/create", createQuiz);
router.get("/", getQuiz);
router.get("/:id", getQuizById);

module.exports = router;