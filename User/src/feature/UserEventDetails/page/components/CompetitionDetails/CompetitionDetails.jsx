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
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

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
    "skillLevel",
    "ageGroup",
    "eligibility",
  ]);

  const orderedKeys = [
    "category",
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
      <DetailAccordion
        title="Competition Overview"
        icon={Sparkles}
        initialOpen={false}
        viewLabel="View details"
        hideLabel="Hide details"
        iconClassName="panel-icon--emerald"
        bodyClassName="panel-body--stacked"
      >
        <div className="mt-4 rounded-xl border border-emerald-100 bg-white px-3 py-4 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-[#ECFDF5] text-emerald-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-sm font-bold text-slate-900">No competition details added yet</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            Organizer will add participation type, team size, format, mode, and more here.
          </p>
        </div>
      </DetailAccordion>
    );
  }

  return (
    <DetailAccordion
      title="Competition Overview"
      badge={`${normalizedItems.length} Specs`}
      icon={Sparkles}
      initialOpen={false}
      viewLabel="View details"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="grid grid-cols-2 gap-3">
        {normalizedItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={`${item.key}-${index}`}
              className="group relative rounded-xl border border-emerald-100 bg-[#F8FBF9] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_10px_26px_rgba(15,118,110,0.05)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-[#ECFDF5] text-emerald-600">
                  <Icon className="h-4 w-4" />
                </div>

                <span className="rounded-full border border-emerald-100 bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {item.label}
                </p>

                <p className="mt-1 line-clamp-2 break-words text-xs font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-slate-900">
                  {item.formattedValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default CompetitionDetails;