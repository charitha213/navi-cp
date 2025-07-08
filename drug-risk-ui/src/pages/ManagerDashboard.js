// src/pages/ManagerDashboard.js
import React, { useState } from "react";
import { getAllFlaggedDrugs } from "./ProductionChecker";
import AlternativeList from "../components/AlternativeList";

export default function ManagerDashboard() {
  const [flaggedDrugs, setFlaggedDrugs] = useState([]);

  const handleLoad = () => {
    const flagged = getAllFlaggedDrugs();
    setFlaggedDrugs(flagged);
  };

  return (
    <div className="container">
      <h2>Manager Dashboard</h2>
      <button onClick={handleLoad}>Load Flagged Drugs</button>

      {flaggedDrugs.length === 0 ? (
        <p>No flagged drugs to display yet.</p>
      ) : (
        <div>
          {flaggedDrugs.map((drug, index) => (
            <div key={index} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc" }}>
              <p>
                <strong>{drug.drugname}</strong> — Risk Level:{" "}
                <strong style={{ color: "red" }}>{drug.risk_level.toUpperCase()}</strong>
              </p>
              <AlternativeList alternatives={drug.alternatives} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
