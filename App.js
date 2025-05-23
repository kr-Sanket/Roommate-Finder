import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Roommates from "./pages/Roommates"; // Import Roommates page
import ErrorBoundary from "./pages/ErrorBoundary"; // Add ErrorBoundary import

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // Add loading state for authentication check

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setUserData(user);
      setAuthChecked(true); // Mark authentication check as complete
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return <div className="loading">Checking authentication...</div>; // Show loading state while checking auth
  }

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/preferences" element={isAuthenticated ? <Preferences /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />
        {/* Add new route for Roommates */}
        <Route path="/roommates" element={isAuthenticated ? <Roommates user={userData} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
