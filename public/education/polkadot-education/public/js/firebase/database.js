/**
 * database.js
 * 
 * Database interaction functionality for the Polkadot Educational Web Platform.
 * This module provides methods for interacting with Firestore and Realtime Database,
 * including CRUD operations for user data, blockchain transactions, and smart contract templates.
 */

import { 
  collection, doc, addDoc, setDoc, getDoc, getDocs, 
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp
} from 'firebase/firestore';
import {
  ref, set, get, update, remove, push, onValue, query as rtdbQuery,
  orderByChild, limitToLast, startAt, endAt
} from 'firebase/database';
import firebase from './config.js';

/**
 * Database service for the Polkadot Educational Web Platform
 */
class DatabaseService {
  constructor() {
    this.firestore = firebase.firestore;
    this.database = firebase.database;
    this.listeners = new Map();
  }

  /**
   * User Data Operations
   */

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User data or null if not found
   */
  async getUser(userId) {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Update a user's data
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<void>}
   */
  async updateUser(userId, userData) {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await updateDoc(userDocRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await deleteDoc(userDocRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Blockchain Transaction History Operations
   */

  /**
   * Save a blockchain transaction
   * @param {string} userId - User ID
   * @param {Object} transaction - Transaction data
   * @returns {Promise<string>} - Transaction ID
   */
  async saveTransaction(userId, transaction) {
    try {
      // Validate transaction data
      if (!transaction.hash || !transaction.network) {
        throw new Error('Transaction must have hash and network properties');
      }
      
      // Add transaction to Firestore
      const transactionsCollectionRef = collection(this.firestore, 'users', userId, 'transactions');
      const transactionDocRef = await addDoc(transactionsCollectionRef, {
        ...transaction,
        timestamp: serverTimestamp(),
        userId
      });
      
      // Also add to Realtime Database for faster querying of recent transactions
      const rtdbTransactionRef = ref(this.database, `transactions/${userId}/${transactionDocRef.id}`);
      await set(rtdbTransactionRef, {
        hash: transaction.hash,
        network: transaction.network,
        type: transaction.type || 'unknown',
        status: transaction.status || 'pending',
        timestamp: Date.now()
      });
      
      return transactionDocRef.id;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  /**
   * Update a transaction's status
   * @param {string} userId - User ID
   * @param {string} transactionId - Transaction ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<void>}
   */
  async updateTransactionStatus(userId, transactionId, status, additionalData = {}) {
    try {
      // Update in Firestore
      const transactionDocRef = doc(this.firestore, 'users', userId, 'transactions', transactionId);
      await updateDoc(transactionDocRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
      });
      
      // Update in Realtime Database
      const rtdbTransactionRef = ref(this.database, `transactions/${userId}/${transactionId}`);
      await update(rtdbTransactionRef, {
        status,
        ...additionalData,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Get a user's transaction history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Transaction history
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      const { network, status, limit: queryLimit = 50, orderByField = 'timestamp', orderDirection = 'desc' } = options;
      
      // Create query
      let transactionsQuery = collection(this.firestore, 'users', userId, 'transactions');
      let constraints = [];
      
      // Add filters if provided
      if (network) {
        constraints.push(where('network', '==', network));
      }
      
      if (status) {
        constraints.push(where('status', '==', status));
      }
      
      // Add ordering and limit
      constraints.push(orderBy(orderByField, orderDirection));
      constraints.push(limit(queryLimit));
      
      // Execute query
      const querySnapshot = await getDocs(query(transactionsQuery, ...constraints));
      
      // Format results
      const transactions = [];
      querySnapshot.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time transaction updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for updates
   * @returns {string} - Listener ID
   */
  listenToTransactions(userId, callback) {
    try {
      // Use Realtime Database for real-time updates
      const rtdbTransactionsRef = ref(this.database, `transactions/${userId}`);
      const rtdbTransactionsQuery = rtdbQuery(rtdbTransactionsRef, orderByChild('timestamp'), limitToLast(20));
      
      const unsubscribe = onValue(rtdbTransactionsQuery, (snapshot) => {
        const transactions = [];
        snapshot.forEach((childSnapshot) => {
          transactions.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        // Sort by timestamp descending
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        callback(transactions);
      });
      
      // Generate a unique listener ID
      const listenerId = `transactions_${userId}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return listenerId;
    } catch (error) {
      console.error('Error listening to transactions:', error);
      throw error;
    }
  }

  /**
   * Smart Contract Template Operations
   */

  /**
   * Save a smart contract template
   * @param {Object} template - Template data
   * @param {string} userId - User ID (optional, for user-specific templates)
   * @returns {Promise<string>} - Template ID
   */
  async saveContractTemplate(template, userId = null) {
    try {
      // Validate template data
      if (!template.name || !template.code) {
        throw new Error('Template must have name and code properties');
      }
      
      let templateDocRef;
      
      if (userId) {
        // User-specific template
        const userTemplatesCollectionRef = collection(this.firestore, 'users', userId, 'templates');
        templateDocRef = await addDoc(userTemplatesCollectionRef, {
          ...template,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Global template
        const templatesCollectionRef = collection(this.firestore, 'contractTemplates');
        templateDocRef = await addDoc(templatesCollectionRef, {
          ...template,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return templateDocRef.id;
    } catch (error) {
      console.error('Error saving contract template:', error);
      throw error;
    }
  }

  /**
   * Get a smart contract template by ID
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID (optional, for user-specific templates)
   * @returns {Promise<Object|null>} - Template data or null if not found
   */
  async getContractTemplate(templateId, userId = null) {
    try {
      let templateDocRef;
      
      if (userId) {
        // Try to get user-specific template first
        templateDocRef = doc(this.firestore, 'users', userId, 'templates', templateId);
        const templateDoc = await getDoc(templateDocRef);
        
        if (templateDoc.exists()) {
          return { id: templateDoc.id, ...templateDoc.data() };
        }
      }
      
      // Try to get global template
      templateDocRef = doc(this.firestore, 'contractTemplates', templateId);
      const templateDoc = await getDoc(templateDocRef);
      
      if (templateDoc.exists()) {
        return { id: templateDoc.id, ...templateDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting contract template:', error);
      throw error;
    }
  }

  /**
   * Get all available smart contract templates
   * @param {string} userId - User ID (optional, to include user-specific templates)
   * @returns {Promise<Array>} - Template list
   */
  async getContractTemplates(userId = null) {
    try {
      const templates = [];
      
      // Get global templates
      const globalTemplatesQuery = query(
        collection(this.firestore, 'contractTemplates'),
        where('isPublic', '==', true),
        orderBy('name')
      );
      
      const globalTemplatesSnapshot = await getDocs(globalTemplatesQuery);
      globalTemplatesSnapshot.forEach(doc => {
        templates.push({
          id: doc.id,
          ...doc.data(),
          isGlobal: true
        });
      });
      
      // Get user-specific templates if userId provided
      if (userId) {
        const userTemplatesQuery = query(
          collection(this.firestore, 'users', userId, 'templates'),
          orderBy('name')
        );
        
        const userTemplatesSnapshot = await getDocs(userTemplatesQuery);
        userTemplatesSnapshot.forEach(doc => {
          templates.push({
            id: doc.id,
            ...doc.data(),
            isGlobal: false
          });
        });
      }
      
      return templates;
    } catch (error) {
      console.error('Error getting contract templates:', error);
      throw error;
    }
  }

  /**
   * Update a smart contract template
   * @param {string} templateId - Template ID
   * @param {Object} templateData - Template data to update
   * @param {string} userId - User ID (optional, for user-specific templates)
   * @returns {Promise<void>}
   */
  async updateContractTemplate(templateId, templateData, userId = null) {
    try {
      let templateDocRef;
      
      if (userId) {
        // Try to update user-specific template first
        templateDocRef = doc(this.firestore, 'users', userId, 'templates', templateId);
        const templateDoc = await getDoc(templateDocRef);
        
        if (templateDoc.exists()) {
          await updateDoc(templateDocRef, {
            ...templateData,
            updatedAt: serverTimestamp()
          });
          return;
        }
      }
      
      // Try to update global template
      templateDocRef = doc(this.firestore, 'contractTemplates', templateId);
      const templateDoc = await getDoc(templateDocRef);
      
      if (templateDoc.exists()) {
        await updateDoc(templateDocRef, {
          ...templateData,
          updatedAt: serverTimestamp()
        });
        return;
      }
      
      throw new Error(`Template with ID ${templateId} not found`);
    } catch (error) {
      console.error('Error updating contract template:', error);
      throw error;
    }
  }

  /**
   * Delete a smart contract template
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID (optional, for user-specific templates)
   * @returns {Promise<void>}
   */
  async deleteContractTemplate(templateId, userId = null) {
    try {
      let templateDocRef;
      
      if (userId) {
        // Try to delete user-specific template first
        templateDocRef = doc(this.firestore, 'users', userId, 'templates', templateId);
        const templateDoc = await getDoc(templateDocRef);
        
        if (templateDoc.exists()) {
          await deleteDoc(templateDocRef);
          return;
        }
      }
      
      // Try to delete global template
      templateDocRef = doc(this.firestore, 'contractTemplates', templateId);
      const templateDoc = await getDoc(templateDocRef);
      
      if (templateDoc.exists()) {
        await deleteDoc(templateDocRef);
        return;
      }
      
      throw new Error(`Template with ID ${templateId} not found`);
    } catch (error) {
      console.error('Error deleting contract template:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Remove a listener
   * @param {string} listenerId - Listener ID
   */
  removeListener(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Generate a unique ID
   * @returns {string} - Unique ID
   */
  generateId() {
    return doc(collection(this.firestore, 'ids')).id;
  }
}

// Create and export the database service instance
const databaseService = new DatabaseService();
export default databaseService;