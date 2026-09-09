import React from "react";

export const LocationBadge = ({ location, className = "" }) => {
  if (!location) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-[10px] sm:text-xs text-slate-300 max-w-[160px] sm:max-w-[220px] shrink-0 ${className}`}
      title={location}
    >
      <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="truncate leading-none font-medium">{location}</span>
    </div>
  );
};