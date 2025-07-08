import { useState } from 'react';
import axios from '../api';

export default function DrugSearch({ onResult }) {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const response = await axios.get(`/predict-risk?name=${encodeURIComponent(name)}`);
    onResult(response.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter drug name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Check Risk</button>
    </form>
  );
}
