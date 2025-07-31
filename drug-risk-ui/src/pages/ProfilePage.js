import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [age, setAge] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        const response = await axios.get(
          "http://127.0.0.1:8000/production/production/production/profile", // Original endpoint for all roles
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setUser(response.data);
        if (response.data.role === "patient") {
          setAge(response.data.age || "");
          setAddress({
            street: response.data.address?.split(",")[0] || "",
            city: response.data.address?.split(",")[1] || "",
            state: response.data.address?.split(",")[2] || "",
            postalCode: response.data.address?.split(",")[3] || "",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load profile");
        const mockUser = {
          username: "testuser",
          name: "Test User",
          email: "test@example.com",
          role: "manager",
        };
        setUser(mockUser);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    if (
      !age ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.postalCode
    ) {
      setMessage("All fields are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const fullAddress = `${address.street}, ${address.city}, ${address.state}, ${address.postalCode}`;
      await axios.put(
        "http://127.0.0.1:8000/patient/patient/profile", // New PUT endpoint for patient update
        { age: parseInt(age), address: fullAddress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUser((prev) => ({
        ...prev,
        age,
        address: fullAddress,
        is_profile_complete: true,
      }));
      setEditMode(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Failed to update profile. Please try again.");
      console.error(err);
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;

  const getStyleClass = () => {
    switch (user.role) {
      case "manager":
        return "profile-manager";
      case "doctor":
        return "profile-doctor";
      case "production":
        return "profile-production";
      default:
        return "profile-default";
    }
  };

  const getReportingInfo = () => {
    if (user.role === "doctor" && user.reporting) {
      return (
        <div className="profile-reporting">
          <h3>Reporting Admin</h3>
          <p>
            <strong>Admin Name:</strong> {user.reporting.adminName}
          </p>
          <p>
            <strong>Admin Email:</strong> {user.reporting.adminEmail}
          </p>
        </div>
      );
    } else if (user.role === "production" && user.reporting) {
      return (
        <div className="profile-reporting">
          <h3>Reporting Manager</h3>
          <p>
            <strong>Manager Name:</strong> {user.reporting.managerName}
          </p>
          <p>
            <strong>Manager Email:</strong> {user.reporting.managerEmail}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`profile-wrapper ${getStyleClass()}`}>
      <div className="profile-card">
        <h1 className="profile-header">User Profile</h1>
        <div className="profile-details">
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          {user.role === "patient" && (
            <div>
              {editMode ? (
                <div className="profile-edit">
                  <div className="profile-field">
                    <label>Age:</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Enter age"
                      required
                    />
                  </div>
                  <div className="profile-address">
                    <h3>Address</h3>
                    <div className="address-field">
                      <label>Street:</label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) =>
                          setAddress({ ...address, street: e.target.value })
                        }
                        placeholder="Street address"
                        required
                      />
                    </div>
                    <div className="address-field">
                      <label>City:</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="address-field">
                      <label>State:</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) =>
                          setAddress({ ...address, state: e.target.value })
                        }
                        placeholder="State"
                        required
                      />
                    </div>
                    <div className="address-field">
                      <label>Postal Code:</label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) =>
                          setAddress({ ...address, postalCode: e.target.value })
                        }
                        placeholder="Postal code"
                        required
                      />
                    </div>
                  </div>
                  <button className="profile-save" onClick={handleSave}>
                    Save
                  </button>
                  <button
                    className="profile-cancel"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                  {message && <p className="profile-message">{message}</p>}
                </div>
              ) : (
                <div>
                  <p>
                    <strong>Age:</strong> {user.age || "Not set"}
                  </p>
                  <p>
                    <strong>Address:</strong> {user.address || "Not set"}
                  </p>
                  <button
                    className="profile-edit-button"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}
          {user.role !== "patient" && getReportingInfo()}
        </div>
      </div>
    </div>
  );
}
