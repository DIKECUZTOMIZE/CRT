import React from "react";

import { OrganizerEventDetails } from "./ui/OrganizerEventDetails.jsx";

export const AdminEventDetailsPage = (props) => {
  const { event } = props;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Admin Panel
          </p>
          <h2 className="mt-1 text-xl font-black text-white">Event Details</h2>
        </div>

        {event && (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            {String(event.id || event._id || "Event").slice(0, 10)}
          </span>
        )}
      </div>

      <OrganizerEventDetails {...props} />
    </div>
  );
};

export default AdminEventDetailsPage;
