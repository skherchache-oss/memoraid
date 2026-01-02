
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

/**
 * CONFIGURATION FIREBASE
 */
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "VOTRE_CLE_API_REELLE_ICI",
  authDomain: "memoraid-7cd9d.firebaseapp.com",
  projectId: "memoraid-7cd9d",
  storageBucket: "memoraid-7cd9d.firebasestorage.app",
  messagingSenderId: "424814765916",
  appId: "1:424814765916:web:aaba185d4dbab2af52c399",
  measurementId: "G-XV1V591X9M"
};

let auth: any = null;
let db: any = null;
let functions: any = null;
let analytics: any = null;
const googleProvider = new GoogleAuthProvider();

try {
    const app = initializeApp(firebaseConfig);
    
    if (typeof window !== 'undefined') {
        isSupported().then(yes => {
            if (yes) analytics = getAnalytics(app);
        }).catch(e => console.warn("Analytics non supporté:", e));
    }

    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, "europe-west1"); // Recommandé: spécifier la région
    console.log("Firebase & Functions initialisés.");
} catch (error) {
    console.error("Erreur d'initialisation Firebase:", error);
}

export { auth, db, functions, googleProvider, analytics };
