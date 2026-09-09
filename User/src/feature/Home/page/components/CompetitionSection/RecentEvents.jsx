import React from "react";
import CompetitionSection from "./CompetitionSection";

const RecentEvents = ({ competitions = [], savedIds = [], onToggleSave }) => (
  <CompetitionSection
    title="Recently Added"
    subtitle="Newly announced hackathons and developer contests"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default RecentEvents;
