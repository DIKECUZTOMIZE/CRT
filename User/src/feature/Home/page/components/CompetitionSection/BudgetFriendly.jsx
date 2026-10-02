import React from "react";
import PremiumBudgetSection from "./PremiumBudgetSection";

const BudgetFriendly = ({ competitions = [], savedIds = [], onToggleSave }) => (
  <PremiumBudgetSection
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default BudgetFriendly;
