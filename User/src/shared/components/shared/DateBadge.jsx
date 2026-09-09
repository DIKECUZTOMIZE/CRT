import React from "react";

export const DateBadge = ({ date, className = "" }) => {
  if (!date) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-[10px] sm:text-xs text-slate-300 shrink-0 ${className}`}
    >
      <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="leading-none font-medium">{date}</span>
    </div>
  );
};