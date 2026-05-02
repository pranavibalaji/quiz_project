const Quiz = require("../models/Quiz");
const Result = require("../models/Result");
const rooms = {};

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinQuizRoom", ({ quizId, name, totalQuestions, timePerQuestion }) => {
      socket.join(quizId);

      if (!rooms[quizId]) {
        rooms[quizId] = {
          players: [],
          host: socket.id,
          currentQuestion: 0,
          totalQuestions,
          timePerQuestion,
          timer: null,
          countdownTimer: null,
          timeLeft: timePerQuestion,
          started: false,
          finished: false,
        };
      }

      const room = rooms[quizId];

      if (!room.players.find((p) => p.socketId === socket.id)) {
        room.players.push({
          socketId: socket.id,
          name,
          score: 0,
          answered: false,
          isHost: socket.id === room.host,
        });
      }

      io.to(quizId).emit("lobbyUpdate", room.players);
      io.to(quizId).emit("leaderboardUpdate", room.players);

      socket.emit("hostInfo", {
        isHost: socket.id === room.host,
      });

      socket.emit("syncQuestion", {
        currentQuestion: room.currentQuestion,
        timeLeft: room.timeLeft,
        started: room.started,
      });
    });

    socket.on("startQuiz", ({ quizId }) => {
      const room = rooms[quizId];
      if (!room || room.started) return;

      if (socket.id !== room.host) {
        socket.emit("notHost", {
          message: "Only host can start the quiz",
        });
        return;
      }

      room.started = true;
      room.finished = false;
      room.currentQuestion = 0;

      room.players.forEach((p) => {
        p.score = 0;
        p.answered = false;
      });

      io.to(quizId).emit("leaderboardUpdate", room.players);

      startCountdown(io, quizId);
    });

    socket.on("submitAnswer", ({ quizId, points }) => {
      const room = rooms[quizId];
      if (!room || room.finished) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player || player.answered) return;

      player.score += Number(points) || 0;
      player.answered = true;

      room.players.sort((a, b) => b.score - a.score);
      io.to(quizId).emit("leaderboardUpdate", room.players);
    });

    socket.on("resetQuizRoom", ({ quizId }) => {
      const room = rooms[quizId];
      if (!room) return;

      clearInterval(room.timer);
      clearInterval(room.countdownTimer);

      room.currentQuestion = 0;
      room.timeLeft = room.timePerQuestion;
      room.started = false;
      room.finished = false;

      room.players = room.players.map((p) => ({
        ...p,
        score: 0,
        answered: false,
        isHost: p.socketId === room.host,
      }));

      io.to(quizId).emit("lobbyUpdate", room.players);
      io.to(quizId).emit("leaderboardUpdate", room.players);

      io.to(quizId).emit("syncQuestion", {
        currentQuestion: 0,
        timeLeft: room.timePerQuestion,
        started: false,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);

      for (const quizId in rooms) {
        const room = rooms[quizId];

        room.players = room.players.filter(
          (p) => p.socketId !== socket.id
        );

        if (room.host === socket.id && room.players.length > 0) {
          room.host = room.players[0].socketId;

          room.players = room.players.map((p) => ({
            ...p,
            isHost: p.socketId === room.host,
          }));

          io.to(room.host).emit("hostInfo", {
            isHost: true,
          });
        }

        io.to(quizId).emit("lobbyUpdate", room.players);
        io.to(quizId).emit("leaderboardUpdate", room.players);

        if (room.players.length === 0) {
          clearInterval(room.timer);
          clearInterval(room.countdownTimer);
          delete rooms[quizId];
        }
      }
    });
  });
};

function startCountdown(io, quizId) {
  const room = rooms[quizId];
  if (!room) return;

  clearInterval(room.countdownTimer);

  let count = 3;

  io.to(quizId).emit("countdown", { count });

  room.countdownTimer = setInterval(() => {
    count -= 1;

    if (count > 0) {
      io.to(quizId).emit("countdown", { count });
    } else {
      clearInterval(room.countdownTimer);
      io.to(quizId).emit("countdown", { count: "GO!" });

      setTimeout(() => {
        io.to(quizId).emit("countdown", { count: null });
        startQuestionTimer(io, quizId);
      }, 700);
    }
  }, 1000);
}

function startQuestionTimer(io, quizId) {
  const room = rooms[quizId];
  if (!room) return;

  clearInterval(room.timer);

  room.timeLeft = room.timePerQuestion;
  room.players.forEach((p) => (p.answered = false));

  io.to(quizId).emit("syncQuestion", {
    currentQuestion: room.currentQuestion,
    timeLeft: room.timeLeft,
    started: true,
  });

  room.timer = setInterval(() => {
    room.timeLeft -= 1;

    io.to(quizId).emit("timerUpdate", {
      timeLeft: room.timeLeft,
    });

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);

      io.to(quizId).emit("showLeaderboard", {
        leaderboard: room.players,
      });

      setTimeout(() => {
        room.currentQuestion += 1;

        if (room.currentQuestion >= room.totalQuestions) {
          room.finished = true;
          room.started = false;

          saveQuizResult(quizId, room.players);

          io.to(quizId).emit("quizFinished", {
            leaderboard: room.players,
          });

          return;
        }

        startCountdown(io, quizId);
      }, 3000);
    }
  }, 1000);
}
async function saveQuizResult(quizId, players) {
  try {
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      console.log("Quiz not found, result not saved");
      return;
    }

    const cleanedParticipants = players.map((p) => ({
      name: p.name,
      score: p.score,
      isHost: p.isHost || false,
    }));

    const sorted = [...cleanedParticipants].sort((a, b) => b.score - a.score);
    const winner = sorted[0] || { name: "No winner", score: 0 };

    await Result.create({
      quizId,
      quizTitle: quiz.title,
      participants: sorted,
      winner: {
        name: winner.name,
        score: winner.score,
      },
    });

    console.log("Quiz result saved ✅");
  } catch (err) {
    console.error("Error saving result:", err.message);
  }
}

module.exports = initSocket;