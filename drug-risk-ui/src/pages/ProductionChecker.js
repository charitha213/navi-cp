import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const flagDrug = async (drugname) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/production/production/production/flag`,
      { drugname }
    );
    return res.data;
  } catch (error) {
    console.error("Error flagging drug:", error);
    throw error;
  }
};

export const getAllFlaggedDrugs = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/production/production/production/flagged`
    );
    return res.data;
  } catch (error) {
    console.error("Error loading flagged drugs:", error);
    return [];
  }
};

export const suppressDrug = async (drugname) => {
  await axios.post(
    `${BASE_URL}/production/production/production/suppress/${drugname}`
  );
};

export const unsuppressDrug = async (drugname) => {
  await axios.post(
    `${BASE_URL}/production/production/production/unsuppress/${drugname}`
  );
};

export const deleteDrug = async (drugname) => {
  try {
    await axios.delete(
      `${BASE_URL}/production/production/production/delete/${drugname}`
    );
  } catch (error) {
    console.error("Error deleting drug:", error);
    throw error;
  }
};

export const updateAlternatives = async (drugname, alternatives) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/production/production/production/update_alternatives/${drugname}`,
      {
        alternatives,
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating alternatives:", error);
    throw error;
  }
};

export const hideDrug = async (drugname) => {
  try {
    await axios.post(
      `${BASE_URL}/production/production/production/hide/${drugname}`
    );
  } catch (error) {
    console.error("Error hiding drug:", error);
    throw error;
  }
};

export const addUser = async (username, password, name, email, role) => {
  try {
    console.log("Sending addUser request with data:", {
      username,
      password,
      name,
      email,
      role,
    }); // Debug payload
    const res = await axios.post(
      `${BASE_URL}/production/production/production/add_user`, // Corrected path
      { username, password, name, email, role },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("addUser response:", res.data); // Debug response
    return res.data;
  } catch (error) {
    console.error(
      "addUser error response:",
      error.response?.data || error.message
    );
    throw error;
  }
};
