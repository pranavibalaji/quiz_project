import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function JoinQuiz() {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  const handleJoin = () => {
    if (!name.trim()) return alert("Enter your name");

    localStorage.removeItem("score");
    localStorage.removeItem("currentIndex");
    localStorage.removeItem("isFinished");
    localStorage.removeItem("lastPoints");
    localStorage.removeItem("lastBonus");

    localStorage.setItem("name", name);

    if (id) {
      localStorage.setItem("quizId", id);
    } else {
      localStorage.removeItem("quizId");
    }

    navigate("/quiz");
  };

  return (
    <div className="page-wrap d-flex align-items-center justify-content-center">
      <div className="glass-card text-center" style={{ maxWidth: "560px", width: "100%" }}>
        <h1 className="gradient-title mb-3">Quiz Battle</h1>

        <p className="text-muted fw-semibold mb-4">
          {id ? "You joined using a quiz link." : "Enter your name and start the latest quiz."}
        </p>

        <input
          className="form-control form-control-lg mb-3 rounded-pill text-center"
          placeholder="Your nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="primary-action w-100 mt-2" onClick={handleJoin}>
          Start Quiz 🚀
        </button>
      </div>
    </div>
  );
}