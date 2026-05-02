import { useEffect, useState } from "react";
import API from "../services/api";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], answer: "" },
  ]);

  const [animateIndex, setAnimateIndex] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [preview, setPreview] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("draftQuiz");
    if (saved) {
      const draft = JSON.parse(saved);
      setTitle(draft.title || "");
      setTime(draft.time || "");
      setQuestions(
        draft.questions || [
          { text: "", options: ["", "", "", ""], answer: "" },
        ]
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "draftQuiz",
      JSON.stringify({ title, time, questions })
    );
  }, [title, time, questions]);

  const addQuestion = () => {
    const newIndex = questions.length;
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], answer: "" },
    ]);
    setAnimateIndex(newIndex);
    setTimeout(() => setAnimateIndex(null), 400);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleDragStart = (index) => setDragIndex(index);

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;

    const updated = [...questions];
    const dragged = updated[dragIndex];

    updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, dragged);

    setQuestions(updated);
    setDragIndex(null);
  };

  const clearDraft = () => {
    localStorage.removeItem("draftQuiz");
    setTitle("");
    setTime(10);
    setQuestions([{ text: "", options: ["", "", "", ""], answer: "" }]);
  };

  const copyLink = async () => {
    const linkToCopy = createdQuiz?.quizLink;

    if (!linkToCopy) {
      alert("No quiz link found ❌");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = linkToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed ❌ Please copy the link manually.");
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = createdQuiz.qrCode;
    link.download = "quiz-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return alert("Enter quiz title");
    if (!time || Number(time) <= 0) return alert("Enter valid time");

    for (let q of questions) {
      if (!q.text.trim()) return alert("Fill all question texts");
      if (q.options.some((opt) => !opt.trim()))
        return alert("Fill all options");
      if (!q.answer.trim()) return alert("Fill correct answer");
      if (!q.options.includes(q.answer)) {
        return alert("Correct answer must match one option");
      }
    }

    try {
      const res = await API.post("/quiz/create", {
        title,
        timePerQuestion: Number(time) || 10,
        questions,
      });

      setCreatedQuiz(res.data);
      localStorage.removeItem("draftQuiz");
    } catch (err) {
      console.error(err);
      alert("Error creating quiz ❌");
    }
  };

  return (
    <div className="page-wrap">
      <div className="quiz-shell">
        <div className="glass-card">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h1 className="gradient-title m-0">Create Quiz 🧠</h1>

            <button
              className="primary-action"
              onClick={() => setPreview(!preview)}
            >
              {preview ? <EyeOff size={18} /> : <Eye size={18} />}{" "}
              {preview ? "Edit Mode" : "Preview"}
            </button>
          </div>

          {!preview ? (
            <>
              <input
                className="form-control mb-3"
                placeholder="Quiz Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="form-control mb-4"
                type="number"
                placeholder="Time per question"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />

              {questions.map((q, qIndex) => {
                const isNew = qIndex === animateIndex;

                return (
                  <div
                    key={qIndex}
                    draggable
                    onDragStart={() => handleDragStart(qIndex)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(qIndex)}
                    className={`glass-card mb-4 ${
                      isNew ? "question-enter question-enter-active" : ""
                    }`}
                  >
                    <div className="d-flex justify-content-between mb-2">
                      <h5>
                        <GripVertical size={18} /> Question {qIndex + 1}
                      </h5>

                      {questions.length > 1 && (
                        <button
                          className="icon-danger-btn"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <input
                      className="form-control mb-2"
                      placeholder="Question text"
                      value={q.text}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "text", e.target.value)
                      }
                    />

                    {q.options.map((opt, oIndex) => (
                      <input
                        key={oIndex}
                        className="form-control mb-2"
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(qIndex, oIndex, e.target.value)
                        }
                      />
                    ))}

                    <input
                      className="form-control"
                      placeholder="Correct Answer"
                      value={q.answer}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "answer", e.target.value)
                      }
                    />
                  </div>
                );
              })}

              <div className="d-flex flex-wrap gap-3 mt-3">
                <button className="primary-action" onClick={addQuestion}>
                  <Plus size={18} /> Add Question
                </button>

                <button className="primary-action" onClick={handleSubmit}>
                  <Save size={18} /> Create Quiz
                </button>

                <button className="icon-danger-btn px-4" onClick={clearDraft}>
                  Clear Draft
                </button>
              </div>

              {createdQuiz && (
                <div className="glass-card mt-4 text-center">
                  <h3 className="gradient-title">Quiz Created 🎉</h3>

                  <p className="text-muted mt-2">
                    Share this link or QR code
                  </p>

                  <a
                    href={createdQuiz.quizLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#22d3ee", wordBreak: "break-all" }}
                  >
                    {createdQuiz.quizLink}
                  </a>

                  <br />

                  <img
                    src={createdQuiz.qrCode}
                    alt="QR"
                    style={{
                      width: "220px",
                      marginTop: "15px",
                      background: "white",
                      padding: "10px",
                      borderRadius: "12px",
                    }}
                  />

                  <div className="d-flex justify-content-center gap-3 mt-3 flex-wrap">
                    <button className="primary-action" onClick={copyLink}>
                      Copy Link 🔗
                    </button>

                    <button className="primary-action" onClick={downloadQR}>
                      Download QR 📥
                    </button>
                  </div>

                  {copied && (
                    <p style={{ color: "#22c55e", marginTop: "10px" }}>
                      Copied! ✅
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>
              <h2>{title || "Untitled Quiz"}</h2>

              {questions.map((q, i) => (
                <div key={i} className="glass-card mb-3">
                  <h5>{q.text}</h5>

                  {q.options.map((opt, idx) => (
                    <div key={idx}>
                      {opt} {opt === q.answer && "✅"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}