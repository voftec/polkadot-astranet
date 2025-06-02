/**
 * blockchain-selector.js
 * 
 * Module that allows users to select different Polkadot-based blockchains
 * (e.g., Polkadot, Kusama, custom parachains).
 * 
 * Part of the Polkadot Educational Web Platform
 */

import PolkadotConnector from './polkadot-connector.js';

class BlockchainSelector {
  /**
   * Initialize the blockchain selector
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.networks = config.networks || BlockchainSelector.DEFAULT_NETWORKS;
    this.currentNetwork = null;
    this.connector = null;
    this.networkChangeListeners = [];
  }

  /**
   * Get the list of available networks
   * @returns {Array} - List of available networks
   */
  getAvailableNetworks() {
    return [...this.networks];
  }

  /**
   * Add a custom network to the list
   * @param {Object} network - Network configuration
   */
  addNetwork(network) {
    if (!network.id || !network.name || !network.endpoint) {
      throw new Error('Network must have id, name, and endpoint properties');
    }
    
    // Check if network with this ID already exists
    const existingIndex = this.networks.findIndex(n => n.id === network.id);
    if (existingIndex !== -1) {
      // Update existing network
      this.networks[existingIndex] = { ...network };
    } else {
      // Add new network
      this.networks.push({ ...network });
    }
  }

  /**
   * Remove a network from the list
   * @param {string} networkId - Network ID to remove
   */
  removeNetwork(networkId) {
    const index = this.networks.findIndex(n => n.id === networkId);
    if (index !== -1) {
      this.networks.splice(index, 1);
    }
  }

  /**
   * Connect to a specific network
   * @param {string} networkId - Network ID to connect to
   * @returns {Promise<Object>} - Connection result
   */
  async connectToNetwork(networkId) {
    // Find the network in the list
    const network = this.networks.find(n => n.id === networkId);
    if (!network) {
      throw new Error(`Network with ID ${networkId} not found`);
    }

    try {
      // Disconnect from current network if connected
      if (this.connector && this.connector.isConnected()) {
        await this.connector.disconnect();
      }

      // Create a new connector with the selected network
      this.connector = new PolkadotConnector({
        networkEndpoint: network.endpoint
      });

      // Connect to the network
      const connectionResult = await this.connector.connect();
      
      // Update current network
      this.currentNetwork = network;
      
      // Notify listeners
      this._notifyNetworkChangeListeners(network);
      
      return {
        network,
        connectionResult
      };
    } catch (error) {
      console.error(`Error connecting to network ${network.name}:`, error);
      throw error;
    }
  }

  /**
   * Get the current network
   * @returns {Object|null} - Current network or null if not connected
   */
  getCurrentNetwork() {
    return this.currentNetwork;
  }

  /**
   * Get the current connector instance
   * @returns {PolkadotConnector|null} - Current connector or null if not connected
   */
  getConnector() {
    return this.connector;
  }

  /**
   * Add a network change listener
   * @param {Function} listener - Callback function for network changes
   */
  addNetworkChangeListener(listener) {
    if (typeof listener === 'function') {
      this.networkChangeListeners.push(listener);
    }
  }

  /**
   * Remove a network change listener
   * @param {Function} listener - The listener to remove
   */
  removeNetworkChangeListener(listener) {
    const index = this.networkChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.networkChangeListeners.splice(index, 1);
    }
  }

  /**
   * Notify all network change listeners
   * @param {Object} network - The new network
   * @private
   */
  _notifyNetworkChangeListeners(network) {
    this.networkChangeListeners.forEach(listener => {
      try {
        listener(network);
      } catch (err) {
        console.error('Error in network change listener:', err);
      }
    });
  }

  /**
   * Auto-detect available networks
   * @returns {Promise<Array>} - List of detected networks
   */
  async detectNetworks() {
    console.log('Detecting available Polkadot networks...');
    
    const detectedNetworks = [];
    const testEndpoints = BlockchainSelector.DEFAULT_NETWORKS.map(n => ({
      ...n,
      detected: false
    }));
    
    // Test each endpoint in parallel
    await Promise.allSettled(
      testEndpoints.map(async (network) => {
        try {
          const tempConnector = new PolkadotConnector({
            networkEndpoint: network.endpoint
          });
          
          // Try to connect with a timeout
          const connectPromise = tempConnector.connect();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          );
          
          await Promise.race([connectPromise, timeoutPromise]);
          
          // If we get here, connection was successful
          const networkInfo = await tempConnector.getNetworkInfo();
          
          // Disconnect after testing
          await tempConnector.disconnect();
          
          // Mark as detected and add to list
          network.detected = true;
          network.chainName = networkInfo.chain;
          network.tokenSymbol = networkInfo.tokenSymbol;
          
          detectedNetworks.push(network);
          console.log(`Detected network: ${network.name} (${networkInfo.chain})`);
        } catch (error) {
          console.log(`Network ${network.name} not available:`, error.message);
        }
      })
    );
    
    return detectedNetworks;
  }

  /**
   * Get network metadata
   * @param {string} networkId - Network ID
   * @returns {Promise<Object>} - Network metadata
   */
  async getNetworkMetadata(networkId) {
    // Find the network in the list
    const network = this.networks.find(n => n.id === networkId);
    if (!network) {
      throw new Error(`Network with ID ${networkId} not found`);
    }

    try {
      // Create a temporary connector if not already connected to this network
      let tempConnector = null;
      let shouldDisconnect = false;
      
      if (this.connector && this.currentNetwork && this.currentNetwork.id === networkId) {
        tempConnector = this.connector;
      } else {
        tempConnector = new PolkadotConnector({
          networkEndpoint: network.endpoint
        });
        await tempConnector.connect();
        shouldDisconnect = true;
      }
      
      // Get network information
      const networkInfo = await tempConnector.getNetworkInfo();
      
      // Disconnect if we created a temporary connection
      if (shouldDisconnect) {
        await tempConnector.disconnect();
      }
      
      return {
        ...network,
        ...networkInfo
      };
    } catch (error) {
      console.error(`Error getting metadata for network ${network.name}:`, error);
      throw error;
    }
  }
}

// Default networks
BlockchainSelector.DEFAULT_NETWORKS = [
  {
    id: 'polkadot',
    name: 'Polkadot',
    description: 'Polkadot mainnet',
    endpoint: 'wss://rpc.polkadot.io',
    explorerUrl: 'https://polkadot.subscan.io'
  },
  {
    id: 'kusama',
    name: 'Kusama',
    description: 'Kusama canary network',
    endpoint: 'wss://kusama-rpc.polkadot.io',
    explorerUrl: 'https://kusama.subscan.io'
  },
  {
    id: 'westend',
    name: 'Westend',
    description: 'Westend testnet',
    endpoint: 'wss://westend-rpc.polkadot.io',
    explorerUrl: 'https://westend.subscan.io'
  },
  {
    id: 'rococo',
    name: 'Rococo',
    description: 'Rococo testnet',
    endpoint: 'wss://rococo-rpc.polkadot.io',
    explorerUrl: 'https://rococo.subscan.io'
  },
  {
    id: 'local',
    name: 'Local Node',
    description: 'Local development node',
    endpoint: 'ws://127.0.0.1:9944',
    explorerUrl: null
  }
];

// Export the BlockchainSelector class
export default BlockchainSelector;