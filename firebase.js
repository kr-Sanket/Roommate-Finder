import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBwbk61Iosxn_SGXlTeGpPbLQs7p7MrADE",
    authDomain: "roommate-finder-46900.firebaseapp.com",
    projectId: "roommate-finder-46900",
    storageBucket: "roommate-finder-46900.appspot.com",
    messagingSenderId: "896039398740",
    appId: "1:896039398740:web:83f23761973b68755decc1",
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };