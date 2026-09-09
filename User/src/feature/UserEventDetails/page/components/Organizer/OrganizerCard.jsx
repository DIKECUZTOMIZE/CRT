import React from "react";
import { ShieldCheck, Mail, ExternalLink } from "lucide-react";

export const OrganizerCard = ({ organizer }) => {
  if (!organizer) return null;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-xl backdrop-blur-xl">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        Organized By
      </h3>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-lg font-bold text-slate-200">
          {organizer.name?.charAt(0)?.toUpperCase() || "O"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-bold text-white">{organizer.name}</h4>
            {organizer.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />}
          </div>
          {organizer.tagline && (
            <p className="truncate text-[11px] text-slate-400">{organizer.tagline}</p>
          )}
        </div>
      </div>
    </div>
  );
};