import React from "react";
import { Bookmark, Heart, Award, Sparkles } from "lucide-react";

export default function UserStats({ stats }) {
  const statItems = [
    { label: "Saved Events", value: stats.savedEvents, icon: Bookmark, color: "text-emerald-400" },
    { label: "Interested Competitions", value: stats.interestedEvents || 0, icon: Heart, color: "text-rose-400" },
    { label: "Reward Points", value: stats.rewardPoints, icon: Award, color: "text-amber-400" },
    { label: "Activity Score", value: "Level 1", icon: Sparkles, color: "text-sky-400" },
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