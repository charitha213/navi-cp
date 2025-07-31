import React, { useState, useEffect } from "react";
import {
  getAllFlaggedDrugs,
  suppressDrug,
  unsuppressDrug,
  hideDrug,
  updateAlternatives,
  addUser,
} from "./ProductionChecker";
import "./ManagerDashboard.css";
import axios from "axios";

export default function ManagerDashboard() {
  const [flaggedDrugs, setFlaggedDrugs] = useState([]);
  const [newAlternatives, setNewAlternatives] = useState("");
  const [message, setMessage] = useState("");
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "production",
  });
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userSubTab, setUserSubTab] = useState("add");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      handleLoad();
    }
  }, [token]);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8000/production/token", {
        username: "manager",
        password: "managerpass",
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

  const handleLoad = async () => {
    const flagged = await getAllFlaggedDrugs();
    setFlaggedDrugs(flagged.map((d) => ({ ...d, isOpen: false })));
  };

  const handleToggle = async (drugname, isSuppressed) => {
    if (isSuppressed) {
      await unsuppressDrug(drugname);
    } else {
      await suppressDrug(drugname);
    }
    handleLoad();
  };

  const handleSuggestAlternatives = async (drugname) => {
    const alternatives = newAlternatives
      .split(",")
      .map((alt) => alt.trim())
      .filter(Boolean);
    if (alternatives.length > 0) {
      try {
        await updateAlternatives(drugname, alternatives);
        setMessage(`✅ Alternatives updated for ${drugname}`);
        setNewAlternatives("");
        handleLoad();
      } catch (err) {
        setMessage(`❌ Error updating alternatives: ${err.message}`);
      }
    } else {
      setMessage("❌ Please enter at least one alternative.");
    }
  };

  const handleHide = async (drugname) => {
    try {
      await hideDrug(drugname);
      setFlaggedDrugs(flaggedDrugs.filter((d) => !d.hidden_by_manager));
      setMessage(`✅ ${drugname} hidden from view.`);
    } catch (err) {
      setMessage(`❌ Error hiding ${drugname}: ${err.message}`);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    console.log("Sending user data:", userForm); // Debug payload
    try {
      await addUser(
        userForm.username,
        userForm.password,
        userForm.name,
        userForm.email,
        userForm.role
      );
      setMessage(`✅ User ${userForm.name} added successfully`);
      setUserForm({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "production",
      });
    } catch (err) {
      const errorDetail = err.response?.data?.detail || [err.message];
      const errorMessage = Array.isArray(errorDetail)
        ? errorDetail.map((d) => d.msg).join(", ")
        : errorDetail;
      setMessage(`❌ Error adding user: ${errorMessage}`);
    }
  };

  const handleDeleteOperator = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.delete(`http://localhost:8000/production/production/delete-operator`, {
        data: { username: deleteUsername },
        headers: { 'Content-Type': 'application/json' }
      });
      setMessage(`✅ Operator ${deleteUsername} deleted successfully!`);
      setDeleteUsername("");
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message || JSON.stringify(error.response?.data);
      setMessage(`❌ Failed to delete operator: ${errorDetail}`);
    }
  };

  return (
    <div className="mgr-container">
      <h2>Production Manager Dashboard</h2>
      {!token && <button onClick={handleLogin}>Login</button>}
      {token && (
        <>
          <button onClick={handleLoad} className="mgr-load-btn">
            Load Flagged Drugs
          </button>
          {message && <div className="mgr-message">{message}</div>}

          {flaggedDrugs.length === 0 ? (
            <p className="mgr-no-drugs">No flagged drugs found.</p>
          ) : (
            <div className="mgr-drug-grid">
              {flaggedDrugs.map(
                (drug, idx) =>
                  !drug.hidden_by_manager && (
                    <div key={idx} className="mgr-drug-card">
                      <div
                        className="mgr-card-header"
                        onClick={() =>
                          setFlaggedDrugs((prev) =>
                            prev.map((d) =>
                              d.drugname === drug.drugname
                                ? { ...d, isOpen: !d.isOpen }
                                : d
                            )
                          )
                        }
                      >
                        <h3>{drug.drugname}</h3>
                        <span
                          className={`mgr-status ${
                            drug.suppressed ? "suppressed" : "active"
                          }`}
                        >
                          {drug.suppressed ? "Suppressed" : "Active"}
                        </span>
                      </div>
                      {drug.isOpen && (
                        <div className="mgr-card-content">
                          <p>
                            <strong>Risk Level:</strong>{" "}
                            <span
                              className={`mgr-risk ${
                                drug.risk_level === "high" ? "high" : "low"
                              }`}
                            >
                              {drug.risk_level}
                            </span>
                          </p>
                          {drug.alternatives.length > 0 && (
                            <div className="mgr-alternatives">
                              <strong>Alternatives:</strong>
                              <ul>
                                {drug.alternatives.map((alt, i) => (
                                  <li key={i}>{alt}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            onClick={() =>
                              handleToggle(drug.drugname, drug.suppressed)
                            }
                            className="mgr-toggle-btn"
                          >
                            {drug.suppressed ? "Un-Suppress" : "Suppress"}
                          </button>
                          <div className="mgr-alt-input">
                            <input
                              type="text"
                              placeholder="Enter alternatives (comma-separated)"
                              value={newAlternatives}
                              onChange={(e) =>
                                setNewAlternatives(e.target.value)
                              }
                              className="mgr-alt-input-field"
                            />
                            <button
                              onClick={() =>
                                handleSuggestAlternatives(drug.drugname)
                              }
                              className="mgr-suggest-btn"
                            >
                              Suggest Alternatives
                            </button>
                          </div>
                          <button
                            onClick={() => handleHide(drug.drugname)}
                            className="mgr-hide-btn"
                          >
                            Hide
                          </button>
                        </div>
                      )}
                    </div>
                  )
              )}
            </div>
          )}

          <div className="mgr-user-section">
            <div className="mgr-user-sub-tabs">
              <button
                onClick={() => setUserSubTab("add")}
                className={userSubTab === "add" ? "active" : ""}
              >
                Add Production User
              </button>
              <button
                onClick={() => setUserSubTab("delete")}
                className={userSubTab === "delete" ? "active" : ""}
              >
                Delete Production User
              </button>
            </div>
            {userSubTab === "add" && (
              <div className="mgr-card-content">
                <form onSubmit={handleAddUser} className="mgr-user-form">
                  <input
                    type="text"
                    placeholder="Username"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    className="mgr-input-field"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="mgr-input-field"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={userForm.name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, name: e.target.value })
                    }
                    className="mgr-input-field"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    className="mgr-input-field"
                    required
                  />
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    className="mgr-input-field"
                    disabled
                  >
                    <option value="production">Production</option>
                  </select>
                  <button type="submit" className="mgr-add-user-btn">
                    Add User
                  </button>
                </form>
              </div>
            )}
            {userSubTab === "delete" && (
              <div className="mgr-card-content">
                <form onSubmit={handleDeleteOperator} className="mgr-user-form">
                  <input
                    type="text"
                    placeholder="Enter Username to Delete"
                    value={deleteUsername}
                    onChange={(e) => setDeleteUsername(e.target.value)}
                    className="mgr-input-field"
                    required
                  />
                  <button type="submit" className="mgr-del-user-btn">
                    Delete User
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}