import React from "react";

export const CompetitionTypeFilter = ({
  selectedTypes = [],
  onChange,
  className = "",
}) => {
  const types = [
    { id: "solo", label: "Solo" },
    { id: "team", label: "Team Based" },
    { id: "hackathon", label: "Hackathon" },
    { id: "bounty", label: "Bounty" },
  ];

  const toggleType = (id) => {
    if (selectedTypes.includes(id)) {
      onChange(selectedTypes.filter((item) => item !== id));
    } else {
      onChange([...selectedTypes, id]);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-semibold text-slate-300">Format</label>
      <div className="flex flex-wrap gap-1.5">
        {types.map((type) => {
          const isSelected = selectedTypes.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleType(type.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};