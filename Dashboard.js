import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc, getDoc, collection, query,
  where, setDoc, onSnapshot, getDocs, or, and
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Dashboard.css";
import { serverTimestamp } from "firebase/firestore";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [confirmedRoommates, setConfirmedRoommates] = useState([]);
  const navigate = useNavigate();

  // Authentication & Preferences
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() || {};
        setUserName(userData.name || "User");

        const prefDoc = await getDoc(doc(db, "preferences", currentUser.uid));
        if (!prefDoc.exists()) {
          navigate("/preferences");
          return;
        }

        const mergedPreferences = {
          ...prefDoc.data(),
          branch: userData.branch || "Not specified"
        };
        setPreferences(mergedPreferences);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Real-Time Confirmed Roommates
  useEffect(() => {
    if (!user?.uid) return;

    const confirmedQuery = query(
      collection(db, "confirmedRoommates"),
      or(
        where("user1", "==", user.uid),
        where("user2", "==", user.uid)
      )
    );

    const unsubscribe = onSnapshot(confirmedQuery, (snapshot) => {
      const roommates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConfirmedRoommates(roommates);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-Time Matches with Confirmed Filtering
  useEffect(() => {
    if (!user?.uid || !preferences?.gender) return;

    const usersQuery = query(
      collection(db, "users"),
      where("gender", "==", preferences.gender)
    );

    const prefsQuery = query(
      collection(db, "preferences"),
      where("roomType", "==", preferences.roomType),
      where("bedType", "==", preferences.bedType)
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (usersSnapshot) => {
      const users = usersSnapshot.docs
        .filter(doc => doc.id !== user.uid)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      const unsubscribePrefs = onSnapshot(prefsQuery, (prefsSnapshot) => {
        const prefs = prefsSnapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));

        const combinedMatches = users
          .map(user => {
            const userPrefs = prefs.find(p => p.id === user.id);
            return userPrefs ? { ...user, ...userPrefs } : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.rank - b.rank);

        const filteredMatches = combinedMatches.filter(match =>
          !confirmedRoommates.some(r =>
            r.user1 === match.id || r.user2 === match.id
          )
        );

        setMatches(filteredMatches);
      });
      return unsubscribePrefs;
    });
    return () => unsubscribeUsers();
  }, [user, preferences, confirmedRoommates]);

  // Optimized Request Status Checker
  const matchStatuses = useMemo(() => {
    const statuses = {};
    matches.forEach(match => {
      const isConfirmed = confirmedRoommates.some(r =>
        r.user1 === match.id || r.user2 === match.id
      );
      const isPending = sentRequests.some(r => r.receiverId === match.id) ||
        incomingRequests.some(r => r.senderId === match.id);

      statuses[match.id] = isConfirmed ? "confirmed" : isPending ? "pending" : null;
    });
    return statuses;
  }, [matches, confirmedRoommates, sentRequests, incomingRequests]);

  // Send Request Handler with Instant UI Feedback
  const sendRequest = async (receiverId) => {
    if (matchStatuses[receiverId]) {
      alert(matchStatuses[receiverId] === "confirmed"
        ? "You're already confirmed!"
        : "Request already pending!");
      return;
    }

    const docId = `${user.uid}_${receiverId}`.replace(/[^\w-]/g, '');

    try {
      // Immediate UI update
      setSentRequests(prev => [...prev, {
        id: docId,
        receiverId,
        status: "pending",
        timestamp: new Date().toISOString()
      }]);

      await setDoc(doc(db, "requests", docId), {
        senderId: user.uid,
        receiverId,
        status: "pending",
        timestamp: serverTimestamp()
      });
    } catch (error) {
      setSentRequests(prev => prev.filter(r => r.id !== docId));
      console.error("Request failed:", error);
    }
  };

  // Handle Request Actions with Optimistic Updates
  const handleRequest = async (requestId, action) => {
    try {
      // Immediate local state update for both users
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      setSentRequests(prev => prev.map(request =>
        request.id === requestId ? { ...request, status: action } : request
      ));

      if (action === "accepted") {
        const requestDoc = await getDoc(doc(db, "requests", requestId));
        const { senderId, receiverId } = requestDoc.data();

        // Optimistic confirmed roommate update
        const pairId = [senderId, receiverId].sort().join('_');
        setConfirmedRoommates(prev => [...prev, {
          id: pairId,
          user1: senderId,
          user2: receiverId
        }]);

        // Atomic Firestore updates
        await Promise.all([
          setDoc(doc(db, "requests", requestId), {
            status: "accepted",
            timestamp: serverTimestamp()
          }, { merge: true }),
          setDoc(doc(db, "confirmedRoommates", pairId), {
            user1: senderId,
            user2: receiverId,
            timestamp: serverTimestamp()
          })
        ]);
      } else {
        // Update both sender and receiver's request status
        await setDoc(doc(db, "requests", requestId), {
          status: "rejected",
          timestamp: serverTimestamp()
        }, { merge: true });
      }

    } catch (error) {
      // Rollback on error
      console.error(`Error ${action} request:`, error);
      setIncomingRequests(prev => [...prev]);
      setSentRequests(prev => prev.map(request =>
        request.id === requestId ? { ...request, status: "pending" } : request
      ));
    }
  };


  // Real-Time Requests Listener (Only Pending)
  useEffect(() => {
    if (!user?.uid) return;

    const userCache = {};
    const fetchUserName = async (userId) => {
      if (userCache[userId]) return userCache[userId];
      const userDoc = await getDoc(doc(db, "users", userId));
      const name = userDoc.exists() ? userDoc.data().name : "Unknown User";
      userCache[userId] = name;
      return name;
    };

    // Incoming Requests (Only Pending)
    const incomingQuery = query(
      collection(db, "requests"),
      and(
        where("receiverId", "==", user.uid),
        where("status", "==", "pending") // Add status filter
      )
    );

    const incomingUnsubscribe = onSnapshot(incomingQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async doc => ({
          id: doc.id,
          ...doc.data(),
          senderName: await fetchUserName(doc.data().senderId)
        }))
      );
      setIncomingRequests(requests);
    });

    // Sent Requests (All Statuses)
    const sentQuery = query(
      collection(db, "requests"),
      and(
        where("senderId", "==", user.uid),
        where("status", "in", ["pending", "accepted"]) // Filter out rejected
      )
    );

    const sentUnsubscribe = onSnapshot(sentQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async doc => ({
          id: doc.id,
          ...doc.data(),
          receiverName: await fetchUserName(doc.data().receiverId)
        }))
      );
      setSentRequests(requests);
    });

    return () => {
      incomingUnsubscribe();
      sentUnsubscribe();
    };
  }, [user]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="header-section">
        <h1>Welcome {userName}!</h1>
        <div className="preferences-summary">
          <h2>Your Preferences</h2>
          <div className="preference-card">
            <div className="preference-item">
              <span>Branch:</span>
              <strong>{preferences?.branch || "Not specified"}</strong>
            </div>
            <div className="preference-item">
              <span>Room Type:</span>
              <strong>{preferences?.roomType || "Not specified"}</strong>
            </div>
            <div className="preference-item">
              <span>Bed Type:</span>
              <strong>{preferences?.bedType || "Not specified"}</strong>
            </div>
            <button
              className="edit-preferences"
              onClick={() => navigate("/preferences")}
            >
              Edit Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Matches Section */}
        <div className="matches-section">
          <h2>Recommended Roommates</h2>
          {matches.length === 0 ? (
            <div className="no-matches">
              <p>No matches found with current preferences</p>
            </div>
          ) : (
            <>
              <div className="branch-group">
                <h3>Your Branch ({preferences?.branch})</h3>
                <div className="matches-grid">
                  {matches.filter(m => m.branch === preferences?.branch).map(match => (
                    <div key={match.id} className="match-card">
                      <h3>{match.name || "Anonymous"}</h3>
                      <p><strong>Rank:</strong> #{match.rank}</p>
                      <p><strong>Room Type:</strong> {match.roomType}</p>
                      <p><strong>Bed Type:</strong> {match.bedType}</p>
                      {matchStatuses[match.id] === "confirmed" ? (
                        <div className="confirmed-status">✅ Confirmed</div>
                      ) : matchStatuses[match.id] === "pending" ? (
                        <button className="pending-button" disabled>
                          Request Pending
                        </button>
                      ) : (
                        <button
                          className="send-request"
                          onClick={() => sendRequest(match.id)}
                        >
                          Send Request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="branch-group">
                <h3>Other Branches</h3>
                <div className="matches-grid">
                  {matches.filter(m => m.branch !== preferences?.branch).map(match => (
                    <div key={match.id} className="match-card">
                      <h3>{match.name || "Anonymous"}</h3>
                      <p><strong>Rank:</strong> #{match.rank}</p>
                      <p><strong>Branch:</strong> {match.branch}</p>
                      <p><strong>Room Type:</strong> {match.roomType}</p>
                      <p><strong>Bed Type:</strong> {match.bedType}</p>
                      {matchStatuses[match.id] === "confirmed" ? (
                        <div className="confirmed-status">✅ Confirmed</div>
                      ) : matchStatuses[match.id] === "pending" ? (
                        <button className="pending-button" disabled>
                          Request Pending
                        </button>
                      ) : (
                        <button
                          className="send-request"
                          onClick={() => sendRequest(match.id)}
                        >
                          Send Request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Requests Section */}
        <div className="requests-section">
          <div className="incoming-requests">
            <h2>Incoming Requests ({incomingRequests.length})</h2>
            {incomingRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <span><strong>From:</strong> {request.senderName}</span>
                  <span className={`request-status ${request.status}`}>
                    {request.status}
                  </span>
                </div>
                {request.status === "pending" && (
                  <div className="request-actions">
                    <button
                      className="accept-button"
                      onClick={() => handleRequest(request.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-button"
                      onClick={() => handleRequest(request.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sent-requests">
            <h2>Sent Requests ({sentRequests.length})</h2>
            {sentRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <span><strong>To:</strong> {request.receiverName}</span>
                  <span className={`request-status ${request.status}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
