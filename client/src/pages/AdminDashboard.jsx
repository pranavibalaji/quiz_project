import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container text-center mt-5">
      <h2>Admin Dashboard</h2>

      <button
        className="btn btn-success mt-3"
        onClick={() => navigate("/create")}
      >
        Create Quiz
      </button>
    </div>
  );
}