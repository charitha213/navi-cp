import React, { useState } from "react";
import { drugList } from "../data/drugData";
import "../pages/DrugSearch.css"; 

const ProductionSearch = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const handleSearch = () => {
    const match = drugList.find(
      (d) => d.name.toLowerCase() === input.trim().toLowerCase()
    );
    if (match) {
      setResult(match);
    } else {
      setResult({ name: input, risk: "unknown" });
    }
  };

  return (
    <div className="drug-search-container">
      <h3>Check Drug Risk Before Production</h3>
      <input
        type="text"
        placeholder="Enter drug name (e.g., Paracetamol)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleSearch}>Check Risk</button>

      {result && (
        <div className={`result-box ${result.risk}`}>
          <p>
            <strong>Drug:</strong> {result.name}
          </p>
          <p>
            <strong>Risk Level:</strong> {result.risk.toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductionSearch;
