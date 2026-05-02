import { useState, useEffect, useMemo } from "react";
import QuestionCard from "../components/QuestionCard";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import socket from "../services/socket";

import tickSound from "../assets/sounds/tick.mp3";
import beepSound from "../assets/sounds/beep.mp3";
import bonusSound from "../assets/sounds/bonus.mp3";

export default function QuizRoom() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState("");
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timePerQuestion, setTimePerQuestion] = useState(10);
  const [score, setScore] = useState(Number(localStorage.getItem("score")) || 0);

  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [started, setStarted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusValue, setBonusValue] = useState(0);

  const tickAudio = useMemo(() => new Audio(tickSound), []);
  const beepAudio = useMemo(() => new Audio(beepSound), []);
  const bonusAudio = useMemo(() => new Audio(bonusSound), []);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const storedQuizId = localStorage.getItem("quizId");

        const res = storedQuizId
          ? await API.get(`/quiz/${storedQuizId}`)
          : await API.get("/quiz");

        const quiz = res.data;
        const finalQuizId = storedQuizId || quiz._id;
        const name = localStorage.getItem("name") || "Guest";

        setQuizId(finalQuizId);
        setQuestions(quiz.questions || []);
        setTimePerQuestion(quiz.timePerQuestion || 10);

        localStorage.setItem("quizId", finalQuizId);

        socket.emit("joinQuizRoom", {
          quizId: finalQuizId,
          name,
          totalQuestions: quiz.questions.length,
          timePerQuestion: quiz.timePerQuestion || 10,
        });
      } catch (err) {
        console.error("Error fetching quiz:", err);
      }
    };

    fetchQuiz();

    socket.on("lobbyUpdate", setPlayers);
    socket.on("hostInfo", ({ isHost }) => setIsHost(isHost));

    socket.on("syncQuestion", ({ currentQuestion, timeLeft, started }) => {
      setIndex(currentQuestion);
      setTimeLeft(timeLeft);
      setStarted(started);
      setAnswered(false);
      setShowBoard(false);
      setCountdown(null);
      setShowBonus(false);
    });

    socket.on("timerUpdate", ({ timeLeft }) => setTimeLeft(timeLeft));

    socket.on("leaderboardUpdate", (data) => {
      setLeaderboard(data);
      localStorage.setItem("liveLeaderboard", JSON.stringify(data));
    });

    socket.on("showLeaderboard", ({ leaderboard }) => {
      setLeaderboard(leaderboard);
      setShowBoard(true);
      localStorage.setItem("liveLeaderboard", JSON.stringify(leaderboard));
    });

    socket.on("countdown", ({ count }) => setCountdown(count));

    socket.on("quizFinished", ({ leaderboard }) => {
      localStorage.setItem("liveLeaderboard", JSON.stringify(leaderboard));
      localStorage.setItem("isFinished", "true");
      navigate("/leaderboard");
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("hostInfo");
      socket.off("syncQuestion");
      socket.off("timerUpdate");
      socket.off("leaderboardUpdate");
      socket.off("showLeaderboard");
      socket.off("countdown");
      socket.off("quizFinished");
    };
  }, [navigate]);

  useEffect(() => {
    if (countdown && countdown !== "GO!") {
      beepAudio.currentTime = 0;
      beepAudio.play().catch(() => {});

      setTimeout(() => {
        beepAudio.pause();
        beepAudio.currentTime = 0;
      }, 300);
    }
  }, [countdown, beepAudio]);

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && started && !showBoard && !countdown) {
      tickAudio.currentTime = 0;
      tickAudio.play().catch(() => {});

      setTimeout(() => {
        tickAudio.pause();
        tickAudio.currentTime = 0;
      }, 120);
    }
  }, [timeLeft, started, showBoard, countdown, tickAudio]);

  const startQuiz = () => {
    socket.emit("startQuiz", { quizId });
  };

  const playShortBonusSound = () => {
    bonusAudio.currentTime = 0;
    bonusAudio.volume = 0.5;
    bonusAudio.play().catch(() => {});

    setTimeout(() => {
      bonusAudio.pause();
      bonusAudio.currentTime = 0;
    }, 350);
  };

  const handleAnswer = (selected) => {
    if (answered || !questions[index]) return;

    setAnswered(true);

    let points = 0;
    let newScore = score;

    if (selected === questions[index].answer) {
      const bonus = timeLeft;
      points = 10 + bonus;
      newScore = score + points;

      setScore(newScore);
      setBonusValue(points);
      setShowBonus(true);

      if (bonus >= timePerQuestion / 2) {
        playShortBonusSound();
      }

      setTimeout(() => setShowBonus(false), 700);

      localStorage.setItem("score", newScore);
      localStorage.setItem("lastPoints", points);
      localStorage.setItem("lastBonus", bonus);
    } else {
      localStorage.setItem("lastPoints", 0);
      localStorage.setItem("lastBonus", 0);
    }

    socket.emit("submitAnswer", {
      quizId,
      points,
    });
  };

  if (questions.length === 0) {
    return <h3 className="text-center mt-5">Loading...</h3>;
  }

  return (
    <div className="page-wrap quiz-room-wrap">
      {showBonus && <div className="bonus-pop">+{bonusValue}</div>}

      <div className="quiz-shell">
        {/* MAIN QUIZ CARD */}
        <div className="glass-card text-center quiz-play-card">
          <h1 className="gradient-title mb-2">Live Quiz Battle ⚡</h1>

          {countdown && (
            <div className="glass-card text-center mt-3 countdown-card">
              <h1 className="gradient-title countdown-text">{countdown}</h1>
            </div>
          )}

          {!started ? (
            <>
              <h4>Waiting Room 🎮</h4>

              <div className="glass-card mt-3">
                {players.length === 0 ? (
                  <p className="text-muted">Waiting for players...</p>
                ) : (
                  players.map((p) => (
                    <div
                      key={p.socketId}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <span className={p.isHost ? "host-glow" : ""}>
                        {p.name} {p.isHost && "👑"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {isHost ? (
                <button className="primary-action mt-3" onClick={startQuiz}>
                  Start Quiz 🚀
                </button>
              ) : (
                <p className="text-muted mt-3">Waiting for host...</p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted fw-semibold mb-2">
                Question {index + 1} / {questions.length}
              </p>

              <div className="timer-pill">⏱ {timeLeft}s</div>

              {started && !showBoard && !countdown && questions[index] && (
                <QuestionCard
                  question={questions[index]}
                  onAnswer={handleAnswer}
                  disabled={answered}
                />
              )}

              {answered && !showBoard && !countdown && (
                <p className="text-center text-muted mt-3">
                  Answer submitted. Waiting for next question...
                </p>
              )}

              <div className="row mt-3">
                <div className="col-md-4 col-12 mb-2">
                  <div className="stat-box">
                    <small>Score</small>
                    <h4>{score}</h4>
                  </div>
                </div>

                <div className="col-md-4 col-12 mb-2">
                  <div className="stat-box">
                    <small>Possible Bonus</small>
                    <h4>+{timeLeft}</h4>
                  </div>
                </div>

                <div className="col-md-4 col-12 mb-2">
                  <div className="stat-box">
                    <small>Time</small>
                    <h4>{timePerQuestion}s</h4>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* LIVE PLAYERS CARD - OUTSIDE MAIN QUIZ CARD */}
        <div className="glass-card mt-3 text-start live-players-card">
          <h4 className="gradient-title text-center">Live Players</h4>

          {leaderboard.length === 0 ? (
            <p className="text-muted text-center">Waiting for scores...</p>
          ) : (
            leaderboard.map((p, i) => {
              let bg = "rgba(255,255,255,0.05)";
              if (i === 0) bg = "rgba(255,215,0,0.28)";
              else if (i === 1) bg = "rgba(192,192,192,0.22)";
              else if (i === 2) bg = "rgba(205,127,50,0.22)";

              return (
                <div
                  key={p.socketId}
                  className="rank-row d-flex justify-content-between align-items-center mb-2"
                  style={{
                    background: bg,
                    padding: "10px 14px",
                    borderRadius: "12px",
                  }}
                >
                  <span>
                    {i === 0 && "🥇 "}
                    {i === 1 && "🥈 "}
                    {i === 2 && "🥉 "}
                    #{i + 1} {p.name} {p.isHost && "👑"}
                  </span>
                  <strong>{p.score}</strong>
                </div>
              );
            })
          )}
        </div>

        {showBoard && (
          <div className="glass-card mt-4 text-center">
            <h3 className="gradient-title">Round Leaderboard</h3>

            {leaderboard.map((p, i) => (
              <div
                key={p.socketId}
                className="rank-row d-flex justify-content-between align-items-center mb-2"
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background:
                    i === 0
                      ? "rgba(255,215,0,0.28)"
                      : "rgba(255,255,255,0.05)",
                }}
              >
                <span>
                  {i === 0 && "🥇 "}
                  #{i + 1} {p.name}
                </span>
                <strong>{p.score}</strong>
              </div>
            ))}

            <p className="text-muted mt-3">Next question starting...</p>
          </div>
        )}
      </div>
    </div>
  );
}