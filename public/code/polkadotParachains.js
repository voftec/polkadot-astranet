const parachains = [
    {
      name: "Acala",
      description: "Acala is the all-in-one DeFi and liquidity hub of Polkadot. It’s an Ethereum-compatible platform for financial applications to use smart contracts or built-in protocols with out-of-the-box cross-chain capabilities and robust security.",
      goodFor: ["DeFi applications", "cross-chain capabilities", "smart contracts"],
      badFor: ["non-financial use cases"],
      smartContractSupport: ["EVM", "Wasm"]
    },
    {
      name: "Ajuna Network",
      description: "Incentive layer that allows game developers to integrate blockchain technology into Unreal and Unity games, enabling secure and scalable decentralized gaming with tokenized virtual goods.",
      goodFor: ["gaming", "NFTs", "integrating blockchain into existing game engines"],
      badFor: ["general-purpose applications outside gaming"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Astar",
      description: "Astar Network supports EVM, Substrate, WebAssembly (Wasm), and ink! environments, offering a scalable, cross-layer & cross-machine protocol for the development of multichain smart contracts, with its unique Build2Earn mechanism empowering developers to earn incentives.",
      goodFor: ["smart contract development", "multichain applications", "developer incentives"],
      badFor: ["applications that don't require smart contracts"],
      smartContractSupport: ["EVM", "Wasm"]
    },
    {
      name: "Aventus",
      description: "Scalability of a permissioned network along with the security and interoperability of public blockchains, targeting businesses with a range of use cases like NFTs, gaming, loyalty, and supply chain, and fostering accessibility to blockchain technology.",
      goodFor: ["business applications", "NFTs", "gaming", "supply chain"],
      badFor: ["not specified"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Bifrost",
      description: "Bifrost Finance on Polkadot is a decentralized, non-custodial cross-chain finance platform that focuses on staking liquidity through its unique protocols, allowing users to earn rewards and maintain liquidity for staked assets like DOT and KSM, while also facilitating cross-chain asset swaps and other DeFi functionalities.",
      goodFor: ["staking liquidity", "cross-chain DeFi"],
      badFor: ["non-DeFi applications"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Bitgreen",
      description: "Eco-friendly blockchain platform designed for NGOs and ESG-focused organizations, facilitating investments in sustainable markets through its green DeFi platform, including the purchase of tokenized carbon credits.",
      goodFor: ["sustainable finance", "tokenized carbon credits"],
      badFor: ["applications not focused on sustainability"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Centrifuge",
      description: "Centrifuge parachain is engineered for decentralized finance of real-world assets, streamlining transactions between borrowers and lenders, and facilitating the tokenization and securitization of various assets to democratize finance for SMEs.",
      goodFor: ["tokenizing real-world assets", "DeFi for SMEs"],
      badFor: ["applications not involving real-world assets"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Clover",
      description: "Parachain that aims to simplify blockchain infrastructure for developers, offering a foundational layer for cross-chain compatibility and efficient on-chain trading services between different chains.",
      goodFor: ["cross-chain compatibility", "on-chain trading"],
      badFor: ["not specified"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Composable Finance",
      description: "Composable Finance's parachain enables interoperability among diverse blockchain networks by running multiple bytecode types, facilitating the integration and communication of various smart contract languages and enhancing cross-chain functionalities.",
      goodFor: ["interoperability", "cross-chain smart contracts"],
      badFor: ["applications that don't require cross-chain functionality"],
      smartContractSupport: ["multiple VM types"]
    },
    {
      name: "Crust",
      description: "Crust Network is a decentralized storage platform on Polkadot, leveraging TEE, MPoW, and GPoS to offer secure and efficient decentralized storage for applications like website hosting, NFT storage, and P2P content distribution, serving as a user-friendly alternative to traditional cloud services.",
      goodFor: ["decentralized storage", "website hosting", "NFT storage"],
      badFor: ["applications not requiring storage solutions"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Darwinia",
      description: "Darwinia Network offers a programmable cross-chain messaging infrastructure for the Polkadot ecosystem, enhancing interoperability and smart contract functionality for applications like DeFi and gaming, with faster transactions and lower costs than Ethereum.",
      goodFor: ["cross-chain messaging", "DeFi", "gaming"],
      badFor: ["not specified"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Equilibrium",
      description: "Equilibrium is a DeFi parachain that combines a money market and an orderbook-based DEX, enabling high-leverage trading and borrowing of digital assets with its native EQ token used for communal governance.",
      goodFor: ["DeFi", "high-leverage trading", "borrowing"],
      badFor: ["non-DeFi applications"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Frequency",
      description: "Frequency is a Polkadot parachain designed to enable scalable, decentralized social media functionality, bridging the gap between Web3 and traditional social media platforms by accommodating high volumes of social interactions like messages and posts at Web2 scale.",
      goodFor: ["decentralized social media", "high-volume interactions"],
      badFor: ["applications not related to social media"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Hashed Network",
      description: "Hashed Network, a parachain in the Polkadot ecosystem, orchestrates native Bitcoin Core standards like PSBTs, Schnorr signatures, and Tapscript. It uses Substrate to ensure secure address generation, verified addresses, spending policies, and security, especially in proof-of-reserves reporting for each vault.",
      goodFor: ["Bitcoin integration", "secure asset management"],
      badFor: ["applications not involving Bitcoin or asset security"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "HydraDX (Hydration)",
      description: "HydraDX is a next-generation DeFi protocol on Polkadot, featuring the HydraDX Omnipool, an innovative Automated Market Maker (AMM) that consolidates all assets into a single trading pool for unparalleled efficiency in liquidity provision.",
      goodFor: ["DeFi", "liquidity provision", "AMMs"],
      badFor: ["non-DeFi applications"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Interlay",
      description: "Interlay is a decentralized network focusing on bridging Bitcoin to DeFi platforms like Polkadot and Ethereum, enabling secure and efficient interaction of cryptocurrencies across various blockchains.",
      goodFor: ["bridging Bitcoin to DeFi", "cross-chain interactions"],
      badFor: ["applications not involving Bitcoin or cross-chain functionality"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "InvArch",
      description: "InvArch Network is a blockchain and service parachain in the Polkadot ecosystem, providing a dynamic multisig solution called Saturn to serve the entire ecosystem and enable efficient IP management, utility, and authentication across multiple blockchains.",
      goodFor: ["multisig solutions", "IP management", "cross-chain authentication"],
      badFor: ["applications not requiring multisig or IP management"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "KILT",
      description: "KILT Protocol is a blockchain-based identity platform on Polkadot, enabling the creation of decentralized identifiers (DIDs) and verifiable credentials, focused on providing secure identity solutions for both individuals and enterprises.",
      goodFor: ["decentralized identity", "verifiable credentials"],
      badFor: ["applications not involving identity management"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Litentry",
      description: "Litentry is a Web3.0 identity aggregation protocol on Polkadot that enables cross-chain credit computations, empowering users with control over their digital identities and facilitating interoperability and privacy in the decentralized ecosystem.",
      goodFor: ["identity aggregation", "cross-chain credit computations"],
      badFor: ["applications not involving identity or credit systems"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Manta",
      description: "Manta Network is a privacy-focused parachain in the Polkadot ecosystem, utilizing advanced cryptographic techniques like zk-SNARKs to ensure end-to-end privacy for blockchain applications, thereby enhancing interoperability and ease of use across various platforms.",
      goodFor: ["privacy-preserving applications", "DeFi with privacy"],
      badFor: ["applications where privacy is not a concern"],
      smartContractSupport: ["likely Wasm with privacy features"]
    },
    {
      name: "Moonbeam",
      description: "Moonbeam is a highly Ethereum-compatible smart contract parachain in the Polkadot ecosystem, enabling developers to seamlessly port projects and dapps with minimal code changes, thus connecting Polkadot's assets and capabilities with Ethereum's developer ecosystem.",
      goodFor: ["Ethereum-compatible dapps", "cross-chain integration with Ethereum"],
      badFor: ["applications that require non-EVM environments"],
      smartContractSupport: ["EVM"]
    },
    {
      name: "Moonsama",
      description: "Moonsama is an EVM-compatible Polkadot parachain designed to support a diverse range of games, NFTs, tokens, and applications, providing a decentralized and interoperable platform for the Moonsama ecosystem.",
      goodFor: ["gaming", "NFTs", "EVM-compatible applications"],
      badFor: ["non-gaming applications"],
      smartContractSupport: ["EVM"]
    },
    {
      name: "Nodle",
      description: "Nodle is a decentralized wireless network parachain on Polkadot, using Bluetooth Low Energy via smartphones and routers to connect IoT devices to the Internet at low cost, while maintaining privacy and security, especially for enterprises and smart cities.",
      goodFor: ["IoT connectivity", "decentralized wireless networks"],
      badFor: ["applications not involving IoT or wireless connectivity"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "OriginTrail",
      description: "OriginTrail is a decentralized knowledge graph parachain on Polkadot, designed to organize, discover, and verify the world's most important assets, enhancing their value and accessibility in various sectors like supply chain, healthcare, and scientific research.",
      goodFor: ["knowledge graphs", "asset verification", "supply chain management"],
      badFor: ["applications not requiring data organization or verification"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Parallel",
      description: "Parallel Finance is a DeFi super DApp protocol in the Polkadot ecosystem, aiming to bring decentralized finance to a broader audience by building a decentralized future that enhances DeFi accessibility, capital efficiency, and security.",
      goodFor: ["DeFi", "capital efficiency", "accessibility"],
      badFor: ["non-DeFi applications"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Pendulum",
      description: "Pendulum is a parachain that integrates DeFi applications with the foreign exchange market, allowing for the creation of Automated Market Makers (AMMs) for fiat currencies and scalable liquidity pools, fostering yield earning opportunities and a decentralized future for fiat tokens.",
      goodFor: ["foreign exchange DeFi", "fiat currency AMMs"],
      badFor: ["applications not involving fiat currencies or DeFi"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Phala Network",
      description: "Phala Network is a privacy-preserving cloud computing service in the Polkadot ecosystem, leveraging the TEE-Blockchain Hybrid Architecture to offer secure and trustless computing while enabling confidential smart contracts and data protection.",
      goodFor: ["privacy-preserving computing", "confidential smart contracts"],
      badFor: ["applications where privacy is not critical"],
      smartContractSupport: ["Wasm with privacy features"]
    },
    {
      name: "Polkadex",
      description: "Polkadex is a decentralized peer-to-peer trading platform that merges the benefits of both centralized and decentralized exchanges into a single ecosystem, featuring high transaction throughput and low latency to facilitate efficient and trustless trading on the Polkadot network.",
      goodFor: ["decentralized trading", "high-frequency trading"],
      badFor: ["applications not involving trading"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Subsocial",
      description: "Subsocial is a decentralized social networking platform on Polkadot, designed for the future of social networks with built-in monetization and censorship resistance, enabling users to own and control their content and social graphs.",
      goodFor: ["decentralized social networking", "content monetization"],
      badFor: ["applications not related to social networking"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "t3rn",
      description: "t3rn is a multichain protocol designed to enable trust-free collaboration between blockchains, facilitating interoperable smart contract execution and fair developer rewards within a decentralized ecosystem that spans across various blockchain networks.",
      goodFor: ["multichain smart contracts", "interoperable execution"],
      badFor: ["applications that don't require multichain functionality"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Unique Network",
      description: "Unique Network is a scalable blockchain designed for NFTs with advanced functionalities, offering tools for flexible economic models, sponsored transactions, re-fungibility, sustainable NFTs, and interoperability on Polkadot and Kusama.",
      goodFor: ["NFTs", "advanced token functionalities"],
      badFor: ["applications not involving NFTs"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Watr Network",
      description: "Watr is an open, ethics-driven platform for programmable commodities on the Polkadot network, connecting commodity flows with a robust ecosystem of participants, and encompassing commodities financing and trade, thereby enhancing the transparency and efficiency of the global commodities market.",
      goodFor: ["commodities trading", "programmable commodities"],
      badFor: ["applications not involving commodities"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Zeitgeist",
      description: "Zeitgeist is a decentralized prediction market protocol built on the Polkadot network, enabling users to create, participate in, and resolve prediction markets across a wide range of topics, leveraging its native ZTG token.",
      goodFor: ["prediction markets", "decentralized betting"],
      badFor: ["applications not involving predictions or markets"],
      smartContractSupport: ["likely Wasm"]
    },
    {
      name: "Mythos",
      description: "Mythos aims to democratize the gaming world and allow for players and creators to participate in the value chain. It is grounded in the support of multi-chain ecosystems, unified marketplaces, decentralized financial systems, decentralized governance mechanisms, and multi-token game economies.",
      goodFor: ["Web3 gaming", "NFTs", "in-game economies"],
      badFor: ["non-gaming applications"],
      smartContractSupport: ["EVM"]
    }
  ];