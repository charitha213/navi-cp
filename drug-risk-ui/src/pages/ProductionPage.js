import React, { useState } from "react";
import {
  checkDrugRisk,
  getAlternatives,
  getAllFlaggedDrugs,
} from "./ProductionChecker";
import AlternativeList from "../components/AlternativeList";

export default function ProductionPage() {
  const [drugInput, setDrugInput] = useState("");
  const [result, setResult] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [finalAction, setFinalAction] = useState(null);
  const [flagged, setFlagged] = useState(false);

  const handleCheck = () => {
    setFinalAction(null);
    const drug = checkDrugRisk(drugInput);
    if (!drug.found) {
      setResult({ found: false });
      setAlternatives([]);
      setFlagged(false);
      return;
    }

    setResult(drug);

    const highRisk = drug.risk_level === "high";
    setFlagged(
      highRisk &&
        getAllFlaggedDrugs().some(
          (d) => d.drugname.toUpperCase() === drug.drugname.toUpperCase()
        )
    );

    if (highRisk) {
      const alts = getAlternatives(drug.prod_ai, drug.drugname);
      setAlternatives(alts);
    } else {
      setAlternatives([]);
    }
  };

  const getSuppressionStatus = () => {
    const flaggedList = getAllFlaggedDrugs();
    const match = flaggedList.find(
      (d) => d.drugname.toUpperCase() === result.drugname.toUpperCase()
    );
    return match?.suppressed ? "Suppressed" : "Active";
  };

  return (
    <div className="container">
      <h2>🏭 Production Line Dashboard</h2>
      <p>Check formulation risk before manufacturing.</p>

      <div className="search-box">
        <input
          type="text"
          placeholder="Enter drug name..."
          value={drugInput}
          onChange={(e) => setDrugInput(e.target.value)}
        />
        <button onClick={handleCheck}>Check Risk</button>
      </div>

      {result && result.found === false && (
        <p style={{ color: "red" }}>Drug not found.</p>
      )}

      {result && result.found && (
        <div style={{ marginTop: "20px" }}>
          <h4>Result</h4>
          <p>
            <strong>Name:</strong> {result.drugname}
          </p>
          <p>
            <strong>Risk Level:</strong>{" "}
            <span
              style={{ color: result.risk_level === "high" ? "red" : "green" }}
            >
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
              <p>
                <strong>Manager Status:</strong>{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    color:
                      getSuppressionStatus() === "Suppressed"
                        ? "orange"
                        : "green",
                  }}
                >
                  {getSuppressionStatus()}
                </span>
              </p>

              <p className="warning">
                ⚠️ High-risk drug! Alternatives suggested:
              </p>

              <AlternativeList alternatives={alternatives} />

              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() =>
                    setFinalAction("Using suggested alternative drug")
                  }
                >
                  Use Alternative
                </button>
                <button
                  onClick={() =>
                    setFinalAction("Proceeding with high-risk drug")
                  }
                  style={{
                    marginLeft: "10px",
                    backgroundColor:
                      getSuppressionStatus() === "Suppressed" ? "#ccc" : "#f00",
                    color:
                      getSuppressionStatus() === "Suppressed"
                        ? "gray"
                        : "white",
                  }}
                  disabled={getSuppressionStatus() === "Suppressed"}
                >
                  Proceed Anyway
                </button>
                {!flagged && (
                  <button
                    onClick={() => {
                      checkDrugRisk(result.drugname);
                      setFlagged(true);
                    }}
                    style={{ marginLeft: "10px" }}
                  >
                    Flag for Manager
                  </button>
                )}
              </div>

              {finalAction && (
                <p style={{ marginTop: "10px", fontWeight: "bold" }}>
                  ✅ Action: {finalAction}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
