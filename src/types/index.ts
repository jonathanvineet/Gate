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