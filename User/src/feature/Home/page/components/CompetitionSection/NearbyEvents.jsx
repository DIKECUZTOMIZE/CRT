import React from "react";
import CompetitionSection from "./CompetitionSection";

const NearbyEvents = ({ competitions = [], savedIds = [], onToggleSave, sectionKey, quickFilters = [] }) => (
  <CompetitionSection
    sectionKey={sectionKey}
    quickFilters={quickFilters}
    title="Nearby"
    subtitle="Hackathons happening near your area"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default NearbyEvents;