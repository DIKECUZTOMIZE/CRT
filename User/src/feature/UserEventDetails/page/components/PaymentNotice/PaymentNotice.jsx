import React from "react";
import { AlertTriangle } from "lucide-react";

export const PaymentNotice = () => {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-300">
            Online payment is currently unavailable.
          </p>
          <p className="text-[11px] leading-relaxed text-amber-200/90">
            We do not recommend online payment yet. Please avoid paying online or sharing payment details until approved. Offline payment is the only safe option if needed.
          </p>
        </div>
      </div>
    </div>
  );
};