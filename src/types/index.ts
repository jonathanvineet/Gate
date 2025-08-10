export interface User {
  id: string;
  address: string;
  isConnected: boolean;
  isVerified: boolean;
  verificationType?: 'age' | 'hackathon-creator' | 'recruiter';
  name?: string;
  birthday?: string;
  company?: string;
  institution?: string;
}

export interface StakePool {
  id: string;
  name: string;
  apy: string;
  tvl: string;
  description: string;
  risk: 'Low' | 'Medium' | 'High';
  minStake: string;
  requiresAge18: boolean;
  // New: required token and chain for staking this pool
  requiredToken?: {
    symbol: string;           // e.g., 'ETH', 'POL', 'USDC'
    address: string;          // ERC20 token address on the chain (0x0 for native)
    decimals?: number;        // default 18
  };
  chainId?: number;           // EVM chain id where this pool lives
  // New: per-pool staking contract address (deployed instance for this token/pool)
  stakingContractAddress?: string;
}

export interface Hackathon {
  id: string;
  name: string;
  prize: string;
  participants: number;
  description: string;
  deadline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  // Optional: registration questions asked during sign-up
  questions?: Array<{
    id: string;
    label: string;
    type: 'single' | 'multi' | 'text';
    options?: string[]; // for single/multi
    required?: boolean;
  }>;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  description: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  experience: string;
}

export interface TopPick {
  id: string;
  title: string;
  type: 'stake-pool' | 'hackathon' | 'job';
  featured: boolean;
  description: string;
  highlight: string;
}