const references = {
  "[1]": { text: "Glossary | Polkadot Developer Docs", url: "https://docs.polkadot.com/polkadot-protocol/glossary/" },
  "[2]": { text: "Glossary - Polkadot Wiki", url: "https://wiki.polkadot.network/general/glossary/" },
  "[3]": { text: "Overview of NPoS", url: "https://research.web3.foundation/Polkadot/protocols/NPoS/Overview" },
  "[4]": { text: "What Is Nominated Proof of Stake (NPoS)?", url: "https://www.ledger.com/academy/topics/blockchain/what-is-nominated-proof-of-stake-npos" },
  "[5]": { text: "A Walkthrough of Polkadot's Governance", url: "https://polkadot.network/blog/a-walkthrough-of-polkadots-governance/" },
  "[6]": { text: "Polkadot Governance", url: "https://polkadot.network/blog/polkadot-governance/" },
  "[7]": { text: "Polkadot.js API | Polkadot Developer Docs", url: "https://docs.polkadot.com/develop/toolkit/api-libraries/polkadot-js-api/" },
  "[8]": { text: "Introduction to Polkadot SDK | Polkadot Developer Docs", url: "https://docs.polkadot.com/develop/parachains/intro-polkadot-sdk/" },
  "[9]": { text: "Substrate Developers Hub", url: "https://substrate.dev" },
  "[10]": { text: "Overview of FRAME | Polkadot Developer Docs", url: "https://docs.polkadot.com/develop/parachains/customize-parachain/overview/" },
  "[11]": { text: "Zero To Hero Parachain Tutorial Series | Polkadot Developer Docs", url: "https://docs.polkadot.com/tutorials/polkadot-sdk/parachains/zero-to-hero/" },
  "[12]": { text: "Tutorials | Polkadot Developer Docs", url: "https://docs.polkadot.com/tutorials/" }
};

export const GLOSSARY_DATA = [
  {
    id: "core-concepts",
    title: "Core Polkadot Terminology",
    type: "terms",
    items: [
      {
        term: "Relay Chain",
        definition: "The central blockchain coordinating consensus and communication for connected parachains and external chains. It ensures shared security across the network.",
        sources: [references["[2]"]]
      },
      {
        term: "Parachains",
        definition: "Blockchains that connect to the Polkadot Relay Chain, enabling them to operate in parallel and benefit from shared security and interoperability. All parachains begin their lifecycle as parathreads.",
        sources: [references["[2]"]]
      },
      {
        term: "Parathreads",
        definition: "Registered chains on the Relay Chain that acquire connectivity on an on-demand, pay-as-you-go basis without securing a dedicated core. Historically referred to as on-demand parachains.",
        sources: [references["[2]"]]
      },
      {
        term: "Bridges",
        definition: "Parachains designed to connect the Polkadot Relay Chain to external blockchains (e.g., Ethereum, Bitcoin) that are not natively compatible, making them appear as parachains to the Polkadot Host.",
        sources: [references["[2]"]]
      },
      {
        term: "Nominated Proof-of-Stake (NPoS)",
        definition: "Polkadot's specific Proof-of-Stake consensus mechanism where token holders (Nominators) select and stake their tokens behind validators (Validators). Both participants share in rewards and are subject to slashing for misbehavior. It aims for democratic validator selection and enhanced security.",
        sources: [references["[3]"], references["[4]"]]
      },
      {
        term: "Treasury",
        definition: "An on-chain mechanism funded by transaction fees and slashes, used to fund projects and initiatives that benefit the Polkadot ecosystem through governance-approved proposals (like OpenGov referenda or Bounties).",
        sources: [references["[2]"]]
      },
      {
        term: "Cross-Consensus Message Format (XCM)",
        definition: "A protocol for arbitrary message passing between different consensus systems, primarily used for communication and asset transfers between parachains via the Relay Chain. An earlier implementation was HRMP; the goal is direct XCMP.",
        sources: [references["[2]"]]
      },
      {
        term: "Governance",
        definition: "The on-chain system enabling stakeholders to propose, vote on, and enact changes to the Polkadot network's code or fund movements. Involves Referenda, various Origins for proposals, and Tracks for different referendum types with independent lifecycles. The current protocol is Polkadot OpenGov.",
        note: `An earlier overview (see source: ${references["[5]"].text}) provides historical context but may not reflect the current OpenGov implementation.`,
        sources: [references["[2]"], references["[6]"], references["[5]"]]
      }
    ]
  },
  {
    id: "polkadot-sdk",
    title: "Polkadot SDK",
    type: "section",
    content: {
      purpose: "The Polkadot Software Development Kit facilitates the creation of custom blockchains, parachains, rollups, and generalized peer-to-peer systems, allowing developers to focus on application-specific logic. It provides flexibility, upgradeability, and cross-consensus interoperability.",
      keyComponents: {
          title: "Key Components:",
          list: [
            { name: "Substrate", description: "A Rust-based framework offering libraries and tools for building application-specific blockchains." },
            { name: "FRAME", description: "A development framework within Substrate based on modular Pallets." },
            { name: "Cumulus", description: "Libraries to adapt FRAME runtimes for parachain compatibility." },
            { name: "XCM", description: "The message format for cross-chain communication." },
            { name: "Polkadot Node", description: "The implementation of the Polkadot protocol." },
            { name: "Polkadot-JS API", description: "A JavaScript/TypeScript API for interacting with Polkadot SDK-based chains." }
          ]
      },
      polkadotJsApiUsage: {
          title: "Polkadot-JS API Usage:",
          description: "Enables querying nodes, reading chain state (`api.query`), and submitting transactions/extrinsics (`api.tx`). Generates interfaces dynamically upon connecting to a node based on chain metadata. An API instance is created using `ApiPromise` and `WsProvider` from the `@polkadot/api` package."
      },
      sources: [references["[8]"], references["[7]"]]
    }
  },
  {
    id: "substrate",
    title: "Polkadot Substrate Framework",
    type: "section",
    highlight: "Substrate is a kit to make the blockchain.",
    content: {
      functionText: "Substrate is a modular, open-source Rust framework for developing highly customizable and future-proof blockchains. It provides default implementations for core blockchain infrastructure like networking, storage, consensus, and cryptography, allowing developers to concentrate on defining the unique business logic (runtime).",
      coreFeatures: {
          title: "Core Features:",
          list: [
            { name: "Modular Architecture", description: "Built with reusable components." },
            { name: "Forkless Runtime Upgrades", description: "Allows seamless protocol evolution by deploying WebAssembly (Wasm) blobs containing the new runtime logic on-chain via governance, without needing a hard fork." },
            { name: "FRAME (Framework for Runtime Aggregation of Modularized Entities)", description: "The primary runtime development environment in Substrate. It uses Pallets." },
            { name: "Pallets", description: "Modular, self-contained components that encapsulate specific blockchain functionalities (e.g., staking, tokens, governance). Developers compose a blockchain's runtime by selecting and configuring pallets, or building custom ones. Uses Rust macros for structure." },
            { name: "On-Chain Governance Support", description: "Provides pre-built pallets to implement sophisticated decentralized governance systems." }
          ]
      },
      relationshipWithPolkadot: {
          title: "Relationship with Polkadot:",
          description: "Substrate is the primary tool used to build the Polkadot Relay Chain runtime and the runtimes for connected Parachains. It enables the creation of blockchains that can leverage Polkadot's shared security and interoperability features."
      },
      sources: [references["[9]"], references["[10]"]]
    }
  },
  {
    id: "parachain-creation",
    title: "Parachain Creation Process",
    type: "accordion_section",
    content: {
      overview: "A step-by-step guide for developing and launching a parachain using the Polkadot SDK and Substrate, based on official tutorials (Zero To Hero Tutorial Series).",
      steps: [
        { title: "1. Set Up Template", description: "Start by compiling and running a local node from a pre-built template like the `parachain-template` provided in the Polkadot SDK." },
        { title: "2. Build a Custom Pallet", description: "Develop a new, application-specific pallet to implement desired custom logic." },
        { title: "3. Pallet Unit Testing", description: "Write comprehensive unit tests for the custom pallet to ensure its functionality is correct." },
        { title: "4. Add Pallets to Runtime", description: "Integrate the custom pallet, along with necessary existing FRAME pallets, into the parachain's runtime configuration." },
        { title: "5. Pallet Benchmarking", description: "Benchmark the pallets and runtime extrinsics to determine execution costs and assign accurate weights for transaction fee calculation and optimization." },
        { title: "6. Deploy on a TestNet", description: "Deploy the developed blockchain onto a test network, such as Paseo, to test connectivity and functionality in a multi-chain environment." },
        { title: "7. Obtain Coretime", description: "Acquire Coretime (block production time) on the Polkadot or Kusama Relay Chain through auctions (for bulk Coretime) or on-demand mechanisms to enable the parachain to produce blocks and connect." }
      ],
      keyTools: {
          title: "Key Tools & Considerations:",
          list: [
            "Polkadot SDK: Provides the foundational tools and templates.",
            "Substrate/FRAME/Pallets: The underlying framework and components for runtime development.",
            "Zombienet / Chopsticks: Tools for testing the network and runtime locally and on testnets.",
            "Polkadot-JS API / CLI tools: Used for interacting with nodes and deployment.",
            "Runtime upgradeability and governance integration are critical aspects of ongoing parachain maintenance.",
            "Starting with templates significantly accelerates development."
          ]
      },
      sources: [references["[11]"], references["[12]"], references["[7]"]]
    }
  }
];
