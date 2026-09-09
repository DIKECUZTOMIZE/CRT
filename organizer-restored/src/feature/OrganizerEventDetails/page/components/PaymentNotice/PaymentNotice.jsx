import React from "react";
import { AlertTriangle } from "lucide-react";

export const PaymentNotice = () => {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-xs font-semibold text-amber-300">
          "Online payment is currently unavailable"
        </p>
      </div>
    </div>
  );
};