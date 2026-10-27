import React from "react";
import CompetitionSection from "./CompetitionSection";

const PremiumBudgetSection = ({ competitions = [], savedIds = [], onToggleSave, sectionKey, quickFilters = [] }) => (
  <div className="rounded-2xl border border-emerald-500/15 bg-white/90 p-2 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
    <CompetitionSection
      sectionKey={sectionKey}
      quickFilters={quickFilters}
      title="Budget Friendly"
      subtitle=""
      competitions={competitions}
      savedIds={savedIds}
      onToggleSave={onToggleSave}
      className="rounded-xl"
      titleClassName="text-base font-extrabold tracking-tight text-slate-900 sm:text-xl sm:text-slate-900"
    />
  </div>
);

export default PremiumBudgetSection;
