import React from "react";

export const LocationFilter = ({
  locationType = "all", // 'all' | 'online' | 'onsite'
  city = "",
  onLocationTypeChange,
  onCityChange,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-300">Format & Location</label>

      {/* Segmented Button Group for Online/On-site */}
      <div className="grid grid-cols-3 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold">
        {[
          { id: "all", label: "All" },
          { id: "online", label: "Online" },
          { id: "onsite", label: "On-Site" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onLocationTypeChange(tab.id)}
            className={`py-1.5 rounded-lg transition-all text-center ${
              locationType === tab.id
                ? "bg-slate-800 text-white shadow border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* City input when On-site is selected or active */}
      {locationType !== "online" && (
        <div className="relative">
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Search city or country..."
            className="w-full h-8 px-3 pl-8 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}
    </div>
  );
};