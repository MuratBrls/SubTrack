import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';

// TODO: REPLACE THIS WITH YOUR REAL FIREBASE CONFIGURATION
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Enable Authentication -> Sign-in method -> Google, Apple, and Email/Password
// 4. Copy the config object below
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:000000000000000000"
};

// Initialize Firebase
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let appleProvider: OAuthProvider | undefined;

try {
  // Check if config is real before initializing to prevent immediate crash on demo
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');

    appleProvider = new OAuthProvider('apple.com');
    appleProvider.addScope('email');
    appleProvider.addScope('name');
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { 
  auth, 
  googleProvider, 
  appleProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";