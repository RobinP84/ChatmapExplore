import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { firebaseApp } from "./firebaseConfig";

// Initialize Firebase Auth and a provider (e.g., Google)
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    console.error("Error with Firebase Google Sign-in", error);
    throw error;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during Firebase sign-out", error);
    throw error;
  }
}

export function onAuthStateChanged(callback) {
  // This returns an unsubscribe function so you can clean up in your components
  return auth.onAuthStateChanged(callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}