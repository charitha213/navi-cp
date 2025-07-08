import { useState } from "react";
import "./LoginPage.css"; // Optional, for styling

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin({ username, role }); // Mock login logic
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
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
        </select>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
