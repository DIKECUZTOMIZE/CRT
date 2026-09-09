import React from "react";
import { Bookmark, MapPin, CalendarDays, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

const formatSavedDate = (value) => {
  if (!value) return "TBA";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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

export default function SavedEventsCard({ savedList = [], onRefresh, onRemove }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
          <Bookmark className="h-4 w-4" /> Wishlist Events
        </h3>
        {onRefresh && (
          <button
            type="button"
            onClick={() => onRefresh()}
            className="text-[10px] font-medium text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {savedList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 p-4 text-xs text-slate-400">
            No saved events yet.
          </p>
        ) : savedList.map((item) => {
          const eventId = item.id || item._id;

          return (
            <div
              key={eventId}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2 text-xs transition hover:border-emerald-500/40 hover:bg-slate-900/80"
            >
              <button
                type="button"
                onClick={() => navigate(`/events/${eventId}`)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg p-2 text-left"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-words font-semibold text-slate-200">{item.title}</p>
                  <div className="flex min-w-0 items-center gap-1.5 text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0 text-emerald-400" />
                    <span className="min-w-0 break-words">{normalizeLocationValue(item)}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-slate-400">
                    <CalendarDays className="h-3 w-3 shrink-0 text-emerald-400" />
                    <span className="break-words">{formatSavedDate(item.eventDate || item.eventStart)}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                  {item.status || "Upcoming"}
                </span>
              </button>

              {onRemove && (
                <button
                  type="button"
                  aria-label="Remove from watchlist"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(eventId);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}