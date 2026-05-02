import { useEffect, useState } from "react";

export default function Timer({ duration, onTimeUp, setTimeLeft }) {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    setTime(duration);

    let interval;

    interval = setInterval(() => {
      setTime((prev) => {
        const newTime = prev - 1;

        return newTime >= 0 ? newTime : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration]);

  // ✅ SAFE: update parent AFTER render
  useEffect(() => {
    if (setTimeLeft) {
      setTimeLeft(time);
    }

    if (time === 0) {
      onTimeUp();
    }
  }, [time, setTimeLeft, onTimeUp]);

  return <div className="timer-pill">⏱ {time}s</div>;
}