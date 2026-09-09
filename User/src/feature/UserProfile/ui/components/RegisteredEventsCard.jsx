import React from "react";
import { Ticket, Calendar, MapPin, ArrowRight } from "lucide-react";

const normalizeLocationValue = (event = {}) => {
  const allParts = [
    event?.location,
    event?.venueAddress,
    event?.city,
    event?.district,
    event?.state,
    event?.pinCode,
  ]
    .filter((part) => typeof part === "string")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!allParts.length) return "Location TBA";

  const primary = typeof event?.location === "string" ? event.location.trim() : "";
  if (
    primary &&
    (primary.includes(",") || primary.length > 24 || /\d/.test(primary))
  ) {
    return primary;
  }

  const fallbackParts = [...new Set([
    event?.venueAddress,
    event?.city,
    event?.district,
    event?.state,
    event?.pinCode,
    event?.location,
  ].filter((part) => typeof part === "string" && part.trim()))].map((part) => part.trim());

  return fallbackParts.length ? fallbackParts.join(", ") : allParts.join(", ");
};

export default function RegisteredEventsCard({ events }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
          <Ticket className="h-4 w-4" /> My Upcoming Tickets ({events.length})
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 transition-all hover:border-slate-700 sm:flex-row sm:items-center"
          >
            <div className="space-y-1">
              <span className="inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                {evt.ticketType}
              </span>
              <h4 className="text-sm font-bold text-slate-100">{evt.title}</h4>
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-500" /> {evt.date} • {evt.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-500" /> {normalizeLocationValue(evt)}
                </span>
              </div>
            </div>

            <button className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white">
              <span>View Ticket</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}