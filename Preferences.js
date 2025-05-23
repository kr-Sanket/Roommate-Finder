import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Preferences.css";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const blocks = ["A", "B", "C", "D", "D-ANNEX", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T"];

const Preferences = () => {
  const [user, setUser] = useState(null);
  const [gender, setGender] = useState("");
  const [roomType, setRoomType] = useState("");
  const [bedType, setBedType] = useState("");
  const [block, setBlock] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [rank, setRank] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ============================
  // 1. Fetch Preferences on Load
  // ============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);
      try {
        const prefDoc = await getDoc(doc(db, "preferences", currentUser.uid));
        if (prefDoc.exists()) {
          const data = prefDoc.data();
          setGender(data.gender || "");
          setRoomType(data.roomType || "");
          setBedType(data.bedType || "");
          setBlock(data.block || "");
          setCgpa(data.cgpa?.toString() || ""); // Convert number to string for input
          setRank(data.rank?.toString() || ""); // Convert number to string for input
          setLocation(data.location || "");
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // ============================
  // 2. Save Preferences
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to save preferences.");
      return;
    }

    // Validate inputs
    const cgpaValue = parseFloat(cgpa);
    const rankValue = parseInt(rank, 10);

    if (isNaN(cgpaValue) || cgpaValue < 0 || cgpaValue > 10) {
      alert("CGPA should be between 0 and 10.");
      return;
    }

    if (isNaN(rankValue) || rankValue <= 0) {
      alert("Rank should be a positive number.");
      return;
    }

    // Prepare data for Firestore
    const preferences = {
      gender,
      roomType,
      bedType,
      block,
      cgpa: cgpaValue,
      rank: rankValue,
      location
    };

    try {
      await setDoc(doc(db, "preferences", user.uid), preferences, { merge: true });
      navigate("/dashboard", { state: { refresh: true } }); // Trigger re-fetch in Dashboard
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Check console for details.");
    }
  };

  // ============================
  // 3. Loading State
  // ============================
  if (loading) {
    return <div className="loading">Loading preferences...</div>;
  }

  return (
    <div className="preferences-container">
      <h2>Set Your Room Preferences</h2>
      <form onSubmit={handleSubmit}>
        {/* Gender */}
        <label>Gender:</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        {/* Room Type */}
        <label>Room Type:</label>
        <select value={roomType} onChange={(e) => setRoomType(e.target.value)} required>
          <option value="">Select</option>
          <option value="AC">AC</option>
          <option value="Non-AC">Non-AC</option>
        </select>

        {/* Bed Type */}
        <label>Bed Type:</label>
        <select value={bedType} onChange={(e) => setBedType(e.target.value)} required>
          <option value="">Select</option>
          <option value="2 Bed">2 Bed</option>
          <option value="3 Bed">3 Bed</option>
          <option value="4 Bed">4 Bed</option>
          <option value="6 Bed">6 Bed</option>
          <option value="8 Bed">8 Bed</option>
        </select>

        {/* Block */}
        <label>Block:</label>
        <select value={block} onChange={(e) => setBlock(e.target.value)} required>
          <option value="">Select Block</option>
          {blocks.map((blockCode, index) => (
            <option key={index} value={blockCode}>Block {blockCode}</option>
          ))}
        </select>

        {/* CGPA */}
        <label>CGPA:</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="10"
          value={cgpa}
          onChange={(e) => setCgpa(e.target.value)}
          required
        />

        {/* Rank */}
        <label>VIT Rank:</label>
        <input
          type="number"
          min="1"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          required
        />

        {/* Location */}
        <label>Home Location:</label>
        <select value={location} onChange={(e) => setLocation(e.target.value)} required>
          <option value="">Select State</option>
          {indianStates.map((state, index) => (
            <option key={index} value={state}>{state}</option>
          ))}
        </select>

        {/* Submit Button */}
        <button type="submit">Save Preferences</button>
      </form>
    </div>
  );
};

export default Preferences;
