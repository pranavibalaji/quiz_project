const Quiz = require("../models/Quiz");
const generateQR = require("../utils/generateQR");

// ✅ CREATE QUIZ + QR
exports.createQuiz = async (req, res) => {
  try {
    const { title, timePerQuestion, questions } = req.body;

    const quiz = await Quiz.create({
      title,
      timePerQuestion,
      questions,
    });

    const quizLink = `${process.env.CLIENT_URL}/join/${quiz._id}`;
    const qrCode = await generateQR(quizLink);

    quiz.quizLink = quizLink;
    quiz.qrCode = qrCode;

    await quiz.save();

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET LATEST QUIZ
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne().sort({ createdAt: -1 });

    if (!quiz) {
      return res.status(404).json({ message: "No quiz found" });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET QUIZ BY ID (FOR QR)
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};