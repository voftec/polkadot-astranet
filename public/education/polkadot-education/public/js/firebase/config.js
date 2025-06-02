/**
 * config.js
 * 
 * Firebase configuration and initialization for the Polkadot Educational Web Platform.
 * This module provides environment-specific configurations and initializes Firebase services.
 */

// Import Firebase SDK modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

/**
 * Environment-specific Firebase configurations
 */
const firebaseConfigs = {
  development: {
    apiKey: process.env.FIREBASE_API_KEY || "YOUR_DEV_API_KEY", // Replace in production
    authDomain: "polkadot-edu-dev.firebaseapp.com",
    projectId: "polkadot-edu-dev",
    storageBucket: "polkadot-edu-dev.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456",
    measurementId: "G-DEV123456",
    databaseURL: "https://polkadot-edu-dev.firebaseio.com"
  },
  production: {
    // In production, all values should be loaded from environment variables
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  }
};

/**
 * Determine the current environment
 * @returns {string} - 'development' or 'production'
 */
function getEnvironment() {
  // Check for environment variables, URL parameters, or other indicators
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    return 'production';
  }
  return 'development';
}

/**
 * Get the appropriate Firebase configuration based on environment
 * @returns {Object} - Firebase configuration object
 */
function getFirebaseConfig() {
  const env = getEnvironment();
  console.log(`Initializing Firebase in ${env} environment`);
  return firebaseConfigs[env];
}

// Initialize Firebase with the appropriate configuration
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

// Initialize App Check for security (only in production)
if (getEnvironment() === 'production') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

/**
 * Firebase instance and services
 */
const firebase = {
  app,
  auth,
  firestore,
  database,
  config: firebaseConfig
};

// Export Firebase instance and services
export default firebase;