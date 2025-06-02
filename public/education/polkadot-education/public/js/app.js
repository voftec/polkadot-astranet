/**
 * app.js
 * 
 * Main application logic for the Polkadot Educational Web Platform.
 * This file handles UI interactions, initializes components, and
 * integrates the Polkadot framework with Firebase functionality.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initializeUI();
    initializePolkadot();
    initializeFirebase();
    setupEventListeners();
});

/**
 * Initialize UI components and interactions
 */
function initializeUI() {
    console.log('Initializing UI components...');
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize dark mode toggle
    initializeDarkMode();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize modals
    initializeModals();
    
    // Initialize progress circles
    initializeProgressCircles();
    
    console.log('UI components initialized');
}

/**
 * Initialize Polkadot framework components
 */
function initializePolkadot() {
    console.log('Initializing Polkadot framework...');
    
    try {
        // Initialize Polkadot connector
        const connector = new PolkadotConnector({
            networkEndpoint: 'wss://rpc.polkadot.io'
        });
        
        // Add connection status listener
        connector.addConnectionListener((connected) => {
            console.log(`Polkadot connection status: ${connected ? 'Connected' : 'Disconnected'}`);
            updateConnectionStatus(connected);
        });
        
        // Initialize blockchain selector
        const selector = new BlockchainSelector({
            connector: connector,
            defaultChain: 'polkadot'
        });
        
        // Initialize contract deployer
        const deployer = new ContractDeployer({
            connector: connector,
            selector: selector
        });
        
        // Store instances in window for global access
        window.polkadotConnector = connector;
        window.blockchainSelector = selector;
        window.contractDeployer = deployer;
        
        // Connect to network (will be handled by the connector)
        connector.connect()
            .then(() => {
                console.log('Connected to Polkadot network');
                loadBlockchainData();
            })
            .catch(error => {
                console.error('Failed to connect to Polkadot network:', error);
                showErrorNotification('Failed to connect to Polkadot network. Please try again later.');
            });
    } catch (error) {
        console.error('Error initializing Polkadot framework:', error);
        showErrorNotification('Failed to initialize Polkadot framework. Please check your connection and try again.');
    }
    
    console.log('Polkadot framework initialized');
}

/**
 * Initialize Firebase components
 */
function initializeFirebase() {
    console.log('Initializing Firebase components...');
    
    try {
        // Check if Firebase is already initialized
        if (!window.firebaseApp) {
            // Initialize Firebase with configuration
            const firebaseConfig = FirebaseConfig.getConfig();
            window.firebaseApp = firebase.initializeApp(firebaseConfig);
        }
        
        // Initialize authentication
        const auth = new FirebaseAuth(window.firebaseApp);
        
        // Initialize database
        const database = new FirebaseDatabase(window.firebaseApp);
        
        // Initialize blockchain integration
        const blockchainIntegration = new BlockchainIntegration({
            database: database,
            connector: window.polkadotConnector
        });
        
        // Store instances in window for global access
        window.firebaseAuth = auth;
        window.firebaseDatabase = database;
        window.blockchainIntegration = blockchainIntegration;
        
        // Check authentication state
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User is signed in:', user.email);
                updateUIForAuthenticatedUser(user);
                loadUserData(user.uid);
            } else {
                console.log('User is signed out');
                updateUIForUnauthenticatedUser();
            }
        });
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        showErrorNotification('Failed to initialize Firebase. Please check your connection and try again.');
    }
    
    console.log('Firebase components initialized');
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            scrollToSection(target);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Close mobile menu if open
            document.getElementById('navList').classList.remove('active');
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            document.getElementById('navList').classList.toggle('active');
        });
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Authentication buttons
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (signupBtn) signupBtn.addEventListener('click', showSignupModal);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Modal switch links
    const showLoginModalLink = document.getElementById('showLoginModal');
    const showSignupModalLink = document.getElementById('showSignupModal');
    if (showLoginModalLink) {
        showLoginModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signupModal').style.display = 'none';
            showLoginModal();
        });
    }
    if (showSignupModalLink) {
        showSignupModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginModal').style.display = 'none';
            showSignupModal();
        });
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (window.firebaseAuth) {
                window.firebaseAuth.signIn(email, password)
                    .then(() => {
                        document.getElementById('loginModal').style.display = 'none';
                        showSuccessNotification('Successfully logged in!');
                    })
                    .catch(error => {
                        console.error('Login error:', error);
                        showErrorNotification('Login failed: ' + error.message);
                    });
            }
        });
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            if (password !== confirmPassword) {
                showErrorNotification('Passwords do not match');
                return;
            }
            
            if (window.firebaseAuth) {
                window.firebaseAuth.signUp(email, password, name)
                    .then(() => {
                        document.getElementById('signupModal').style.display = 'none';
                        showSuccessNotification('Account created successfully!');
                    })
                    .catch(error => {
                        console.error('Signup error:', error);
                        showErrorNotification('Signup failed: ' + error.message);
                    });
            }
        });
    }
    
    // Connect wallet button
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Deploy contract button
    const deployContractBtn = document.getElementById('deployContractBtn');
    if (deployContractBtn) {
        deployContractBtn.addEventListener('click', deployContract);
    }
    
    // Contract template buttons
    document.querySelectorAll('[data-template]').forEach(button => {
        button.addEventListener('click', (e) => {
            const templateName = e.target.getAttribute('data-template');
            loadContractTemplate(templateName);
        });
    });
    
    // Explorer tab buttons
    document.querySelectorAll('[data-explorer-tab]').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-explorer-tab');
            switchExplorerTab(tabName);
        });
    });
    
    // Dashboard tab buttons
    document.querySelectorAll('[data-dashboard-tab]').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-dashboard-tab');
            switchDashboardTab(tabName);
        });
    });
    
    // Search button in explorer
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchQuery = document.getElementById('explorerSearch').value;
            if (searchQuery) {
                searchBlockchain(searchQuery);
            }
        });
    }
    
    // Interactive demos and quizzes
    const startBasicsQuiz = document.getElementById('startBasicsQuiz');
    if (startBasicsQuiz) {
        startBasicsQuiz.addEventListener('click', startBasicsQuizHandler);
    }
    
    const loadArchitectureDiagram = document.getElementById('loadArchitectureDiagram');
    if (loadArchitectureDiagram) {
        loadArchitectureDiagram.addEventListener('click', loadArchitectureDiagramHandler);
    }
    
    const startCrossChainDemo = document.getElementById('startCrossChainDemo');
    if (startCrossChainDemo) {
        startCrossChainDemo.addEventListener('click', startCrossChainDemoHandler);
    }
    
    // Run contract in sandbox
    const runContract = document.getElementById('runContract');
    if (runContract) {
        runContract.addEventListener('click', runContractInSandbox);
    }
    
    console.log('Event listeners set up');
}

/**
 * Initialize tab functionality
 */
function initializeTabs() {
    // Content tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            if (!tabName) return;
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const selectedContent = document.getElementById(`${tabName}-content`);
            if (selectedContent) {
                selectedContent.classList.add('active');
            }
            
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
        });
    });
}

/**
 * Initialize dark mode functionality
 */
function initializeDarkMode() {
    // Check for saved preference
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateDarkModeIcon(isDarkMode);
}

/**
 * Update dark mode icon
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 */
function updateDarkModeIcon(isDarkMode) {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
}

/**
 * Initialize mobile menu
 */
function initializeMobileMenu() {
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const navList = document.getElementById('navList');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        if (navList && mobileMenuToggle) {
            if (!navList.contains(e.target) && !mobileMenuToggle.contains(e.target) && navList.classList.contains('active')) {
                navList.classList.remove('active');
            }
        }
    });
}

/**
 * Initialize modals
 */
function initializeModals() {
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Initialize progress circles
 */
function initializeProgressCircles() {
    document.querySelectorAll('.progress-circle').forEach(circle => {
        const progress = parseInt(circle.getAttribute('data-progress')) || 0;
        updateProgressCircle(circle, progress);
    });
}

/**
 * Update progress circle
 * @param {HTMLElement} circle - The progress circle element
 * @param {number} progress - Progress percentage (0-100)
 */
function updateProgressCircle(circle, progress) {
    // Update the circle's appearance based on progress
    const circumference = 2 * Math.PI * 45; // 45 is the radius
    const offset = circumference - (progress / 100) * circumference;
    
    // If the circle has an SVG, update it
    const progressText = circle.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
    
    // Store the progress value
    circle.setAttribute('data-progress', progress);
}

/**
 * Show login modal
 */
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

/**
 * Show signup modal
 */
function showSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

/**
 * Scroll to section
 * @param {string} sectionId - ID of the section to scroll to
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Update UI for authenticated user
 * @param {Object} user - Firebase user object
 */
function updateUIForAuthenticatedUser(user) {
    // Hide auth buttons, show user profile
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    
    if (authButtons && userProfile) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update user profile info
        const userProfileImg = document.getElementById('userProfileImg');
        const userName = document.getElementById('userName');
        
        if (userProfileImg && userName) {
            userProfileImg.src = user.photoURL || 'assets/default-avatar.png';
            userName.textContent = user.displayName || user.email;
        }
    }
    
    // Update dashboard user name
    const dashboardUserName = document.getElementById('dashboardUserName');
    if (dashboardUserName) {
        dashboardUserName.textContent = user.displayName || user.email;
    }
}

/**
 * Update UI for unauthenticated user
 */
function updateUIForUnauthenticatedUser() {
    // Show auth buttons, hide user profile
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    
    if (authButtons && userProfile) {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
    
    // Update dashboard user name
    const dashboardUserName = document.getElementById('dashboardUserName');
    if (dashboardUserName) {
        dashboardUserName.textContent = 'Guest';
    }
}

/**
 * Load user data from Firebase
 * @param {string} userId - Firebase user ID
 */
function loadUserData(userId) {
    if (window.firebaseDatabase) {
        window.firebaseDatabase.getUserData(userId)
            .then(userData => {
                if (userData) {
                    console.log('User data loaded:', userData);
                    updateDashboard(userData);
                } else {
                    console.log('No user data found');
                }
            })
            .catch(error => {
                console.error('Error loading user data:', error);
            });
    }
}

/**
 * Update dashboard with user data
 * @param {Object} userData - User data from Firebase
 */
function updateDashboard(userData) {
    // Update learning progress
    const learningProgress = userData.learningProgress || 0;
    const learningProgressCircle = document.getElementById('learningProgressCircle');
    if (learningProgressCircle) {
        updateProgressCircle(learningProgressCircle, learningProgress);
    }
    
    // Update contracts count
    const contractsCount = document.getElementById('contractsCount');
    if (contractsCount) {
        contractsCount.textContent = userData.contracts?.length || 0;
    }
    
    // Update transactions count
    const transactionsCount = document.getElementById('transactionsCount');
    if (transactionsCount) {
        transactionsCount.textContent = userData.transactions?.length || 0;
    }
    
    // Update achievements count
    const achievementsCount = document.getElementById('achievementsCount');
    if (achievementsCount) {
        achievementsCount.textContent = userData.achievements?.length || 0;
    }
    
    // Update activity list
    updateActivityList(userData.activities || []);
    
    // Update learning modules
    updateLearningModules(userData.modules || []);
    
    // Update contracts list
    updateContractsList(userData.contracts || []);
    
    // Update transactions list
    updateTransactionsList(userData.transactions || []);
}

/**
 * Update activity list
 * @param {Array} activities - User activities
 */
function updateActivityList(activities) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <li class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">No recent activity to display.</p>
                    <p class="activity-time">Complete learning modules or deploy contracts to see activity here.</p>
                </div>
            </li>
        `;
        return;
    }
    
    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Take only the 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    // Generate HTML for activities
    const activitiesHTML = recentActivities.map(activity => {
        let iconClass = 'fas fa-info-circle';
        
        // Set icon based on activity type
        switch (activity.type) {
            case 'learning':
                iconClass = 'fas fa-book';
                break;
            case 'quiz':
                iconClass = 'fas fa-question-circle';
                break;
            case 'contract':
                iconClass = 'fas fa-file-contract';
                break;
            case 'transaction':
                iconClass = 'fas fa-exchange-alt';
                break;
            case 'achievement':
                iconClass = 'fas fa-trophy';
                break;
        }
        
        // Format timestamp
        const date = new Date(activity.timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();
        
        return `
            <li class="activity-item">
                <div class="activity-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.description}</p>
                    <p class="activity-time">${formattedDate} at ${formattedTime}</p>
                </div>
            </li>
        `;
    }).join('');
    
    activityList.innerHTML = activitiesHTML;
}

/**
 * Update learning modules
 * @param {Array} modules - Learning modules data
 */
function updateLearningModules(modules) {
    const learningModules = document.getElementById('learningModules');
    if (!learningModules) return;
    
    if (modules.length === 0) {
        // Use default modules if none are provided
        const defaultModules = [
            {
                id: 'basics',
                title: 'Introduction to Polkadot',
                description: 'Learn the basics of Polkadot blockchain technology.',
                progress: 0,
                status: 'Not Started'
            },
            {
                id: 'architecture',
                title: 'Polkadot Architecture',
                description: 'Understand the components of Polkadot\'s architecture.',
                progress: 0,
                status: 'Not Started'
            },
            {
                id: 'smart-contracts',
                title: 'Smart Contract Development',
                description: 'Learn how to develop smart contracts for Polkadot.',
                progress: 0,
                status: 'Not Started'
            }
        ];
        
        updateLearningModules(defaultModules);
        return;
    }
    
    // Generate HTML for modules
    const modulesHTML = modules.map(module => {
        return `
            <div class="module">
                <div class="module-header">
                    <h4>${module.title}</h4>
                    <span class="module-status">${module.status}</span>
                </div>
                <div class="module-progress">
                    <div class="progress-bar" style="width: ${module.progress}%"></div>
                </div>
                <div class="module-content">
                    <p>${module.description}</p>
                    <button class="btn btn-primary" data-module-id="${module.id}">
                        ${module.progress > 0 ? 'Continue' : 'Start'} Module
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    learningModules.innerHTML = modulesHTML;
    
    // Add event listeners to module buttons
    document.querySelectorAll('[data-module-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const moduleId = e.target.getAttribute('data-module-id');
            startLearningModule(moduleId);
        });
    });
}

/**
 * Update contracts list
 * @param {Array} contracts - User contracts
 */
function updateContractsList(contracts) {
    const contractsList = document.getElementById('contractsList');
    if (!contractsList) return;
    
    if (contracts.length === 0) {
        contractsList.innerHTML = `
            <p>No contracts deployed yet.</p>
            <button class="btn btn-primary" id="deployNewContractBtn">Deploy New Contract</button>
        `;
        
        // Add event listener to deploy button
        const deployNewContractBtn = document.getElementById('deployNewContractBtn');
        if (deployNewContractBtn) {
            deployNewContractBtn.addEventListener('click', () => {
                scrollToSection('deploy');
            });
        }
        
        return;
    }
    
    // Generate HTML for contracts
    const contractsHTML = contracts.map((contract, index) => {
        return `
            <div class="contract-item">
                <div class="contract-header">
                    <h4>${contract.name || `Contract ${index + 1}`}</h4>
                    <span class="contract-network">${contract.network}</span>
                </div>
                <div class="contract-details">
                    <p><strong>Address:</strong> ${contract.address}</p>
                    <p><strong>Deployed:</strong> ${new Date(contract.deployedAt).toLocaleString()}</p>
                    <p><strong>Type:</strong> ${contract.type}</p>
                </div>
                <div class="contract-actions">
                    <button class="btn btn-outline" data-contract-id="${contract.id}" data-action="view">View Contract</button>
                    <button class="btn btn-primary" data-contract-id="${contract.id}" data-action="interact">Interact</button>
                </div>
            </div>
        `;
    }).join('');
    
    contractsList.innerHTML = contractsHTML;
    
    // Add event listeners to contract buttons
    document.querySelectorAll('[data-contract-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const contractId = e.target.getAttribute('data-contract-id');
            const action = e.target.getAttribute('data-action');
            
            if (action === 'view') {
                viewContract(contractId);
            } else if (action === 'interact') {
                interactWithContract(contractId);
            }
        });
    });
}

/**
 * Update transactions list
 * @param {Array} transactions - User transactions
 */
function updateTransactionsList(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <p>No transactions found.</p>
        `;
        return;
    }
    
    // Sort transactions by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    // Generate HTML for transactions
    const transactionsHTML = transactions.map(tx => {
        return `
            <div class="transaction-item">
                <div class="transaction-header">
                    <h4>${tx.type}</h4>
                    <span class="transaction-status ${tx.status.toLowerCase()}">${tx.status}</span>
                </div>
                <div class="transaction-details">
                    <p><strong>Hash:</strong> ${tx.hash}</p>
                    <p><strong>Block:</strong> ${tx.blockNumber}</p>
                    <p><strong>Time:</strong> ${new Date(tx.timestamp).toLocaleString()}</p>
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-outline" data-tx-hash="${tx.hash}">View Details</button>
                </div>
            </div>
        `;
    }).join('');
    
    transactionsList.innerHTML = transactionsHTML;
    
    // Add event listeners to transaction buttons
    document.querySelectorAll('[data-tx-hash]').forEach(button => {
        button.addEventListener('click', (e) => {
            const txHash = e.target.getAttribute('data-tx-hash');
            viewTransaction(txHash);
        });
    });
}

/**
 * Load blockchain data for explorer
 */
function loadBlockchainData() {
    if (!window.polkadotConnector || !window.polkadotConnector.isConnected()) {
        console.log('Polkadot connector not ready');
        return;
    }
    
    console.log('Loading blockchain data...');
    
    // Load blocks
    loadBlocks();
    
    // Load transactions
    loadTransactions();
    
    // Load accounts
    loadAccounts();
    
    // Load validators
    loadValidators();
}

/**
 * Load blocks for explorer
 */
function loadBlocks() {
    const blocksTable = document.getElementById('blocksTable');
    if (!blocksTable) return;
    
    // Show loading state
    blocksTable.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="5" class="text-center">Loading block data...</td>
        </tr>
    `;
    
    // Use the Polkadot connector to fetch blocks
    if (window.polkadotConnector) {
        window.polkadotConnector.getRecentBlocks(10)
            .then(blocks => {
                if (blocks && blocks.length > 0) {
                    updateBlocksTable(blocks);
                } else {
                    blocksTable.querySelector('tbody').innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center">No blocks found</td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading blocks:', error);
                blocksTable.querySelector('tbody').innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Error loading blocks</td>
                    </tr>
                `;
            });
    }
}

/**
 * Update blocks table with data
 * @param {Array} blocks - Block data
 */
function updateBlocksTable(blocks) {
    const blocksTable = document.getElementById('blocksTable');
    if (!blocksTable) return;
    
    const tbody = blocksTable.querySelector('tbody');
    
    // Generate HTML for blocks
    const blocksHTML = blocks.map(block => {
        return `
            <tr>
                <td>${block.number}</td>
                <td>${block.hash.substring(0, 10)}...${block.hash.substring(block.hash.length - 8)}</td>
                <td>${new Date(block.timestamp).toLocaleString()}</td>
                <td>${block.transactions}</td>
                <td>${block.validator.substring(0, 10)}...${block.validator.substring(block.validator.length - 8)}</td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = blocksHTML;
}

/**
 * Load transactions for explorer
 */
function loadTransactions() {
    const transactionsTable = document.getElementById('transactionsTable');
    if (!transactionsTable) return;
    
    // Show loading state
    transactionsTable.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="5" class="text-center">Loading transaction data...</td>
        </tr>
    `;
    
    // Use the Polkadot connector to fetch transactions
    if (window.polkadotConnector) {
        window.polkadotConnector.getRecentTransactions(10)
            .then(transactions => {
                if (transactions && transactions.length > 0) {
                    updateTransactionsTable(transactions);
                } else {
                    transactionsTable.querySelector('tbody').innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center">No transactions found</td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading transactions:', error);
                transactionsTable.querySelector('tbody').innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Error loading transactions</td>
                    </tr>
                `;
            });
    }
}

/**
 * Update transactions table with data
 * @param {Array} transactions - Transaction data
 */
function updateTransactionsTable(transactions) {
    const transactionsTable = document.getElementById('transactionsTable');
    if (!transactionsTable) return;
    
    const tbody = transactionsTable.querySelector('tbody');
    
    // Generate HTML for transactions
    const transactionsHTML = transactions.map(tx => {
        return `
            <tr>
                <td>${tx.hash.substring(0, 10)}...${tx.hash.substring(tx.hash.length - 8)}</td>
                <td>${tx.blockNumber}</td>
                <td>${tx.from.substring(0, 10)}...${tx.from.substring(tx.from.length - 8)}</td>
                <td>${tx.to.substring(0, 10)}...${tx.to.substring(tx.to.length - 8)}</td>
                <td>${tx.value} DOT</td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = transactionsHTML;
}

/**
 * Load accounts for explorer
 */
function loadAccounts() {
    const accountsTable = document.getElementById('accountsTable');
    if (!accountsTable) return;
    
    // Show loading state
    accountsTable.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="4" class="text-center">Loading account data...</td>
        </tr>
    `;
    
    // Use the Polkadot connector to fetch accounts
    if (window.polkadotConnector) {
        window.polkadotConnector.getTopAccounts(10)
            .then(accounts => {
                if (accounts && accounts.length > 0) {
                    updateAccountsTable(accounts);
                } else {
                    accountsTable.querySelector('tbody').innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center">No accounts found</td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading accounts:', error);
                accountsTable.querySelector('tbody').innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">Error loading accounts</td>
                    </tr>
                `;
            });
    }
}

/**
 * Update accounts table with data
 * @param {Array} accounts - Account data
 */
function updateAccountsTable(accounts) {
    const accountsTable = document.getElementById('accountsTable');
    if (!accountsTable) return;
    
    const tbody = accountsTable.querySelector('tbody');
    
    // Generate HTML for accounts
    const accountsHTML = accounts.map((account, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${account.address.substring(0, 10)}...${account.address.substring(account.address.length - 8)}</td>
                <td>${account.balance} DOT</td>
                <td>${account.transactions}</td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = accountsHTML;
}

/**
 * Load validators for explorer
 */
function loadValidators() {
    const validatorsTable = document.getElementById('validatorsTable');
    if (!validatorsTable) return;
    
    // Show loading state
    validatorsTable.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="5" class="text-center">Loading validator data...</td>
        </tr>
    `;
    
    // Use the Polkadot connector to fetch validators
    if (window.polkadotConnector) {
        window.polkadotConnector.getActiveValidators(10)
            .then(validators => {
                if (validators && validators.length > 0) {
                    updateValidatorsTable(validators);
                } else {
                    validatorsTable.querySelector('tbody').innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center">No validators found</td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading validators:', error);
                validatorsTable.querySelector('tbody').innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Error loading validators</td>
                    </tr>
                `;
            });
    }
}

/**
 * Update validators table with data
 * @param {Array} validators - Validator data
 */
function updateValidatorsTable(validators) {
    const validatorsTable = document.getElementById('validatorsTable');
    if (!validatorsTable) return;
    
    const tbody = validatorsTable.querySelector('tbody');
    
    // Generate HTML for validators
    const validatorsHTML = validators.map((validator, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${validator.name || validator.address.substring(0, 10) + '...' + validator.address.substring(validator.address.length - 8)}</td>
                <td>${validator.stakedAmount} DOT</td>
                <td>${validator.commission}%</td>
                <td>${validator.blocksProduced}</td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = validatorsHTML;
}

/**
 * Switch explorer tab
 * @param {string} tabName - Name of the tab to switch to
 */
function switchExplorerTab(tabName) {
    // Hide all explorer content
    document.querySelectorAll('.explorer-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected explorer content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Update active tab button
    document.querySelectorAll('[data-explorer-tab]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-explorer-tab="${tabName}"]`).classList.add('active');
}

/**
 * Switch dashboard tab
 * @param {string} tabName - Name of the tab to switch to
 */
function switchDashboardTab(tabName) {
    // Hide all dashboard content
    document.querySelectorAll('.dashboard-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected dashboard content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Update active tab button
    document.querySelectorAll('[data-dashboard-tab]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-dashboard-tab="${tabName}"]`).classList.add('active');
}

/**
 * Search blockchain for a query
 * @param {string} query - Search query
 */
function searchBlockchain(query) {
    console.log('Searching blockchain for:', query);
    
    if (!window.polkadotConnector) {
        showErrorNotification('Blockchain connector not initialized');
        return;
    }
    
    // Determine what type of query it is (block number, transaction hash, or account address)
    if (/^\d+$/.test(query)) {
        // Block number
        searchBlock(parseInt(query));
    } else if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
        // Transaction hash
        searchTransaction(query);
    } else {
        // Account address
        searchAccount(query);
    }
}

/**
 * Search for a block
 * @param {number} blockNumber - Block number
 */
function searchBlock(blockNumber) {
    if (window.polkadotConnector) {
        window.polkadotConnector.getBlock(blockNumber)
            .then(block => {
                if (block) {
                    showBlockDetails(block);
                } else {
                    showErrorNotification(`Block ${blockNumber} not found`);
                }
            })
            .catch(error => {
                console.error('Error searching for block:', error);
                showErrorNotification('Error searching for block');
            });
    }
}

/**
 * Search for a transaction
 * @param {string} txHash - Transaction hash
 */
function searchTransaction(txHash) {
    if (window.polkadotConnector) {
        window.polkadotConnector.getTransaction(txHash)
            .then(tx => {
                if (tx) {
                    showTransactionDetails(tx);
                } else {
                    showErrorNotification(`Transaction ${txHash} not found`);
                }
            })
            .catch(error => {
                console.error('Error searching for transaction:', error);
                showErrorNotification('Error searching for transaction');
            });
    }
}

/**
 * Search for an account
 * @param {string} address - Account address
 */
function searchAccount(address) {
    if (window.polkadotConnector) {
        window.polkadotConnector.getAccount(address)
            .then(account => {
                if (account) {
                    showAccountDetails(account);
                } else {
                    showErrorNotification(`Account ${address} not found`);
                }
            })
            .catch(error => {
                console.error('Error searching for account:', error);
                showErrorNotification('Error searching for account');
            });
    }
}

/**
 * Show block details
 * @param {Object} block - Block data
 */
function showBlockDetails(block) {
    // Implementation depends on UI design
    console.log('Block details:', block);
    
    // Switch to blocks tab
    switchExplorerTab('blocks');
    
    // Highlight the block in the table or show a modal with details
    // This is a placeholder implementation
    alert(`Block ${block.number} details:\nHash: ${block.hash}\nTimestamp: ${new Date(block.timestamp).toLocaleString()}\nTransactions: ${block.transactions}\nValidator: ${block.validator}`);
}

/**
 * Show transaction details
 * @param {Object} tx - Transaction data
 */
function showTransactionDetails(tx) {
    // Implementation depends on UI design
    console.log('Transaction details:', tx);
    
    // Switch to transactions tab
    switchExplorerTab('transactions');
    
    // Highlight the transaction in the table or show a modal with details
    // This is a placeholder implementation
    alert(`Transaction details:\nHash: ${tx.hash}\nBlock: ${tx.blockNumber}\nFrom: ${tx.from}\nTo: ${tx.to}\nValue: ${tx.value} DOT`);
}

/**
 * Show account details
 * @param {Object} account - Account data
 */
function showAccountDetails(account) {
    // Implementation depends on UI design
    console.log('Account details:', account);
    
    // Switch to accounts tab
    switchExplorerTab('accounts');
    
    // Highlight the account in the table or show a modal with details
    // This is a placeholder implementation
    alert(`Account details:\nAddress: ${account.address}\nBalance: ${account.balance} DOT\nTransactions: ${account.transactions}`);
}

/**
 * Connect wallet
 */
function connectWallet() {
    console.log('Connecting wallet...');
    
    if (!window.polkadotConnector) {
        showErrorNotification('Blockchain connector not initialized');
        return;
    }
    
    // Show connecting state
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.disabled = true;
        connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    }
    
    // Connect wallet
    window.polkadotConnector.connectWallet()
        .then(wallet => {
            console.log('Wallet connected:', wallet);
            
            // Update UI
            const walletStatus = document.getElementById('walletStatus');
            const walletAddress = document.getElementById('walletAddress');
            
            if (walletStatus && walletAddress) {
                walletStatus.style.display = 'block';
                walletAddress.textContent = `${wallet.address.substring(0, 10)}...${wallet.address.substring(wallet.address.length - 8)}`;
            }
            
            // Reset button
            if (connectWalletBtn) {
                connectWalletBtn.disabled = false;
                connectWalletBtn.innerHTML = 'Wallet Connected';
                connectWalletBtn.classList.remove('btn-primary');
                connectWalletBtn.classList.add('btn-success');
            }
            
            showSuccessNotification('Wallet connected successfully!');
        })
        .catch(error => {
            console.error('Error connecting wallet:', error);
            
            // Reset button
            if (connectWalletBtn) {
                connectWalletBtn.disabled = false;
                connectWalletBtn.innerHTML = 'Connect Wallet';
            }
            
            showErrorNotification('Failed to connect wallet: ' + error.message);
        });
}

/**
 * Deploy contract
 */
function deployContract() {
    console.log('Deploying contract...');
    
    if (!window.contractDeployer) {
        showErrorNotification('Contract deployer not initialized');
        return;
    }
    
    // Get form values
    const network = document.getElementById('networkSelect').value;
    const contractType = document.getElementById('contractType').value;
    const contractCode = document.getElementById('contractCode').value;
    const constructorArgs = document.getElementById('constructorArgs').value;
    const gasLimit = document.getElementById('gasLimit').value;
    
    // Validate inputs
    if (!contractCode) {
        showErrorNotification('Please enter contract code or upload a contract file');
        return;
    }
    
    // Parse constructor arguments
    let parsedArgs = [];
    try {
        if (constructorArgs) {
            parsedArgs = JSON.parse(constructorArgs);
        }
    } catch (error) {
        showErrorNotification('Invalid constructor arguments format. Please use JSON array format.');
        return;
    }
    
    // Show deploying state
    const deployContractBtn = document.getElementById('deployContractBtn');
    if (deployContractBtn) {
        deployContractBtn.disabled = true;
        deployContractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deploying...';
    }
    
    // Update deployment status
    const deploymentStatus = document.getElementById('deploymentStatus');
    const deploymentLog = document.getElementById('deploymentLog');
    
    if (deploymentStatus) {
        deploymentStatus.querySelector('.status-indicator span').textContent = 'Deploying contract...';
    }
    
    if (deploymentLog) {
        deploymentLog.innerHTML += `<p>[${new Date().toLocaleTimeString()}] Starting deployment on ${network}...</p>`;
    }
    
    // Deploy contract
    window.contractDeployer.deployContract({
        network,
        contractType,
        contractCode,
        constructorArgs: parsedArgs,
        gasLimit: parseInt(gasLimit)
    })
        .then(result => {
            console.log('Contract deployed:', result);
            
            // Update deployment log
            if (deploymentLog) {
                deploymentLog.innerHTML += `
                    <p>[${new Date().toLocaleTimeString()}] Contract deployed successfully!</p>
                    <p>[${new Date().toLocaleTimeString()}] Contract address: ${result.address}</p>
                    <p>[${new Date().toLocaleTimeString()}] Transaction hash: ${result.transactionHash}</p>
                `;
            }
            
            // Update status indicator
            if (deploymentStatus) {
                deploymentStatus.querySelector('.status-indicator i').classList.remove('fa-spin');
                deploymentStatus.querySelector('.status-indicator i').classList.remove('fa-circle-notch');
                deploymentStatus.querySelector('.status-indicator i').classList.add('fa-check-circle');
                deploymentStatus.querySelector('.status-indicator span').textContent = 'Contract deployed successfully!';
            }
            
            // Reset button
            if (deployContractBtn) {
                deployContractBtn.disabled = false;
                deployContractBtn.innerHTML = 'Deploy Contract';
            }
            
            showSuccessNotification('Contract deployed successfully!');
            
            // Save contract to user data if authenticated
            if (window.firebaseAuth && window.firebaseAuth.getCurrentUser() && window.firebaseDatabase) {
                const user = window.firebaseAuth.getCurrentUser();
                
                const contractData = {
                    name: `Contract ${new Date().toLocaleTimeString()}`,
                    address: result.address,
                    network,
                    type: contractType,
                    deployedAt: Date.now(),
                    transactionHash: result.transactionHash
                };
                
                window.firebaseDatabase.saveContract(user.uid, contractData)
                    .then(() => {
                        console.log('Contract saved to user data');
                        
                        // Add activity
                        const activityData = {
                            type: 'contract',
                            description: `Deployed a ${contractType} contract on ${network}`,
                            timestamp: Date.now()
                        };
                        
                        window.firebaseDatabase.addActivity(user.uid, activityData)
                            .then(() => {
                                console.log('Activity added');
                                
                                // Reload user data to update UI
                                loadUserData(user.uid);
                            })
                            .catch(error => {
                                console.error('Error adding activity:', error);
                            });
                    })
                    .catch(error => {
                        console.error('Error saving contract:', error);
                    });
            }
        })
        .catch(error => {
            console.error('Error deploying contract:', error);
            
            // Update deployment log
            if (deploymentLog) {
                deploymentLog.innerHTML += `
                    <p class="error">[${new Date().toLocaleTimeString()}] Error deploying contract: ${error.message}</p>
                `;
            }
            
            // Update status indicator
            if (deploymentStatus) {
                deploymentStatus.querySelector('.status-indicator i').classList.remove('fa-spin');
                deploymentStatus.querySelector('.status-indicator i').classList.remove('fa-circle-notch');
                deploymentStatus.querySelector('.status-indicator i').classList.add('fa-exclamation-circle');
                deploymentStatus.querySelector('.status-indicator span').textContent = 'Deployment failed';
            }
            
            // Reset button
            if (deployContractBtn) {
                deployContractBtn.disabled = false;
                deployContractBtn.innerHTML = 'Deploy Contract';
            }
            
            showErrorNotification('Failed to deploy contract: ' + error.message);
        });
}

/**
 * Load contract template
 * @param {string} templateName - Name of the template to load
 */
function loadContractTemplate(templateName) {
    console.log('Loading contract template:', templateName);
    
    const contractCode = document.getElementById('contractCode');
    const contractType = document.getElementById('contractType');
    
    if (!contractCode || !contractType) return;
    
    let code = '';
    let type = 'ink';
    
    switch (templateName) {
        case 'token':
            type = 'evm';
            code = `pragma solidity ^0.8.0;

/**
 * @title SimpleToken
 * @dev A simple ERC-20 Token implementation
 */
contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _initialSupply * 10**uint256(decimals);
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(recipient != address(0), "Transfer to zero address");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view returns (uint256) {
        return allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");
        require(balances[sender] >= amount, "Insufficient balance");
        require(allowances[sender][msg.sender] >= amount, "Insufficient allowance");
        
        balances[sender] -= amount;
        balances[recipient] += amount;
        allowances[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }
}`;
            break;
        case 'nft':
            type = 'evm';
            code = `pragma solidity ^0.8.0;

/**
 * @title SimpleNFT
 * @dev A simple NFT collection contract
 */
contract SimpleNFT {
    string public name;
    string public symbol;
    
    struct NFT {
        string tokenURI;
        address creator;
        uint256 createdAt;
    }
    
    NFT[] private tokens;
    mapping(uint256 => address) private tokenOwners;
    mapping(address => uint256) private balances;
    mapping(uint256 => address) private tokenApprovals;
    mapping(address => mapping(address => bool)) private operatorApprovals;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Owner cannot be zero address");
        return balances[owner];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        require(tokenId < tokens.length, "Token does not exist");
        address owner = tokenOwners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(tokenId < tokens.length, "Token does not exist");
        return tokens[tokenId].tokenURI;
    }
    
    function mint(string memory _tokenURI) public returns (uint256) {
        uint256 tokenId = tokens.length;
        tokens.push(NFT(_tokenURI, msg.sender, block.timestamp));
        tokenOwners[tokenId] = msg.sender;
        balances[msg.sender]++;
        
        emit Transfer(address(0), msg.sender, tokenId);
        return tokenId;
    }
    
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(to != owner, "Cannot approve to current owner");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "Not authorized");
        
        tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(tokenId < tokens.length, "Token does not exist");
        return tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Cannot approve to self");
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return operatorApprovals[owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(to != address(0), "Cannot transfer to zero address");
        
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner || 
            getApproved(tokenId) == msg.sender || 
            isApprovedForAll(owner, msg.sender),
            "Not authorized"
        );
        require(from == owner, "From address is not owner");
        
        // Clear approvals
        tokenApprovals[tokenId] = address(0);
        
        // Update balances
        balances[from]--;
        balances[to]++;
        
        // Update ownership
        tokenOwners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
}`;
            break;
        case 'storage':
            type = 'ink';
            code = `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod simple_storage {
    /// Defines the storage of your contract.
    #[ink(storage)]
    pub struct SimpleStorage {
        /// Stores a single value.
        value: u32,
        /// Stores a mapping from accounts to values.
        values: ink_storage::collections::HashMap<AccountId, u32>,
    }

    impl SimpleStorage {
        /// Constructor that initializes the value to the given value.
        #[ink(constructor)]
        pub fn new(init_value: u32) -> Self {
            Self {
                value: init_value,
                values: ink_storage::collections::HashMap::new(),
            }
        }

        /// Constructor that initializes the value to zero.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(0)
        }

        /// Returns the current value.
        #[ink(message)]
        pub fn get(&self) -> u32 {
            self.value
        }

        /// Sets the value to the given value.
        #[ink(message)]
        pub fn set(&mut self, new_value: u32) {
            self.value = new_value;
        }

        /// Gets the value for the calling account.
        #[ink(message)]
        pub fn get_mine(&self) -> u32 {
            self.get_from(Self::env().caller())
        }

        /// Gets the value for the specified account.
        #[ink(message)]
        pub fn get_from(&self, account: AccountId) -> u32 {
            self.values.get(&account).copied().unwrap_or(0)
        }

        /// Sets the value for the calling account.
        #[ink(message)]
        pub fn set_mine(&mut self, new_value: u32) {
            self.set_for(Self::env().caller(), new_value);
        }

        /// Sets the value for the specified account.
        #[ink(message)]
        pub fn set_for(&mut self, account: AccountId, new_value: u32) {
            self.values.insert(account, new_value);
        }
    }

    /// Unit tests in Rust are normally defined within such a block.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// We test if the default constructor works as expected.
        #[test]
        fn default_works() {
            let simple_storage = SimpleStorage::default();
            assert_eq!(simple_storage.get(), 0);
        }

        /// We test a simple use case of our contract.
        #[test]
        fn it_works() {
            let mut simple_storage = SimpleStorage::new(42);
            assert_eq!(simple_storage.get(), 42);
            simple_storage.set(100);
            assert_eq!(simple_storage.get(), 100);
        }
    }
}`;
            break;
        default:
            showErrorNotification('Unknown template');
            return;
    }
    
    // Update contract type and code
    contractType.value = type;
    contractCode.value = code;
    
    showSuccessNotification(`${templateName} template loaded`);
}

/**
 * Run contract in sandbox
 */
function runContractInSandbox() {
    console.log('Running contract in sandbox...');
    
    const contractLanguage = document.getElementById('contractLanguage').value;
    const contractEditor = document.getElementById('contractEditor');
    const contractOutput = document.getElementById('contractOutput');
    
    if (!contractEditor || !contractOutput) return;
    
    // Get code from editor (placeholder - in a real implementation, this would use Monaco editor)
    const code = contractEditor.textContent || '';
    
    if (!code) {
        contractOutput.innerHTML = '<p class="error">No code to run</p>';
        return;
    }
    
    // Show running state
    contractOutput.innerHTML = '<p>Running contract...</p>';
    
    // Simulate contract execution
    setTimeout(() => {
        if (contractLanguage === 'ink') {
            contractOutput.innerHTML = `
                <p class="success">Contract compiled successfully!</p>
                <pre>
Compiling contract...
Success! Contract compiled without errors.

Simulating deployment...
Contract deployed to: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

Contract instance created.
</pre>
            `;
        } else {
            contractOutput.innerHTML = `
                <p class="success">Contract compiled successfully!</p>
                <pre>
Compiling contract...
Success! Contract compiled without errors.

Simulating deployment...
Contract deployed to: 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199

Contract instance created.
</pre>
            `;
        }
    }, 1500);
}

/**
 * Start basics quiz handler
 */
function startBasicsQuizHandler() {
    console.log('Starting basics quiz...');
    
    const basicsQuiz = document.getElementById('basicsQuiz');
    if (!basicsQuiz) return;
    
    // Show quiz questions
    basicsQuiz.innerHTML = `
        <div class="quiz-question">
            <h4>1. What is the main purpose of Polkadot's Relay Chain?</h4>
            <div class="quiz-options">
                <label class="quiz-option">
                    <input type="radio" name="q1" value="a"> To process smart contracts
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q1" value="b"> To provide shared security and interoperability for parachains
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q1" value="c"> To store user data
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q1" value="d"> To mine new tokens
                </label>
            </div>
        </div>
        
        <div class="quiz-question">
            <h4>2. What are parachains in the Polkadot ecosystem?</h4>
            <div class="quiz-options">
                <label class="quiz-option">
                    <input type="radio" name="q2" value="a"> Validators that secure the network
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q2" value="b"> Specialized blockchains that connect to the Relay Chain
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q2" value="c"> Smart contracts running on the Relay Chain
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q2" value="d"> Governance proposals
                </label>
            </div>
        </div>
        
        <div class="quiz-question">
            <h4>3. What is the native cryptocurrency of Polkadot?</h4>
            <div class="quiz-options">
                <label class="quiz-option">
                    <input type="radio" name="q3" value="a"> ETH
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q3" value="b"> BTC
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q3" value="c"> DOT
                </label>
                <label class="quiz-option">
                    <input type="radio" name="q3" value="d"> KSM
                </label>
            </div>
        </div>
        
        <button class="btn btn-primary" id="submitQuiz">Submit Answers</button>
    `;
    
    // Add event listener to submit button
    const submitQuiz = document.getElementById('submitQuiz');
    if (submitQuiz) {
        submitQuiz.addEventListener('click', () => {
            // Get selected answers
            const q1 = document.querySelector('input[name="q1"]:checked')?.value;
            const q2 = document.querySelector('input[name="q2"]:checked')?.value;
            const q3 = document.querySelector('input[name="q3"]:checked')?.value;
            
            // Check if all questions are answered
            if (!q1 || !q2 || !q3) {
                showErrorNotification('Please answer all questions');
                return;
            }
            
            // Check answers
            const correctAnswers = {
                q1: 'b',
                q2: 'b',
                q3: 'c'
            };
            
            let score = 0;
            if (q1 === correctAnswers.q1) score++;
            if (q2 === correctAnswers.q2) score++;
            if (q3 === correctAnswers.q3) score++;
            
            // Show results
            basicsQuiz.innerHTML = `
                <h4>Quiz Results</h4>
                <p>You scored ${score} out of 3!</p>
                <div class="quiz-results">
                    <p><strong>Question 1:</strong> ${q1 === correctAnswers.q1 ? '✓ Correct' : '✗ Incorrect'}</p>
                    <p><strong>Question 2:</strong> ${q2 === correctAnswers.q2 ? '✓ Correct' : '✗ Incorrect'}</p>
                    <p><strong>Question 3:</strong> ${q3 === correctAnswers.q3 ? '✓ Correct' : '✗ Incorrect'}</p>
                </div>
                <button class="btn btn-primary" id="retakeQuiz">Retake Quiz</button>
            `;
            
            // Add event listener to retake button
            const retakeQuiz = document.getElementById('retakeQuiz');
            if (retakeQuiz) {
                retakeQuiz.addEventListener('click', startBasicsQuizHandler);
            }
            
            // Save quiz result if user is authenticated
            if (window.firebaseAuth && window.firebaseAuth.getCurrentUser() && window.firebaseDatabase) {
                const user = window.firebaseAuth.getCurrentUser();
                
                const quizData = {
                    type: 'basics',
                    score,
                    totalQuestions: 3,
                    timestamp: Date.now()
                };
                
                window.firebaseDatabase.saveQuizResult(user.uid, quizData)
                    .then(() => {
                        console.log('Quiz result saved');
                        
                        // Add activity
                        const activityData = {
                            type: 'quiz',
                            description: `Completed Polkadot Basics quiz with score ${score}/3`,
                            timestamp: Date.now()
                        };
                        
                        window.firebaseDatabase.addActivity(user.uid, activityData)
                            .then(() => {
                                console.log('Activity added');
                                
                                // Update learning progress
                                window.firebaseDatabase.updateLearningProgress(user.uid, 'basics', 33)
                                    .then(() => {
                                        console.log('Learning progress updated');
                                        
                                        // Reload user data to update UI
                                        loadUserData(user.uid);
                                    })
                                    .catch(error => {
                                        console.error('Error updating learning progress:', error);
                                    });
                            })
                            .catch(error => {
                                console.error('Error adding activity:', error);
                            });
                    })
                    .catch(error => {
                        console.error('Error saving quiz result:', error);
                    });
            }
        });
    }
}

/**
 * Load architecture diagram handler
 */
function loadArchitectureDiagramHandler() {
    console.log('Loading architecture diagram...');
    
    const architectureDiagram = document.getElementById('architectureDiagram');
    if (!architectureDiagram) return;
    
    // Show loading state
    architectureDiagram.innerHTML = '<p>Loading diagram...</p>';
    
    // Simulate loading delay
    setTimeout(() => {
        architectureDiagram.innerHTML = `
            <div class="interactive-diagram">
                <img src="assets/polkadot-architecture.png" alt="Polkadot Architecture" class="img-fluid">
                <div class="diagram-controls">
                    <button class="btn btn-outline" data-component="relay-chain">Relay Chain</button>
                    <button class="btn btn-outline" data-component="parachain">Parachains</button>
                    <button class="btn btn-outline" data-component="bridge">Bridges</button>
                    <button class="btn btn-outline" data-component="validator">Validators</button>
                </div>
                <div class="diagram-info" id="diagramInfo">
                    <h4>Polkadot Architecture</h4>
                    <p>Click on a component to learn more about it.</p>
                </div>
            </div>
        `;
        
        // Add event listeners to diagram controls
        document.querySelectorAll('[data-component]').forEach(button => {
            button.addEventListener('click', (e) => {
                const component = e.target.getAttribute('data-component');
                showComponentInfo(component);
            });
        });
    }, 1000);
}

/**
 * Show component info in architecture diagram
 * @param {string} component - Component name
 */
function showComponentInfo(component) {
    const diagramInfo = document.getElementById('diagramInfo');
    if (!diagramInfo) return;
    
    // Update active button
    document.querySelectorAll('[data-component]').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[data-component="${component}"]`).classList.add('active');
    
    // Update info content
    switch (component) {
        case 'relay-chain':
            diagramInfo.innerHTML = `
                <h4>Relay Chain</h4>
                <p>The Relay Chain is the central chain of the Polkadot network. It is responsible for the network's shared security, consensus, and cross-chain interoperability.</p>
                <ul>
                    <li>Provides shared security for all connected parachains</li>
                    <li>Coordinates consensus and finality</li>
                    <li>Facilitates cross-chain communication</li>
                    <li>Handles network governance</li>
                </ul>
            `;
            break;
        case 'parachain':
            diagramInfo.innerHTML = `
                <h4>Parachains</h4>
                <p>Parachains are specialized blockchains that connect to the Relay Chain. Each parachain can be optimized for specific use cases.</p>
                <ul>
                    <li>Can have their own governance and tokenomics</li>
                    <li>Benefit from the shared security of the Relay Chain</li>
                    <li>Can communicate with other parachains</li>
                    <li>Designed for specific use cases and applications</li>
                </ul>
            `;
            break;
        case 'bridge':
            diagramInfo.innerHTML = `
                <h4>Bridges</h4>
                <p>Bridges connect Polkadot to external blockchain networks like Ethereum, Bitcoin, and others.</p>
                <ul>
                    <li>Enable cross-chain token transfers</li>
                    <li>Allow communication between Polkadot and external blockchains</li>
                    <li>Expand the interoperability of the entire ecosystem</li>
                    <li>Can be trustless or federated depending on the design</li>
                </ul>
            `;
            break;
        case 'validator':
            diagramInfo.innerHTML = `
                <h4>Validators</h4>
                <p>Validators are nodes that secure the Polkadot network by staking DOT tokens and participating in consensus.</p>
                <ul>
                    <li>Validate transactions and blocks</li>
                    <li>Participate in the consensus mechanism</li>
                    <li>Stake DOT tokens as collateral</li>
                    <li>Earn rewards for honest behavior</li>
                </ul>
            `;
            break;
    }
}

/**
 * Start cross-chain demo handler
 */
function startCrossChainDemoHandler() {
    console.log('Starting cross-chain demo...');
    
    const crossChainDemo = document.getElementById('crossChainDemo');
    if (!crossChainDemo) return;
    
    // Show loading state
    crossChainDemo.innerHTML = '<p>Loading demo...</p>';
    
    // Simulate loading delay
    setTimeout(() => {
        crossChainDemo.innerHTML = `
            <div class="cross-chain-demo">
                <div class="demo-chains">
                    <div class="demo-chain" id="chainA">
                        <h4>Parachain A</h4>
                        <div class="chain-balance">
                            <p>Balance: <span id="balanceA">100</span> TokenA</p>
                        </div>
                    </div>
                    <div class="demo-bridge">
                        <i class="fas fa-arrows-alt-h"></i>
                    </div>
                    <div class="demo-chain" id="chainB">
                        <h4>Parachain B</h4>
                        <div class="chain-balance">
                            <p>Balance: <span id="balanceB">0</span> TokenA</p>
                        </div>
                    </div>
                </div>
                
                <div class="demo-controls">
                    <div class="form-group">
                        <label for="transferAmount" class="form-label">Transfer Amount</label>
                        <input type="number" id="transferAmount" class="form-control" value="10" min="1" max="100">
                    </div>
                    <button class="btn btn-primary" id="transferBtn">Transfer from A to B</button>
                    <button class="btn btn-outline" id="resetDemoBtn">Reset Demo</button>
                </div>
                
                <div class="demo-log" id="demoLog">
                    <p>Cross-chain transfer demo initialized.</p>
                    <p>This demo simulates transferring tokens between two parachains using XCM.</p>
                </div>
            </div>
        `;
        
        // Add event listeners to demo buttons
        const transferBtn = document.getElementById('transferBtn');
        const resetDemoBtn = document.getElementById('resetDemoBtn');
        
        if (transferBtn) {
            transferBtn.addEventListener('click', () => {
                const transferAmount = parseInt(document.getElementById('transferAmount').value);
                const balanceA = parseInt(document.getElementById('balanceA').textContent);
                const balanceB = parseInt(document.getElementById('balanceB').textContent);
                
                if (isNaN(transferAmount) || transferAmount <= 0) {
                    showErrorNotification('Please enter a valid transfer amount');
                    return;
                }
                
                if (transferAmount > balanceA) {
                    showErrorNotification('Insufficient balance on Parachain A');
                    return;
                }
                
                // Update balances
                document.getElementById('balanceA').textContent = balanceA - transferAmount;
                document.getElementById('balanceB').textContent = balanceB + transferAmount;
                
                // Update log
                const demoLog = document.getElementById('demoLog');
                if (demoLog) {
                    demoLog.innerHTML += `
                        <p>Initiating transfer of ${transferAmount} TokenA from Parachain A to Parachain B...</p>
                        <p>XCM message sent from Parachain A to Relay Chain.</p>
                        <p>Relay Chain forwards XCM message to Parachain B.</p>
                        <p>Parachain B processes XCM message and updates balances.</p>
                        <p class="success">Transfer complete! ${transferAmount} TokenA successfully transferred.</p>
                    `;
                    
                    // Scroll to bottom of log
                    demoLog.scrollTop = demoLog.scrollHeight;
                }
                
                // Animate transfer
                const chainA = document.getElementById('chainA');
                const chainB = document.getElementById('chainB');
                
                if (chainA && chainB) {
                    chainA.classList.add('sending');
                    
                    setTimeout(() => {
                        chainA.classList.remove('sending');
                        chainB.classList.add('receiving');
                        
                        setTimeout(() => {
                            chainB.classList.remove('receiving');
                        }, 1000);
                    }, 1000);
                }
            });
        }
        
        if (resetDemoBtn) {
            resetDemoBtn.addEventListener('click', () => {
                // Reset balances
                document.getElementById('balanceA').textContent = '100';
                document.getElementById('balanceB').textContent = '0';
                
                // Reset log
                const demoLog = document.getElementById('demoLog');
                if (demoLog) {
                    demoLog.innerHTML = `
                        <p>Demo reset.</p>
                        <p>Cross-chain transfer demo initialized.</p>
                        <p>This demo simulates transferring tokens between two parachains using XCM.</p>
                    `;
                }
            });
        }
    }, 1000);
}

/**
 * View contract details
 * @param {string} contractId - Contract ID
 */
function viewContract(contractId) {
    console.log('Viewing contract:', contractId);
    
    // Implementation depends on UI design
    // This is a placeholder implementation
    alert(`Viewing contract ${contractId}`);
}

/**
 * Interact with contract
 * @param {string} contractId - Contract ID
 */
function interactWithContract(contractId) {
    console.log('Interacting with contract:', contractId);
    
    // Implementation depends on UI design
    // This is a placeholder implementation
    alert(`Interacting with contract ${contractId}`);
}

/**
 * View transaction details
 * @param {string} txHash - Transaction hash
 */
function viewTransaction(txHash) {
    console.log('Viewing transaction:', txHash);
    
    // Implementation depends on UI design
    // This is a placeholder implementation
    alert(`Viewing transaction ${txHash}`);
}

/**
 * Start learning module
 * @param {string} moduleId - Module ID
 */
function startLearningModule(moduleId) {
    console.log('Starting learning module:', moduleId);
    
    // Implementation depends on UI design
    // This is a placeholder implementation
    
    // Switch to the corresponding tab in the learning section
    document.querySelector(`[data-tab="${moduleId}"]`).click();
    
    // Scroll to the learning section
    scrollToSection('learn');
}

/**
 * Update connection status
 * @param {boolean} connected - Whether connected to Polkadot network
 */
function updateConnectionStatus(connected) {
    // Implementation depends on UI design
    console.log('Connection status:', connected ? 'Connected' : 'Disconnected');
}

/**
 * Show success notification
 * @param {string} message - Notification message
 */
function showSuccessNotification(message) {
    // Implementation depends on UI design
    console.log('Success:', message);
    alert(`Success: ${message}`);
}

/**
 * Show error notification
 * @param {string} message - Error message
 */
function showErrorNotification(message) {
    // Implementation depends on UI design
    console.error('Error:', message);
    alert(`Error: ${message}`);
}