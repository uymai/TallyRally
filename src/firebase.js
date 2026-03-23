import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  runTransaction,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore'

// TODO: Replace with your Firebase project config
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or use an existing one)
// 3. Add a web app and copy the config below
// 4. Enable Cloud Firestore in the Firebase console
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export {
  db,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  runTransaction,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
}
