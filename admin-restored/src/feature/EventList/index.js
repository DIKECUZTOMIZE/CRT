export const eventStatusFilters = ["All", "Live", "Upcoming", "Completed", "Cancelled", "Ended", "Postponed"];

export const getEventSummary = (events = []) => {
  const counts = {
    total: events.length,
    live: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    ended: 0,
    postponed: 0,
  };

  events.forEach((event) => {
    const status = event.status;

    if (status === "Live") counts.live += 1;
    if (status === "Upcoming") counts.upcoming += 1;
    if (status === "Completed") counts.completed += 1;
    if (status === "Cancelled") counts.cancelled += 1;
    if (status === "Ended") counts.ended += 1;
    if (status === "Postponed") counts.postponed += 1;
  });

  return [
    { label: "Total Events", value: counts.total },
    { label: "Live", value: counts.live },
    { label: "Upcoming", value: counts.upcoming },
    { label: "Completed", value: counts.completed },
    { label: "Cancelled", value: counts.cancelled },
    { label: "Ended", value: counts.ended },
    { label: "Postponed", value: counts.postponed },
  ];
};
