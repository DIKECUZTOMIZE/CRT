import React from "react";
import CompetitionSection from "./CompetitionSection";

const NearbyEvents = ({ competitions = [], savedIds = [], onToggleSave }) => (
  <CompetitionSection
    title="Nearby Competitions"
    subtitle="Hackathons happening near your area"
    competitions={competitions}
    savedIds={savedIds}
    onToggleSave={onToggleSave}
  />
);

export default NearbyEvents;