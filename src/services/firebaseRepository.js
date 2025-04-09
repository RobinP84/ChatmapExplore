// src/repositories/firebaseRepository.js
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";

const db = getFirestore(firebaseApp);

export async function fetchPosts(viewedArea) {
  // Define your Firebase query using viewedArea and any other filters
  const postsRef = collection(db, "posts");
  const snapshot = await getDocs(postsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function insertPost(postData) {
  const postsRef = collection(db, "posts");
  const dataToSend = {
    ...postData,
    added: serverTimestamp(),
  };
  const docRef = await addDoc(postsRef, dataToSend);
  return docRef.id;
}