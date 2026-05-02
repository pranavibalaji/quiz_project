import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../services/socket";
import confetti from "canvas-confetti";
import winSound from "../assets/sounds/win.mp3";

export default function Leaderboard() {
  const navigate = useNavigate();

  const [showWinner, setShowWinner] = useState(false);
  const [hideWinner, setHideWinner] = useState(false);

  const name = localStorage.getItem("name") || "Guest";
  const score = Number(localStorage.getItem("score")) || 0;
  const lastPoints = Number(localStorage.getItem("lastPoints")) || 0;
  const lastBonus = Number(localStorage.getItem("lastBonus")) || 0;
  const isFinished = localStorage.getItem("isFinished") === "true";

  const liveLeaderboard = JSON.parse(
    localStorage.getItem("liveLeaderboard") || "[]"
  );

  const topPlayer = liveLeaderboard[0];

  // 🎉 CONFETTI FUNCTION
  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#facc15", "#22d3ee", "#a78bfa", "#f472b6"];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors,
      });

      confetti({
        particleCount: 6,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // 🎯 Everyone sees winner popup, only winner hears sound
  useEffect(() => {
    if (isFinished && liveLeaderboard.length > 0) {
      fireConfetti();

      const winner = liveLeaderboard[0];

      if (winner) {
        setShowWinner(true);
        setHideWinner(false);

        // 🔊 Sound only if YOU win
        if (winner.name === name) {
          const audio = new Audio(winSound);
          audio.volume = 0.5;
          audio.play().catch(() => {});
        }

        // Start fade after 4 seconds
        const fade = setTimeout(() => {
          setHideWinner(true);
        }, 4000);

        // Remove popup after 5 seconds
        const remove = setTimeout(() => {
          setShowWinner(false);
        }, 5000);

        return () => {
          clearTimeout(fade);
          clearTimeout(remove);
        };
      }
    }
  }, []);

  const playAgain = () => {
    const quizId = localStorage.getItem("quizId");

    if (quizId) {
      socket.emit("resetQuizRoom", { quizId });
    }

    localStorage.removeItem("score");
    localStorage.removeItem("currentIndex");
    localStorage.removeItem("isFinished");
    localStorage.removeItem("lastPoints");
    localStorage.removeItem("lastBonus");
    localStorage.removeItem("liveLeaderboard");

    navigate("/");
  };

  return (
    <div className="page-wrap d-flex align-items-center justify-content-center">
      <div className="premium-board">
        <div className="board-header">
          <h1 className="gradient-title">🏆 Leaderboard</h1>
          <p>
            {isFinished
              ? "Final results are in!"
              : "Next question loading..."}
          </p>
        </div>

        {/* 🏆 WINNER POPUP - EVERYONE SEES, ONLY WINNER HEARS SOUND */}
        {showWinner && (
          <div className={`winner-popup ${hideWinner ? "hide" : ""}`}>
            <div className="winner-popup-inner">
              🏆 {topPlayer?.name || "Winner"} WON!
            </div>
          </div>
        )}

        {/* 👑 TOP PLAYER */}
        {topPlayer && (
          <div className="winner-card">
            <div className="winner-crown">👑</div>
            <small>Current Leader</small>
            <h2>{topPlayer.name}</h2>
            <h3>{topPlayer.score} pts</h3>
          </div>
        )}

        {/* 📊 SCORE */}
        <div className="score-grid">
          <div className="score-tile">
            <small>You</small>
            <h3>👤 {name}</h3>
          </div>

          <div className="score-tile">
            <small>Your Score</small>
            <h3>{score}</h3>
          </div>

          <div className="score-tile">
            <small>Last Points</small>
            <h3>+{lastPoints}</h3>
          </div>

          <div className="score-tile">
            <small>Speed Bonus</small>
            <h3>⚡ +{lastBonus}</h3>
          </div>
        </div>

        {/* 🌍 RANKING */}
        <div className="ranking-list">
          <h3 className="gradient-title text-center mb-3">Live Ranking</h3>

          {liveLeaderboard.length === 0 ? (
            <p className="text-muted text-center">Waiting for players...</p>
          ) : (
            liveLeaderboard.map((player, index) => {
              const isYou = player.name === name;

              return (
                <div
                  key={player.socketId}
                  className={`ranking-row rank-${index + 1} ${
                    isYou ? "you-row" : ""
                  }`}
                >
                  <div className="rank-left">
                    <div className="rank-badge">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `#${index + 1}`}
                    </div>

                    <div>
                      <h4>
                        {player.name} {isYou && <span>(You)</span>}{" "}
                        {player.isHost && "👑"}
                      </h4>
                      <small>
                        {index === 0
                          ? "Leading the battle"
                          : "Still in the game"}
                      </small>
                    </div>
                  </div>

                  <div className="rank-score">{player.score}</div>
                </div>
              );
            })
          )}
        </div>

        {/* 🎮 BUTTON / LOADER */}
        {isFinished ? (
          <button className="primary-action board-btn" onClick={playAgain}>
            Play Again 🔁
          </button>
        ) : (
          <div className="next-box">
            <div className="mini-loader"></div>
            <p>Next question starting automatically...</p>
          </div>
        )}
      </div>
    </div>
  );
}