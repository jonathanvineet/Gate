import { StakePool, Hackathon, Job, TopPick } from '../types';

export const stakePools: StakePool[] = [
  {
    id: 'amoy-1',
    name: 'Amoy Test Pool',
    apy: '10.0%',
    tvl: '$0',
    description: 'Polygon Amoy test staking pool for integration testing.',
    risk: 'Low',
    minStake: '1 tPOL',
    requiresAge18: false,
    requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
    chainId: 80002,
    stakingContractAddress: '0x7D0ce8CB4F3615A1c9437026b2b53d2C58a9a976'
  },
  {
    id: '1',
    name: 'DeFi Yield Pro',
    apy: '12.5%',
    tvl: '$2.3M',
    description: 'High-yield staking pool with automated compounding and risk management protocols.',
    risk: 'Medium',
  minStake: '1 tPOL',
  requiresAge18: true,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '2', 
    name: 'Stable Rewards',
    apy: '8.2%',
    tvl: '$5.7M',
    description: 'Conservative staking strategy focused on stable returns and capital preservation.',
    risk: 'Low',
  minStake: '1 tPOL',
  requiresAge18: false,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '3',
    name: 'Moonshot Alpha',
    apy: '25.8%',
    tvl: '$890K',
    description: 'Aggressive growth pool targeting emerging DeFi protocols with high potential.',
    risk: 'High',
  minStake: '1 tPOL',
  requiresAge18: true,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '4',
    name: 'Ethereum Validator',
    apy: '5.4%',
    tvl: '$12.1M',
    description: 'Direct Ethereum 2.0 staking with institutional-grade security and monitoring.',
    risk: 'Low',
  minStake: '1 tPOL',
  requiresAge18: true,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '5',
    name: 'Cross-Chain Arbitrage',
    apy: '18.7%',
    tvl: '$1.8M',
    description: 'Automated arbitrage opportunities across multiple blockchain networks.',
    risk: 'High',
  minStake: '1 tPOL',
  requiresAge18: true,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '6',
    name: 'Liquid Staking Plus',
    apy: '9.8%',
    tvl: '$4.2M',
    description: 'Liquid staking with additional yield farming opportunities and governance tokens.',
    risk: 'Medium',
  minStake: '1 tPOL',
  requiresAge18: false,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '7',
    name: 'AI Trading Bot',
    apy: '22.3%',
    tvl: '$650K',
    description: 'Machine learning-powered trading strategies with real-time market analysis.',
    risk: 'High',
  minStake: '1 tPOL',
  requiresAge18: true,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '8',
    name: 'Blue Chip Basket',
    apy: '7.1%',
    tvl: '$8.9M',
    description: 'Diversified portfolio of top-tier cryptocurrencies with automated rebalancing.',
    risk: 'Low',
  minStake: '1 tPOL',
  requiresAge18: false,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '9',
    name: 'NFT Yield Farm',
    apy: '15.6%',
    tvl: '$1.3M',
    description: 'Innovative yield farming using NFTs as collateral and reward mechanisms.',
    risk: 'Medium',
  minStake: '1 tPOL',
  requiresAge18: true,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  },
  {
    id: '10',
    name: 'Layer 2 Optimizer',
    apy: '11.4%',
    tvl: '$3.1M',
    description: 'Optimized staking across Layer 2 solutions for maximum efficiency and lower fees.',
    risk: 'Medium',
  minStake: '1 tPOL',
  requiresAge18: false,
  requiredToken: { symbol: 'tPOL', address: '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca', decimals: 18 },
  chainId: 80002,
  // stakingContractAddress: '0x...'
  }
];

export const hackathons: Hackathon[] = [
  {
    id: '1',
    name: 'Web3 Builder Challenge',
    prize: '$50,000',
    participants: 1240,
    description: 'Build the next generation of decentralized applications using cutting-edge Web3 technologies.',
    deadline: '2025-02-15',
    difficulty: 'Intermediate',
    tags: ['DeFi', 'NFTs', 'DAOs']
  },
  {
    id: '2',
    name: 'AI x Blockchain Summit',
    prize: '$75,000',
    participants: 890,
    description: 'Combine artificial intelligence with blockchain technology to solve real-world problems.',
    deadline: '2025-03-01',
    difficulty: 'Advanced',
    tags: ['AI', 'Machine Learning', 'Smart Contracts']
  },
  {
    id: '3',
    name: 'Beginner Bootcamp',
    prize: '$10,000',
    participants: 2100,
    description: 'Perfect entry point for developers new to blockchain and Web3 development.',
    deadline: '2025-01-30',
    difficulty: 'Beginner',
    tags: ['Education', 'Basics', 'Tutorials']
  },
  {
    id: '4',
    name: 'Climate Tech Blockchain',
    prize: '$100,000',
    participants: 567,
    description: 'Develop blockchain solutions to combat climate change and promote sustainability.',
    deadline: '2025-04-20',
    difficulty: 'Advanced',
    tags: ['Climate', 'Sustainability', 'Carbon Credits']
  },
  {
    id: '5',
    name: 'Gaming Metaverse Jam',
    prize: '$60,000',
    participants: 1850,
    description: 'Create immersive gaming experiences in the metaverse with blockchain integration.',
    deadline: '2025-03-15',
    difficulty: 'Intermediate',
    tags: ['Gaming', 'Metaverse', 'VR/AR']
  },
  {
    id: '6',
    name: 'DeFi Innovation Lab',
    prize: '$80,000',
    participants: 723,
    description: 'Push the boundaries of decentralized finance with novel protocols and mechanisms.',
    deadline: '2025-05-10',
    difficulty: 'Advanced',
    tags: ['DeFi', 'Protocols', 'Innovation']
  },
  {
    id: '7',
    name: 'Social Impact Crypto',
    prize: '$40,000',
    participants: 1456,
    description: 'Leverage cryptocurrency and blockchain for positive social impact initiatives.',
    deadline: '2025-02-28',
    difficulty: 'Intermediate',
    tags: ['Social Impact', 'Charity', 'Community']
  },
  {
    id: '8',
    name: 'Zero-Knowledge Privacy',
    prize: '$90,000',
    participants: 445,
    description: 'Implement zero-knowledge proofs for enhanced privacy in blockchain applications.',
    deadline: '2025-06-01',
    difficulty: 'Advanced',
    tags: ['Privacy', 'Zero-Knowledge', 'Cryptography']
  },
  {
    id: '9',
    name: 'Mobile Web3 UX',
    prize: '$35,000',
    participants: 1678,
    description: 'Design and build exceptional mobile user experiences for Web3 applications.',
    deadline: '2025-03-30',
    difficulty: 'Intermediate',
    tags: ['Mobile', 'UX/UI', 'React Native']
  },
  {
    id: '10',
    name: 'Cross-Chain Bridge',
    prize: '$120,000',
    participants: 334,
    description: 'Develop secure and efficient cross-chain bridges for seamless asset transfers.',
    deadline: '2025-07-15',
    difficulty: 'Advanced',
    tags: ['Cross-Chain', 'Bridges', 'Interoperability']
  }
];

export const jobs: Job[] = [
  {
    id: '1',
    title: 'Senior Blockchain Developer',
    company: 'CryptoTech Inc.',
    salary: '$120k - $180k',
    description: 'Lead the development of next-generation DeFi protocols and smart contract architecture.',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years'
  },
  {
    id: '2',
    title: 'Web3 Frontend Engineer',
    company: 'MetaVerse Studios',
    salary: '$90k - $140k', 
    description: 'Create stunning user interfaces for immersive Web3 experiences and NFT marketplaces.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    experience: '2+ years'
  },
  {
    id: '3',
    title: 'Smart Contract Auditor',
    company: 'SecureChain Labs',
    salary: '$150k - $220k',
    description: 'Ensure the security and reliability of smart contracts through comprehensive auditing.',
    location: 'Remote',
    type: 'Contract',
    experience: '5+ years'
  },
  {
    id: '4',
    title: 'DeFi Product Manager',
    company: 'Yield Protocol',
    salary: '$130k - $190k',
    description: 'Drive product strategy and roadmap for innovative DeFi lending and borrowing platforms.',
    location: 'New York, NY',
    type: 'Full-time',
    experience: '4+ years'
  },
  {
    id: '5',
    title: 'Blockchain Security Engineer',
    company: 'Guardian Crypto',
    salary: '$140k - $200k',
    description: 'Implement robust security measures and conduct penetration testing for blockchain systems.',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years'
  },
  {
    id: '6',
    title: 'NFT Marketplace Developer',
    company: 'ArtChain Digital',
    salary: '$100k - $150k',
    description: 'Build and maintain scalable NFT marketplace platforms with advanced trading features.',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    experience: '2+ years'
  },
  {
    id: '7',
    title: 'Crypto Trading Algorithm Developer',
    company: 'QuantumTrade AI',
    salary: '$160k - $240k',
    description: 'Develop sophisticated algorithmic trading strategies for cryptocurrency markets.',
    location: 'Chicago, IL',
    type: 'Full-time',
    experience: '5+ years'
  },
  {
    id: '8',
    title: 'Web3 UX/UI Designer',
    company: 'Nexus Design Lab',
    salary: '$80k - $120k',
    description: 'Design intuitive and beautiful user experiences for decentralized applications.',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years'
  },
  {
    id: '9',
    title: 'Blockchain Data Analyst',
    company: 'ChainAnalytics Pro',
    salary: '$95k - $135k',
    description: 'Analyze on-chain data to provide insights and intelligence for crypto investments.',
    location: 'Austin, TX',
    type: 'Full-time',
    experience: '2+ years'
  },
  {
    id: '10',
    title: 'Solidity Developer',
    company: 'EthBuild Solutions',
    salary: '$110k - $170k',
    description: 'Develop and optimize smart contracts on Ethereum and compatible blockchain networks.',
    location: 'Remote',
    type: 'Contract',
    experience: '3+ years'
  }
];

export const topPicks: TopPick[] = [
  {
    id: '1',
    title: 'DeFi Yield Pro',
    type: 'stake-pool',
    featured: true,
    description: 'Trending high-yield pool with 12.5% APY',
    highlight: 'Hot 🔥'
  },
  {
    id: '2',
    title: 'Web3 Builder Challenge',
    type: 'hackathon',
    featured: true,
    description: '$50K prize pool - Registration closing soon!',
    highlight: 'Limited Time'
  },
  {
    id: '3',
    title: 'Senior Blockchain Developer',
    type: 'job',
    featured: true,
    description: 'Remote position at CryptoTech Inc.',
    highlight: 'Remote'
  },
  {
    id: '4',
    title: 'AI x Blockchain Summit',
    type: 'hackathon',
    featured: true,
    description: '$75K prize for AI + blockchain innovations',
    highlight: 'New 🆕'
  },
  {
    id: '5',
    title: 'Ethereum Validator',
    type: 'stake-pool',
    featured: true,
    description: 'Institutional-grade ETH 2.0 staking',
    highlight: 'Secure'
  },
  {
    id: '6',
    title: 'Smart Contract Auditor',
    type: 'job',
    featured: true,
    description: 'Up to $220K at SecureChain Labs',
    highlight: 'High Pay'
  },
  {
    id: '7',
    title: 'Climate Tech Blockchain',
    type: 'hackathon',
    featured: true,
    description: '$100K for climate solutions',
    highlight: 'Impact'
  },
  {
    id: '8',
    title: 'Cross-Chain Arbitrage',
    type: 'stake-pool',
    featured: true,
    description: '18.7% APY with automated trading',
    highlight: 'Auto'
  },
  {
    id: '9',
    title: 'Crypto Trading Algorithm Developer',
    type: 'job',
    featured: true,
    description: 'Up to $240K in Chicago',
    highlight: 'Quant'
  },
  {
    id: '10',
    title: 'Zero-Knowledge Privacy',
    type: 'hackathon',
    featured: true,
    description: '$90K for privacy innovations',
    highlight: 'Privacy'
  }
];