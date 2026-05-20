// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: 🔥 YAHAN APNI FIREBASE CONFIG KEYS PASTE KAREIN 🔥
// Jo code aapko Firebase console se milega, use is jagah paste karein.
const firebaseConfig = {
  apiKey: "AIzaSyBxIbLbMI1DVoTFNCvDJ4zKhPjzS1Jaw7w",
  authDomain: "axl-codex-c5c59.firebaseapp.com",
  projectId: "axl-codex-c5c59",
  storageBucket: "axl-codex-c5c59.firebasestorage.app",
  messagingSenderId: "678741235554",
  appId: "1:678741235554:web:fbfd065db65dfd73607e3b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Admin Email configuration
// TODO: 🔥 YAHAN APNA ADMIN EMAIL SET KAREIN 🔥
export const ADMIN_EMAIL = "vikasstm2003@gmail.com"; 
