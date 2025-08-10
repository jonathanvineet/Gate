import React, { useState, useEffect } from 'react';
import { Activity, Download, Trash2, TrendingUp, Building, Coins, Calendar, ChevronDown, ChevronUp, ExternalLink, Minus, RefreshCw } from 'lucide-react';
import { csvLogger, StakeRecord } from '../utils/csvLogger';
import UnstakeModal from './UnstakeModal';
import { stakingRecords } from '../utils/stakingRecords';

interface CompanyData {
  companyName: string;
  totalStaked: number;
  uniquePools: number;
  records: StakeRecord[];
  lastStakeDate: string;
  avgAPY: number;
}

const ActivityDashboard: React.FC = () => {
  const [records, setRecords] = useState<StakeRecord[]>([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalAmount: 0,
    uniqueCompanies: 0,
    lastStakeDate: null as string | null
  });
  const [hackathonRecords, setHackathonRecords] = useState<StakeRecord[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize and load activity when component mounts or refresh is triggered
  useEffect(() => {
    stakingRecords.initializeFromCSV();
    loadActivity();
    const onUpdated = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('stake-records-updated', onUpdated as any);
    return () => window.removeEventListener('stake-records-updated', onUpdated as any);
  }, [refreshTrigger]);

  const loadActivity = () => {
    const allRecords = csvLogger.loadRecords();
    setRecords(allRecords);
  setHackathonRecords(allRecords.filter(r => (r.category || '').toLowerCase() === 'hackathon'));
    setSummary(csvLogger.getSummary());
    console.log("Activity loaded with total records:", allRecords.length);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDownloadCSV = () => {
    csvLogger.downloadCSV(`stake_activity_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleClearActivity = () => {
    if (window.confirm('Are you sure you want to clear all activity records? This cannot be undone.')) {
      csvLogger.clearAllRecords();
      stakingRecords.resetAllBalances();
      loadActivity();
    }
  };

  const handleUnstake = (company: CompanyData) => {
    setSelectedCompany(company);
    setUnstakeModalOpen(true);
  };

  const handleUnstakeSuccess = () => {
    // Reload activity after successful unstake
    setRefreshTrigger(prev => prev + 1);
    setUnstakeModalOpen(false);
    setSelectedCompany(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleCompanyExpanded = (companyName: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyName)) {
      newExpanded.delete(companyName);
    } else {
      newExpanded.add(companyName);
    }
    setExpandedCompanies(newExpanded);
  };

  const getCompanyData = (): CompanyData[] => {
    const companyMap = new Map<string, CompanyData>();
    const stakingBalances = stakingRecords.getAllBalances();

    // First gather all companies from records
    records.forEach(record => {
      if (!companyMap.has(record.companyName)) {
        companyMap.set(record.companyName, {
          companyName: record.companyName,
          totalStaked: 0, // Will set from stakingRecords later
          uniquePools: 0,
          records: [],
          lastStakeDate: record.date,
          avgAPY: 0
        });
      }

      const company = companyMap.get(record.companyName)!;
      company.records.push(record);
      
      // Update last stake date if this record is more recent
      if (new Date(record.date) > new Date(company.lastStakeDate)) {
        company.lastStakeDate = record.date;
      }
    });

    // Calculate unique pools and average APY for each company
    companyMap.forEach((company, companyName) => {
      const uniquePoolNames = new Set(company.records.map(r => r.poolName));
      company.uniquePools = uniquePoolNames.size;
      
      // Calculate average APY from stake records (not unstake)
      const stakeRecords = company.records.filter(r => r.amount > 0);
      if (stakeRecords.length > 0) {
        const totalAPY = stakeRecords.reduce((sum, record) => {
          const apy = parseFloat(record.apy.replace('%', ''));
          return sum + apy;
        }, 0);
        company.avgAPY = totalAPY / stakeRecords.length;
      }
      
      // Set total staked from stakingRecords (source of truth)
      company.totalStaked = stakingBalances[companyName]?.totalStaked || 0;
      
      console.log(`Company ${companyName} total staked from records:`, company.totalStaked);
    });

    // Sort companies by total staked amount (descending)
    return Array.from(companyMap.values())
      .sort((a, b) => b.totalStaked - a.totalStaked)
      .filter(company => company.totalStaked > 0); // Only show companies with positive stake
  };

  const companyData = getCompanyData();

  if (records.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
        <div className="text-center">
          <Activity className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
          <p className="text-gray-400">Start staking in pools to see your activity here</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div id="activity-dashboard" />
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Total Stakes</p>
                <p className="text-white font-bold text-lg">{summary.totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Coins className="text-green-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-white font-bold text-lg">{summary.totalAmount.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Building className="text-purple-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Companies</p>
                <p className="text-white font-bold text-lg">{companyData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Calendar className="text-orange-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Last Stake</p>
                <p className="text-white font-bold text-sm">
                  {summary.lastStakeDate ? formatDateShort(summary.lastStakeDate) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Your Staking by Company</h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            
            <button
              onClick={handleClearActivity}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>

        {/* Hackathon Activity */}
        {hackathonRecords.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-3">Hackathons</h3>
            <div className="space-y-2">
              {hackathonRecords.map((r, i) => (
                <div key={i} className="rounded-lg p-3 bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{r.poolName}</p>
                    <p className="text-gray-400 text-xs">{formatDate(r.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-mono">+{r.amount.toFixed(4)} {r.tokenSymbol}</p>
                    <p className="text-green-400 text-xs">Registration Stake</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companyData.map((company) => {
            const isExpanded = expandedCompanies.has(company.companyName);
            const tokenSymbol = company.records[0]?.tokenSymbol || 'tokens';

            return (
              <div
                key={company.companyName}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-300"
              >
                {/* Company Card Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleCompanyExpanded(company.companyName)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                        <Building className="text-white" size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-white">{company.companyName}</h3>
                    </div>
                    
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Total Staked Amount - Prominent Display */}
                  <div className="text-center py-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 mb-4">
                    <p className="text-green-400 text-sm font-medium mb-1">Total Staked</p>
                    <p className="text-3xl font-bold text-green-300">
                      {company.totalStaked.toFixed(4)}
                    </p>
                    <p className="text-green-400 text-sm">{tokenSymbol}</p>
                  </div>

                  {/* Company Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-gray-400 text-xs">Pools</p>
                      <p className="text-white font-semibold">{company.uniquePools}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Avg APY</p>
                      <p className="text-white font-semibold">{company.avgAPY.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Last Stake</p>
                      <p className="text-white font-semibold text-xs">{formatDateShort(company.lastStakeDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnstake(company);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
                  >
                    <Minus size={16} />
                    Unstake from {company.companyName}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5">
                    <div className="p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Staking History
                      </h4>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {company.records.map((record, index) => (
                          <div
                            key={index}
                            className={`rounded-lg p-3 flex items-center justify-between ${
                              record.amount > 0 
                                ? 'bg-white/5' 
                                : 'bg-red-500/10 border border-red-500/20'
                            }`}
                          >
                            <div>
                              <p className="text-white text-sm font-medium">{record.poolName}</p>
                              <p className="text-gray-400 text-xs">{formatDate(record.date)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className={`text-sm font-mono ${record.amount > 0 ? 'text-white' : 'text-red-400'}`}>
                                {record.amount > 0 ? '+' : ''}{record.amount.toFixed(4)} {record.tokenSymbol}
                              </p>
                              {record.amount > 0 && <p className="text-green-400 text-xs">{record.apy} APY</p>}
                            </div>
                            
                            {record.transactionHash && (
                              <a
                                href={`https://polygonscan.com/tx/${record.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 ml-2"
                                title="View Transaction"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Summary at bottom of expanded view */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Transactions:</span>
                          <span className="text-white font-medium">{company.records.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {companyData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No companies with active stakes found</p>
          </div>
        )}
      </div>

      {/* Unstake Modal */}
      {selectedCompany && (
        <UnstakeModal
          isOpen={unstakeModalOpen}
          onClose={() => {
            setUnstakeModalOpen(false);
            setSelectedCompany(null);
          }}
          companyName={selectedCompany.companyName}
          totalStaked={selectedCompany.totalStaked}
          tokenSymbol={selectedCompany.records[0]?.tokenSymbol || 'TT'}
          onUnstakeSuccess={handleUnstakeSuccess}
        />
      )}
    </>
  );
};

export default ActivityDashboard;
