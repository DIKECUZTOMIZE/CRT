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
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

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
        badgeClass: "border-emerald-200 bg-[#ECFDF5] text-emerald-700",
        dotClass: "bg-emerald-600 animate-pulse",
      };
    }
    if (status === "upcoming") {
      return {
        label: statusStr,
        badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
        dotClass: "bg-amber-500",
      };
    }
    if (status === "completed" || status === "ended") {
      return {
        label: statusStr,
        badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
        dotClass: "bg-sky-600",
      };
    }
    if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "cancel"
    ) {
      return {
        label: statusStr,
        badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
        dotClass: "bg-rose-600",
      };
    }
    if (status === "postponed") {
      return {
        label: statusStr,
        badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
        dotClass: "bg-violet-600",
      };
    }
    return {
      label: statusStr,
      badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
      dotClass: "bg-slate-500",
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
    <DetailAccordion
      title="Event Overview"
      icon={Sparkles}
      initialOpen={false}
      viewLabel="View details"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="space-y-5">
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
                    className="group relative flex items-center gap-3 rounded-xl border border-emerald-100 bg-[#F8FBF9] p-3 transition-all duration-300 hover:border-emerald-200 hover:bg-[#ECFDF5]"
                  >
                    <div className="absolute left-1/2 top-full z-20 mt-2 w-[300px] max-w-[80vw] -translate-x-1/2 translate-y-2 rounded-xl border border-emerald-200 bg-white p-2.5 text-left text-slate-700 opacity-0 shadow-[0_10px_26px_rgba(15,118,110,0.05)] ring-1 ring-emerald-100 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible invisible">
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        {item.label}
                      </div>
                      <div className="whitespace-pre-wrap break-words text-[10px] font-semibold leading-relaxed text-slate-700">
                        {statusStyle.label}
                      </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-[#ECFDF5] text-emerald-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
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
                  className="group relative flex items-center gap-3 rounded-xl border border-emerald-100 bg-[#F8FBF9] p-3 transition-all duration-300 hover:border-emerald-200 hover:bg-[#ECFDF5]"
                >
                  <div className="absolute left-1/2 top-full z-20 mt-2 w-[300px] max-w-[80vw] -translate-x-1/2 translate-y-2 rounded-xl border border-emerald-200 bg-white p-2.5 text-left text-slate-700 opacity-0 shadow-[0_10px_26px_rgba(15,118,110,0.05)] ring-1 ring-emerald-100 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible invisible">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                      {item.label}
                    </div>
                    <div className="whitespace-pre-wrap break-words text-[10px] font-semibold leading-relaxed text-slate-700">
                      {item.value}
                    </div>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-[#ECFDF5] text-emerald-600 transition-colors group-hover:border-emerald-300 group-hover:bg-[#ECFDF5]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {item.label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-bold text-slate-900 break-words group-hover:text-slate-900">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {scheduleItems.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Schedule & Deadlines
            </p>

            <div className="grid grid-cols-2 gap-3">
              {scheduleItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    title={`${item.date}${item.time ? ` • ${item.time}` : ""}`}
                    className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-[0_10px_26px_rgba(15,118,110,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_rgba(15,118,110,0.08)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />

                    <div className="absolute left-1/2 top-full z-20 mt-2 w-[300px] max-w-[80vw] -translate-x-1/2 translate-y-2 rounded-xl border border-emerald-200 bg-white p-2.5 text-left text-slate-700 opacity-0 shadow-[0_10px_26px_rgba(15,118,110,0.05)] ring-1 ring-emerald-100 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible invisible">
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        {item.label}
                      </div>
                      <div className="whitespace-pre-wrap break-words text-[10px] font-semibold leading-relaxed text-slate-700">
                        {item.date}
                        {item.time ? ` • ${item.time}` : ""}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-[#ECFDF5] text-emerald-600 ring-1 ring-emerald-100">
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs font-extrabold tracking-tight text-slate-900 group-hover:text-slate-900">
                          {item.date}
                        </p>

                        {item.time && (
                          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-[#F8FBF9] px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
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
      </div>
    </DetailAccordion>
  );
};

export default EventOverview;
