import React from "react";
import CompetitionSection from "./CompetitionSection";

const PopularEvents = ({ competitions = [], savedIds = [], onToggleSave }) => (
  <CompetitionSection
    title="Popular Competitions"
    subtitle="Trending events with maximum participant signups"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default PopularEvents;