import React from "react";
import PremiumBudgetSection from "./PremiumBudgetSection";

const BudgetFriendly = ({ competitions = [], savedIds = [], onToggleSave, sectionKey, quickFilters = [] }) => (
  <PremiumBudgetSection
    sectionKey={sectionKey}
    quickFilters={quickFilters}
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default BudgetFriendly;
