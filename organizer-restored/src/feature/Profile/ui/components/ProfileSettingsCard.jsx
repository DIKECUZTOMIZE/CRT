import React from "react";
import { Bell } from "lucide-react";

export default function ProfileSettingsCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
        <Bell className="h-4 w-4" /> Profile Settings
      </h3>
      <p className="mt-3 text-xs text-slate-400">No additional settings are currently enabled.</p>
    </div>
  );
}