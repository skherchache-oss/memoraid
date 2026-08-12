import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

/* -------------------------------------------------------------------------- */
/* CONFIG FIREBASE — SANDBOX                                                   */
/* -------------------------------------------------------------------------- */

const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.API_KEY || process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const firebaseConfig = {
  apiKey: getApiKey(),
  authDomain: "memoraid-sandbox.firebaseapp.com",
  projectId: "memoraid-sandbox",
  storageBucket: "memoraid-sandbox.appspot.com",
  messagingSenderId: "41010291417860",
  appId: "1:1010291417860:web:8ae86c5bfae532c3112651",
};

/* -------------------------------------------------------------------------- */
/* INITIALISATION SÉCURISÉE                                                    */
/* -------------------------------------------------------------------------- */

let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase init failed:", error);
}

/* -------------------------------------------------------------------------- */
/* SERVICES                                                                    */
/* -------------------------------------------------------------------------- */

export const auth = app ? getAuth(app) : null as any;
export const db = app ? getFirestore(app) : null as any;
export const functions = app ? getFunctions(app, "europe-west1") : null as any;

// CRITIQUE : Forcer la persistance locale avant toute autre action
if (auth) {
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("🔐 Auth persistence set to LOCAL"))
    .catch(console.error);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
