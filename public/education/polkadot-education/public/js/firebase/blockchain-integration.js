/**
 * blockchain-integration.js
 * 
 * Integration between Firebase services and the Polkadot framework.
 * This module provides functionality to connect Firebase authentication with
 * Polkadot wallets, store blockchain interactions, and manage smart contract templates.
 */

import PolkadotConnector from '../framework/polkadot-connector.js';
import BlockchainSelector from '../framework/blockchain-selector.js';
import ContractDeployer from '../framework/contract-deployer.js';
import authService from './auth.js';
import databaseService from './database.js';
import firebase from './config.js';

/**
 * Blockchain integration service for the Polkadot Educational Web Platform
 */
class BlockchainIntegrationService {
  constructor() {
    this.blockchainSelector = new BlockchainSelector();
    this.connector = null;
    this.contractDeployer = null;
    this.currentUser = null;
    this.walletAssociations = new Map();
    
    // Initialize authentication listener
    this._initAuthListener();
  }

  /**
   * Initialize authentication listener
   * @private
   */
  _initAuthListener() {
    authService.addAuthStateListener((user) => {
      this.currentUser = user;
      
      if (user) {
        // Load user's wallet associations when authenticated
        this._loadUserWalletAssociations(user.uid);
      } else {
        // Clear wallet associations when signed out
        this.walletAssociations.clear();
      }
    });
  }

  /**
   * Load user's wallet associations from Firestore
   * @param {string} userId - User ID
   * @private
   */
  async _loadUserWalletAssociations(userId) {
    try {
      const user = await databaseService.getUser(userId);
      
      if (user && user.wallets) {
        this.walletAssociations.clear();
        
        // Load wallet associations
        Object.entries(user.wallets).forEach(([network, address]) => {
          this.walletAssociations.set(network, address);
        });
        
        console.log(`Loaded ${this.walletAssociations.size} wallet associations for user ${userId}`);
      }
    } catch (error) {
      console.error('Error loading user wallet associations:', error);
    }
  }

  /**
   * Connect to a blockchain network
   * @param {string} networkId - Network ID to connect to
   * @returns {Promise<Object>} - Connection result
   */
  async connectToNetwork(networkId) {
    try {
      const result = await this.blockchainSelector.connectToNetwork(networkId);
      this.connector = this.blockchainSelector.getConnector();
      
      // Initialize contract deployer with the connector
      if (this.connector) {
        this.contractDeployer = new ContractDeployer(this.connector);
      }
      
      // Log connection to analytics if user is authenticated
      if (this.currentUser) {
        await this._logBlockchainInteraction({
          type: 'network_connection',
          network: networkId,
          status: 'success',
          details: {
            networkName: result.network.name,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error connecting to network ${networkId}:`, error);
      
      // Log failed connection attempt if user is authenticated
      if (this.currentUser) {
        await this._logBlockchainInteraction({
          type: 'network_connection',
          network: networkId,
          status: 'error',
          details: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      throw error;
    }
  }

  /**
   * Associate a wallet address with the current user for a specific network
   * @param {string} networkId - Network ID
   * @param {string} address - Wallet address
   * @returns {Promise<void>}
   */
  async associateWalletWithUser(networkId, address) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to associate a wallet');
    }

    try {
      // Update the local map
      this.walletAssociations.set(networkId, address);
      
      // Convert map to object for storage
      const wallets = {};
      this.walletAssociations.forEach((addr, network) => {
        wallets[network] = addr;
      });
      
      // Update user document in Firestore
      await databaseService.updateUser(this.currentUser.uid, { wallets });
      
      console.log(`Associated wallet ${address} with user ${this.currentUser.uid} for network ${networkId}`);
    } catch (error) {
      console.error('Error associating wallet with user:', error);
      throw error;
    }
  }

  /**
   * Get the user's wallet address for a specific network
   * @param {string} networkId - Network ID
   * @returns {string|null} - Wallet address or null if not associated
   */
  getUserWalletForNetwork(networkId) {
    return this.walletAssociations.get(networkId) || null;
  }

  /**
   * Get all user's wallet associations
   * @returns {Object} - Map of network IDs to wallet addresses
   */
  getUserWalletAssociations() {
    const wallets = {};
    this.walletAssociations.forEach((address, networkId) => {
      wallets[networkId] = address;
    });
    return wallets;
  }

  /**
   * Create a new account and associate it with the current user
   * @param {string} networkId - Network ID
   * @returns {Promise<Object>} - Created account
   */
  async createAndAssociateAccount(networkId) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to create an associated account');
    }

    if (!this.connector || !this.connector.isConnected()) {
      throw new Error('Must be connected to a network to create an account');
    }

    try {
      // Create a new account
      const account = await this.connector.createAccount();
      
      // Associate the account with the user
      await this.associateWalletWithUser(networkId, account.address);
      
      // Log the account creation
      await this._logBlockchainInteraction({
        type: 'account_creation',
        network: networkId,
        status: 'success',
        details: {
          address: account.address,
          timestamp: new Date().toISOString()
        }
      });
      
      return account;
    } catch (error) {
      console.error('Error creating and associating account:', error);
      
      // Log the failed account creation
      await this._logBlockchainInteraction({
        type: 'account_creation',
        network: networkId,
        status: 'error',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
      
      throw error;
    }
  }

  /**
   * Import an account from mnemonic and associate it with the current user
   * @param {string} networkId - Network ID
   * @param {string} mnemonic - Mnemonic phrase
   * @returns {Promise<Object>} - Imported account
   */
  async importAndAssociateAccount(networkId, mnemonic) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to import an associated account');
    }

    if (!this.connector || !this.connector.isConnected()) {
      throw new Error('Must be connected to a network to import an account');
    }

    try {
      // Import the account
      const account = await this.connector.importAccount(mnemonic);
      
      // Associate the account with the user
      await this.associateWalletWithUser(networkId, account.address);
      
      // Log the account import
      await this._logBlockchainInteraction({
        type: 'account_import',
        network: networkId,
        status: 'success',
        details: {
          address: account.address,
          timestamp: new Date().toISOString()
        }
      });
      
      return account;
    } catch (error) {
      console.error('Error importing and associating account:', error);
      
      // Log the failed account import
      await this._logBlockchainInteraction({
        type: 'account_import',
        network: networkId,
        status: 'error',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
      
      throw error;
    }
  }

  /**
   * Deploy a smart contract
   * @param {Object} contractData - Contract data including ABI and bytecode
   * @param {Object} deployOptions - Deployment options
   * @returns {Promise<Object>} - Deployed contract information
   */
  async deployContract(contractData, deployOptions = {}) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to deploy a contract');
    }

    if (!this.connector || !this.connector.isConnected()) {
      throw new Error('Must be connected to a network to deploy a contract');
    }

    if (!this.contractDeployer) {
      throw new Error('Contract deployer not initialized');
    }

    try {
      // Deploy the contract
      const deployedContract = await this.contractDeployer.deployContract(contractData, deployOptions);
      
      // Get the current network
      const network = this.blockchainSelector.getCurrentNetwork();
      
      // Store the contract deployment in Firebase
      const contractId = await databaseService.saveTransaction(this.currentUser.uid, {
        type: 'contract_deployment',
        network: network.id,
        hash: deployedContract.deploymentData.blockHash,
        status: 'success',
        contractAddress: deployedContract.address,
        contractName: contractData.name || 'Unnamed Contract',
        timestamp: new Date().toISOString()
      });
      
      // Store the contract details
      await this._storeContractDetails(contractId, deployedContract, contractData);
      
      return {
        ...deployedContract,
        id: contractId
      };
    } catch (error) {
      console.error('Error deploying contract:', error);
      
      // Log the failed contract deployment
      if (this.currentUser) {
        const network = this.blockchainSelector.getCurrentNetwork();
        await databaseService.saveTransaction(this.currentUser.uid, {
          type: 'contract_deployment',
          network: network.id,
          status: 'error',
          error: error.message,
          contractName: contractData.name || 'Unnamed Contract',
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }

  /**
   * Store contract details in Firestore
   * @param {string} contractId - Contract ID
   * @param {Object} deployedContract - Deployed contract information
   * @param {Object} contractData - Original contract data
   * @returns {Promise<void>}
   * @private
   */
  async _storeContractDetails(contractId, deployedContract, contractData) {
    try {
      // Store contract details in a separate collection
      const contractDetails = {
        address: deployedContract.address,
        abi: JSON.stringify(deployedContract.abi),
        name: contractData.name || 'Unnamed Contract',
        description: contractData.description || '',
        network: this.blockchainSelector.getCurrentNetwork().id,
        deployedBy: this.currentUser.uid,
        deploymentData: deployedContract.deploymentData,
        createdAt: new Date().toISOString()
      };
      
      // Store in Firestore
      await databaseService.updateUser(this.currentUser.uid, {
        [`contracts.${contractId}`]: contractDetails
      });
    } catch (error) {
      console.error('Error storing contract details:', error);
      throw error;
    }
  }

  /**
   * Get user's deployed contracts
   * @returns {Promise<Array>} - List of deployed contracts
   */
  async getUserContracts() {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to get contracts');
    }

    try {
      const user = await databaseService.getUser(this.currentUser.uid);
      
      if (user && user.contracts) {
        return Object.entries(user.contracts).map(([id, contract]) => ({
          id,
          ...contract
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting user contracts:', error);
      throw error;
    }
  }

  /**
   * Save a smart contract template
   * @param {Object} template - Template data
   * @param {boolean} isPublic - Whether the template is public
   * @returns {Promise<string>} - Template ID
   */
  async saveContractTemplate(template, isPublic = false) {
    if (!this.currentUser && isPublic) {
      throw new Error('User must be authenticated to save a public template');
    }

    try {
      // Save the template
      const templateId = await databaseService.saveContractTemplate(
        {
          ...template,
          createdBy: this.currentUser ? this.currentUser.uid : null,
          isPublic
        },
        isPublic ? null : this.currentUser.uid
      );
      
      return templateId;
    } catch (error) {
      console.error('Error saving contract template:', error);
      throw error;
    }
  }

  /**
   * Get available smart contract templates
   * @param {boolean} includeUserTemplates - Whether to include user-specific templates
   * @returns {Promise<Array>} - List of templates
   */
  async getContractTemplates(includeUserTemplates = true) {
    try {
      return await databaseService.getContractTemplates(
        includeUserTemplates && this.currentUser ? this.currentUser.uid : null
      );
    } catch (error) {
      console.error('Error getting contract templates:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction on a deployed contract
   * @param {string} contractAddress - Contract address
   * @param {string} methodName - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} - Transaction result
   */
  async executeContractTransaction(contractAddress, methodName, args = [], options = {}) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to execute a contract transaction');
    }

    if (!this.connector || !this.connector.isConnected()) {
      throw new Error('Must be connected to a network to execute a contract transaction');
    }

    if (!this.contractDeployer) {
      throw new Error('Contract deployer not initialized');
    }

    try {
      // Execute the transaction
      const result = await this.contractDeployer.executeContractTransaction(
        contractAddress,
        methodName,
        args,
        options
      );
      
      // Get the current network
      const network = this.blockchainSelector.getCurrentNetwork();
      
      // Store the transaction in Firebase
      await databaseService.saveTransaction(this.currentUser.uid, {
        type: 'contract_interaction',
        network: network.id,
        hash: result.blockHash,
        status: 'success',
        contractAddress,
        methodName,
        args,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error executing contract transaction:', error);
      
      // Log the failed transaction
      if (this.currentUser) {
        const network = this.blockchainSelector.getCurrentNetwork();
        await databaseService.saveTransaction(this.currentUser.uid, {
          type: 'contract_interaction',
          network: network.id,
          status: 'error',
          error: error.message,
          contractAddress,
          methodName,
          args,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }

  /**
   * Get transaction history for the current user
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Transaction history
   */
  async getTransactionHistory(options = {}) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to get transaction history');
    }

    try {
      return await databaseService.getTransactionHistory(this.currentUser.uid, options);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time transaction updates
   * @param {Function} callback - Callback function for updates
   * @returns {string} - Listener ID
   */
  listenToTransactions(callback) {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to listen to transactions');
    }

    try {
      return databaseService.listenToTransactions(this.currentUser.uid, callback);
    } catch (error) {
      console.error('Error listening to transactions:', error);
      throw error;
    }
  }

  /**
   * Stop listening to transaction updates
   * @param {string} listenerId - Listener ID
   */
  stopListeningToTransactions(listenerId) {
    databaseService.removeListener(listenerId);
  }

  /**
   * Log a blockchain interaction to Firebase
   * @param {Object} interaction - Interaction data
   * @returns {Promise<string>} - Interaction ID
   * @private
   */
  async _logBlockchainInteraction(interaction) {
    if (!this.currentUser) {
      return null;
    }

    try {
      return await databaseService.saveTransaction(this.currentUser.uid, interaction);
    } catch (error) {
      console.error('Error logging blockchain interaction:', error);
      return null;
    }
  }
}

// Create and export the blockchain integration service instance
const blockchainIntegrationService = new BlockchainIntegrationService();
export default blockchainIntegrationService;