import React from "react";
import { Building2, ExternalLink } from "lucide-react";

export default function OrganizationProfileDetails({ organization }) {
  const bio = organization?.bio?.trim() || "No organization description added yet.";
  const type = organization?.type?.trim() || "Not added yet";
  const website = organization?.website?.trim();
  const address = organization?.address?.trim() || "Not added yet";

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5 space-y-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#E2E8F0]">
        <Building2 className="h-4 w-4 text-[#34D399]" /> Organization Details
      </h3>

      <div className="space-y-3 text-xs text-[#CBD5E1]">
        <p className="leading-relaxed text-[#94A3B8]">{bio}</p>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <span className="text-[11px] text-[#94A3B8]">Industry / Type</span>
            <p className="mt-0.5 font-semibold text-[#E2E8F0]">{type}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <span className="text-[11px] text-[#94A3B8]">Official Website</span>
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 flex items-center gap-1 font-semibold text-[#E2E8F0] hover:text-[#34D399] hover:underline"
              >
                {website} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="mt-0.5 font-semibold text-[#94A3B8]">Not added yet</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <span className="text-[11px] text-[#94A3B8]">Official Address</span>
          <p className="mt-0.5 font-semibold text-[#E2E8F0]">{address}</p>
        </div>
      </div>
    </div>
  );
}