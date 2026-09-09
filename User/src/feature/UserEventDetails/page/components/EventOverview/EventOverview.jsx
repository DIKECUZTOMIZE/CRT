import React from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Hourglass,
  CalendarDays,
  Sparkles,
} from "lucide-react";

export const EventOverview = ({ meta, overview }) => {
  const data = meta || overview || {};

  if (!data || typeof data !== "object") {
    return null;
  }

  const formatDateOnly = (value) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = (statusStr) => {
    const status = statusStr?.toLowerCase();
    if (status === "live") {
      return {
        label: statusStr,
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        dotClass: "bg-emerald-400 animate-pulse",
      };
    }
    if (status === "upcoming") {
      return {
        label: statusStr,
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        dotClass: "bg-amber-400",
      };
    }
    if (status === "completed" || status === "ended") {
      return {
        label: statusStr,
        badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        dotClass: "bg-blue-500",
      };
    }
    if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "cancel"
    ) {
      return {
        label: statusStr,
        badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
        dotClass: "bg-rose-500",
      };
    }
    if (status === "postponed") {
      return {
        label: statusStr,
        badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-400",
        dotClass: "bg-violet-500",
      };
    }
    return {
      label: statusStr,
      badgeClass: "border-slate-700 bg-slate-800 text-slate-300",
      dotClass: "bg-slate-400",
    };
  };

  const mainStats = [
    {
      icon: CheckCircle2,
      label: "Status",
      type: "status",
      value: data.status,
      show: Boolean(data.status),
    },
    {
      icon: Users,
      label: "Seats Available",
      type: "seats",
      value:
        data.seatsAvailable !== undefined && data.seatsAvailable !== null
          ? `${data.seatsAvailable} Seats`
          : null,
      show: data.seatsAvailable !== undefined && data.seatsAvailable !== null,
    },
    {
      icon: MapPin,
      label: "Location / Venue",
      type: "text",
      value: data.location,
      show: Boolean(data.location),
    },
  ].filter((item) => item.show);

  const dynamicScheduleItems = Array.isArray(data.scheduleItems)
    ? data.scheduleItems
        .filter((item) => item && (item.date || item.time))
        .map((item) => ({
          icon: CalendarDays,
          label: item.label || item.type || item.customType || "Schedule",
          date: item.date ? formatDateOnly(item.date) : null,
          time: item.time || null,
          show: true,
        }))
    : [];

  const fallbackScheduleItems = [
    {
      icon: CalendarDays,
      label: "Event Start",
      date: data.startDate ? formatDateOnly(data.startDate) : null,
      time: data?.startTime || null,
      show: Boolean(data.startDate || data?.startTime),
    },
    {
      icon: Calendar,
      label: "Event End",
      date: data.endDate ? formatDateOnly(data.endDate) : null,
      time: data?.endTime || null,
      show: Boolean(data.endDate || data?.endTime),
    },
    {
      icon: Hourglass,
      label: "Registration Starts",
      date: data.registrationStarts
        ? formatDateOnly(data.registrationStarts)
        : null,
      time: null,
      show: Boolean(data.registrationStarts),
    },
    {
      icon: Hourglass,
      label: "Registration Deadline",
      date: data.registrationDeadline
        ? formatDateOnly(data.registrationDeadline)
        : null,
      time: null,
      show: Boolean(data.registrationDeadline),
    },
  ];

  const seenScheduleKeys = new Set();
  const scheduleItems = [...fallbackScheduleItems, ...dynamicScheduleItems]
    .filter((item) => item.show)
    .filter((item) => {
      const key = `${item.label}-${item.date || ""}-${item.time || ""}`;
      if (seenScheduleKeys.has(key)) return false;
      seenScheduleKeys.add(key);
      return true;
    });

  if (mainStats.length === 0 && scheduleItems.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
              Event Information
            </h3>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            Key schedules, venue, and registration status
          </p>
        </div>
      </div>

      {mainStats.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mainStats.map((item, idx) => {
            const Icon = item.icon;

            if (item.type === "status") {
              const statusStyle = getStatusBadge(item.value);
              return (
                <div
                  key={idx}
                  title={statusStyle.label}
                  className="group relative flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/70 p-3 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950"
                >
                  <div className="absolute left-1/2 top-full z-20 mt-2 w-[300px] max-w-[80vw] -translate-x-1/2 translate-y-2 rounded-xl border border-emerald-500/30 bg-slate-950/95 p-2.5 text-left text-slate-100 opacity-0 shadow-2xl shadow-slate-950/60 ring-1 ring-slate-800/80 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible invisible">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                      {item.label}
                    </div>
                    <div className="whitespace-pre-wrap break-words text-[10px] font-semibold leading-relaxed text-slate-100">
                      {statusStyle.label}
                    </div>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {item.label}
                    </p>
                    <div className="mt-1 flex items-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold capitalize ${statusStyle.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`}
                        />
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                title={item.value}
                className="group relative flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/70 p-3 transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-950"
              >
                <div className="absolute left-1/2 top-full z-20 mt-2 w-[300px] max-w-[80vw] -translate-x-1/2 translate-y-2 rounded-xl border border-emerald-500/30 bg-slate-950/95 p-2.5 text-left text-slate-100 opacity-0 shadow-2xl shadow-slate-950/60 ring-1 ring-slate-800/80 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible invisible">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                    {item.label}
                  </div>
                  <div className="whitespace-pre-wrap break-words text-[10px] font-semibold leading-relaxed text-slate-100">
                    {item.value}
                  </div>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-colors group-hover:border-emerald-400 group-hover:bg-emerald-500/20">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-bold text-slate-200 break-words group-hover:text-white">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {scheduleItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Schedule & Deadlines
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {scheduleItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  title={`${item.date}${item.time ? ` • ${item.time}` : ""}`}
                  className="group relative rounded-xl border border-slate-800/70 bg-slate-950/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-slate-950"
                >
                  <div className="absolute left-1/2 top-full z-20 mt-2 w-[300px] max-w-[80vw] -translate-x-1/2 translate-y-2 rounded-xl border border-emerald-500/30 bg-slate-950/95 p-2.5 text-left text-slate-100 opacity-0 shadow-2xl shadow-slate-950/60 ring-1 ring-slate-800/80 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible invisible">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                      {item.label}
                    </div>
                    <div className="whitespace-pre-wrap break-words text-[10px] font-semibold leading-relaxed text-slate-100">
                      {item.date}
                      {item.time ? ` • ${item.time}` : ""}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {item.label}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs font-extrabold tracking-tight text-slate-200 group-hover:text-white">
                        {item.date}
                      </p>

                      {item.time && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                          <Clock className="h-2.5 w-2.5" />
                          {item.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default EventOverview;
