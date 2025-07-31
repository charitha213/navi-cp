import React, { useState, useEffect } from "react";
import axios from "axios";
import { generatePrescriptionPDF } from "./pdfUtils";
import { format, toZonedTime } from "date-fns-tz"; // Updated to use toZonedTime
import "./PatientDashboard.css";

export default function PatientDashboard() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [activeTab, setActiveTab] = useState("calendar"); // Default to calendar
  const [appointments, setAppointments] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchAppointments();
    }
  }, [token]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/patient/patient/appointments"); // Updated endpoint
      console.log("Fetched appointments:", res.data); // Debug log
      const fetchedAppointments = res.data.appointments || [];
      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
      setMessage("Failed to fetch appointments");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/patient/patient/token", // Updated endpoint
        {
          username: "pat", // Match database username
          password: "patientpass",
        }
      );
      setToken(res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.data.access_token}`;
      alert("Logged in successfully!");
      fetchAppointments(); // Fetch appointments after login
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!appointmentDate) {
      setMessage("Please select a date and time.");
      return;
    }
    try {
      // Convert to IST using toZonedTime
      const istDate = toZonedTime(new Date(appointmentDate), "Asia/Kolkata");
      const isoDate = format(istDate, "yyyy-MM-dd'T'HH:mm:ssXXX", {
        timeZone: "Asia/Kolkata",
      });
      await axios.post(
        "http://localhost:8000/patient/patient/book-appointment", // Updated endpoint
        {
          appointment_date: isoDate,
        }
      );
      setMessage("Appointment booked successfully");
      fetchAppointments(); // Refresh appointments after booking
    } catch (error) {
      setMessage(error.response?.data?.detail || "Booking failed");
    }
  };

  const CalendarTab = () => {
    const today = toZonedTime(new Date(), "Asia/Kolkata"); // Use IST for today
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const renderCalendar = () => {
      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push(<td key={`empty-${i}`} />);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = format(
          toZonedTime(new Date(currentYear, currentMonth, day), "Asia/Kolkata"),
          "yyyy-MM-dd",
          { timeZone: "Asia/Kolkata" }
        );
        const isToday =
          dateStr === format(today, "yyyy-MM-dd", { timeZone: "Asia/Kolkata" });
        const appt = appointments.find(
          (a) =>
            format(
              toZonedTime(new Date(a.appointment_date), "Asia/Kolkata"),
              "yyyy-MM-dd",
              { timeZone: "Asia/Kolkata" }
            ) === dateStr
        );
        days.push(
          <td
            key={day}
            className={`${isToday ? "today" : ""} ${appt ? "appointment" : ""}`}
          >
            {day}
            {appt && (
              <div className="appointment-time">
                {format(
                  toZonedTime(new Date(appt.appointment_date), "Asia/Kolkata"),
                  "HH:mm",
                  { timeZone: "Asia/Kolkata" }
                )}
              </div>
            )}
          </td>
        );
      }

      const weeks = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push(<tr key={i / 7}>{days.slice(i, i + 7)}</tr>);
      }

      return weeks;
    };

    return (
      <div className="calendar">
        <h3>Calendar</h3>
        <table>
          <thead>
            <tr>
              <th>Sun</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
            </tr>
          </thead>
          <tbody>{renderCalendar()}</tbody>
        </table>
        {message && <p>{message}</p>}
      </div>
    );
  };

  const Appointments = () => (
    <div className="past-appointments">
      <h3>Appointments</h3>
      {appointments.length > 0 ? (
        appointments.map((appt, index) => (
          <div key={index} className="past-appointment-card">
            <p>
              Date:{" "}
              {format(
                toZonedTime(new Date(appt.appointment_date), "Asia/Kolkata"),
                "MMM dd, yyyy, HH:mm",
                { timeZone: "Asia/Kolkata" }
              )}
            </p>
          </div>
        ))
      ) : (
        <p>No appointments booked.</p>
      )}
    </div>
  );

  return (
    <div className="patient-dashboard">
      <h2>Patient Dashboard</h2>
      {!token && <button onClick={handleLogin}>Login</button>}
      {token && (
        <>
          <div className="tab-buttons">
            <button
              onClick={() => setActiveTab("book")}
              className={activeTab === "book" ? "active" : ""}
            >
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={activeTab === "calendar" ? "active" : ""}
            >
              Calendar
            </button>
          </div>
          {activeTab === "book" && (
            <div className="book-appointment">
              <div className="form-section">
                <h3>Book Appointment</h3>
                <form onSubmit={handleBookAppointment}>
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                  <button type="submit">Book</button>
                </form>
                {message && <p>{message}</p>}
              </div>
              <div className="past-appointments-section">
                <Appointments />
              </div>
            </div>
          )}
          {activeTab === "calendar" && <CalendarTab />}
        </>
      )}
    </div>
  );
}
