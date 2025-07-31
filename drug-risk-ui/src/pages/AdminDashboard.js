import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("drugs");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [doctorSubTab, setDoctorSubTab] = useState("add");

  const [form, setForm] = useState({
    name: "",
    prod_ai: "",
    pt: "",
    outc_cod: "",
  });
  const [risk, setRisk] = useState("");
  const [file, setFile] = useState(null);
  const [bulkResult, setBulkResult] = useState([]);

  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    hospital: "",
    city: "",
    role: "doctor",
  });
  const [userMsg, setUserMsg] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleUserChange = (e) =>
    setUserForm({ ...userForm, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8000/admin/admin/token", {
        username: "admin",
        password: "adminpass",
      });
      setToken(res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.data.access_token}`;
      alert("Logged in successfully!");
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    try {
      const res = await axios.post(
        "http://localhost:8000/admin/admin/add-drug",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setRisk(res.data.risk_level);
      alert(`Drug added with risk level: ${res.data.risk_level}`);
    } catch (error) {
      alert("Error adding drug");
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a file");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        "http://localhost:8000/admin/admin/bulk-upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setBulkResult(res.data.data);
      alert("Bulk upload successful!");
    } catch (error) {
      alert("Error uploading bulk data");
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(userForm).forEach((key) => formData.append(key, userForm[key]));
    try {
      const res = await axios.post(
        `http://localhost:8000/admin/admin/add-${userForm.role}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const roleCapitalized =
        userForm.role.charAt(0).toUpperCase() + userForm.role.slice(1);
      setUserMsg(`${roleCapitalized} added successfully!`);
      setUserForm({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        hospital: "",
        city: "",
        role: "doctor",
      });
    } catch (error) {
      setUserMsg(
        `Failed to add ${userForm.role}: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  const handleDeleteDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.delete(`http://localhost:8000/admin/admin/delete-doctor`, {
        data: { username: deleteUsername },
        headers: { "Content-Type": "application/json" },
      });
      setUserMsg(`Doctor ${deleteUsername} deleted successfully!`);
      setDeleteUsername("");
    } catch (error) {
      setUserMsg(
        `Failed to delete doctor: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/admin/admin/download-template",
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "drug_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
      alert("Download failed");
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      {!token && (
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
      )}
      {token && (
        <>
          <div className="admin-tabs">
            <button
              onClick={() => setActiveTab("drugs")}
              className={activeTab === "drugs" ? "active" : ""}
            >
              Manage Drugs
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={activeTab === "users" ? "active" : ""}
            >
              Manage Users
            </button>
          </div>

          {activeTab === "drugs" && (
            <div className="drug-panels">
              <div className="admin-section">
                <h4>Add Single Drug</h4>
                <div>
                  <input
                    name="name"
                    placeholder="Drug Name"
                    value={form.name}
                    onChange={handleChange}
                  />
                  <input
                    name="prod_ai"
                    placeholder="Active Ingredient"
                    value={form.prod_ai}
                    onChange={handleChange}
                  />
                  <input
                    name="pt"
                    placeholder="Preferred Term (optional)"
                    value={form.pt}
                    onChange={handleChange}
                  />
                  <input
                    name="outc_cod"
                    placeholder="Outcome Code (optional)"
                    value={form.outc_cod}
                    onChange={handleChange}
                  />
                  <button onClick={handleSubmit}>Predict & Save</button>
                </div>
                {risk && (
                  <p>
                    Predicted Risk Level: <strong>{risk}</strong>
                  </p>
                )}
              </div>

              <div className="admin-section">
                <h4>Bulk Upload</h4>
                <div>
                  <button onClick={downloadTemplate}>
                    Download Excel Template
                  </button>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <button onClick={handleBulkUpload}>Upload & Predict</button>
                </div>
                {bulkResult.length > 0 && (
                  <div>
                    <h5>Uploaded Drugs</h5>
                    <ul>
                      {bulkResult.map((item, i) => (
                        <li key={i}>
                          {item.name} - Risk: {item.risk_level}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="admin-section">
              <div className="doctor-sub-tabs">
                <button
                  onClick={() => setDoctorSubTab("add")}
                  className={doctorSubTab === "add" ? "active" : ""}
                >
                  Add User
                </button>
                <button
                  onClick={() => setDoctorSubTab("delete")}
                  className={doctorSubTab === "delete" ? "active" : ""}
                >
                  Delete Doctor
                </button>
              </div>
              {doctorSubTab === "add" && (
                <div className="doctor-grid">
                  <input
                    name="username"
                    placeholder="Username"
                    value={userForm.username}
                    onChange={handleUserChange}
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={userForm.password}
                    onChange={handleUserChange}
                  />
                  <input
                    name="name"
                    placeholder="Full Name"
                    value={userForm.name}
                    onChange={handleUserChange}
                  />
                  <input
                    name="email"
                    placeholder="Email"
                    value={userForm.email}
                    onChange={handleUserChange}
                  />
                  <input
                    name="phone"
                    placeholder="Phone"
                    value={userForm.phone}
                    onChange={handleUserChange}
                  />
                  <input
                    name="department"
                    placeholder="Department"
                    value={userForm.department}
                    onChange={handleUserChange}
                  />
                  <input
                    name="designation"
                    placeholder="Designation"
                    value={userForm.designation}
                    onChange={handleUserChange}
                  />
                  <input
                    name="hospital"
                    placeholder="Hospital"
                    value={userForm.hospital}
                    onChange={handleUserChange}
                  />
                  <input
                    name="city"
                    placeholder="City"
                    value={userForm.city}
                    onChange={handleUserChange}
                  />
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleUserChange}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                  <div className="doctor-submit">
                    <button onClick={handleUserSubmit}>Add User</button>
                  </div>
                </div>
              )}
              {doctorSubTab === "delete" && (
                <div className="doctor-delete-section">
                  <input
                    type="text"
                    placeholder="Enter Username to Delete"
                    value={deleteUsername}
                    onChange={(e) => setDeleteUsername(e.target.value)}
                  />
                  <button onClick={handleDeleteDoctor}>Delete Doctor</button>
                </div>
              )}
              {userMsg && <p>{userMsg}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
