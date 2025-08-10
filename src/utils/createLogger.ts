import { csvLogger } from './csvLogger';

export interface CreateSubmission {
  type: 'stake-pool' | 'hackathon' | 'job';
  form: Record<string, unknown>;
  userAddress?: string;
  txHash?: string;
  amount?: string; // actual deposited amount if available
  tokenSymbol?: string;
}

/**
 * createLogger logs create submissions into the shared CSV using category labels
 * so they show up in Activity and can be exported alongside staking actions.
 */
export const createLogger = {
  add(record: CreateSubmission) {
    // 1) Add a lightweight entry into the Activity CSV for visibility
    try {
      const company = (() => {
        if (record.type === 'job') return (record.form.company as string) || 'Recruiter';
        if (record.type === 'hackathon') return (record.form.name as string) || 'Hackathon';
        return ((record.form.name as string) || '').split(' ')[0] || 'Stake';
      })();
      const poolName = (() => {
        if (record.type === 'job') return (record.form.title as string) || 'Job Post';
        return (record.form.name as string) || record.type;
      })();
  const amountRaw = (record.form?.['deposit'] as unknown) ?? (record.form?.['minStake'] as unknown) ?? 0;
  const amount = typeof record.amount === 'string' && record.amount ? Number(record.amount) : (typeof amountRaw === 'number' ? amountRaw : Number(amountRaw) || 0);
  const tokenSymRaw = (record.tokenSymbol as unknown) ?? (record.form?.['tokenSymbol'] as unknown);
  const tokenSymbol = typeof tokenSymRaw === 'string' && tokenSymRaw ? tokenSymRaw : 'TT';
  const apyRaw = record.form?.['apy'] as unknown;
  const apy = typeof apyRaw === 'string' || typeof apyRaw === 'number' ? String(apyRaw) : '0%';
      csvLogger.addStakeRecord({
        companyName: company,
        poolName,
        amount,
        tokenSymbol,
        apy,
        userAddress: record.userAddress,
        transactionHash: record.txHash,
        category: `create:${record.type}`
      });
    } catch (e) {
      // non-fatal
      void e;
    }

    // 2) Persist full form data into a dedicated Create CSV
    try {
      const STORAGE_KEY = 'create_activity_csv';
      const HEADERS = 'Date,Type,Name,User Address,Transaction Hash,Form';
      const existing = localStorage.getItem(STORAGE_KEY) || '';
      let csv = existing || HEADERS + '\n';
      const name = (record.form.name as string) || (record.form.title as string) || record.type;
      const row = [
        new Date().toISOString(),
        record.type,
        // escape commas and quotes in name
        name && /[",\n]/.test(name) ? '"' + name.replace(/"/g, '""') + '"' : name,
        record.userAddress || '',
        record.txHash || '',
        // stringify form and escape for CSV
        (() => {
          const json = JSON.stringify(record.form || {});
          return '"' + json.replace(/"/g, '""') + '"';
        })()
      ].join(',');
      if (!existing) {
        csv = HEADERS + '\n' + row + '\n';
      } else {
        csv += row + '\n';
      }
      localStorage.setItem(STORAGE_KEY, csv);
    } catch (e) {
      void e;
    }
  }
};
