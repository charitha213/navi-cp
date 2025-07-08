// src/components/Navbar.js
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ isLoggedIn, role, onLogout }) {
  return (
    <nav className="navbar">
      <h1>💊 Drug Risk System</h1>
      <ul>
        {isLoggedIn && role === "doctor" && (
          <li>
            <Link to="/doctor">Doctor Dashboard</Link>
          </li>
        )}
        {isLoggedIn && role === "admin" && (
          <li>
            <Link to="/admin">Admin Panel</Link>
          </li>
        )}
        {isLoggedIn && role === "production" && (
          <li>
            <Link to="/prodcheck">Production Dashboard</Link>
          </li>
        )}
        {isLoggedIn && role === "manager" && (
          <li>
            <Link to="/manager">Manager Dashboard</Link>
          </li>
        )}
        {!isLoggedIn ? (
          <li>
            <Link to="/login">Login</Link>
          </li>
        ) : (
          <li>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
