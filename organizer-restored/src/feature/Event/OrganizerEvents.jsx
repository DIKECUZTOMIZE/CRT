import React from "react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Plus,
  CalendarDays,
  Clock3,
  MapPin,
  ArrowRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router";

import { useOrganizerEvents } from "./hook/useOrganizerEvents.js";

const OrganizerEvents = () => {
  const navigate = useNavigate();
  const {
    filteredEvents,
    loading,
    error,
    deleteEvent,
    fetchEvents,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filterTabs,
  } = useOrganizerEvents();

  const handleDeleteEvent = async (eventId, eventTitle) => {
    try {
      const success = await deleteEvent(eventId, eventTitle);
      if (success) {
        await fetchEvents();
        toast.success("Event deleted successfully.");
      }
    } catch (err) {
      toast.error(err?.message || "Unable to delete event.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 sm:text-xs">
            <Sparkles className="h-3 w-3" />
            Management
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            All Events
          </h1>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Search, filter, and manage your hosted competitions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/organizer/events/create")}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, location, category..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFilter(tab)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                selectedFilter === tab
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">
          {!loading ? `${filteredEvents.length} ${filteredEvents.length === 1 ? "event" : "events"} found` : "Loading events..."}
        </p>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Clear search
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-6 text-center text-sm text-rose-300">
          {error}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/20 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-emerald-500/10 active:scale-[0.99]"
            >
              <div className="flex h-full min-w-0 w-full flex-col gap-3">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <img
                    src={event.bannerUrl || "/assets/images/banner-placeholder.png"}
                    alt={event.title}
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/images/banner-placeholder.png";
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      event.status === "live"
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                        : event.status === "upcoming"
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                          : event.status === "cancelled" || event.status === "canceled"
                            ? "border-rose-500/30 bg-rose-500/15 text-rose-400"
                            : event.status === "postponed"
                              ? "border-violet-500/30 bg-violet-500/15 text-violet-400"
                              : "border-blue-500/30 bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {event.status}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id, event.title);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
                    aria-label={`Delete ${event.title}`}
                    title="Delete event"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div
                  onClick={() => navigate(`/organizer/events/${event.id}`)}
                  title={event.title}
                  className="min-w-0 w-full cursor-pointer overflow-hidden"
                >
                  <h3
                    className="min-w-0 w-full text-sm font-bold text-slate-100 transition-colors group-hover:text-emerald-400 sm:text-base"
                    title={event.title}
                  >
                    <span className="line-clamp-2 block min-w-0 w-full overflow-hidden break-words [overflow-wrap:anywhere]">
                      {event.title}
                    </span>
                  </h3>

                  <div className="mt-3 flex min-w-0 w-full flex-col gap-1.5 text-[11px] text-slate-400">
                    <span className="flex min-w-0 items-center gap-1.5" title={`${event.date}`}>
                      <CalendarDays className="h-3 w-3 shrink-0 text-slate-500" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{event.date}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5" title={`${event.time}`}>
                      <Clock3 className="h-3 w-3 shrink-0 text-slate-500" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{event.time}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5" title={`${event.location}`}>
                      <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{event.location}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-800/60 pt-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {event.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate(`/organizer/events/${event.id}`)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-400 transition-all hover:bg-emerald-500 hover:text-slate-950"
                  >
                    View Details
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <Filter className="h-6 w-6 text-slate-600" />
          </div>

          <h3 className="text-sm font-bold text-slate-300">No events found</h3>

          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Try another search term or select a different event status.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrganizerEvents;
