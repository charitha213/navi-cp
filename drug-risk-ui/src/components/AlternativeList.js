

import React from "react";
import "./AlternativeList.css"; 
export default function AlternativeList({ alternatives }) {
  if (!alternatives || alternatives.length === 0) {
    return <p>No low-risk alternatives found.</p>;
  }

  return (
    <div className="alt-list">
      <h4>Suggested Alternatives</h4>
      <ul>
        {alternatives.map((drug, index) => (
          <li key={index}>
            <strong>{drug.drugname}</strong> — {drug.risk_level.toUpperCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
