import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ isLoggedIn, role, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-text">Drug Risk System</span>
      </div>
      <ul className="navbar-links">
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
            <Link to="/production">Production Dashboard</Link>
          </li>
        )}
        {isLoggedIn && role === "manager" && (
          <li>
            <Link to="/manager">Manager Dashboard</Link>
          </li>
        )}
        {isLoggedIn && role === "patient" && (
          <li>
            <Link to="/patient">Patient Dashboard</Link>
          </li>
        )}
        {isLoggedIn &&
          role === "nurse" && ( 
            <li>
              <Link to="/nurse">Nurse Dashboard</Link>
            </li>
          )}
        {isLoggedIn && (
          <li>
            <Link to="/profile">Profile</Link>
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
