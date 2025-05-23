import React from "react";
import { Link } from "react-router-dom";
import "./About.css"; // Ensure proper styling

const About = () => {
  return (
    <div className="about-container">
      <h1>About Roommate Finder</h1>
      
      <section className="about-section">
        <h2>What is Roommate Finder?</h2>
        <p>
          Roommate Finder is a platform designed to help students find roommates based on their preferences. 
          Whether you're looking for someone with a similar academic schedule, living habits, or interests, our system 
          helps match you with the right people.
        </p>
      </section>

      <section className="about-section">
        <h2>How It Works?</h2>
        <ol>
          <li>🔹 **Sign Up**: Create an account and fill in your details.</li>
          <li>🔹 **Set Preferences**: Choose your CGPA, branch, and room type preferences.</li>
          <li>🔹 **Get Matched**: Our system matches you with other students based on your inputs.</li>
          <li>🔹 **Finalize Room**: The highest-ranked person in a group can finalize the room selection.</li>
        </ol>
      </section>

      <section className="about-section">
        <h2>Support & Contact</h2>
        <p>📧 Email: <a href="mailto:support@roommatefinder.com">support@roommatefinder.com</a></p>
        <p>📞 Phone: +91 98765 43210</p>
      </section>

      <section className="about-section">
        <h2>Developed By</h2>
        <p>👨‍💻 **Sanket Kumar** – Student at VIT Vellore</p>
      </section>

      <Link to="/" className="btn">Go to Home Page</Link>
    </div>
  );
};

export default About;
