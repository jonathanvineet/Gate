import { csvLogger } from './csvLogger';

interface StakingBalance {
  [companyName: string]: {
    totalStaked: number;
    tokenSymbol: string;
  }
}

class StakingRecords {
  private readonly STORAGE_KEY = 'staking_balances';
  
  // Get current balances
  private getBalances(): StakingBalance {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting staking balances:', error);
      return {};
    }
  }
  
  // Save balances
  private saveBalances(balances: StakingBalance): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(balances));
  }
  
  // Record a stake
  public recordStake(companyName: string, amount: number, tokenSymbol: string): void {
    const balances = this.getBalances();
    
    if (!balances[companyName]) {
      balances[companyName] = { totalStaked: 0, tokenSymbol };
    }
    
    balances[companyName].totalStaked += amount;
    balances[companyName].tokenSymbol = tokenSymbol;
    
    this.saveBalances(balances);
    console.log(`Recorded stake of ${amount} ${tokenSymbol} for ${companyName}`);
  }
  
  // Record an unstake
  public recordUnstake(companyName: string, amount: number, tokenSymbol: string): void {
    const balances = this.getBalances();
    
    if (!balances[companyName]) {
      balances[companyName] = { totalStaked: 0, tokenSymbol };
    }
    
    // Ensure we're tracking the unstake amount properly
    balances[companyName].totalStaked -= amount;
    console.log(`Reducing staked amount by ${amount}. New total: ${balances[companyName].totalStaked}`);
    
    // Don't allow negative balance
    if (balances[companyName].totalStaked < 0) {
      console.warn(`Setting negative balance (${balances[companyName].totalStaked}) to 0 for ${companyName}`);
      balances[companyName].totalStaked = 0;
    }
    
    this.saveBalances(balances);
    console.log(`Recorded unstake of ${amount} ${tokenSymbol} from ${companyName}. New balance: ${balances[companyName].totalStaked}`);
  }
  
  // Get current staked amount for a company
  public getStakedAmount(companyName: string): number {
    const balances = this.getBalances();
    return balances[companyName]?.totalStaked || 0;
  }
  
  // Get all staking balances
  public getAllBalances(): StakingBalance {
    return this.getBalances();
  }
  
  // Initialize from CSV records if needed
  public initializeFromCSV(): void {
    try {
      const records = csvLogger.loadRecords();
      const balances: StakingBalance = {};
      
      records.forEach(record => {
        if (!balances[record.companyName]) {
          balances[record.companyName] = { totalStaked: 0, tokenSymbol: record.tokenSymbol };
        }
        
        // Consider negative amounts for unstaking operations
        balances[record.companyName].totalStaked += record.amount;
      });
      
      // Don't override existing balances completely, merge them
      const currentBalances = this.getBalances();
      const mergedBalances = {...currentBalances};
      
      // Only update companies that need updating
      Object.keys(balances).forEach(company => {
        if (!mergedBalances[company] || 
            Math.abs(mergedBalances[company].totalStaked - balances[company].totalStaked) > 0.0001) {
          mergedBalances[company] = balances[company];
        }
      });
      
      this.saveBalances(mergedBalances);
      console.log('Initialized staking balances from CSV records');
    } catch (error) {
      console.error('Error initializing from CSV:', error);
    }
  }
  
  // Reset all balances - useful for testing
  public resetAllBalances(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Reset all staking balances');
  }
}

export const stakingRecords = new StakingRecords();
