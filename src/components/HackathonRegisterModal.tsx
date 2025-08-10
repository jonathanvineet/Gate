import React, { useMemo, useState } from 'react';
import { X, Loader, CheckCircle, PenTool } from 'lucide-react';
import { hackathons } from '../data/mockData';
import StakeModal from './StakeModal';
import { EXPECTED_CHAIN_ID, STAKING_CONTRACT_ADDRESS, TOKEN_ADDRESS } from '../config/staking';
// Activity is implicitly logged by StakeModal via csvLogger

interface HackathonRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string | null;
}

const HackathonRegisterModal: React.FC<HackathonRegisterModalProps> = ({ isOpen, onClose, hackathonId }) => {
  const hackathon = useMemo(() => hackathons.find(h => h.id === hackathonId) || null, [hackathonId]);
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [step, setStep] = useState<'form' | 'stake' | 'done'>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakeOpen, setStakeOpen] = useState(false);

  if (!isOpen || !hackathon) return null;

  const handleAnswer = (qid: string, value: string, multi: boolean) => {
    setAnswers(prev => {
      if (multi) {
        const current = new Set(Array.isArray(prev[qid]) ? (prev[qid] as string[]) : []);
        if (current.has(value)) current.delete(value); else current.add(value);
        return { ...prev, [qid]: Array.from(current) };
      }
      return { ...prev, [qid]: value };
    });
  };

  const validate = () => {
    const qs = hackathon.questions || [];
    for (const q of qs) {
      if (q.required) {
        const val = answers[q.id];
        if (q.type === 'multi') {
          if (!Array.isArray(val) || val.length === 0) return `${q.label} is required`;
        } else if (!val || String(val).trim() === '') {
          return `${q.label} is required`;
        }
      }
    }
    return null;
  };

  const submitForm = async () => {
    try {
      setBusy(true);
      setError(null);
      const err = validate();
      if (err) throw new Error(err);
      // Move to stake step
      setStep('stake');
      setStakeOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Validation failed');
    } finally {
      setBusy(false);
    }
  };

  // StakeModal onClose will set stakeOpen false; we keep this wrapped implicitly

  const handleStakeSuccessProbe = () => {
    // This modal doesn't know when StakeModal succeeded, so rely on ActivityDashboard refresh event after CSV update.
    // As a UX compromise, provide a manual Done button after user closes the stake modal.
  };

  const renderForm = () => (
    <div className="space-y-4">
      {(hackathon.questions || []).length === 0 ? (
        <div className="text-sm text-gray-700">No additional questions. Proceed to stake to confirm your registration.</div>
      ) : (
        (hackathon.questions || []).map(q => (
          <div key={q.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-800">{q.label}{q.required && <span className="text-red-500"> *</span>}</label>
            {q.type === 'text' && (
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Type your answer"
                value={(answers[q.id] as string) || ''}
                onChange={e => handleAnswer(q.id, e.target.value, false)}
              />
            )}
            {q.type === 'single' && (
              <div className="flex flex-wrap gap-2">
                {(q.options || []).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(q.id, opt, false)}
                    className={`px-3 py-1 rounded border ${answers[q.id] === opt ? 'bg-black text-white' : 'bg-white text-gray-800'}`}
                  >{opt}</button>
                ))}
              </div>
            )}
            {q.type === 'multi' && (
              <div className="flex flex-wrap gap-2">
                {(q.options || []).map(opt => {
                  const selected = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswer(q.id, opt, true)}
                      className={`px-3 py-1 rounded border ${selected ? 'bg-black text-white' : 'bg-white text-gray-800'}`}
                    >{opt}</button>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={busy}
        >Cancel</button>
        <button
          onClick={submitForm}
          className="flex-1 px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          disabled={busy}
        >{busy ? (<><Loader className="animate-spin inline mr-2" size={14} /> Submitting...</>) : 'Continue to Stake'}</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-auto relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={22} />
        </button>
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <PenTool className="text-purple-600" />
            <h3 className="text-xl font-bold">Register for {hackathon.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Answer a few basics, then stake a small amount of tPOL to confirm your registration.</p>
        </div>
        <div className="p-6">
          {step === 'form' && renderForm()}
          {step === 'stake' && (
            <div className="space-y-3 text-sm text-gray-700">
              <p>Complete the stake step in the wallet modal. After staking, your registration will be recorded in your activity.</p>
              <button
                onClick={() => { setStep('done'); onClose(); }}
                className="px-4 py-2 border rounded-lg"
              >Done</button>
            </div>
          )}
          {step === 'done' && (
            <div className="text-center space-y-2">
              <CheckCircle className="text-green-500 mx-auto" size={48} />
              <p className="text-gray-700">Thanks! You can view your stake in the Activity section.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stake confirmation modal */}
    {hackathon && (
        <StakeModal
          isOpen={stakeOpen}
          onClose={() => { setStakeOpen(false); handleStakeSuccessProbe(); }}
      poolName={`${hackathon.name} Registration`}
          poolId={`hackathon-${hackathon.id}`}
          minStake={'0.5 tPOL'}
          apy={'0%'}
          requiredToken={{ symbol: 'tPOL', address: TOKEN_ADDRESS, decimals: 18 }}
          requiredChainId={EXPECTED_CHAIN_ID}
          stakingContractAddress={STAKING_CONTRACT_ADDRESS}
      hackathonMode
        />
      )}
    </div>
  );
};

export default HackathonRegisterModal;
