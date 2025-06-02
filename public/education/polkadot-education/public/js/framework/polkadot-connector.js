/**
 * polkadot-connector.js
 * 
 * Core connection functionality for Polkadot blockchain integration.
 * This module provides methods to connect to Polkadot networks,
 * manage accounts, and handle transactions.
 * 
 * Part of the Polkadot Educational Web Platform
 */

class PolkadotConnector {
  /**
   * Initialize the Polkadot connector
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.api = null;
    this.connected = false;
    this.networkEndpoint = config.networkEndpoint || 'wss://rpc.polkadot.io';
    this.connectionListeners = [];
    this.accounts = [];
  }

  /**
   * Connect to the Polkadot network
   * @returns {Promise} - Resolves when connected
   */
  async connect() {
    try {
      // Dynamic import to ensure compatibility with browser environments
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      
      console.log(`Connecting to Polkadot network at ${this.networkEndpoint}...`);
      
      // Create a WebSocket provider with the endpoint
      const wsProvider = new WsProvider(this.networkEndpoint);
      
      // Create the API instance
      this.api = await ApiPromise.create({ provider: wsProvider });
      
      // Wait for the API to be ready
      await this.api.isReady;
      
      // Get chain information
      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version()
      ]);
      
      console.log(`Connected to ${chain} using ${nodeName} v${nodeVersion}`);
      
      this.connected = true;
      this._notifyConnectionListeners(true);
      
      // Set up connection monitoring
      this._monitorConnection(wsProvider);
      
      return {
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        api: this.api
      };
    } catch (error) {
      console.error('Failed to connect to Polkadot network:', error);
      this._notifyConnectionListeners(false, error);
      throw error;
    }
  }

  /**
   * Disconnect from the Polkadot network
   */
  async disconnect() {
    if (this.api && this.connected) {
      try {
        await this.api.disconnect();
        console.log('Disconnected from Polkadot network');
        this.connected = false;
        this._notifyConnectionListeners(false);
      } catch (error) {
        console.error('Error disconnecting from Polkadot network:', error);
        throw error;
      }
    }
  }

  /**
   * Monitor the connection status
   * @param {WsProvider} provider - The WebSocket provider
   * @private
   */
  _monitorConnection(provider) {
    provider.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.connected = false;
      this._notifyConnectionListeners(false, error);
    });

    provider.on('disconnected', () => {
      console.log('Disconnected from Polkadot network');
      this.connected = false;
      this._notifyConnectionListeners(false);
    });

    provider.on('connected', () => {
      console.log('Connected to Polkadot network');
      this.connected = true;
      this._notifyConnectionListeners(true);
    });
  }

  /**
   * Add a connection status listener
   * @param {Function} listener - Callback function for connection status changes
   */
  addConnectionListener(listener) {
    if (typeof listener === 'function') {
      this.connectionListeners.push(listener);
    }
  }

  /**
   * Remove a connection status listener
   * @param {Function} listener - The listener to remove
   */
  removeConnectionListener(listener) {
    const index = this.connectionListeners.indexOf(listener);
    if (index !== -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  /**
   * Notify all connection listeners of status changes
   * @param {boolean} connected - Connection status
   * @param {Error} error - Error object if applicable
   * @private
   */
  _notifyConnectionListeners(connected, error = null) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected, error);
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    });
  }

  /**
   * Check if connected to the network
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.connected && this.api !== null;
  }

  /**
   * Get the current network information
   * @returns {Promise<Object>} - Network information
   */
  async getNetworkInfo() {
    if (!this.isConnected()) {
      throw new Error('Not connected to Polkadot network');
    }

    try {
      const [chain, nodeName, nodeVersion, properties] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
        this.api.rpc.system.properties()
      ]);

      return {
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        tokenSymbol: properties.tokenSymbol.toString(),
        tokenDecimals: properties.tokenDecimals.toNumber(),
        ss58Format: properties.ss58Format.toNumber()
      };
    } catch (error) {
      console.error('Error getting network information:', error);
      throw error;
    }
  }

  /**
   * Create a new account
   * @param {string} mnemonic - Optional mnemonic phrase
   * @returns {Promise<Object>} - The created account
   */
  async createAccount(mnemonic = null) {
    try {
      // Dynamic import to ensure compatibility with browser environments
      const { Keyring } = await import('@polkadot/keyring');
      const { mnemonicGenerate } = await import('@polkadot/util-crypto');
      
      // Generate a mnemonic if not provided
      const seedPhrase = mnemonic || mnemonicGenerate();
      
      // Create a keyring instance
      const keyring = new Keyring({ type: 'sr25519' });
      
      // Add an account using the mnemonic
      const account = keyring.addFromMnemonic(seedPhrase);
      
      const newAccount = {
        address: account.address,
        publicKey: account.publicKey,
        mnemonic: seedPhrase,
        type: 'sr25519'
      };
      
      this.accounts.push(newAccount);
      
      return newAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Import an account using a mnemonic phrase
   * @param {string} mnemonic - The mnemonic phrase
   * @returns {Promise<Object>} - The imported account
   */
  async importAccount(mnemonic) {
    try {
      return await this.createAccount(mnemonic);
    } catch (error) {
      console.error('Error importing account:', error);
      throw error;
    }
  }

  /**
   * Export an account
   * @param {string} address - The account address
   * @returns {Object} - The exported account data
   */
  exportAccount(address) {
    const account = this.accounts.find(acc => acc.address === address);
    
    if (!account) {
      throw new Error(`Account with address ${address} not found`);
    }
    
    return {
      address: account.address,
      mnemonic: account.mnemonic,
      type: account.type
    };
  }

  /**
   * Get account balance
   * @param {string} address - The account address
   * @returns {Promise<Object>} - Account balance information
   */
  async getBalance(address) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Polkadot network');
    }

    try {
      const { data: balance } = await this.api.query.system.account(address);
      
      return {
        free: balance.free.toString(),
        reserved: balance.reserved.toString(),
        miscFrozen: balance.miscFrozen.toString(),
        feeFrozen: balance.feeFrozen.toString()
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  }

  /**
   * Sign and send a transaction
   * @param {Object} transaction - The transaction to send
   * @param {string} senderAddress - The sender's address
   * @param {string} senderMnemonic - The sender's mnemonic for signing
   * @returns {Promise<Object>} - Transaction result
   */
  async signAndSendTransaction(transaction, senderAddress, senderMnemonic) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Polkadot network');
    }

    try {
      // Dynamic import to ensure compatibility with browser environments
      const { Keyring } = await import('@polkadot/keyring');
      
      // Create a keyring instance
      const keyring = new Keyring({ type: 'sr25519' });
      
      // Get the account from the mnemonic
      const account = keyring.addFromMnemonic(senderMnemonic);
      
      // Verify the address matches
      if (account.address !== senderAddress) {
        throw new Error('Mnemonic does not match the provided address');
      }
      
      // Create the transaction
      const tx = this.api.tx[transaction.module][transaction.method](...transaction.params);
      
      // Sign and send the transaction
      return new Promise((resolve, reject) => {
        tx.signAndSend(account, ({ status, events, dispatchError }) => {
          if (status.isInBlock || status.isFinalized) {
            // Check if there was an error
            if (dispatchError) {
              if (dispatchError.isModule) {
                // For module errors, we have the section and method
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                
                reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                reject(new Error(dispatchError.toString()));
              }
            } else {
              // Success, resolve with the block hash and events
              resolve({
                status: status.type,
                blockHash: status.isFinalized ? status.asFinalized.toHex() : status.asInBlock.toHex(),
                events: events.map(({ event }) => ({
                  section: event.section,
                  method: event.method,
                  data: event.data.toString()
                }))
              });
            }
          }
        }).catch(error => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error signing and sending transaction:', error);
      throw error;
    }
  }

  /**
   * Estimate transaction fees
   * @param {Object} transaction - The transaction
   * @param {string} senderAddress - The sender's address
   * @returns {Promise<Object>} - Fee estimation
   */
  async estimateTransactionFees(transaction, senderAddress) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Polkadot network');
    }

    try {
      // Create the transaction
      const tx = this.api.tx[transaction.module][transaction.method](...transaction.params);
      
      // Get the payment info
      const paymentInfo = await tx.paymentInfo(senderAddress);
      
      return {
        partialFee: paymentInfo.partialFee.toString(),
        weight: paymentInfo.weight.toString()
      };
    } catch (error) {
      console.error('Error estimating transaction fees:', error);
      throw error;
    }
  }
}

// Export the PolkadotConnector class
export default PolkadotConnector;