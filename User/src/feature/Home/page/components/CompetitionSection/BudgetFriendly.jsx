import React from "react";
import CompetitionSection from "./CompetitionSection";

const BudgetFriendly = ({ competitions = [], savedIds = [], onToggleSave }) => (
  <CompetitionSection
    title="Budget Friendly"
    subtitle="Beginner-accessible challenges and standard prize pools"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default BudgetFriendly;
