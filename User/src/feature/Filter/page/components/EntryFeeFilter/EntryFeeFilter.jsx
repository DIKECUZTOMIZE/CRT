import React from "react";

export const EntryFeeFilter = ({
  isFreeOnly = false,
  minPrize = 0,
  onFreeOnlyChange,
  onMinPrizeChange,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-slate-300">Pricing & Prize</label>

        {/* Free Only Checkbox / Switch */}
        <label className="flex cursor-pointer items-center gap-2 select-none rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5">
          <input
            type="checkbox"
            checked={isFreeOnly}
            onChange={(e) => onFreeOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
          />
          <span className="text-[11px] font-medium text-slate-300">Free Only</span>
        </label>
      </div>

      {/* Prize Pool Range Indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[11px] font-medium">
          <span className="text-slate-400">Min Prize Pool</span>
          <span className="font-bold text-emerald-400">${minPrize.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="0"
          max="50000"
          step="1000"
          value={minPrize}
          onChange={(e) => onMinPrizeChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
        />
      </div>
    </div>
  );
};