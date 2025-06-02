# Polkadot Educational Web Platform API Documentation

## Overview

This document provides comprehensive documentation for the Polkadot Educational Web Platform's JavaScript framework and Firebase integration. The platform is designed to facilitate learning about Polkadot blockchain technology, the Polkadot Virtual Machine (PVM), and smart contract development.

## Architecture Overview

The platform's architecture consists of several key components:

1. **Polkadot Framework**: A JavaScript framework for interacting with Polkadot blockchain networks
2. **Firebase Integration**: Services for authentication, data storage, and blockchain interaction tracking
3. **Web UI**: HTML, CSS, and JavaScript components for the user interface
4. **Smart Contract Examples**: Sample contracts and deployment tools

The architecture follows a modular design pattern, with clear separation of concerns between components:

```
┌─────────────────────────────────┐      ┌─────────────────────────┐
│        Web UI Components        │◄────►│    Firebase Services    │
└───────────────┬─────────────────┘      │                         │
                │                        │  - Authentication       │
                ▼                        │  - Firestore Database   │
┌─────────────────────────────────┐      │  - Realtime Database    │
│      Polkadot Framework         │      │  - Blockchain Storage   │
│                                 │      └─────────────┬───────────┘
│  - Connection Management        │                    │
│  - Network Selection            │                    │
│  - Contract Deployment          │◄───────────────────┘
└─────────────────────────────────┘
```

## Polkadot Framework Modules

### 1. PolkadotConnector (`polkadot-connector.js`)

The core module for establishing connections to Polkadot networks and managing blockchain interactions.

#### Key Methods

| Method | Description | Parameters | Return Value |
|--------|-------------|------------|--------------|
| `constructor(config)` | Initialize the connector | `config`: Configuration object with `networkEndpoint` | `PolkadotConnector` instance |
| `connect()` | Connect to the Polkadot network | None | Promise resolving to connection info |
| `disconnect()` | Disconnect from the network | None | Promise resolving when disconnected |
| `isConnected()` | Check connection status | None | Boolean indicating connection status |
| `getNetworkInfo()` | Get information about the connected network | None | Promise resolving to network info object |
| `createAccount(mnemonic)` | Create a new account | `mnemonic`: Optional seed phrase | Promise resolving to account object |
| `importAccount(mnemonic)` | Import an account using a mnemonic | `mnemonic`: Seed phrase | Promise resolving to account object |
| `getBalance(address)` | Get account balance | `address`: Account address | Promise resolving to balance object |
| `signAndSendTransaction(transaction, senderAddress, senderMnemonic)` | Sign and send a transaction | Transaction details and credentials | Promise resolving to transaction result |

#### Usage Example

```javascript
// Initialize the connector
const connector = new PolkadotConnector({
  networkEndpoint: 'wss://rpc.polkadot.io'
});

// Connect to the network
connector.connect()
  .then(connectionInfo => {
    console.log(`Connected to ${connectionInfo.chain}`);
    
    // Create a new account
    return connector.createAccount();
  })
  .then(account => {
    console.log(`Created account with address: ${account.address}`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 2. BlockchainSelector (`blockchain-selector.js`)

Module for selecting and managing different Polkadot-based blockchains.

#### Key Methods

| Method | Description | Parameters | Return Value |
|--------|-------------|------------|--------------|
| `constructor(config)` | Initialize the selector | `config`: Configuration object with optional `networks` | `BlockchainSelector` instance |
| `getAvailableNetworks()` | Get list of available networks | None | Array of network objects |
| `addNetwork(network)` | Add a custom network | `network`: Network configuration object | None |
| `removeNetwork(networkId)` | Remove a network | `networkId`: Network identifier | None |
| `connectToNetwork(networkId)` | Connect to a specific network | `networkId`: Network identifier | Promise resolving to connection result |
| `getCurrentNetwork()` | Get current network | None | Network object or null |
| `getConnector()` | Get current connector instance | None | `PolkadotConnector` instance or null |
| `detectNetworks()` | Auto-detect available networks | None | Promise resolving to array of detected networks |
| `getNetworkMetadata(networkId)` | Get network metadata | `networkId`: Network identifier | Promise resolving to network metadata |

#### Usage Example

```javascript
// Initialize the blockchain selector
const selector = new BlockchainSelector();

// Get available networks
const networks = selector.getAvailableNetworks();
console.log(`Available networks: ${networks.map(n => n.name).join(', ')}`);

// Connect to a specific network
selector.connectToNetwork('kusama')
  .then(result => {
    console.log(`Connected to ${result.network.name}`);
    
    // Get the connector instance
    const connector = selector.getConnector();
    
    // Use the connector for blockchain interactions
    return connector.getNetworkInfo();
  })
  .then(networkInfo => {
    console.log(`Network info: ${JSON.stringify(networkInfo)}`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 3. ContractDeployer (`contract-deployer.js`)

Module for deploying and interacting with smart contracts on Polkadot networks.

#### Key Methods

| Method | Description | Parameters | Return Value |
|--------|-------------|------------|--------------|
| `constructor(connector)` | Initialize the deployer | `connector`: `PolkadotConnector` instance | `ContractDeployer` instance |
| `deployContract(contractData, deployOptions)` | Deploy a smart contract | Contract data and deployment options | Promise resolving to deployed contract info |
| `callContractMethod(contractAddress, methodName, args, options)` | Call a read-only contract method | Contract address, method name, arguments, and options | Promise resolving to method result |
| `executeContractTransaction(contractAddress, methodName, args, options)` | Execute a contract transaction | Contract address, method name, arguments, and options | Promise resolving to transaction result |
| `getDeployedContracts()` | Get all deployed contracts | None | Array of deployed contract objects |
| `addContractTemplate(template)` | Add a contract template | `template`: Contract template object | None |
| `getContractTemplates()` | Get all contract templates | None | Array of contract template objects |
| `getContractTemplate(templateId)` | Get a specific contract template | `templateId`: Template identifier | Contract template object or null |
| `verifyContract(contractAddress, contractData)` | Verify a deployed contract | Contract address and original data | Promise resolving to verification result |

#### Usage Example

```javascript
// Initialize the contract deployer with a connector
const deployer = new ContractDeployer(connector);

// Deploy a contract
const contractData = {
  name: 'MyToken',
  abi: JSON.stringify(tokenAbi),
  wasm: tokenWasm
};

const deployOptions = {
  deployerAddress: account.address,
  deployerMnemonic: account.mnemonic,
  constructorArgs: ['MyToken', 'MTK', 18, 1000000],
  gasLimit: 1000000
};

deployer.deployContract(contractData, deployOptions)
  .then(deployedContract => {
    console.log(`Contract deployed at address: ${deployedContract.address}`);
    
    // Call a contract method
    return deployer.callContractMethod(
      deployedContract.address,
      'balanceOf',
      [account.address]
    );
  })
  .then(balance => {
    console.log(`Account balance: ${balance}`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Firebase Integration Modules

### 1. Firebase Configuration (`firebase/config.js`)

Module for configuring and initializing Firebase services.

#### Key Components

- Environment-specific Firebase configurations
- Firebase service initialization
- Security configuration with App Check

#### Usage Example

```javascript
// Import Firebase configuration
import firebase from './firebase/config.js';

// Access Firebase services
const auth = firebase.auth;
const firestore = firebase.firestore;
const database = firebase.database;

console.log(`Firebase initialized in ${firebase.config.projectId}`);
```

### 2. Authentication Service (`firebase/auth.js`)

Module for user authentication and profile management.

#### Key Methods

| Method | Description | Parameters | Return Value |
|--------|-------------|------------|--------------|
| `registerWithEmail(email, password, profileData)` | Register a new user | Email, password, and profile data | Promise resolving to user data |
| `loginWithEmail(email, password)` | Sign in with email and password | Email and password | Promise resolving to user data |
| `loginWithGoogle()` | Sign in with Google | None | Promise resolving to user data |
| `loginWithGithub()` | Sign in with GitHub | None | Promise resolving to user data |
| `logout()` | Sign out the current user | None | Promise resolving when signed out |
| `getCurrentUser()` | Get the current user | None | User object or null |
| `sendPasswordReset(email)` | Send password reset email | Email address | Promise resolving when email sent |
| `updateUserProfile(profileData)` | Update user profile | Profile data to update | Promise resolving to updated user data |
| `addAuthStateListener(listener)` | Add authentication state listener | Listener function | None |
| `removeAuthStateListener(listener)` | Remove authentication state listener | Listener function | None |

#### Usage Example

```javascript
// Import authentication service
import authService from './firebase/auth.js';

// Register a new user
authService.registerWithEmail('user@example.com', 'password123', {
  displayName: 'John Doe'
})
  .then(user => {
    console.log(`User registered: ${user.displayName}`);
  })
  .catch(error => {
    console.error('Registration error:', error);
  });

// Add authentication state listener
authService.addAuthStateListener(user => {
  if (user) {
    console.log(`User signed in: ${user.displayName}`);
  } else {
    console.log('User signed out');
  }
});
```

### 3. Database Service (`firebase/database.js`)

Module for interacting with Firestore and Realtime Database.

#### Key Methods

| Method | Description | Parameters | Return Value |
|--------|-------------|------------|--------------|
| `getUser(userId)` | Get a user by ID | User ID | Promise resolving to user data |
| `updateUser(userId, userData)` | Update a user's data | User ID and data to update | Promise resolving when updated |
| `deleteUser(userId)` | Delete a user | User ID | Promise resolving when deleted |
| `saveTransaction(userId, transaction)` | Save a blockchain transaction | User ID and transaction data | Promise resolving to transaction ID |
| `updateTransactionStatus(userId, transactionId, status, additionalData)` | Update transaction status | User ID, transaction ID, status, and additional data | Promise resolving when updated |
| `getTransactionHistory(userId, options)` | Get transaction history | User ID and query options | Promise resolving to transaction array |
| `listenToTransactions(userId, callback)` | Listen to real-time transaction updates | User ID and callback function | Listener ID |
| `saveContractTemplate(template, userId)` | Save a contract template | Template data and optional user ID | Promise resolving to template ID |
| `getContractTemplate(templateId, userId)` | Get a contract template | Template ID and optional user ID | Promise resolving to template data |
| `getContractTemplates(userId)` | Get all contract templates | Optional user ID | Promise resolving to template array |
| `removeListener(listenerId)` | Remove a listener | Listener ID | None |

#### Usage Example

```javascript
// Import database service
import databaseService from './firebase/database.js';

// Save a blockchain transaction
databaseService.saveTransaction('user123', {
  hash: '0x123abc...',
  network: 'polkadot',
  type: 'transfer',
  status: 'pending'
})
  .then(transactionId => {
    console.log(`Transaction saved with ID: ${transactionId}`);
    
    // Listen to transaction updates
    return databaseService.listenToTransactions('user123', transactions => {
      console.log(`Received ${transactions.length} transactions`);
    });
  })
  .then(listenerId => {
    console.log(`Listening to transactions with ID: ${listenerId}`);
    
    // Later, remove the listener
    // databaseService.removeListener(listenerId);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 4. Blockchain Integration Service (`firebase/blockchain-integration.js`)

Module for integrating Firebase services with the Polkadot framework.

#### Key Methods

| Method | Description | Parameters | Return Value |
|--------|-------------|------------|--------------|
| `connectToNetwork(networkId)` | Connect to a blockchain network | Network ID | Promise resolving to connection result |
| `associateWalletWithUser(networkId, address)` | Associate a wallet with the current user | Network ID and wallet address | Promise resolving when associated |
| `getUserWalletForNetwork(networkId)` | Get user's wallet for a network | Network ID | Wallet address or null |
| `getUserWalletAssociations()` | Get all user's wallet associations | None | Object mapping network IDs to wallet addresses |
| `createAndAssociateAccount(networkId)` | Create and associate a new account | Network ID | Promise resolving to created account |
| `importAndAssociateAccount(networkId, mnemonic)` | Import and associate an account | Network ID and mnemonic | Promise resolving to imported account |
| `deployContract(contractData, deployOptions)` | Deploy a smart contract | Contract data and deployment options | Promise resolving to deployed contract |
| `getUserContracts()` | Get user's deployed contracts | None | Promise resolving to contract array |
| `saveContractTemplate(template, isPublic)` | Save a contract template | Template data and visibility flag | Promise resolving to template ID |
| `getContractTemplates(includeUserTemplates)` | Get available contract templates | Whether to include user templates | Promise resolving to template array |
| `executeContractTransaction(contractAddress, methodName, args, options)` | Execute a contract transaction | Contract address, method name, arguments, and options | Promise resolving to transaction result |
| `getTransactionHistory(options)` | Get transaction history | Query options | Promise resolving to transaction array |
| `listenToTransactions(callback)` | Listen to transaction updates | Callback function | Listener ID |
| `stopListeningToTransactions(listenerId)` | Stop listening to transactions | Listener ID | None |

#### Usage Example

```javascript
// Import blockchain integration service
import blockchainIntegrationService from './firebase/blockchain-integration.js';

// Connect to a network
blockchainIntegrationService.connectToNetwork('polkadot')
  .then(result => {
    console.log(`Connected to ${result.network.name}`);
    
    // Create and associate a new account
    return blockchainIntegrationService.createAndAssociateAccount('polkadot');
  })
  .then(account => {
    console.log(`Created and associated account: ${account.address}`);
    
    // Deploy a contract
    const contractData = {
      name: 'Flipper',
      abi: flipperAbi,
      wasm: flipperWasm
    };
    
    const deployOptions = {
      deployerAddress: account.address,
      deployerMnemonic: account.mnemonic,
      constructorArgs: [true]
    };
    
    return blockchainIntegrationService.deployContract(contractData, deployOptions);
  })
  .then(deployedContract => {
    console.log(`Contract deployed at: ${deployedContract.address}`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Error Handling Guidelines

### Common Error Types

1. **Connection Errors**: Occur when unable to connect to the Polkadot network
2. **Authentication Errors**: Occur during user authentication processes
3. **Transaction Errors**: Occur when sending transactions to the blockchain
4. **Contract Errors**: Occur during contract deployment or interaction
5. **Database Errors**: Occur when interacting with Firebase services

### Error Handling Best Practices

1. **Use try-catch blocks** for asynchronous operations:
   ```javascript
   try {
     const result = await connector.connect();
     console.log('Connected successfully');
   } catch (error) {
     console.error('Connection error:', error);
     // Handle the error appropriately
   }
   ```

2. **Check connection status** before performing blockchain operations:
   ```javascript
   if (!connector.isConnected()) {
     throw new Error('Not connected to the network');
   }
   ```

3. **Validate user input** before sending to the blockchain:
   ```javascript
   if (!isValidAddress(address)) {
     throw new Error('Invalid address format');
   }
   ```

4. **Implement retry mechanisms** for transient errors:
   ```javascript
   async function connectWithRetry(maxRetries = 3) {
     let retries = 0;
     while (retries < maxRetries) {
       try {
         return await connector.connect();
       } catch (error) {
         retries++;
         if (retries >= maxRetries) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000));
       }
     }
   }
   ```

5. **Provide meaningful error messages** to users:
   ```javascript
   function handleError(error) {
     let userMessage = 'An unexpected error occurred';
     
     if (error.message.includes('insufficient balance')) {
       userMessage = 'Insufficient balance to complete this transaction';
     } else if (error.message.includes('connection timeout')) {
       userMessage = 'Network connection timeout. Please try again later';
     }
     
     displayErrorToUser(userMessage);
     console.error('Original error:', error);
   }
   ```

## Code Examples

### Complete Example: Connecting to a Network and Deploying a Contract

```javascript
import authService from './firebase/auth.js';
import blockchainIntegrationService from './firebase/blockchain-integration.js';

// Login user
async function loginAndDeploy() {
  try {
    // Login
    await authService.loginWithEmail('user@example.com', 'password123');
    console.log('Logged in successfully');
    
    // Connect to network
    const connection = await blockchainIntegrationService.connectToNetwork('polkadot');
    console.log(`Connected to ${connection.network.name}`);
    
    // Get or create wallet
    let wallet = blockchainIntegrationService.getUserWalletForNetwork('polkadot');
    if (!wallet) {
      const account = await blockchainIntegrationService.createAndAssociateAccount('polkadot');
      wallet = account.address;
      console.log(`Created new wallet: ${wallet}`);
    } else {
      console.log(`Using existing wallet: ${wallet}`);
    }
    
    // Load contract template
    const templates = await blockchainIntegrationService.getContractTemplates();
    const flipperTemplate = templates.find(t => t.id === 'flipper');
    
    if (!flipperTemplate) {
      throw new Error('Flipper template not found');
    }
    
    // Deploy contract
    const contractData = {
      name: 'MyFlipper',
      abi: flipperTemplate.abi,
      wasm: flipperTemplate.wasm
    };
    
    const deployOptions = {
      deployerAddress: wallet,
      constructorArgs: [true]
    };
    
    const deployedContract = await blockchainIntegrationService.deployContract(
      contractData,
      deployOptions
    );
    
    console.log(`Contract deployed at: ${deployedContract.address}`);
    
    // Call contract method
    const result = await blockchainIntegrationService.executeContractTransaction(
      deployedContract.address,
      'flip',
      [],
      { senderAddress: wallet }
    );
    
    console.log(`Transaction result: ${JSON.stringify(result)}`);
    
    return deployedContract;
  } catch (error) {
    console.error('Error in loginAndDeploy:', error);
    throw error;
  }
}

// Execute the function
loginAndDeploy()
  .then(contract => {
    console.log('Process completed successfully');
  })
  .catch(error => {
    console.error('Process failed:', error);
  });
```

### Example: Listening to Blockchain Events

```javascript
import blockchainIntegrationService from './firebase/blockchain-integration.js';

// Listen to transaction updates
function monitorTransactions() {
  // Connect to network
  blockchainIntegrationService.connectToNetwork('polkadot')
    .then(() => {
      console.log('Connected to network');
      
      // Start listening to transactions
      const listenerId = blockchainIntegrationService.listenToTransactions(transactions => {
        console.log(`Received ${transactions.length} transactions`);
        
        // Process each transaction
        transactions.forEach(tx => {
          console.log(`Transaction ${tx.hash} (${tx.status})`);
          
          // Update UI with transaction data
          updateTransactionUI(tx);
        });
      });
      
      console.log(`Listening to transactions with ID: ${listenerId}`);
      
      // Store the listener ID for later cleanup
      window.transactionListenerId = listenerId;
    })
    .catch(error => {
      console.error('Error monitoring transactions:', error);
    });
}

// Update UI with transaction data
function updateTransactionUI(transaction) {
  // Implementation depends on UI design
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  const txElement = document.createElement('div');
  txElement.className = 'transaction-item';
  txElement.innerHTML = `
    <div class="transaction-header">
      <h4>${transaction.type}</h4>
      <span class="transaction-status ${transaction.status.toLowerCase()}">${transaction.status}</span>
    </div>
    <div class="transaction-details">
      <p><strong>Hash:</strong> ${transaction.hash}</p>
      <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
    </div>
  `;
  
  transactionsList.prepend(txElement);
}

// Stop monitoring transactions
function stopMonitoringTransactions() {
  if (window.transactionListenerId) {
    blockchainIntegrationService.stopListeningToTransactions(window.transactionListenerId);
    console.log('Stopped monitoring transactions');
    window.transactionListenerId = null;
  }
}
```

## Conclusion

This API documentation provides a comprehensive guide to the Polkadot Educational Web Platform's framework and Firebase integration. Developers can use these modules to build educational applications that interact with the Polkadot blockchain, deploy and interact with smart contracts, and manage user data through Firebase services.

For more information about Polkadot and its ecosystem, refer to the official documentation at [https://polkadot.network/](https://polkadot.network/) and [https://wiki.polkadot.network/](https://wiki.polkadot.network/).