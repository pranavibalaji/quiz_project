const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    timePerQuestion: {
      type: Number,
      required: true,
    },

    questions: [
      {
        text: String,
        options: [String],
        answer: String,
      },
    ],

    quizLink: String,
    qrCode: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);