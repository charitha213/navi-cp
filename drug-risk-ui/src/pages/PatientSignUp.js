import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";
import doctorImage from "../assets/patient.jpg";
import { useNavigate } from "react-router-dom";

export default function PatientSignup() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/patient/patient/signup", form);
      setMessage("Signup successful! Please log in.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Signup failed");
    }
  };

  const handleBackToLogin = () => {
    navigate("/login"); // Navigate back to login page
  };

  return (
    <div className="login-wrapper">
      <button className="back-to-login" onClick={handleBackToLogin}>
        ← Back to Login
      </button>
      <div className="login-left">
        <h1 className="login-title">
          The care you need
          <br />
          from doctors you trust
        </h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            name="name"
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            type="text"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
          <button type="submit">Signup</button>
        </form>
        {message && <p className="error-text">{message}</p>}
      </div>
      <div className="login-right">
        <img src={doctorImage} alt="Doctor" className="login-image" />
      </div>
    </div>
  );
}
