/**
 * contract-deployer.js
 * 
 * Module for deploying smart contracts to selected Polkadot networks.
 * Provides functionality for contract deployment, interaction, and template management.
 * 
 * Part of the Polkadot Educational Web Platform
 */

import PolkadotConnector from './polkadot-connector.js';

class ContractDeployer {
  /**
   * Initialize the contract deployer
   * @param {PolkadotConnector} connector - Polkadot connector instance
   */
  constructor(connector) {
    if (!connector || !(connector instanceof PolkadotConnector)) {
      throw new Error('A valid PolkadotConnector instance is required');
    }
    
    this.connector = connector;
    this.deployedContracts = [];
    this.contractTemplates = ContractDeployer.DEFAULT_TEMPLATES;
  }

  /**
   * Deploy a smart contract to the connected network
   * @param {Object} contractData - Contract data including ABI and bytecode
   * @param {Object} deployOptions - Deployment options
   * @returns {Promise<Object>} - Deployed contract information
   */
  async deployContract(contractData, deployOptions = {}) {
    if (!this.connector.isConnected()) {
      throw new Error('Not connected to a Polkadot network');
    }

    try {
      console.log('Deploying contract to network...');
      
      // Dynamic import to ensure compatibility with browser environments
      const { ContractPromise } = await import('@polkadot/api-contract');
      
      // Validate contract data
      if (!contractData.abi || !contractData.wasm) {
        throw new Error('Contract data must include ABI and WASM bytecode');
      }
      
      // Get the deployer account
      const deployerAddress = deployOptions.deployerAddress;
      if (!deployerAddress) {
        throw new Error('Deployer address is required');
      }
      
      // Parse the ABI
      const abi = JSON.parse(contractData.abi);
      
      // Create the contract instance
      const api = this.connector.api;
      
      // Get the constructor
      const constructor = abi.constructors.find(c => c.args.length === (deployOptions.constructorArgs || []).length);
      if (!constructor) {
        throw new Error('No matching constructor found for the provided arguments');
      }
      
      // Estimate gas for deployment
      const gasLimit = deployOptions.gasLimit || api.registry.createType('WeightV2', {
        refTime: 100000000000,
        proofSize: 5000000,
      });
      
      const storageDepositLimit = deployOptions.storageDepositLimit || null;
      const value = deployOptions.value || 0;
      
      // Deploy the contract
      const tx = api.tx.contracts.instantiateWithCode(
        value,
        gasLimit,
        storageDepositLimit,
        contractData.wasm,
        constructor.method + '(' + (deployOptions.constructorArgs || []).join(',') + ')',
        deployOptions.salt || ''
      );
      
      // Sign and send the transaction
      const result = await this.connector.signAndSendTransaction(
        {
          module: 'contracts',
          method: 'instantiateWithCode',
          params: [
            value,
            gasLimit,
            storageDepositLimit,
            contractData.wasm,
            constructor.method + '(' + (deployOptions.constructorArgs || []).join(',') + ')',
            deployOptions.salt || ''
          ]
        },
        deployerAddress,
        deployOptions.deployerMnemonic
      );
      
      // Find the contract address from events
      let contractAddress = null;
      for (const event of result.events) {
        if (event.section === 'contracts' && event.method === 'Instantiated') {
          // The second item in the data array is the contract address
          const dataArray = event.data.split(',');
          if (dataArray.length >= 2) {
            contractAddress = dataArray[1].trim();
          }
          break;
        }
      }
      
      if (!contractAddress) {
        throw new Error('Failed to retrieve contract address from transaction events');
      }
      
      // Create a contract instance for interaction
      const contract = new ContractPromise(api, abi, contractAddress);
      
      // Store the deployed contract
      const deployedContract = {
        address: contractAddress,
        abi: abi,
        contract: contract,
        deploymentData: {
          blockHash: result.blockHash,
          deployerAddress: deployerAddress,
          timestamp: new Date().toISOString(),
          constructorArgs: deployOptions.constructorArgs || []
        }
      };
      
      this.deployedContracts.push(deployedContract);
      
      console.log(`Contract deployed at address: ${contractAddress}`);
      
      return deployedContract;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }

  /**
   * Call a read-only method on a deployed contract
   * @param {string} contractAddress - Address of the deployed contract
   * @param {string} methodName - Name of the method to call
   * @param {Array} args - Arguments for the method
   * @param {Object} options - Call options
   * @returns {Promise<any>} - Method result
   */
  async callContractMethod(contractAddress, methodName, args = [], options = {}) {
    if (!this.connector.isConnected()) {
      throw new Error('Not connected to a Polkadot network');
    }

    try {
      // Find the deployed contract
      const deployedContract = this.findDeployedContract(contractAddress);
      if (!deployedContract) {
        throw new Error(`Contract with address ${contractAddress} not found`);
      }
      
      // Get the contract instance
      const contract = deployedContract.contract;
      
      // Call the method
      const result = await contract.query[methodName](
        options.callerAddress || this.connector.accounts[0]?.address,
        options.value || 0,
        options.gasLimit || null,
        ...args
      );
      
      // Check for errors
      if (result.result.isErr) {
        throw new Error(`Contract call error: ${result.result.asErr.toString()}`);
      }
      
      // Return the decoded result
      return result.output.toHuman();
    } catch (error) {
      console.error(`Error calling contract method ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a transaction on a deployed contract
   * @param {string} contractAddress - Address of the deployed contract
   * @param {string} methodName - Name of the method to execute
   * @param {Array} args - Arguments for the method
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} - Transaction result
   */
  async executeContractTransaction(contractAddress, methodName, args = [], options = {}) {
    if (!this.connector.isConnected()) {
      throw new Error('Not connected to a Polkadot network');
    }

    try {
      // Find the deployed contract
      const deployedContract = this.findDeployedContract(contractAddress);
      if (!deployedContract) {
        throw new Error(`Contract with address ${contractAddress} not found`);
      }
      
      // Get the contract instance
      const contract = deployedContract.contract;
      
      // Create the transaction
      const tx = contract.tx[methodName](
        options.gasLimit || null,
        options.storageDepositLimit || null,
        options.value || 0,
        ...args
      );
      
      // Sign and send the transaction
      const senderAddress = options.senderAddress || this.connector.accounts[0]?.address;
      if (!senderAddress) {
        throw new Error('Sender address is required');
      }
      
      const senderMnemonic = options.senderMnemonic;
      if (!senderMnemonic) {
        throw new Error('Sender mnemonic is required for signing');
      }
      
      // Sign and send the transaction
      return await this.connector.signAndSendTransaction(
        {
          module: 'contracts',
          method: 'call',
          params: [
            contractAddress,
            options.value || 0,
            options.gasLimit || null,
            options.storageDepositLimit || null,
            tx.method.toHex()
          ]
        },
        senderAddress,
        senderMnemonic
      );
    } catch (error) {
      console.error(`Error executing contract transaction ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Find a deployed contract by address
   * @param {string} contractAddress - Contract address
   * @returns {Object|null} - Deployed contract or null if not found
   * @private
   */
  findDeployedContract(contractAddress) {
    return this.deployedContracts.find(c => c.address === contractAddress) || null;
  }

  /**
   * Get all deployed contracts
   * @returns {Array} - List of deployed contracts
   */
  getDeployedContracts() {
    return [...this.deployedContracts];
  }

  /**
   * Add a contract template
   * @param {Object} template - Contract template
   */
  addContractTemplate(template) {
    if (!template.id || !template.name || !template.description) {
      throw new Error('Contract template must have id, name, and description properties');
    }
    
    // Check if template with this ID already exists
    const existingIndex = this.contractTemplates.findIndex(t => t.id === template.id);
    if (existingIndex !== -1) {
      // Update existing template
      this.contractTemplates[existingIndex] = { ...template };
    } else {
      // Add new template
      this.contractTemplates.push({ ...template });
    }
  }

  /**
   * Remove a contract template
   * @param {string} templateId - Template ID to remove
   */
  removeContractTemplate(templateId) {
    const index = this.contractTemplates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.contractTemplates.splice(index, 1);
    }
  }

  /**
   * Get all contract templates
   * @returns {Array} - List of contract templates
   */
  getContractTemplates() {
    return [...this.contractTemplates];
  }

  /**
   * Get a contract template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} - Contract template or null if not found
   */
  getContractTemplate(templateId) {
    return this.contractTemplates.find(t => t.id === templateId) || null;
  }

  /**
   * Verify a deployed contract
   * @param {string} contractAddress - Contract address
   * @param {Object} contractData - Original contract data
   * @returns {Promise<boolean>} - Verification result
   */
  async verifyContract(contractAddress, contractData) {
    if (!this.connector.isConnected()) {
      throw new Error('Not connected to a Polkadot network');
    }

    try {
      // Find the deployed contract
      const deployedContract = this.findDeployedContract(contractAddress);
      if (!deployedContract) {
        throw new Error(`Contract with address ${contractAddress} not found`);
      }
      
      // Compare contract bytecode
      // Note: This is a simplified verification approach
      // A more comprehensive verification would involve comparing the bytecode on-chain
      
      console.log('Contract verification is currently a simplified check');
      
      // For now, we'll just check if the contract exists and is callable
      const contract = deployedContract.contract;
      
      // Try to call a method to verify the contract is accessible
      // This is just a basic check that the contract exists and is callable
      const result = await contract.query.hasOwnProperty(
        this.connector.accounts[0]?.address || contractAddress,
        0
      );
      
      return !result.result.isErr;
    } catch (error) {
      console.error('Error verifying contract:', error);
      return false;
    }
  }
}

// Default contract templates
ContractDeployer.DEFAULT_TEMPLATES = [
  {
    id: 'erc20',
    name: 'ERC-20 Token',
    description: 'Standard ERC-20 token contract',
    category: 'tokens',
    language: 'ink',
    source: `
#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod erc20 {
    use ink_storage::{
        collections::HashMap,
        lazy::Lazy,
    };

    #[ink(storage)]
    pub struct Erc20 {
        total_supply: Lazy<Balance>,
        balances: HashMap<AccountId, Balance>,
        allowances: HashMap<(AccountId, AccountId), Balance>,
    }

    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: Option<AccountId>,
        value: Balance,
    }

    #[ink(event)]
    pub struct Approval {
        #[ink(topic)]
        owner: AccountId,
        #[ink(topic)]
        spender: AccountId,
        value: Balance,
    }

    impl Erc20 {
        #[ink(constructor)]
        pub fn new(initial_supply: Balance) -> Self {
            let caller = Self::env().caller();
            let mut balances = HashMap::new();
            balances.insert(caller, initial_supply);

            Self::env().emit_event(Transfer {
                from: None,
                to: Some(caller),
                value: initial_supply,
            });

            Self {
                total_supply: Lazy::new(initial_supply),
                balances,
                allowances: HashMap::new(),
            }
        }

        #[ink(message)]
        pub fn total_supply(&self) -> Balance {
            *self.total_supply
        }

        #[ink(message)]
        pub fn balance_of(&self, owner: AccountId) -> Balance {
            self.balances.get(&owner).copied().unwrap_or(0)
        }

        #[ink(message)]
        pub fn transfer(&mut self, to: AccountId, value: Balance) -> bool {
            let from = self.env().caller();
            self.transfer_from_to(from, to, value)
        }

        fn transfer_from_to(&mut self, from: AccountId, to: AccountId, value: Balance) -> bool {
            let from_balance = self.balance_of(from);
            if from_balance < value {
                return false;
            }

            self.balances.insert(from, from_balance - value);
            let to_balance = self.balance_of(to);
            self.balances.insert(to, to_balance + value);

            self.env().emit_event(Transfer {
                from: Some(from),
                to: Some(to),
                value,
            });

            true
        }
    }
}
    `
  },
  {
    id: 'flipper',
    name: 'Flipper',
    description: 'Simple boolean flip contract',
    category: 'examples',
    language: 'ink',
    source: `
#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(false)
        }

        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}
    `
  },
  {
    id: 'incrementer',
    name: 'Incrementer',
    description: 'Simple counter contract',
    category: 'examples',
    language: 'ink',
    source: `
#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod incrementer {
    #[ink(storage)]
    pub struct Incrementer {
        value: i32,
    }

    impl Incrementer {
        #[ink(constructor)]
        pub fn new(init_value: i32) -> Self {
            Self { value: init_value }
        }

        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(0)
        }

        #[ink(message)]
        pub fn increment(&mut self) {
            self.value += 1;
        }

        #[ink(message)]
        pub fn get(&self) -> i32 {
            self.value
        }

        #[ink(message)]
        pub fn reset(&mut self) {
            self.value = 0;
        }
    }
}
    `
  }
];

// Export the ContractDeployer class
export default ContractDeployer;