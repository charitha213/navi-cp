import React, { useState, useEffect } from "react";
import axios from "axios";
import { login } from "../authService"; // Ensure path is correct
import "./NurseDashboard.css";

export default function NurseDashboard() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchAppointments();
    }
  }, [token]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/nurse/nurse/appointments"
      );
      // Filter out forwarded appointments (assuming doctor_id is null or undefined for unforwarded)
      const unforwardedAppointments = res.data.filter(
        (app) => !app.doctor_id || app.doctor_id === null
      );
      // Sort by appointment_date
      const sortedAppointments = unforwardedAppointments.sort((a, b) => {
        return new Date(a.appointment_date) - new Date(b.appointment_date);
      });
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const success = await login("nurse", "nursepass");
      if (success) {
        setToken(localStorage.getItem("token"));
        localStorage.setItem("username", "nurse");
        alert("Logged in successfully!");
        fetchAppointments();
      }
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleForwardToDoctor = async (patient_username, appointmentDate) => {
    const now = new Date();
    now.setHours(now.getHours() + 5); // Adjust to IST (UTC+5:30)
    now.setMinutes(now.getMinutes() + 30); // Adjust to IST (UTC+5:30)
    const appointmentTime = new Date(appointmentDate);
    const timeDiff = Math.abs(now - appointmentTime) / (1000 * 60); // Difference in minutes
    const isSameDay = now.toDateString() === appointmentTime.toDateString();
    const slackMinutes = 30; // ±30 minutes slack

    if (!isSameDay) {
      setMessage("Cannot forward: Appointment is for a future day.");
      return;
    }

    if (timeDiff > slackMinutes) {
      const proceed = window.confirm(
        `Warning: Appointment is outside the ±30-minute slack period (${timeDiff.toFixed(
          1
        )} minutes away). Proceed anyway?`
      );
      if (!proceed) {
        setMessage("Forwarding canceled by nurse.");
        return;
      }
    }

    try {
      await axios.post(
        `http://localhost:8000/nurse/nurse/forward-to-doctor/${patient_username}`
      );
      setMessage(`Patient ${patient_username} forwarded to doctor`);
      fetchAppointments(); // Refresh to exclude forwarded appointment
    } catch (error) {
      setMessage(error.response?.data?.detail || "Forwarding failed");
    }
  };

  return (
    <div className="nurse-dashboard">
      {!token ? (
        <div className="login-container">
          <button onClick={handleLogin} className="login-button">
            Login
          </button>
        </div>
      ) : (
        <>
          <div className="sidebar">
            <h2>Nurse Dashboard</h2>
          </div>
          <div className="main-content">
            <h3>Appointments</h3>
            {appointments.length === 0 ? (
              <p className="no-appointments">No appointments scheduled</p>
            ) : (
              <div className="appointments-list">
                {appointments.map((app, i) => {
                  const isToday =
                    new Date().toDateString() ===
                    new Date(app.appointment_date).toDateString();
                  if (
                    i > 0 &&
                    !isToday &&
                    new Date(
                      appointments[i - 1].appointment_date
                    ).toDateString() !==
                      new Date(app.appointment_date).toDateString()
                  ) {
                    return [
                      <div key={`breakpoint-${i}`} className="date-breakpoint">
                        <hr />
                        <span>Future Appointments</span>
                      </div>,
                      <div key={i} className="appointment-card">
                        <div className="appointment-details">
                          <p>
                            <strong>Patient:</strong> {app.username}
                          </p>
                          <p>
                            <strong>Time:</strong>{" "}
                            {new Date(app.appointment_date).toLocaleString(
                              "en-US",
                              {
                                timeZone: "Asia/Kolkata",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleForwardToDoctor(
                              app.username,
                              app.appointment_date
                            )
                          }
                          className="forward-button"
                        >
                          Forward to Doctor
                        </button>
                      </div>,
                    ];
                  }
                  return (
                    <div key={i} className="appointment-card">
                      <div className="appointment-details">
                        <p>
                          <strong>Patient:</strong> {app.username}
                        </p>
                        <p>
                          <strong>Time:</strong>{" "}
                          {new Date(app.appointment_date).toLocaleString(
                            "en-US",
                            {
                              timeZone: "Asia/Kolkata",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleForwardToDoctor(
                            app.username,
                            app.appointment_date
                          )
                        }
                        className="forward-button"
                      >
                        Forward to Doctor
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {message && <p className="message">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
