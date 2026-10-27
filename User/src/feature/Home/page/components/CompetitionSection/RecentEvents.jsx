import React from "react";
import CompetitionSection from "./CompetitionSection";

const RecentEvents = ({ competitions = [], savedIds = [], onToggleSave, sectionKey, quickFilters = [] }) => (
  <CompetitionSection
    sectionKey={sectionKey}
    quickFilters={quickFilters}
    title="Recently"
    subtitle="Newly announced hackathons and developer contests"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default RecentEvents;
