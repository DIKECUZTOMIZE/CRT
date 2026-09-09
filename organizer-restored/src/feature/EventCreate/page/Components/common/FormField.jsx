import React from "react";
import { AlertCircle } from "lucide-react";

export default function FormField({
  label,
  required = false,
  hint,
  error,
  children,
  className = "",
}) {
  return (
    <div className={`form-field space-y-1.5 ${className}`}>
      {/* LABEL & HINT */}
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label className="form-field-label text-xs font-semibold sm:text-sm">
            {label}
            {required && <span className="ml-1 text-rose-400">*</span>}
          </label>
          {hint && <span className="form-field-hint text-[11px] font-normal">{hint}</span>}
        </div>
      )}

      {/* INPUT CONTROL SLOT */}
      <div className="relative">{children}</div>

      {/* ERROR MESSAGE */}
      {error && (
        <p className="form-field-error flex items-center gap-1.5 text-[11px] font-medium animate-in fade-in-50 slide-in-from-top-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{typeof error === "string" ? error : error.message}</span>
        </p>
      )}
    </div>
  );
}