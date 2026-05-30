import React from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export function OtcReconciliationTab({
  pendingTxs,
  loading,
  onResolve,
  saving,
}: {
  pendingTxs: any[];
  loading: boolean;
  onResolve: (txId: string) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-[15px] font-bold text-slate-800 tracking-tight mb-4">
          Pending OTC Reconciliation
        </h2>
        
        {loading ? (
            <div className="text-center py-12 text-slate-500 font-bold">Loading...</div>
        ) : pendingTxs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            No pending OTC reconciliations found.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTxs.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1fr,auto] items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div>
                  <div className="font-bold text-[13px] text-slate-900">
                    User Ref: {tx.internal_ref}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Amount: {Math.abs(parseFloat(tx.amount))} USDC
                  </div>
                </div>
                
                <button
                  onClick={() => onResolve(tx.id)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[12px] font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  <CheckCircle size={14} />
                  Reconcile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
