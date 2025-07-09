import React, { useState } from "react";
import "./DoctorDashboard.css";
import { generatePrescriptionPDF } from "./pdfUtils";
import Modal from "../components/Modal";

const drugData = [
  { name: "Paracetamol", risk: "low" },
  { name: "Paclitaxel", risk: "high" },
  { name: "Pazopanib", risk: "medium" },
  { name: "Palbociclib", risk: "low" },
  { name: "Paliperidone", risk: "low" },
  { name: "Palivizumab", risk: "low" },
  { name: "Palonosetron", risk: "low" },
  { name: "Pamidronate", risk: "high" },
  { name: "Paroxetine", risk: "low" },
];

export default function DoctorDashboard() {
  const [searchText, setSearchText] = useState("");
  const [prescription, setPrescription] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const handleAdd = (drug) => {
    if (prescription.some((d) => d.name === drug.name)) return;

    if (drug.risk === "high") {
      const altLow = drugData.filter(
        (d) => d.risk === "low" && d.name !== drug.name
      );
      const altMedium = drugData.filter(
        (d) => d.risk === "medium" && d.name !== drug.name
      );
      const alts = altLow.length > 0 ? altLow : altMedium;
      setAlternatives(alts);
      setSelectedDrug(drug);
      setShowModal(true);
    } else {
      addToPrescription(drug);
    }
  };

  const addToPrescription = (drug) => {
    setPrescription([
      ...prescription,
      {
        ...drug,
        dosage: "",
        morning: false,
        afternoon: false,
        night: false,
      },
    ]);
  };

  const handleSelectAlternative = (alt) => {
    addToPrescription(alt);
    setShowModal(false);
    setSelectedDrug(null);
  };

  const handleProceedWithHighRisk = () => {
    addToPrescription(selectedDrug);
    setShowModal(false);
    setSelectedDrug(null);
  };

  const updateField = (index, field, value) => {
    const updated = [...prescription];
    updated[index][field] = value;
    setPrescription(updated);
  };

  const filteredDrugs = drugData.filter((drug) =>
    drug.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="left-panel">
        <input
          type="text"
          placeholder="Search for medicines"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="results-list">
          {filteredDrugs.map((drug, i) => (
            <div key={i} className="drug-item">
              <div className="drug-info">
                <span>{drug.name}</span>
                <span className={`risk-dot ${drug.risk}`}></span>
              </div>
              <button onClick={() => handleAdd(drug)}>+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="right-panel">
        <div className="prescription-header">
          <button
            className="print-btn"
            onClick={() => generatePrescriptionPDF(prescription)}
          >
            Ready to Print Prescription ⬇
          </button>
        </div>
        <div className="prescription-body">
          {prescription.map((drug, i) => (
            <div className="prescription-line" key={i}>
              <div>
                <strong>{drug.name}</strong> ({drug.risk})
              </div>
              <input
                type="text"
                placeholder="Dosage"
                value={drug.dosage}
                onChange={(e) => updateField(i, "dosage", e.target.value)}
              />
              <div className="toggle-group">
                {["morning", "afternoon", "night"].map((time) => (
                  <label key={time} className="toggle-wrapper">
                    <input
                      type="checkbox"
                      checked={drug[time]}
                      onChange={(e) => updateField(i, time, e.target.checked)}
                    />
                    <span className="slider"></span>
                    <small>
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </small>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && selectedDrug && (
        <Modal
          drug={selectedDrug}
          alternatives={alternatives}
          onSelect={handleSelectAlternative}
          onProceed={handleProceedWithHighRisk}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
