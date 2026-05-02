import { useState, useEffect } from "react";

import correctSound from "../assets/sounds/correct.mp3";
import wrongSound from "../assets/sounds/wrong.mp3";

export default function QuestionCard({ question, onAnswer, disabled }) {
  const [selected, setSelected] = useState(null);

  const correctAudio = new Audio(correctSound);
  const wrongAudio = new Audio(wrongSound);

  useEffect(() => {
    setSelected(null);
  }, [question]);

  if (!question) {
    return (
      <div className="glass-card question-card text-center">
        <p className="text-muted">Waiting for question...</p>
      </div>
    );
  }

  const handleClick = (opt) => {
    if (disabled || selected) return;

    setSelected(opt);

    if (opt === question.answer) {
     correctAudio.play().catch(() => {});
    } else {
      wrongAudio.play().catch(() => {});
    }

    setTimeout(() => {
      onAnswer(opt);
    }, 700);
  };

  return (
    <div className="glass-card question-card">
      <p className="text-muted fw-semibold mb-2">Choose the correct option</p>
      <h2 className="fw-bold mb-4">{question.text}</h2>

      <div className="row">
        {question.options.map((opt, i) => {
          let className = "option-btn";

          if (selected) {
            if (opt === question.answer) className += " correct";
            else if (opt === selected) className += " wrong";
          }

          return (
            <div className="col-md-6 col-12 mb-3" key={i}>
              <button
                className={className}
                onClick={() => handleClick(opt)}
                disabled={disabled}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}