import React from "react";

export const FilterButton = ({
  activeCount = 0,
  isOpen = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border active:scale-95 select-none ${
        isOpen || activeCount > 0
          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10"
          : "bg-slate-900/80 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/60"
      } ${className}`}
    >
      {/* Filter Sliders Icon */}
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${
          isOpen ? "rotate-90 text-emerald-400" : "text-slate-400"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>

      <span>Filters</span>

      {/* Active Filters Badge */}
      {activeCount > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-emerald-500 text-[10px] font-black text-slate-950 ml-0.5">
          {activeCount}
        </span>
      )}
    </button>
  );
};