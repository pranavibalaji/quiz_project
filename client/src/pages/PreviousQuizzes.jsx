import { useEffect, useState } from "react";
import API from "../services/api";

export default function PreviousQuizzes() {
  const [results, setResults] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get("/results");
        setResults(res.data || []);
      } catch (err) {
        console.error("Error fetching results:", err);
      }
    };

    fetchResults();
  }, []);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  if (results.length === 0) {
    return (
      <div className="page-wrap">
        <div className="glass-card empty-history">
          <h3>No quiz history yet 📭</h3>
          <p>Your completed quizzes will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="container py-4">
        <h1 className="gradient-title text-center mb-4">
          📚 Previous Quizzes
        </h1>

        {results.map((r) => {
          const isOpen = openId === r._id;
          const winner = r.winner;

          return (
            <div key={r._id} className="glass-card previous-card mb-4">
              <div
                className="previous-header d-flex justify-content-between align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => toggle(r._id)}
              >
                <div>
                  <h4 className="previous-title mb-1">
                    {r.quizTitle || "Untitled Quiz"}
                  </h4>

                  <small className="text-muted">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString()
                      : "No date"}
                  </small>
                </div>

                <div className="winner-pill">
                  🏆 {winner?.name || "No winner"} ({winner?.score || 0})
                  <span className="expand-icon">{isOpen ? "−" : "+"}</span>
                </div>
              </div>

              {isOpen && (
                <div className="history-section">
                  <div className="mb-4">
                    <h5 className="history-heading">👥 Participants</h5>

                    {r.participants?.length > 0 ? (
                      r.participants.map((p, i) => (
                        <div key={i} className="participant-row">
                          <span className="participant-name">
                            #{i + 1} {p.name} {p.isHost && "👑"}
                          </span>

                          <strong className="participant-score">
                            {p.score}
                          </strong>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No participants found.</p>
                    )}
                  </div>

                  <div>
                    <h5 className="history-heading">❓ Questions</h5>

                    {r.quizId?.questions?.length > 0 ? (
                      r.quizId.questions.map((q, i) => (
                        <div key={i} className="question-history-card">
                          <p className="fw-semibold">
                            {i + 1}. {q.text}
                          </p>

                          {q.options?.map((opt, idx) => (
                            <div
                              key={idx}
                              className={`history-option ${
                                opt === q.answer ? "correct" : ""
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No questions found.</p>
                    )}
                  </div>

                  {r.quizId?.quizLink && (
                    <div className="mt-3">
                      <a
                        href={r.quizId.quizLink}
                        target="_blank"
                        rel="noreferrer"
                        className="primary-action text-decoration-none d-inline-block"
                      >
                        Open Quiz 🔗
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}