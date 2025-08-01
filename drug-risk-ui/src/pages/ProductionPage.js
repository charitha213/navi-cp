import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAllFlaggedDrugs, deleteDrug } from "./ProductionChecker";
import "./ProductionPage.css";

export default function ProductionPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [flaggedDrugs, setFlaggedDrugs] = useState([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length >= 2) {
        axios
          .post(
            "http://127.0.0.1:8000/production/production/production/search",
            { query }
          )
          .then((res) => setResults(res.data))
          .catch((err) => {
            setResults([]);
            console.error("Search error:", err);
          });
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
    const interval = setInterval(handleLoadFlaggedDrugs, 10000);
    handleLoadFlaggedDrugs();
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (drug) => {
    setSelectedDrug(drug);
    setQuery(drug.drugname);
    setResults([]);
    setMessage("");
  };

  const handleFlag = async () => {
    if (!selectedDrug || selectedDrug.risk_level !== "high") return;
    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/production/production/production/flag",
        {
          drugname: selectedDrug.drugname,
        }
      );
      setMessage(`✅ Flagged: ${res.data.drugname}`);
      handleLoadFlaggedDrugs();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.detail || "Error flagging drug"}`);
    }
    setLoading(false);
  };

  const handleLoadFlaggedDrugs = async () => {
    try {
      const drugs = await getAllFlaggedDrugs();
      setFlaggedDrugs(drugs.map((drug) => ({ ...drug, isOpen: false })));
    } catch (err) {
      console.error("Error loading flagged drugs:", err);
      setFlaggedDrugs([]);
    }
  };

  const handleClearFlagged = () => {
    setFlaggedDrugs([]);
    setMessage("Flagged drugs cleared from view.");
  };

  const handleDismiss = async (drugname) => {
    try {
      await deleteDrug(drugname);
      setFlaggedDrugs(flaggedDrugs.filter((d) => d.drugname !== drugname));
      setMessage(`✅ ${drugname} permanently dismissed.`);
    } catch (err) {
      setMessage(`❌ Error dismissing ${drugname}: ${err.message}`);
    }
  };

  const toggleDrug = (drugname) => {
    setFlaggedDrugs((prevDrugs) =>
      prevDrugs.map((drug) =>
        drug.drugname === drugname ? { ...drug, isOpen: !drug.isOpen } : drug
      )
    );
  };

  return (
    <div className="prod-container">
      <h1 className="prod-title">Drug Risk System - Production</h1>
      <div className="prod-search-section">
        <input
          type="text"
          placeholder="Search drug..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMessage("");
            setSelectedDrug(null);
          }}
          className="prod-search-input"
        />
        {results.length > 0 && (
          <ul className="prod-suggestions">
            {results.map((drug) => (
              <li key={drug.drugname} onClick={() => handleSelect(drug)}>
                {drug.drugname}{" "}
                <span
                  className={`prod-risk-dot ${drug.risk_level.toLowerCase()}`}
                ></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedDrug && (
        <div className="prod-selected-card">
          <h3>Selected Drug</h3>
          <p>
            Name: <strong>{selectedDrug.drugname}</strong>
          </p>
          <p>
            Risk:{" "}
            <span
              className={`prod-risk ${selectedDrug.risk_level.toLowerCase()}`}
            >
              {selectedDrug.risk_level}
            </span>
          </p>
          <button
            onClick={handleFlag}
            disabled={loading || selectedDrug.risk_level !== "high"}
            className="prod-flag-btn"
          >
            {loading ? "Flagging..." : "Flag Drug"}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`prod-message ${
            message.includes("✅") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <div className="prod-flagged-section">
        <div className="prod-flagged-header">
          <h3>My Flagged Requests</h3>
          <div className="prod-header-actions">
            <button
              onClick={handleLoadFlaggedDrugs}
              className="prod-refresh-btn"
            >
              Refresh
            </button>
            <button onClick={handleClearFlagged} className="prod-clear-btn">
              Clear View
            </button>
          </div>
        </div>
        {flaggedDrugs.length === 0 ? (
          <p className="prod-no-flagged">No flagged requests found.</p>
        ) : (
          <div className="prod-flagged-grid">
            {flaggedDrugs.map((drug) => (
              <div key={drug.drugname} className="prod-flagged-card">
                <div
                  className="prod-card-header"
                  onClick={() => toggleDrug(drug.drugname)}
                >
                  <h4>{drug.drugname}</h4>
                  <span
                    className={`prod-status ${
                      drug.suppressed ? "suppressed" : "active"
                    }`}
                  >
                    {drug.suppressed ? "Suppressed" : "Active"}
                  </span>
                  {drug.hidden_by_manager && (
                    <span className="prod-reviewed-label">
                      (Reviewed by Manager)
                    </span>
                  )}
                </div>
                {drug.isOpen && (
                  <div className="prod-card-content">
                    <p>
                      Risk:{" "}
                      <span
                        className={`prod-risk ${drug.risk_level.toLowerCase()}`}
                      >
                        {drug.risk_level}
                      </span>
                    </p>
                    {drug.alternatives.length > 0 && (
                      <p>
                        Manager Alternatives:{" "}
                        <span className="prod-alternatives">
                          {drug.alternatives.join(", ")}
                        </span>
                      </p>
                    )}
                    <button
                      onClick={() => handleDismiss(drug.drugname)}
                      className="prod-dismiss-btn"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
