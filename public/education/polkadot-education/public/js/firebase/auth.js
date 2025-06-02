/**
 * auth.js
 * 
 * Authentication functionality for the Polkadot Educational Web Platform.
 * This module provides methods for user authentication, including sign-up,
 * login, logout, social authentication, and user profile management.
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import firebase from './config.js';

/**
 * Authentication service for the Polkadot Educational Web Platform
 */
class AuthService {
  constructor() {
    this.auth = firebase.auth;
    this.firestore = firebase.firestore;
    this.authStateListeners = [];
    
    // Initialize auth state monitoring
    this._initAuthStateMonitoring();
  }

  /**
   * Initialize authentication state monitoring
   * @private
   */
  _initAuthStateMonitoring() {
    onAuthStateChanged(this.auth, (user) => {
      this._notifyAuthStateListeners(user);
    });
  }

  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} profileData - Additional profile data
   * @returns {Promise<Object>} - User data
   */
  async registerWithEmail(email, password, profileData = {}) {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with display name if provided
      if (profileData.displayName) {
        await updateProfile(user, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL || null
        });
      }
      
      // Create user profile document in Firestore
      await this._createUserProfile(user.uid, {
        email: user.email,
        displayName: profileData.displayName || '',
        photoURL: profileData.photoURL || '',
        createdAt: new Date().toISOString(),
        ...profileData
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      return this._formatUserData(user);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data
   */
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return this._formatUserData(userCredential.user);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * @returns {Promise<Object>} - User data
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
      
      // Check if user profile exists, create if not
      const userProfile = await this._getUserProfile(user.uid);
      if (!userProfile) {
        await this._createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }
      
      return this._formatUserData(user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * Sign in with GitHub
   * @returns {Promise<Object>} - User data
   */
  async loginWithGithub() {
    try {
      const provider = new GithubAuthProvider();
      provider.addScope('read:user');
      provider.addScope('user:email');
      
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
      
      // Check if user profile exists, create if not
      const userProfile = await this._getUserProfile(user.uid);
      if (!userProfile) {
        await this._createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }
      
      return this._formatUserData(user);
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null} - Current user or null if not authenticated
   */
  getCurrentUser() {
    const user = this.auth.currentUser;
    return user ? this._formatUserData(user) : null;
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated user data
   */
  async updateUserProfile(profileData) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      // Update authentication profile
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(user, {
          displayName: profileData.displayName || user.displayName,
          photoURL: profileData.photoURL || user.photoURL
        });
      }
      
      // Update email if provided
      if (profileData.email && profileData.email !== user.email) {
        await updateEmail(user, profileData.email);
      }
      
      // Update password if provided
      if (profileData.password) {
        await updatePassword(user, profileData.password);
      }
      
      // Update Firestore profile
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      
      return this._formatUserData(user);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Add an authentication state listener
   * @param {Function} listener - Callback function for auth state changes
   */
  addAuthStateListener(listener) {
    if (typeof listener === 'function') {
      this.authStateListeners.push(listener);
      
      // Immediately call with current auth state
      const currentUser = this.getCurrentUser();
      listener(currentUser);
    }
  }

  /**
   * Remove an authentication state listener
   * @param {Function} listener - The listener to remove
   */
  removeAuthStateListener(listener) {
    const index = this.authStateListeners.indexOf(listener);
    if (index !== -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  /**
   * Create a user profile in Firestore
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<void>}
   * @private
   */
  async _createUserProfile(userId, profileData) {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await setDoc(userDocRef, {
        ...profileData,
        userId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get a user profile from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User profile or null if not found
   * @private
   */
  async _getUserProfile(userId) {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Format user data for consistent return structure
   * @param {Object} user - Firebase user object
   * @returns {Object} - Formatted user data
   * @private
   */
  _formatUserData(user) {
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerData: user.providerData
    };
  }

  /**
   * Notify all auth state listeners
   * @param {Object|null} user - Current user or null if signed out
   * @private
   */
  _notifyAuthStateListeners(user) {
    const userData = user ? this._formatUserData(user) : null;
    
    this.authStateListeners.forEach(listener => {
      try {
        listener(userData);
      } catch (err) {
        console.error('Error in auth state listener:', err);
      }
    });
  }
}

// Create and export the auth service instance
const authService = new AuthService();
export default authService;