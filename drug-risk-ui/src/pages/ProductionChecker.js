import { useState } from "react";
import { drugList } from "../data/drugData";
import "./DrugSearch.css";

let flaggedDrugs = [];

export function getAlternatives(prod_ai) {
  const safe = drugList.filter(
    (d) =>
      d.prod_ai.toUpperCase() === prod_ai.toUpperCase() &&
      d.risk_level === "low"
  );
  return safe.slice(0, 5);
}

export function checkDrugRisk(drugName) {
  const name = drugName.trim().toUpperCase();
  const match = drugList.find((d) => d.drugname.toUpperCase() === name);

  if (!match) return { found: false };

  const isHigh = match.risk_level === "high";

  if (isHigh && !flaggedDrugs.some((d) => d.drugname === match.drugname)) {
    const alternatives = getAlternatives(match.prod_ai);
    flaggedDrugs.push({
      ...match,
      alternatives,
      suppressed: false,
    });
  }

  return {
    found: true,
    drugname: match.drugname,
    prod_ai: match.prod_ai,
    risk_level: match.risk_level,
    pt: match.pt,
    outc_cod: match.outc_cod,
  };
}

export function getAllFlaggedDrugs() {
  return flaggedDrugs;
}

export function suppressDrug(drugname) {
  const drug = flaggedDrugs.find((d) => d.drugname === drugname);
  if (drug) {
    drug.suppressed = true;
  }
}

export function unsuppressDrug(drugname) {
  const drug = flaggedDrugs.find((d) => d.drugname === drugname);
  if (drug) {
    drug.suppressed = false;
  }
}

export default function ProductionChecker() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const handleCheck = () => {
    const res = checkDrugRisk(input);
    setResult(res);
  };

  return (
    <div className="container">
      <h2>🏭 Production Line Risk Checker</h2>
      <p>Check formulation-level risks before manufacturing.</p>

      <div className="search-box">
        <input
          type="text"
          placeholder="Enter drug name (e.g. ASPIRIN)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleCheck}>Check Risk</button>
      </div>

      {result && !result.found && (
        <p className="warning">⚠️ Drug not found in the current database.</p>
      )}

      {result && result.found && (
        <div className={`result-box ${result.risk_level}`}>
          <h4>Drug: {result.drugname}</h4>
          <p>
            <strong>Active Ingredient:</strong> {result.prod_ai}
          </p>
          <p>
            <strong>Risk Level:</strong> {result.risk_level.toUpperCase()}
          </p>
          <p>
            <strong>Preferred Term:</strong> {result.pt || "N/A"}
          </p>
          <p>
            <strong>Outcome Code:</strong> {result.outc_cod || "N/A"}
          </p>
          {result.risk_level === "high" && (
            <p className="warning">
              ⚠️ This drug is flagged for manager review.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
