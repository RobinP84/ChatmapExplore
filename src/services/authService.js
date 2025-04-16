import * as firebaseAuth from "../firebase/firebaseAuth";

// You could structure this as an object with methods
const authService = {
  signInWithGoogle: firebaseAuth.signInWithGoogle,
  logOut: firebaseAuth.logOut,
  onAuthStateChanged: firebaseAuth.onAuthStateChanged,
  getCurrentUser: firebaseAuth.getCurrentUser,
};

export default authService;