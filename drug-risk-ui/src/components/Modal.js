// src/pages/Modal.js
import React from 'react';
import './Modal.css';

export default function Modal({ drug, alternatives, onSelect, onProceed, onClose }) {
  if (!drug) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2>High-Risk Drug Alert</h2>
        <p>
          <strong >{drug.name}</strong> is classified as a <span className={`risk-label ${drug.risk}`}>{drug.risk}</span> risk drug.
        </p>

        {alternatives.length > 0 ? (
          <>
            <p>Select a safer alternative below:</p>
            <ul className="alt-list">
              {alternatives.map((alt, i) => (
                <li key={i}>
                  <button className="alt-btn" onClick={() => onSelect(alt)}>
                    {alt.name} <span className={`risk-dot ${alt.risk}`}></span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No low/medium risk alternatives available.</p>
        )}

        <div className="modal-actions">
          <button className="proceed-btn" onClick={onProceed}>Proceed with {drug.name}</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
