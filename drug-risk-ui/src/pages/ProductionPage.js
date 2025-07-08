// src/pages/ProductionPage.js
import React, { useState } from "react";
import { checkDrugRisk, getAlternatives } from "./ProductionChecker";
import AlternativeList from "../components/AlternativeList";
import "./ProductionPage.css"; // Create this CSS file

export default function ProductionPage() {
  const [drugInput, setDrugInput] = useState("");
  const [result, setResult] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const handleCheck = () => {
    const drug = checkDrugRisk(drugInput);
    if (!drug.found) {
      setResult({ found: false });
      setAlternatives([]);
      return;
    }

    setResult(drug);

    if (drug.risk_level === "high") {
      const alts = getAlternatives(drug.prod_ai);
      setAlternatives(alts);
    } else {
      setAlternatives([]);
    }
  };

  return (
    <div className="production-container">
      <h2>Production Line Dashboard</h2>
      <p>Check formulation risk before manufacturing.</p>

      <div className="production-input">
        <input
          type="text"
          placeholder="Enter drug name (e.g., ASPIRIN)"
          value={drugInput}
          onChange={(e) => setDrugInput(e.target.value)}
        />
        <button onClick={handleCheck}>Check Risk</button>
      </div>

      {result && !result.found && (
        <p className="warning">⚠️ Drug not found in the system.</p>
      )}

      {result && result.found && (
        <div className={`result-box ${result.risk_level}`}>
          <h4>Result</h4>
          <p>
            <strong>Name:</strong> {result.drugname}
          </p>
          <p>
            <strong>Risk Level:</strong>{" "}
            <span className={`risk-tag ${result.risk_level}`}>
              {result.risk_level.toUpperCase()}
            </span>
          </p>
          <p>
            <strong>Active Ingredient:</strong> {result.prod_ai}
          </p>
          <p>
            <strong>PT:</strong> {result.pt || "N/A"}
          </p>
          <p>
            <strong>Outcome:</strong> {result.outc_cod || "N/A"}
          </p>

          {result.risk_level === "high" && (
            <>
              <p className="warning">
                ⚠️ High-risk drug! Alternatives suggested:
              </p>
              <AlternativeList alternatives={alternatives} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
