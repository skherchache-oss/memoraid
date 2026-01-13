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
/* CONFIG FIREBASE — MEMORAID                                              */
/* -------------------------------------------------------------------------- */

const firebaseConfig = {
  /* Fix: Use process.env which is pre-configured via Vite's 'define' to avoid ImportMeta type errors in certain environments */
  apiKey: (process.env as any).VITE_FIREBASE_API_KEY,
  authDomain: " memoraid-7cd9d.firebaseapp.com",
  projectId: " memoraid-7cd9d",
  storageBucket: " memoraid-7cd9d.firebasestorage.app",
  messagingSenderId: " 424814765916",
  appId: " 1:424814765916:web:aaba185d4dbab2af52c399",
};


/* -------------------------------------------------------------------------- */
/* INITIALISATION UNIQUE                                                       */
/* -------------------------------------------------------------------------- */

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* -------------------------------------------------------------------------- */
/* AUTH                                                                        */
/* -------------------------------------------------------------------------- */

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

/* -------------------------------------------------------------------------- */
/* FIRESTORE                                                                   */
/* -------------------------------------------------------------------------- */

export const db = getFirestore(app);

/* -------------------------------------------------------------------------- */
/* CLOUD FUNCTIONS (EUROPE-WEST1)                                               */
/* -------------------------------------------------------------------------- */

export const functions = getFunctions(app, "europe-west1");

/* -------------------------------------------------------------------------- */
/* GOOGLE AUTH PROVIDER                                                        */
/* -------------------------------------------------------------------------- */

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});