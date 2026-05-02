const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    quizTitle: {
      type: String,
      required: true,
    },

    participants: [
      {
        name: String,
        score: Number,
        isHost: Boolean,
      },
    ],

    winner: {
      name: String,
      score: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", resultSchema);