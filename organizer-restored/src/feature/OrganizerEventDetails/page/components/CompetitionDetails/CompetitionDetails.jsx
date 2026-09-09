import React from "react";
import {
  Users,
  UserRound,
  GraduationCap,
  Trophy,
  Layers3,
  Globe2,
  Gauge,
  Sparkles,
  Calendar,
} from "lucide-react";

export const CompetitionDetails = ({ details }) => {
  if (!details || typeof details !== "object") return null;

  const formatValue = (val) => {
    if (Array.isArray(val)) return val.filter(Boolean).join(", ");
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (val === null || val === undefined) return "";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return "Added detail";
      }
    }
    return String(val);
  };

  const getDisplayLabel = (key) => {
    const labels = {
      participationType: "Participation",
      teamSize: "Team Size",
      eligibility: "Eligibility",
      category: "Category",
      skillLevel: "Skill Level",
      competitionType: "Competition Type",
      mode: "Mode",
      ageGroup: "Age Group",
      audience: "Audience",
      entryFee: "Entry Fee",
      totalSeats: "Seats",
      location: "Location",
      duration: "Duration",
      prizePool: "Prize Pool",
      registrationStarts: "Registration Starts",
      registrationDeadline: "Registration Deadline",
      registrationWindow: "Registration Window",
      startDate: "Event Start",
      endDate: "Event End",
    };

    if (labels[key]) return labels[key];

    const formatted = String(key)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();

    return formatted
      ? formatted.replace(/\b\w/g, (char) => char.toUpperCase())
      : "Detail";
  };

  const getDisplayIcon = (key) => {
    const iconMap = {
      participationType: Users,
      teamSize: UserRound,
      eligibility: GraduationCap,
      category: Trophy,
      skillLevel: Gauge,
      competitionType: Layers3,
      mode: Globe2,
      ageGroup: Users,
      audience: Users,
      entryFee: Trophy,
      totalSeats: Layers3,
      location: Globe2,
      duration: Gauge,
      prizePool: Trophy,
      registrationStarts: Calendar,
      registrationDeadline: Calendar,
      registrationWindow: Calendar,
      startDate: Calendar,
      endDate: Calendar,
    };

    return iconMap[key] || Trophy;
  };

  const duplicateKeys = new Set([
    "startDate",
    "endDate",
    "registrationStarts",
    "registrationDeadline",
    "totalSeats",
    "location",
  ]);

  const hiddenKeys = new Set([
    "teamSize",
    "category",
    "skillLevel",
    "ageGroup",
    "eligibility",
  ]);

  const orderedKeys = [
    "participationType",
    "competitionType",
    "mode",
  ];

  const detailEntries = Object.entries(details || {});
  const seen = new Set();

  const items = [];

  orderedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(details, key)) {
      const value = details[key];
      if (value !== undefined && value !== null && value !== "") {
        seen.add(key);
        items.push({
          key,
          icon: getDisplayIcon(key),
          label: getDisplayLabel(key),
          value,
        });
      }
    }
  });

  detailEntries.forEach(([key, value]) => {
    if (seen.has(key)) return;
    if (duplicateKeys.has(key)) return;
    if (hiddenKeys.has(key)) return;
    if (value === undefined || value === null || value === "") return;
    items.push({
      key,
      icon: getDisplayIcon(key),
      label: getDisplayLabel(key),
      value,
    });
  });

  const normalizedItems = items
    .map((item) => ({
      ...item,
      formattedValue: formatValue(item.value),
    }))
    .filter((item) => item.formattedValue && item.formattedValue.trim() !== "");

  if (normalizedItems.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/8 blur-3xl" />

        <div className="relative flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
                Competition Overview
              </h3>
              <p className="text-[11px] text-slate-400">More details will appear here</p>
            </div>
          </div>

          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 text-sm font-bold text-emerald-400">
            +
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-4 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-sm font-bold text-slate-100">No competition details added yet</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Organizer will add participation type, team size, format, mode, and more here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 sm:mb-5 sm:pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
              Competition Overview
            </h3>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            Eligibility, format & key participation info
          </p>
        </div>

        <span className="rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-slate-400">
          {normalizedItems.length} Specs
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {normalizedItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={`${item.key}-${index}`}
              className="group relative min-w-0 overflow-hidden rounded-xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/90 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-4 w-4" />
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 max-w-full overflow-hidden text-ellipsis line-clamp-2 break-words text-xs font-extrabold tracking-tight text-slate-100 transition-colors group-hover:text-white">
                  {item.formattedValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CompetitionDetails;