import React from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router";

import { useDashboardEvents } from "../feature/Dashboard/hook/useDashboardEvents.js";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { stats, recentEvents, loading, error } = useDashboardEvents();

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
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

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">{stat.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                {stat.label === "Total Events" && <CalendarDays className="h-4 w-4" />}
                {stat.label === "Live" && <Sparkles className="h-4 w-4" />}
                {stat.label === "Upcoming" && <Clock3 className="h-4 w-4" />}
                {stat.label === "Completed" && <CalendarDays className="h-4 w-4" />}
              </div>
            </div>

            <div className="text-3xl font-black text-white">{stat.value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{stat.description}</div>
          </div>
        ))}
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

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/70" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/organizer/events/${event.id}`)}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-500/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        event.status === "live"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : event.status === "upcoming"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : event.status === "cancelled" || event.status === "canceled"
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                              : event.status === "postponed"
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                                : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                      }`}
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
        )}
      </section>
    </main>
  );
};

export default OrganizerDashboard;
