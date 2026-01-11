import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.API_KEY || "",
  authDomain: "memoraid-sandbox.firebaseapp.com",
  projectId: "memoraid-sandbox",
  storageBucket: "memoraid-sandbox.firebasestorage.app",
  messagingSenderId: "424814765916",
  appId: "1:424814765916:web:aaba185d4dbab2af52c399",
  measurementId: "G-XV1V591X9M"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

// CRUCIAL: Préciser la région europe-west1 ici
export const functions = getFunctions(app, "europe-west1"); 
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});