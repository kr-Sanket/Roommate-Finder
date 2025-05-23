import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import "./Home.css";

const Home = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    // Function to scroll to the top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div>
            {/* Hero Section */}
            <div className="home-container">
                <h1>Find Your Ideal Roommate</h1>
                <p>Connecting students to find the perfect match for their hostel rooms.</p>

                {!user && (
                    <div className="auth-buttons">
                        <Link to="/login" className="btn">Login</Link>
                        <Link to="/signup" className="btn">Signup</Link>
                    </div>
                )}
            </div>

            {/* Features Section */}
            <section className="features">
                <h2>Why Use Roommate Finder?</h2>
                <div className="feature-list">
                    <div className="feature-item">
                        <h3>🔍 Smart Matching</h3>
                        <p>Find roommates based on CGPA, branch, and preferences.</p>
                    </div>
                    <div className="feature-item">
                        <h3>📅 Hassle-Free Booking</h3>
                        <p>Reserve your room in just a few clicks.</p>
                    </div>
                    <div className="feature-item">
                        <h3>🔐 Secure & Private</h3>
                        <p>Your information is safe and only shared with your matches.</p>
                    </div>
                </div>
            </section>

            {/* Counseling Process Section */}
            <section className="counseling-process">
                <h2>How Hostel Room Counseling Works?</h2>
                <div className="process-list">
                    <div className="process-step">
                        <h3>📜 Step 1: Rank-Based Slot Allocation</h3>
                        <p>Students are assigned slots based on their CGPA ranks.</p>
                    </div>
                    <div className="process-step">
                        <h3>🏠 Step 2: Room Selection</h3>
                        <p>Students choose their preferred room type (e.g., 4-bed non-AC).</p>
                    </div>
                    <div className="process-step">
                        <h3>🤝 Step 3: Finding a Roommate</h3>
                        <p>Only the highest-ranked student in a group can finalize the room.</p>
                    </div>
                    <div className="process-step highlight">
                        <h3>✅ Our Solution: Find Compatible Roommates</h3>
                        <p>We help you find a roommate with matching preferences before finalizing a room.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="footer-section" className="footer">
                <p>&copy; 2025 Roommate Finder. All rights reserved.</p>
                <p>
                    📧 <a href="mailto:support@roommatefinder.com">support@roommatefinder.com</a> |
                    📞 +91 98765 43210
                </p>
                <p><Link to="/about">About Us</Link> | <Link to="/contact">Contact</Link></p>
                <h2>Developed By</h2>
                <p>👨‍💻 <a>**Sanket Kumar** – Student at VIT Vellore</a></p>
                <button className="scroll-up" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>⬆ Scroll to Top</button>
            </footer>

        </div>
    );
};

export default Home;
