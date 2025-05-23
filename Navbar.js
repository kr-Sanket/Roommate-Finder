import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Import Firebase authentication
import { signOut, onAuthStateChanged } from "firebase/auth";
import "./Navbar.css";

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [setIsAuthenticated]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li>
          <Link to="/" onClick={(e) => {
            e.preventDefault();
            setTimeout(() => {
              document.getElementById("footer-section")?.scrollIntoView({ behavior: "smooth" });
            }, 100); // Delay ensures smooth transition after route change
          }}>
            Contact
          </Link>
        </li>


        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><a href="/roommates">Roommates</a></li>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
