import React from "react";
import CompetitionSection from "./CompetitionSection";

const HighBudget = ({ competitions = [], savedIds = [], onToggleSave }) => (
  <CompetitionSection
    title="High Budget / Mega Pools"
    subtitle="Grand-scale hackathons featuring high prize amounts"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default HighBudget;