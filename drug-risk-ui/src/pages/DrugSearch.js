import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import './DrugSearch.css';

const drugData = [
  { name: 'Paracetamol', risk: 'low' },
  { name: 'Paclitaxel', risk: 'high' },
  { name: 'Palbociclib', risk: 'low' },
  { name: 'Paliperidone', risk: 'low' },
  { name: 'Palivizumab', risk: 'low' },
  { name: 'Palonosetron', risk: 'low' },
  { name: 'Pamidronate', risk: 'high' },
  { name: 'Pazopanib', risk: 'medium' },
  { name: 'Paroxetine', risk: 'low' },
];

export default function DrugSearch({ onAddDrug }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const filtered = drugData.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
    setResults(filtered);
  }, [query]);

  const handleAdd = (drug) => {
    onAddDrug(drug);
  };

  return (
    <div className="left-panel">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter drug name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="results-list">
        {results.map((drug, i) => (
          <div key={i} className="drug-item">
            <div className="drug-info">
              <span>{drug.name}</span>
              <span className={`risk-dot ${drug.risk}`}></span>
            </div>
            <button className="add-button" onClick={() => handleAdd(drug)} title="Add drug">
              <FaPlus />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
