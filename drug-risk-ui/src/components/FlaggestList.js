// src/components/FlaggedList.js

import React from "react";

export default function FlaggedList({ flaggedDrugs }) {
  return (
    <div className="flagged-list">
      <h3>⚠️ Flagged High-Risk Drugs</h3>
      {flaggedDrugs.length === 0 ? (
        <p>No flagged drugs currently.</p>
      ) : (
        <ul>
          {flaggedDrugs.map((drug, index) => (
            <li key={index}>
              <strong>{drug.drugname}</strong> — Risk: {drug.risk_level}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
