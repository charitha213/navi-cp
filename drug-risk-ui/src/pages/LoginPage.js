import { useState } from "react";
import "./LoginPage.css";
import { login, getRole } from "../authService";
import doctorImage from "../assets/doctor.jpg"; // Add your doctor image here

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username && password) {
      const success = await login(username, password);
      if (success) {
        const userRole = getRole();
        let redirectPath = "/";
        switch (userRole) {
          case "doctor":
            redirectPath = "/doctor";
            break;
          case "admin":
            redirectPath = "/admin";
            break;
          case "production":
            redirectPath = "/production";
            break;
          case "manager":
            redirectPath = "/manager";
            break;
          case "patient":
            redirectPath = "/patient";
            break;
          case "nurse": // Add nurse case
            redirectPath = "/nurse";
            break;
          default:
            redirectPath = "/unauthorized";
        }
        onLogin(redirectPath);
      } else {
        setError("Invalid username or password");
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <h1 className="login-title">
          The care you need
          <br />
          from doctors you trust
        </h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
            <option value="production">Production</option>
            <option value="manager">Manager</option>
            <option value="patient">Patient</option>
            <option value="nurse">Nurse</option> {/* Add nurse option */}
          </select>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Login</button>
        </form>
        <div className="signup-link-container">
          <p className="signup-text">New patient?</p>
          <a href="/patient/signup" className="signup-link">
            Sign up here
          </a>
        </div>
      </div>
      <div className="login-right">
        <img src={doctorImage} alt="Doctor" className="login-image" />
      </div>
    </div>
  );
}
