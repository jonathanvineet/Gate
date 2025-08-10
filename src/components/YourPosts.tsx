import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Code, Coins, CalendarDays, MapPin, DollarSign, Wand2 } from 'lucide-react';

type CreateType = 'stake-pool' | 'hackathon' | 'job';

interface CreatePostRow {
  date: string;
  type: CreateType;
  name: string;
  userAddress: string;
  txHash?: string;
  form: Record<string, unknown>;
}

const STORAGE_KEY = 'create_activity_csv';

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  while (i < row.length) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += ch;
      i++;
    }
  }
  result.push(current);
  return result;
}

function loadCreatePosts(): CreatePostRow[] {
  try {
    const csv = localStorage.getItem(STORAGE_KEY);
    if (!csv) return [];
    const lines = csv.split('\n').filter(Boolean);
    if (lines.length <= 1) return [];
    const data: CreatePostRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVRow(lines[i]);
      if (fields.length < 6) continue;
      const date = fields[0];
      const type = fields[1] as CreateType;
      const name = fields[2];
      const userAddress = fields[3] || '';
      const txHash = fields[4] || '';
      const formStr = fields[5] || '{}';
      let form: Record<string, unknown> = {};
      try {
        form = JSON.parse(formStr);
  } catch {
        // Ignore malformed JSON in legacy rows
        form = {};
      }
      data.push({ date, type, name, userAddress, txHash, form });
    }
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

const YourPosts: React.FC = () => {
  const [filter, setFilter] = useState<CreateType | 'all'>('all');
  const [rows, setRows] = useState<CreatePostRow[]>([]);

  useEffect(() => {
    setRows(loadCreatePosts());
    const onUpdate = () => setRows(loadCreatePosts());
    window.addEventListener('storage', onUpdate);
    return () => window.removeEventListener('storage', onUpdate);
  }, []);

  const filtered = useMemo(() => {
    return filter === 'all' ? rows : rows.filter(r => r.type === filter);
  }, [rows, filter]);

  // CSV export removed per request

  const TypeIcon = ({ t }: { t: CreateType }) => {
    if (t === 'job') return <Briefcase className="text-green-500" size={18} />;
    if (t === 'hackathon') return <Code className="text-blue-500" size={18} />;
    return <Coins className="text-purple-500" size={18} />;
  };

  const renderDetails = (r: CreatePostRow) => {
    if (r.type === 'job') {
      return (
        <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2"><DollarSign size={14} className="text-green-400" />{String(r.form.salary || '—')}</div>
          <div className="flex items-center gap-2"><MapPin size={14} className="text-green-400" />{String(r.form.location || '—')}</div>
          <div className="col-span-2 mt-1 text-gray-400">{String(r.form.description || '')}</div>
        </div>
      );
    }
    if (r.type === 'hackathon') {
      return (
        <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2"><DollarSign size={14} className="text-blue-400" />Prize: {String(r.form.prize || '—')}</div>
          <div className="flex items-center gap-2"><CalendarDays size={14} className="text-blue-400" />Deadline: {String(r.form.deadline || '—')}</div>
          <div className="col-span-2 mt-1 text-gray-400">{String(r.form.description || '')}</div>
        </div>
      );
    }
    // stake-pool
    return (
      <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-1">
        <div>APY: <span className="text-green-400">{String(r.form.apy || '—')}</span></div>
        <div>Min Stake: {String(r.form.minStake || '—')}</div>
        <div className="col-span-2 mt-1 text-gray-400">{String(r.form.description || '')}</div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-sm ${filter==='all'?'bg-gray-800 text-white':'bg-gray-900 text-gray-400 hover:text-white'}`}>All</button>
          <button onClick={() => setFilter('stake-pool')} className={`px-3 py-1.5 rounded-md text-sm ${filter==='stake-pool'?'bg-gray-800 text-white':'bg-gray-900 text-gray-400 hover:text-white'}`}>Stake Pools</button>
          <button onClick={() => setFilter('hackathon')} className={`px-3 py-1.5 rounded-md text-sm ${filter==='hackathon'?'bg-gray-800 text-white':'bg-gray-900 text-gray-400 hover:text-white'}`}>Hackathons</button>
          <button onClick={() => setFilter('job')} className={`px-3 py-1.5 rounded-md text-sm ${filter==='job'?'bg-gray-800 text-white':'bg-gray-900 text-gray-400 hover:text-white'}`}>Jobs</button>
        </div>
        {/* CSV download button removed */}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 text-center text-gray-400">
          <Wand2 className="mx-auto mb-2 text-purple-400" size={24} />
          No posts yet. Use the Create button to publish Stake Pools, Hackathons or Jobs.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r, idx) => (
            <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TypeIcon t={r.type} />
                  <div className="font-semibold text-gray-100">{r.type === 'job' ? String(r.form.title || r.name) : r.name}</div>
                </div>
                <div className="text-xs text-gray-400">{new Date(r.date).toLocaleString()}</div>
              </div>
              {r.type === 'job' && (
                <div className="text-sm text-gray-400 mb-1">{String(r.form.company || '')}</div>
              )}
              {renderDetails(r)}
              {r.txHash && (
                <div className="mt-3 text-xs text-blue-400 truncate">Tx: {r.txHash}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YourPosts;
