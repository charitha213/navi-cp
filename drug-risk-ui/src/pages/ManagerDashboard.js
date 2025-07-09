import React, { useState } from "react";
import {
  getAllFlaggedDrugs,
  suppressDrug,
  unsuppressDrug,
} from "./ProductionChecker";
import AlternativeList from "../components/AlternativeList";

export default function ManagerDashboard() {
  const [flaggedDrugs, setFlaggedDrugs] = useState([]);

  const handleLoad = () => {
    const flagged = getAllFlaggedDrugs();
    setFlaggedDrugs([...flagged]); 
  };

  const handleToggle = (drugname) => {
    const drug = flaggedDrugs.find((d) => d.drugname === drugname);
    if (!drug) return;

    if (drug.suppressed) {
      unsuppressDrug(drugname); 
      drug.suppressed = false;
    } else {
      suppressDrug(drugname); 
      drug.suppressed = true;
    }

    setFlaggedDrugs([...flaggedDrugs]); 
  };

  return (
    <div className="container">
      <h2>Manager Dashboard</h2>
      <p>Review flagged high-risk drugs and manage suppression status.</p>
      <button onClick={handleLoad}>Load Flagged Drugs</button>

      {flaggedDrugs.length === 0 ? (
        <p>No flagged drugs to display yet.</p>
      ) : (
        <div>
          {flaggedDrugs.map((drug, index) => (
            <div
              key={index}
              style={{
                borderBottom: "1px solid #ccc",
                marginBottom: "20px",
                paddingBottom: "10px",
              }}
            >
              <p>
                <strong>{drug.drugname}</strong> — Risk Level:{" "}
                <span style={{ color: "red" }}>
                  {drug.risk_level.toUpperCase()}
                </span>
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: drug.suppressed ? "orange" : "green",
                    fontWeight: "bold",
                  }}
                >
                  {drug.suppressed ? "Suppressed" : "Active"}
                </span>
              </p>
              <button onClick={() => handleToggle(drug.drugname)}>
                {drug.suppressed ? "Un-Suppress" : "Suppress"}
              </button>

              <AlternativeList alternatives={drug.alternatives} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
