import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PreviousQuizzes from "./pages/PreviousQuizzes";
import JoinQuiz from "./pages/JoinQuiz";
import QuizRoom from "./pages/QuizRoom";
import Leaderboard from "./pages/Leaderboard";
import CreateQuiz from "./pages/CreateQuiz";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<JoinQuiz />} />
        <Route path="/join/:id" element={<JoinQuiz />} />
        <Route path="/quiz" element={<QuizRoom />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/history" element={<PreviousQuizzes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;