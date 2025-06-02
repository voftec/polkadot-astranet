# Polkadot Educational Web Platform

A comprehensive educational platform for learning about Polkadot blockchain technology, the Polkadot Virtual Machine (PVM), and smart contract development. This platform integrates with Firebase for authentication and data storage, and connects to the Polkadot blockchain for real-world interaction.

## Features

- **Interactive Learning Modules**: Comprehensive educational content about Polkadot ecosystem, architecture, and smart contract development
- **Blockchain Explorer**: Browse blocks, transactions, accounts, and validators on the Polkadot network
- **Smart Contract Deployment**: Deploy and interact with smart contracts directly from the platform
- **User Dashboard**: Track learning progress, manage deployed contracts, and view transaction history
- **Firebase Integration**: Authentication, data storage, and blockchain interaction tracking
- **Polkadot Framework**: JavaScript framework for interacting with Polkadot blockchain networks

## Project Structure

```
project/
├── public/                      # Web application files
│   ├── css/                     # Stylesheets
│   │   └── styles.css           # Main CSS file
│   ├── js/                      # JavaScript files
│   │   ├── framework/           # Polkadot integration framework
│   │   │   ├── polkadot-connector.js    # Core connection functionality
│   │   │   ├── blockchain-selector.js   # Network selection module
│   │   │   └── contract-deployer.js     # Contract deployment module
│   │   ├── firebase/            # Firebase integration
│   │   │   ├── config.js        # Firebase configuration
│   │   │   ├── auth.js          # Authentication service
│   │   │   ├── database.js      # Database service
│   │   │   └── blockchain-integration.js # Blockchain integration service
│   │   └── app.js               # Main application logic
│   ├── assets/                  # Images and resources
│   │   ├── polkadot-logo.png
│   │   ├── polkadot-architecture.png
│   │   ├── polkadot-parachain.png
│   │   └── polkadot-xcmp.png
│   └── index.html               # Main HTML file
├── docs/                        # Documentation and research
│   ├── research/                # Research findings
│   │   ├── polkadot-research.md
│   │   ├── smart-contract-research.md
│   │   └── firebase-integration.md
│   ├── api-documentation.md     # Framework API documentation
│   └── mvp-roadmap.md           # MVP roadmap
└── examples/                    # Example smart contracts
    └── demo-contracts/
        ├── erc20.rs             # ERC-20 token contract example
        └── flipper.rs           # Simple boolean flip contract example
```

## Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Firebase account
- Polkadot.js extension (for wallet integration)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/polkadot-educational-platform.git
   cd polkadot-educational-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication, Firestore Database, and Realtime Database
   - Create a web app in your Firebase project
   - Copy the Firebase configuration
   - Update the configuration in `public/js/firebase/config.js`

4. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     FIREBASE_API_KEY=your_api_key
     FIREBASE_AUTH_DOMAIN=your_auth_domain
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_storage_bucket
     FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     FIREBASE_APP_ID=your_app_id
     FIREBASE_MEASUREMENT_ID=your_measurement_id
     FIREBASE_DATABASE_URL=your_database_url
     RECAPTCHA_SITE_KEY=your_recaptcha_site_key
     ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### Learning Modules

1. Navigate to the "Learn" section
2. Choose a learning module (Basics, Architecture, PVM, Smart Contracts, or Interoperability)
3. Read the educational content and interact with the examples
4. Complete quizzes to test your knowledge

### Blockchain Explorer

1. Navigate to the "Explorer" section
2. Browse blocks, transactions, accounts, and validators
3. Search for specific blocks, transactions, or accounts
4. View detailed information about blockchain entities

### Smart Contract Deployment

1. Navigate to the "Deploy" section
2. Connect your Polkadot wallet
3. Select a network (Polkadot, Kusama, Rococo, or Local)
4. Choose a contract template or write your own
5. Configure deployment parameters
6. Deploy the contract
7. Interact with the deployed contract

### User Dashboard

1. Sign up or log in to your account
2. Navigate to the "Dashboard" section
3. View your learning progress
4. Manage your deployed contracts
5. Track your transaction history
6. Earn achievements as you learn

## Configuration

### Firebase Configuration

The platform uses Firebase for authentication, data storage, and blockchain interaction tracking. The configuration is stored in `public/js/firebase/config.js`.

```javascript
const firebaseConfigs = {
  development: {
    apiKey: process.env.FIREBASE_API_KEY || "YOUR_DEV_API_KEY",
    authDomain: "polkadot-edu-dev.firebaseapp.com",
    projectId: "polkadot-edu-dev",
    storageBucket: "polkadot-edu-dev.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456",
    measurementId: "G-DEV123456",
    databaseURL: "https://polkadot-edu-dev.firebaseio.com"
  },
  production: {
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
```

### Polkadot Network Configuration

The platform connects to various Polkadot networks. The default networks are configured in `public/js/framework/blockchain-selector.js`.

```javascript
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
```

## Development

### Framework Architecture

The platform's JavaScript framework consists of three main modules:

1. **PolkadotConnector**: Core connection functionality for Polkadot blockchain integration
2. **BlockchainSelector**: Module for selecting different Polkadot-based blockchains
3. **ContractDeployer**: Module for deploying and interacting with smart contracts

These modules are integrated with Firebase services through the blockchain integration service.

### Adding New Learning Content

To add new learning content:

1. Create a new tab in the `content-tabs` section of `public/index.html`
2. Add the corresponding tab content in the `tab-content` section
3. Update the navigation links if necessary

### Adding New Contract Templates

To add a new contract template:

1. Add the template to the `DEFAULT_TEMPLATES` array in `public/js/framework/contract-deployer.js`
2. Create a new template card in the `contract-templates` section of `public/index.html`
3. Add the template logic to the `loadContractTemplate` function in `public/js/app.js`

### Testing

The platform includes unit tests for the smart contract examples. To run the tests:

1. Install the ink! CLI:
   ```bash
   cargo install cargo-contract --force
   ```

2. Run the tests:
   ```bash
   cd examples/demo-contracts
   cargo +nightly test
   ```

## Contributing

We welcome contributions to the Polkadot Educational Web Platform! Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Write tests for your changes
5. Run the tests to ensure they pass
6. Submit a pull request

Please follow our coding standards and include appropriate documentation for your changes.

### Coding Standards

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ conventions
- Write clear, descriptive comments
- Use meaningful variable and function names
- Keep functions small and focused on a single task
- Write unit tests for new functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Polkadot Network](https://polkadot.network/) for creating the Polkadot blockchain
- [Parity Technologies](https://www.parity.io/) for developing the Polkadot Virtual Machine (PVM)
- [Firebase](https://firebase.google.com/) for providing authentication and database services
- [Polkadot.js](https://polkadot.js.org/) for the JavaScript API