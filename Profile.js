import React, { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth } from "../firebase";
import "./Profile.css";

const db = getFirestore();

const Profile = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    degree: "",
    year: "",
    branch: "",
    gender: "",
    contact: "",
    hometown: "",
    bio: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          const userDataFromAuth = {
            name: user.displayName || "",
            email: user.email || "",
          };
          setUserData(userDataFromAuth);
          await setDoc(userDocRef, userDataFromAuth);
        }
      } catch (error) {
        console.error("Error fetching profile:", error.message);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const degrees = ["B.Tech", "M.Tech", "B.Sc", "M.Sc", "BBA", "MBA", "BA", "MA", "B.Com", "M.Com"];

  const getYearOptions = () => {
    if (["B.Tech", "B.Sc", "BBA", "BA", "B.Com"].includes(userData.degree)) {
      return ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    } else if (["M.Tech", "M.Sc", "MBA", "MA", "M.Com"].includes(userData.degree)) {
      return ["1st Year", "2nd Year"];
    }
    return [];
  };

  const branches = [
    "Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
    "Electronics & Communication", "Information Technology", "Chemical Engineering", 
    "Aerospace Engineering", "Biotechnology", "Automobile Engineering"
  ];

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), userData);
      alert("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <h2>Profile</h2>

      <div className="profile-details">
        <label>Name:</label>
        <input type="text" name="name" value={userData.name} disabled />

        <label>Email:</label>
        <input type="text" name="email" value={userData.email} disabled />

        <label>Degree:</label>
        <select name="degree" value={userData.degree} onChange={handleChange}>
          <option value="">Select Degree</option>
          {degrees.map((deg, index) => (
            <option key={index} value={deg}>{deg}</option>
          ))}
        </select>

        {userData.degree && (
          <>
            <label>Year:</label>
            <select name="year" value={userData.year} onChange={handleChange}>
              <option value="">Select Year</option>
              {getYearOptions().map((year, index) => (
                <option key={index} value={year}>{year}</option>
              ))}
            </select>
          </>
        )}

        <label>Branch:</label>
        <select name="branch" value={userData.branch} onChange={handleChange}>
          <option value="">Select Branch</option>
          {branches.map((branch, index) => (
            <option key={index} value={branch}>{branch}</option>
          ))}
        </select>

        <label>Gender:</label>
        <select name="gender" value={userData.gender} onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <label>Contact:</label>
        <input type="text" name="contact" value={userData.contact} onChange={handleChange} placeholder="Enter your contact" />

        <label>Hometown:</label>
        <select name="hometown" value={userData.hometown} onChange={handleChange}>
          <option value="">Select State</option>
          {states.map((state, index) => (
            <option key={index} value={state}>{state}</option>
          ))}
        </select>

        <label>Bio:</label>
        <textarea name="bio" value={userData.bio} onChange={handleChange} placeholder="Write something about yourself"></textarea>
      </div>

      <button className="save-btn" onClick={handleSaveProfile}>Save Profile</button>
    </div>
  );
};

export default Profile;
