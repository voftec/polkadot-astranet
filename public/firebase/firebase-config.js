// public/firebase/firebase-config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAg8Eza9ETRPCRwjnt1rJoBdmqkqXunDAI",
  authDomain: "voftec.firebaseapp.com",
  databaseURL: "https://voftec-default-rtdb.firebaseio.com",
  projectId: "voftec",
  storageBucket: "voftec.firebasestorage.app",
  messagingSenderId: "485422164439",
  appId: "1:485422164439:web:22187c2d498e17022bc392",
  measurementId: "G-6X4EG9SWP5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

// Export the initialized services
export {
  app,
  database,
  auth,
  analytics,
  firebaseConfig
};

// Export default configuration
export default firebaseConfig;
