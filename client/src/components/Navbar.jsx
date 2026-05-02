import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  PlayCircle,
  Trophy,
  Settings,
  History,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Quiz", path: "/quiz", icon: <PlayCircle size={18} /> },
    { name: "Leaderboard", path: "/leaderboard", icon: <Trophy size={18} /> },
    { name: "Admin", path: "/create", icon: <Settings size={18} /> },
    { name: "History", path: "/history", icon: <History size={18} /> },
  ];

  return (
    <nav className="premium-navbar">
      <Link to="/" className="premium-logo" onClick={() => setOpen(false)}>
        QuizBattle ⚡
      </Link>

      <div className="premium-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`premium-link ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>

      <button className="premium-menu-btn" onClick={() => setOpen(!open)}>
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="premium-mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`premium-mobile-link ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}