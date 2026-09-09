import React from "react";

export const SortDropdown = ({
  value = "popular",
  onChange,
  className = "",
}) => {
  const options = [
    { id: "popular", label: "Most Popular" },
    { id: "newest", label: "Recently Added" },
    { id: "prize_high", label: "Highest Prize" },
    { id: "deadline_soon", label: "Ending Soonest" },
  ];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pr-8 pl-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-semibold text-slate-200 appearance-none cursor-pointer hover:border-slate-700 focus:outline-none focus:border-emerald-500/50 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
            Sort: {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};