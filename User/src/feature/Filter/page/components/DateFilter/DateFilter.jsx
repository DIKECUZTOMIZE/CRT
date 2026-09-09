import React from "react";

export const DateFilter = ({
  selectedRange = "all",
  onChange,
  className = "",
}) => {
  const options = [
    { id: "all", label: "Anytime" },
    { id: "upcoming", label: "Upcoming" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "ending_soon", label: "Ending Soon" },
  ];

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-300">Timeline</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = selectedRange === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`min-h-[42px] rounded-xl border px-3 py-2 text-left text-[12px] font-medium transition-all touch-manipulation active:scale-[0.99] ${
                isSelected
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-950/20"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};