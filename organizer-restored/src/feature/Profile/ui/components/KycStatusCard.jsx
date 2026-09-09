import React from "react";
import { ShieldCheck } from "lucide-react";

export default function KycStatusCard({ kyc }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
        <ShieldCheck className="h-4 w-4" /> Verification & KYC
      </h3>

      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Status</span>
          <span className="font-bold text-emerald-400">{kyc.status}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span className="text-slate-400">Doc Type</span>
          <span className="font-medium text-slate-300">{kyc.documentType}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span className="text-slate-400">Verified On</span>
          <span className="font-medium text-slate-300">{kyc.verifiedAt}</span>
        </div>
      </div>
    </div>
  );
}