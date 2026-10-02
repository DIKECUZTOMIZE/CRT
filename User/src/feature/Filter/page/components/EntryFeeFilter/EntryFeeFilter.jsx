import React from "react";

export const EntryFeeFilter = ({
  isFreeOnly = false,
  minPrize = 0,
  onFreeOnlyChange,
  onMinPrizeChange,
  className = "",
}) => {
  const sliderProgress = Math.min(100, Math.max(0, (minPrize / 50000) * 100));

  return (
    <>
      <style>{`
        .slider-premium-range {
          --slider-track: #E2E8F0;
          --slider-fill: #CBD5E1;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(
            90deg,
            var(--slider-fill) 0%,
            var(--slider-fill) ${sliderProgress}%,
            var(--slider-track) ${sliderProgress}%,
            var(--slider-track) 100%
          );
          border-radius: 9999px;
          outline: none;
          accent-color: #CBD5E1;
          color: #CBD5E1;
          transition: background 0.18s ease, box-shadow 0.18s ease;
        }

        .slider-premium-range::-webkit-slider-runnable-track,
        .slider-premium-range::-moz-range-track {
          background: transparent;
        }

        .slider-premium-range::-webkit-slider-thumb,
        .slider-premium-range::-moz-range-thumb {
          -webkit-appearance: none;
          appearance: none;
          accent-color: #CBD5E1;
          color: #CBD5E1;
        }

        .slider-premium-range::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 9999px;
          background: #E2E8F0;
        }

        .slider-premium-range::-moz-range-progress {
          background: #CBD5E1;
          height: 4px;
          border-radius: 9999px;
        }

        .slider-premium-range::-moz-range-track {
          background: #E2E8F0;
          height: 4px;
          border-radius: 9999px;
        }

        .slider-premium-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.16);
          margin-top: -5px;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .slider-premium-range:active::-webkit-slider-thumb,
        .slider-premium-range:focus-visible::-webkit-slider-thumb {
          transform: scale(1.02);
          box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
        }

        .slider-premium-range::-moz-range-track {
          height: 4px;
          border-radius: 9999px;
          background: transparent;
        }

        .slider-premium-range::-moz-range-progress {
          background: #CBD5E1;
          height: 4px;
          border-radius: 9999px;
        }

        .slider-premium-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.16);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        @media (min-width: 768px) {
          .slider-premium-range::-webkit-slider-runnable-track {
            height: 6px;
          }

          .slider-premium-range::-webkit-slider-thumb {
            width: 16px;
            height: 16px;
            margin-top: -5px;
          }

          .slider-premium-range::-moz-range-track {
            height: 6px;
          }

          .slider-premium-range::-moz-range-thumb {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>

      <div className={`flex flex-col gap-2 sm:gap-3 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold text-slate-300">Pricing & Prize</label>

          {/* Free Only Checkbox / Switch */}
          <label className="flex cursor-pointer items-center gap-2 select-none rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5">
            <input
              type="checkbox"
              checked={isFreeOnly}
              onChange={(e) => onFreeOnlyChange(e.target.checked)}
              className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-slate-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-slate-500"
            />
            <span className="text-[11px] font-medium text-slate-300">Free Only</span>
          </label>
        </div>

        {/* Prize Pool Range Indicator */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-slate-400">Min Prize Pool</span>
            <span className="font-bold text-slate-300">${minPrize.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50000"
            step="1000"
            value={minPrize}
            onChange={(e) => onMinPrizeChange(Number(e.target.value))}
            className="slider-premium-range h-2 w-full cursor-pointer appearance-none rounded-full"
          />
        </div>
      </div>
    </>
  );
};