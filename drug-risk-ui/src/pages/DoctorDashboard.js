import React, { useState, useEffect } from "react";
import "./DoctorDashboard.css";
import { generatePrescriptionPDF } from "./pdfUtils";
import Modal from "../components/Modal";
import axios from "axios";
import { isAuthenticated, getAuthHeaders } from "../authService";

export default function DoctorDashboard() {
  const [searchText, setSearchText] = useState("");
  const [prescription, setPrescription] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("prescription");
  const [appointments, setAppointments] = useState([]);
  const [patientDetails, setPatientDetails] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = "/login";
    } else {
      fetchAppointments();
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/doctor/doctor/appointments",
        { headers: getAuthHeaders() }
      );
      const unhandledAppointments = response.data.filter(
        (app) => !app.is_handled
      );
      const sortedAppointments = unhandledAppointments.sort((a, b) => {
        return new Date(a.appointment_date) - new Date(b.appointment_date);
      });
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setMessage("Error fetching appointments");
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/doctor/doctor/search",
        { query: text },
        { headers: getAuthHeaders() }
      );
      const results = response.data.map((item) => ({
        name: item.drugname,
        risk: item.risk_level,
      }));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching drugs:", error);
      setSearchResults([]);
    }
  };

  const handleAdd = async (drug) => {
    if (prescription.some((d) => d.name === drug.name)) return;

    try {
      const response = await axios.post(
        "http://localhost:8000/doctor/doctor/alternatives",
        { drugname: drug.name },
        { headers: getAuthHeaders() }
      );
      const { risk_level, alternatives: altList } = response.data;
      if (risk_level === "high") {
        setAlternatives(altList.map((name) => ({ name, risk: "low" })));
        setSelectedDrug({ name: drug.name, risk: "high" });
        setShowModal(true);
      } else {
        addToPrescription({ name: drug.name, risk: "low" });
      }
    } catch (error) {
      console.error("Error fetching alternatives:", error);
    }
  };

  const addToPrescription = (drug) => {
    setPrescription([
      ...prescription,
      {
        ...drug,
        dosage: "",
        morning: false,
        afternoon: false,
        night: false,
      },
    ]);
  };

  const handleSelectAlternative = (alt) => {
    addToPrescription(alt);
    setShowModal(false);
    setSelectedDrug(null);
  };

  const handleProceedWithHighRisk = () => {
    addToPrescription(selectedDrug);
    setShowModal(false);
    setSelectedDrug(null);
  };

  const updateField = (index, field, value) => {
    const updated = [...prescription];
    updated[index][field] = value;
    setPrescription(updated);
  };

  const handleAppointmentClick = async (patient_username) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/patient/patient/profile?username=${patient_username}`,
        { headers: getAuthHeaders() }
      );
      setPatientDetails(response.data);
      setSelectedPatient(patient_username);
      setPrescription([]); // Reset prescription for new patient
      setActiveTab("prescription");

      // Mark appointment as handled after viewing
      await axios.post(
        `http://localhost:8000/doctor/doctor/mark-handled`,
        { patient_username },
        { headers: getAuthHeaders() }
      );
      setMessage(`Appointment for ${patient_username} marked as viewed`);
      fetchAppointments(); // Refresh to exclude handled appointment
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setMessage("Error processing appointment");
    }
  };

  const handleDownloadPrescription = async () => {
    if (!patientDetails.name || prescription.length === 0) {
      alert(
        "Please ensure patient details are loaded and prescription is complete."
      );
      return;
    }
    generatePrescriptionPDF({
      patientName: patientDetails.name || "____________________",
      age: patientDetails.age || "_____",
      address:
        patientDetails.address || "______________________________________",
      date: new Date().toLocaleDateString(),
      medicines: prescription,
    });
    // Mark appointment as handled after downloading prescription
    if (selectedPatient) {
      try {
        await axios.post(
          `http://localhost:8000/doctor/doctor/mark-handled`,
          { patient_username: selectedPatient },
          { headers: getAuthHeaders() }
        );
        setMessage(
          `Prescription for ${selectedPatient} downloaded and appointment marked as handled`
        );
        setPrescription([]); // Clear prescription after download
        setSelectedPatient(null); // Reset selected patient
        fetchAppointments(); // Refresh appointments
      } catch (error) {
        console.error("Error marking appointment as handled:", error);
        setMessage("Error marking appointment as handled");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div>
        <button
          onClick={() => setActiveTab("prescription")}
          className={activeTab === "prescription" ? "active" : ""}
        >
          Prescription
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={activeTab === "appointments" ? "active" : ""}
        >
          Appointments
        </button>
      </div>
      {activeTab === "prescription" && (
        <>
          <div className="left-panel">
            <input
              type="text"
              placeholder="Search for medicines"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="results-list">
              {searchResults.map((drug, i) => (
                <div key={i} className="drug-item">
                  <div className="drug-info">
                    <span>{drug.name}</span>
                    <span className={`risk-dot ${drug.risk}`}></span>
                  </div>
                  <div className="plus">
                    <button className="plus" onClick={() => handleAdd(drug)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="right-panel">
            <div className="prescription-header">
              <button
                className="print-btn"
                onClick={handleDownloadPrescription}
              >
                Download Prescription ⬇
              </button>
            </div>
            <div className="prescription-body">
              {prescription.map((drug, i) => (
                <div className="prescription-line" key={i}>
                  <div>
                    <strong>{drug.name}</strong> ({drug.risk})
                  </div>
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={drug.dosage}
                    onChange={(e) => updateField(i, "dosage", e.target.value)}
                  />
                  <div className="toggle-group">
                    {["morning", "afternoon", "night"].map((time) => (
                      <label key={time} className="toggle-wrapper">
                        <input
                          type="checkbox"
                          checked={drug[time]}
                          onChange={(e) =>
                            updateField(i, time, e.target.checked)
                          }
                        />
                        <span className="slider"></span>
                        <small>
                          {time.charAt(0).toUpperCase() + time.slice(1)}
                        </small>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {activeTab === "appointments" && (
        <div className="main-content">
          <h3>Appointments</h3>
          {appointments.length === 0 ? (
            <p className="no-appointments">No appointments</p>
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
                        onClick={() => handleAppointmentClick(app.username)}
                        className="forward-button"
                      >
                        View
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
                      onClick={() => handleAppointmentClick(app.username)}
                      className="forward-button"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {message && <p className="message">{message}</p>}
        </div>
      )}

      {showModal && selectedDrug && (
        <Modal
          drug={selectedDrug}
          alternatives={alternatives}
          onSelect={handleSelectAlternative}
          onProceed={handleProceedWithHighRisk}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
