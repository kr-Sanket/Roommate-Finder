import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // Ensure db is imported
import "./Auth.css";

const Signup = () => {
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Name is required!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
      });

      console.log("User Created:", user);
      navigate("/login"); // Redirect to login page
    } catch (err) {
      console.error("Signup Error:", err.message);
      setError(err.message || "Failed to create an account. Try again.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input type="text" placeholder="Enter Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        <button type="submit">Signup</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
};

export default Signup;
