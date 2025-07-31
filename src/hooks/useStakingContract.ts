import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Ensure window.ethereum is properly typed
declare global {
  interface Window {
    ethereum?: any;
    Buffer?: any;
  }
}

const STAKING_CONTRACT_ADDRESS = '0x63D5c4B45517Aaa4D4A7B1cc7c958a4389dADe02'; // Updated contract address

const STAKING_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "_token",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Unstaked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "stakedBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "stakes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface StakingState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  tokenInfo?: {
    address: string;
    symbol: string;
    decimals: number;
    balance: string;
    allowance: string;
    name?: string;
  };
  totalStaked?: string;
}

export const useStakingContract = () => {
  const [stakingState, setStakingState] = useState<StakingState>({
    isLoading: false,
    error: null,
    txHash: null
  });

  const connectWallet = async () => {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed. Please install MetaMask to use staking features.');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Please connect your wallet to continue');
      }
      console.error('Wallet connection error:', error);
      throw new Error('Failed to connect wallet. Please try again.');
    }
  };

  const getContract = async () => {
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      return new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    } catch (error) {
      console.error('Contract initialization error:', error);
      throw error;
    }
  };

  const getTokenContract = async (tokenAddress: string) => {
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    } catch (error) {
      console.error('Token contract initialization error:', error);
      throw error;
    }
  };

  const loadTokenInfo = useCallback(async () => {
    try {
      const contract = await getContract();
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Get token address from staking contract
      let tokenAddress;
      try {
        tokenAddress = await contract.token();
        console.log('Token address from contract:', tokenAddress);
        
        // Check if token address is valid (not zero address)
        if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error('No token configured in staking contract');
        }
        
        // Check if the address is actually a contract
        const code = await provider.getCode(tokenAddress);
        if (code === '0x') {
          throw new Error(`Token address ${tokenAddress} is not a contract. It appears to be an EOA (wallet address) instead of a token contract.`);
        }
        
      } catch (error) {
        console.error('Error getting token address:', error);
        if (error.message.includes('not a contract')) {
          throw error; // Re-throw the specific error
        }
        throw new Error('Token not configured in staking contract. Please check contract setup.');
      }
      
      // Try to get token contract
      let tokenContract;
      try {
        tokenContract = await getTokenContract(tokenAddress);
      } catch (error) {
        console.error('Error creating token contract:', error);
        throw new Error('Invalid token address from staking contract');
      }
      
      // Get token info with individual error handling
      let symbol = 'Unknown';
      let name = 'Unknown Token';
      let decimals = 18;
      let balance = '0';
      let allowance = '0';
      
      try {
        symbol = await tokenContract.symbol();
        console.log('Token symbol:', symbol);
      } catch (error) {
        console.error('Error getting token symbol:', error);
        throw new Error(`Failed to get token symbol. The address ${tokenAddress} may not be a valid ERC20 token contract.`);
      }
      
      try {
        name = await tokenContract.name();
        console.log('Token name:', name);
      } catch (error) {
        console.error('Error getting token name:', error);
        name = symbol; // Fallback to symbol if name fails
      }
      
      try {
        decimals = await tokenContract.decimals();
        console.log('Token decimals:', decimals);
      } catch (error) {
        console.error('Error getting token decimals:', error);
        throw new Error(`Failed to get token decimals. The address ${tokenAddress} may not be a valid ERC20 token contract.`);
      }
      
      try {
        const balanceRaw = await tokenContract.balanceOf(userAddress);
        balance = ethers.formatUnits(balanceRaw, decimals);
      } catch (error) {
        console.error('Error getting token balance:', error);
        balance = '0';
      }
      
      try {
        const allowanceRaw = await tokenContract.allowance(userAddress, STAKING_CONTRACT_ADDRESS);
        allowance = ethers.formatUnits(allowanceRaw, decimals);
      } catch (error) {
        console.error('Error getting token allowance:', error);
        allowance = '0';
      }

      // Get total staked amount
      let totalStaked = '0';
      try {
        const totalStakedRaw = await contract.totalStaked();
        totalStaked = ethers.formatUnits(totalStakedRaw, decimals);
      } catch (error) {
        console.error('Error getting total staked:', error);
        totalStaked = '0';
      }

      const tokenInfo = {
        address: tokenAddress,
        symbol,
        name,
        decimals: Number(decimals),
        balance,
        allowance
      };

      console.log('Token info loaded successfully:', tokenInfo);
      console.log('Total staked:', totalStaked);
      
      setStakingState(prev => ({ ...prev, tokenInfo, totalStaked }));
      return { tokenInfo, totalStaked };
    } catch (error) {
      console.error('Error loading token info:', error);
      
      // Set fallback token info for development
      const fallbackTokenInfo = {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'TT',
        name: 'Test Token',
        decimals: 18,
        balance: '0',
        allowance: '0'
      };
      
      setStakingState(prev => ({ 
        ...prev, 
        tokenInfo: fallbackTokenInfo,
        totalStaked: '0',
        error: `Token configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      
      throw error;
    }
  }, []);

  const approveToken = useCallback(async (amount: string) => {
    setStakingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🔓 Starting token approval for amount:', amount);
      
      const contract = await getContract();
      
      let tokenAddress;
      try {
        tokenAddress = await contract.token();
        if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error('No token configured in staking contract');
        }
      } catch (error) {
        throw new Error('Cannot approve: Token not configured in staking contract');
      }
      
      const tokenContract = await getTokenContract(tokenAddress);
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      console.log('💰 Approving amount in token units:', amountWei.toString());
      
      // Approve tokens
      const tx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, amountWei);
      console.log('📝 Approval transaction sent:', tx.hash);
      
      setStakingState(prev => ({ ...prev, txHash: tx.hash }));
      
      // Wait for approval confirmation
      const receipt = await tx.wait();
      console.log('✅ Approval confirmed:', receipt);
      
      // Reload token info to update allowance
      await loadTokenInfo();
      
      setStakingState(prev => ({ 
        ...prev, 
        isLoading: false, 
        txHash: tx.hash 
      }));
      
      return { success: true, txHash: tx.hash, receipt };
      
    } catch (error: any) {
      console.error('❌ Approval error:', error);
      
      let errorMessage = 'Token approval failed';
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Approval cancelled by user';
      } else if (error.message.includes('No token configured')) {
        errorMessage = 'No token configured in staking contract. Please contact support.';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStakingState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        txHash: null
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [loadTokenInfo]);

  const stake = useCallback(async (amount: string) => {
    setStakingState(prev => ({ ...prev, isLoading: true, error: null, txHash: null }));
    
    try {
      console.log('🔗 Starting stake transaction for amount:', amount);
      
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid stake amount');
      }

      const contract = await getContract();
      
      // Check if token is configured
      let tokenAddress;
      try {
        tokenAddress = await contract.token();
        if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error('No token configured in staking contract. Please contact support.');
        }
      } catch (error) {
        throw new Error('Cannot stake: Token not configured in staking contract');
      }
      
      const tokenContract = await getTokenContract(tokenAddress);
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      console.log('💰 Amount in token units:', amountWei.toString());
      
      // Check allowance
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const allowance = await tokenContract.allowance(userAddress, STAKING_CONTRACT_ADDRESS);
      
      if (allowance < amountWei) {
        throw new Error(`Insufficient token allowance. Please approve ${amount} tokens first.`);
      }
      
      // Check balance
      const balance = await tokenContract.balanceOf(userAddress);
      if (balance < amountWei) {
        throw new Error(`Insufficient token balance. You have ${ethers.formatUnits(balance, decimals)} tokens.`);
      }
      
      // Estimate gas
      try {
        const gasEstimate = await contract.stake.estimateGas(amountWei);
        console.log('⛽ Estimated gas:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed:', gasError);
      }
      
      // Call stake function
      const tx = await contract.stake(amountWei, {
        gasLimit: 300000
      });
      console.log('📝 Stake transaction sent:', tx.hash);
      
      setStakingState(prev => ({ ...prev, txHash: tx.hash }));
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Stake transaction confirmed:', receipt);
      
      // Reload token info
      await loadTokenInfo();
      
      setStakingState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        txHash: tx.hash
      }));
      
      return { success: true, txHash: tx.hash, receipt };
      
    } catch (error: any) {
      console.error('❌ Staking error:', error);
      
      let errorMessage = 'Transaction failed';
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message && error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction and gas fees';
      } else if (error.message && error.message.includes('allowance')) {
        errorMessage = 'Token allowance insufficient. Please approve tokens first.';
      } else if (error.message && error.message.includes('No token configured')) {
        errorMessage = 'Staking contract not properly configured. Please contact support.';
      } else if (error.message && error.message.includes('revert')) {
        errorMessage = 'Transaction reverted. Please check contract requirements.';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStakingState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        txHash: null
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [loadTokenInfo]);

  const unstake = useCallback(async (amount: string) => {
    setStakingState(prev => ({ ...prev, isLoading: true, error: null, txHash: null }));
    
    try {
      console.log('🔗 Starting unstake transaction for amount:', amount);
      
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid unstake amount');
      }
      
      const contract = await getContract();
      const tokenAddress = await contract.token();
      const tokenContract = await getTokenContract(tokenAddress);
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      const tx = await contract.unstake(amountWei, {
        gasLimit: 300000
      });
      console.log('📝 Unstake transaction sent:', tx.hash);
      
      setStakingState(prev => ({ ...prev, txHash: tx.hash }));
      
      const receipt = await tx.wait();
      console.log('✅ Unstake transaction confirmed:', receipt);
      
      // Reload token info
      await loadTokenInfo();
      
      setStakingState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        txHash: tx.hash
      }));
      
      return { success: true, txHash: tx.hash, receipt };
      
    } catch (error: any) {
      console.error('❌ Unstaking error:', error);
      
      let errorMessage = 'Unstake transaction failed';
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStakingState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        txHash: null
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [loadTokenInfo]);

  const getStakeAmount = useCallback(async (address: string) => {
    try {
      const contract = await getContract();
      const stakeAmount = await contract.stakedBalance(address);
      const tokenAddress = await contract.token();
      const tokenContract = await getTokenContract(tokenAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(stakeAmount, decimals);
    } catch (error) {
      console.error('Error getting stake amount:', error);
      return '0';
    }
  }, []);

  const getStakeAmountFromMapping = useCallback(async (address: string) => {
    try {
      const contract = await getContract();
      const stakeAmount = await contract.stakes(address);
      return ethers.formatEther(stakeAmount);
    } catch (error) {
      console.error('Error getting stake amount from mapping:', error);
      return '0';
    }
  }, []);

  const getTokenAddress = useCallback(async () => {
    try {
      const contract = await getContract();
      const tokenAddress = await contract.token();
      return tokenAddress;
    } catch (error) {
      console.error('Error getting token address:', error);
      return null;
    }
  }, []);

  const getTotalStaked = useCallback(async () => {
    try {
      const contract = await getContract();
      const totalStakedRaw = await contract.totalStaked();
      
      // Get token decimals for proper formatting
      const tokenAddress = await contract.token();
      const tokenContract = await getTokenContract(tokenAddress);
      const decimals = await tokenContract.decimals();
      
      return ethers.formatUnits(totalStakedRaw, decimals);
    } catch (error) {
      console.error('Error getting total staked:', error);
      return '0';
    }
  }, []);

  const listenToStakingEvents = useCallback(async (callback: (event: any) => void) => {
    try {
      const contract = await getContract();
      
      // Listen for Staked events
      contract.on('Staked', (user, amount, event) => {
        console.log('Staked event:', { user, amount: amount.toString(), event });
        callback({ type: 'Staked', user, amount: amount.toString(), event });
      });
      
      // Listen for Unstaked events
      contract.on('Unstaked', (user, amount, event) => {
        console.log('Unstaked event:', { user, amount: amount.toString(), event });
        callback({ type: 'Unstaked', user, amount: amount.toString(), event });
      });
      
      return () => {
        contract.removeAllListeners('Staked');
        contract.removeAllListeners('Unstaked');
      };
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      return () => {};
    }
  }, []);

  const clearState = useCallback(() => {
    setStakingState({ isLoading: false, error: null, txHash: null });
  }, []);

  return {
    stake,
    unstake,
    approveToken,
    loadTokenInfo,
    getStakeAmount,
    getStakeAmountFromMapping,
    getTokenAddress,
    getTotalStaked,
    listenToStakingEvents,
    clearState,
    stakingState,
    contractAddress: STAKING_CONTRACT_ADDRESS
  };
};
