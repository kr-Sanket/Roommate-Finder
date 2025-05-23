import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
    doc,
    getDoc, getDocs,
    collection,
    query,
    where,
    onSnapshot,
    deleteDoc,
    or,
    and
} from "firebase/firestore";
import "./Roommates.css";
import PropTypes from "prop-types";

const Roommates = ({ user }) => {
    const [confirmedRoommates, setConfirmedRoommates] = useState([]);

    useEffect(() => {
        if (!user?.uid) return;

        const confirmedQuery = query(
            collection(db, "confirmedRoommates"),
            or(
                where("user1", "==", user.uid),
                where("user2", "==", user.uid)
            )
        );

        const unsubscribe = onSnapshot(confirmedQuery, async (snapshot) => {
            const roommates = await Promise.all(
                snapshot.docs.map(async (docSnapshot) => {
                    const data = docSnapshot.data();
                    const otherUserId = data.user1 === user.uid ? data.user2 : data.user1;
                    const userDocRef = doc(db, "users", otherUserId);
                    const userDoc = await getDoc(userDocRef);

                    return {
                        id: docSnapshot.id,
                        otherUserId,
                        name: userDoc.exists() ? userDoc.data().name : "Unknown User",
                    };
                })
            );
            setConfirmedRoommates(roommates);
        });

        return () => unsubscribe();
    }, [user]);

    const removeRoommate = async (docId, otherUserId) => {
        try {
            // 1. Delete confirmed roommate
            await deleteDoc(doc(db, "confirmedRoommates", docId));

            // 2. Delete ALL related requests
            const q = query(
                collection(db, "requests"),
                or(
                    and(where("senderId", "==", user.uid), where("receiverId", "==", otherUserId)),
                    and(where("senderId", "==", otherUserId), where("receiverId", "==", user.uid))
                )
            );

            const snapshot = await getDocs(q);
            snapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            // 3. Update local state
            setConfirmedRoommates(prev => prev.filter(r => r.id !== docId));
        } catch (error) {
            console.error("Error removing roommate:", error);
        }
    };

    return (
        <div className="roommates-container">
            <h1>Confirmed Roommates</h1>
            {confirmedRoommates.length === 0 ? (
                <p>No confirmed roommates yet.</p>
            ) : (
                <div className="roommate-list">
                    {confirmedRoommates.map((roommate) => (
                        <div key={roommate.id} className="roommate-card">
                            <h3>{roommate.name}</h3>
                            <button
                                className="remove-button"
                                onClick={() => removeRoommate(roommate.id, roommate.otherUserId)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

Roommates.propTypes = {
    user: PropTypes.shape({
        uid: PropTypes.string.isRequired,
    }).isRequired,
};

export default Roommates;
