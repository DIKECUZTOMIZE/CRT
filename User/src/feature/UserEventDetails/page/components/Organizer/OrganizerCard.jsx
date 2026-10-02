import React from "react";
import { ShieldCheck, Mail, ExternalLink } from "lucide-react";

export const OrganizerCard = ({ organizer }) => {
  if (!organizer) return null;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_10px_26px_rgba(15,118,110,0.05)] backdrop-blur-xl">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-600">
        Organized By
      </h3>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-[#F8FBF9] text-lg font-bold text-slate-900">
          {organizer.name?.charAt(0)?.toUpperCase() || "O"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-bold text-slate-900">{organizer.name}</h4>
            {organizer.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
          </div>
          {organizer.tagline && (
            <p className="truncate text-[11px] text-slate-600">{organizer.tagline}</p>
          )}
        </div>
      </div>
    </div>
  );
};