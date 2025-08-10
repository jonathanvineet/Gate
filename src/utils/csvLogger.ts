export interface StakeRecord {
  date: string;
  companyName: string;
  poolName: string;
  amount: number;
  tokenSymbol: string;
  apy: string;
  userAddress?: string;
  transactionHash?: string;
}

// Add new record type for unstaking
export interface UnstakeRecord {
  date: string;
  companyName: string;
  amount: number;
  tokenSymbol: string;
  userAddress?: string;
  transactionHash?: string;
}

class CSVLogger {
  private readonly STORAGE_KEY = 'stake_activity_csv';
  private readonly CSV_HEADERS = 'Date,Company Name,Pool Name,Amount,Token,APY,User Address,Transaction Hash';

  // Convert stake record to CSV row
  private recordToCSVRow(record: StakeRecord): string {
    const escapeCsvField = (field: string | number | undefined): string => {
      const str = String(field || '');
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    return [
      escapeCsvField(record.date),
      escapeCsvField(record.companyName),
      escapeCsvField(record.poolName),
      escapeCsvField(record.amount),
      escapeCsvField(record.tokenSymbol),
      escapeCsvField(record.apy),
      escapeCsvField(record.userAddress),
      escapeCsvField(record.transactionHash)
    ].join(',');
  }

  // Parse CSV row to stake record
  private csvRowToRecord(row: string): StakeRecord | null {
    try {
      const fields = this.parseCSVRow(row);
      if (fields.length < 6) return null;

      return {
        date: fields[0],
        companyName: fields[1],
        poolName: fields[2],
        amount: parseFloat(fields[3]) || 0,
        tokenSymbol: fields[4],
        apy: fields[5],
        userAddress: fields[6] || '',
        transactionHash: fields[7] || ''
      };
    } catch (error) {
      console.error('Error parsing CSV row:', error);
      return null;
    }
  }

  // Simple CSV parser that handles quoted fields
  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current);
    return result;
  }

  // Load all records from localStorage
  public loadRecords(): StakeRecord[] {
    try {
      const csvData = localStorage.getItem(this.STORAGE_KEY);
      if (!csvData) return [];

      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length <= 1) return []; // No data rows (only header or empty)

      const records: StakeRecord[] = [];
      // Skip header line (index 0)
      for (let i = 1; i < lines.length; i++) {
        const record = this.csvRowToRecord(lines[i]);
        if (record) {
          records.push(record);
        }
      }

      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error loading stake records:', error);
      return [];
    }
  }

  // Add a new stake record
  public addStakeRecord(record: Omit<StakeRecord, 'date'>): void {
    try {
      const newRecord: StakeRecord = {
        ...record,
        date: new Date().toISOString()
      };

      const existingCsv = localStorage.getItem(this.STORAGE_KEY) || '';
      let csvData = existingCsv;

      // Add header if this is the first record
      if (!csvData) {
        csvData = this.CSV_HEADERS + '\n';
      }

      // Add new record
      csvData += this.recordToCSVRow(newRecord) + '\n';

      localStorage.setItem(this.STORAGE_KEY, csvData);
      console.log('✅ Stake record added to CSV:', newRecord);
      // Notify listeners that records updated
      try {
        window.dispatchEvent(new CustomEvent('stake-records-updated'));
      } catch {}
    } catch (error) {
      console.error('Error adding stake record:', error);
    }
  }

  // Add a new unstake record - update CSV with negative amount
  public addUnstakeRecord(record: Omit<UnstakeRecord, 'date'>): void {
    try {
      const newRecord: StakeRecord = {
        ...record,
        poolName: `Unstake from ${record.companyName}`, // Mark as unstake operation
        apy: '0%', // No APY for unstaking
        date: new Date().toISOString()
      };

      const existingCsv = localStorage.getItem(this.STORAGE_KEY) || '';
      let csvData = existingCsv;

      // Add header if this is the first record
      if (!csvData) {
        csvData = this.CSV_HEADERS + '\n';
      }

      // Add new record with negative amount
      csvData += this.recordToCSVRow(newRecord) + '\n';

      localStorage.setItem(this.STORAGE_KEY, csvData);
      console.log('✅ Unstake record added to CSV:', newRecord);
      // Notify listeners that records updated
      try {
        window.dispatchEvent(new CustomEvent('stake-records-updated'));
      } catch {}
    } catch (error) {
      console.error('Error adding unstake record:', error);
    }
  }

  // Get records for a specific company
  public getRecordsByCompany(companyName: string): StakeRecord[] {
    return this.loadRecords().filter(record => 
      record.companyName.toLowerCase() === companyName.toLowerCase()
    );
  }

  // Get total staked amount for a company - now accounts for unstaking
  public getTotalStakedByCompany(companyName: string): number {
    const records = this.loadRecords();
    
    // Filter records for this company
    const companyRecords = records.filter(record => 
      record.companyName.toLowerCase() === companyName.toLowerCase()
    );
    
    if (companyRecords.length === 0) return 0;
    
    // Calculate total staked from all records (including negative values from unstaking)
    return companyRecords.reduce((total, record) => total + record.amount, 0);
  }

  // Export CSV data
  public exportCSV(): string {
    return localStorage.getItem(this.STORAGE_KEY) || this.CSV_HEADERS;
  }

  // Download CSV file
  public downloadCSV(filename: string = 'stake_activity.csv'): void {
    try {
      const csvData = this.exportCSV();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  }

  // Clear all records
  public clearAllRecords(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ All stake records cleared');
    try {
      window.dispatchEvent(new CustomEvent('stake-records-updated'));
    } catch {}
  }

  // Get summary statistics
  public getSummary(): {
    totalRecords: number;
    totalAmount: number;
    uniqueCompanies: number;
    lastStakeDate: string | null;
  } {
    const records = this.loadRecords();
    const uniqueCompanies = new Set(records.map(r => r.companyName)).size;
    
    // Sum only positive amounts (stake operations, not unstake)
    const totalAmount = records.reduce((sum, r) => sum + Math.max(0, r.amount), 0);
    
    // Get the most recent record date
    const lastStakeDate = records.length > 0 ? records[0].date : null;

    return {
      totalRecords: records.filter(r => r.amount > 0).length, // Count only stake operations
      totalAmount,
      uniqueCompanies,
      lastStakeDate
    };
  }
}

export const csvLogger = new CSVLogger();
