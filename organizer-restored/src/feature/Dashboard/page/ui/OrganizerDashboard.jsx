import React, { useRef } from "react";
import {
  CalendarDays,
  Plus,
  ArrowRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router";

import { useDashboardEvents } from "../../hook/useDashboardEvents.js";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const eventsRef = useRef(null);
  const { stats, recentEvents, loading, error, refetch, getStatIcon, getStatusClassName, scrollSlider } = useDashboardEvents();

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Event List</h1>
        </div>

        <button
          type="button"
          onClick={() => navigate("/organizer/events/create")}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between sm:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Overview
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll stats left"
              onClick={() => scrollSlider(statsRef, "prev")}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll stats right"
              onClick={() => scrollSlider(statsRef, "next")}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
            <button
              type="button"
              onClick={refetch}
              className="ml-3 font-semibold text-rose-200 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        <div
          ref={statsRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 xl:grid-cols-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`loading-stat-${index}`}
                  className="min-w-[78%] snap-start rounded-xl border border-slate-800 bg-slate-900 p-4 sm:min-w-0"
                >
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
                  <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-700" />
                  <div className="mt-3 h-3 w-28 animate-pulse rounded bg-slate-800" />
                </div>
              ))
            : stats.map((stat) => {
                const Icon = getStatIcon(stat.label);

                return (
                  <div
                    key={stat.label}
                    className="min-w-[78%] snap-start rounded-xl border border-slate-800 bg-slate-900 p-4 sm:min-w-0"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{stat.label}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{stat.description}</div>
                  </div>
                );
              })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent & Upcoming</h2>
          <button
            type="button"
            onClick={() => navigate("/organizer/events")}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-end gap-2 sm:hidden">
          <button
            type="button"
            aria-label="Scroll events left"
            onClick={() => scrollSlider(eventsRef, "prev")}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll events right"
            onClick={() => scrollSlider(eventsRef, "next")}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={eventsRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none sm:block sm:space-y-3 sm:overflow-visible sm:pb-0"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`loading-event-${index}`}
                  className="min-w-[82%] snap-start rounded-xl border border-slate-800 bg-slate-900 p-4 sm:min-w-0"
                >
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
                  <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-700" />
                  <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-800" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-800" />
                </div>
              ))
            : recentEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/organizer/events/${event.id}`)}
                  className="min-w-[82%] snap-start cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-500/40 sm:min-w-0"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClassName(event.status)}`}
                      >
                        {event.status}
                      </span>

                      <h3 className="mt-2 text-base font-bold text-white">{event.title}</h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" /> {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {event.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
};

export default OrganizerDashboard;
