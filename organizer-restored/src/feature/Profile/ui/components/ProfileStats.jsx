import React from "react";
import { Calendar, Award, Users, Star } from "lucide-react";

export default function ProfileStats({ stats }) {
  const safeStats = stats || {};

  const statItems = [
    { label: "Total Events", value: safeStats.totalEvents ?? 0, icon: Calendar, color: "text-emerald-400" },
    { label: "Active Events", value: safeStats.activeEvents ?? 0, icon: Award, color: "text-emerald-400" },
    { label: "Attendees", value: safeStats.totalAttendees ?? 0, icon: Users, color: "text-sky-400" },
    { label: "Rating", value: `${Number(safeStats.rating ?? 0).toFixed(1)} / 5.0`, icon: Star, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-white sm:text-2xl">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}