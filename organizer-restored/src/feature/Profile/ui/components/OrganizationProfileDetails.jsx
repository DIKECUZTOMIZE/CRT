import React from "react";
import { Building2, ExternalLink } from "lucide-react";

export default function OrganizationProfileDetails({ organization }) {
  const bio = organization?.bio?.trim() || "No organization description added yet.";
  const type = organization?.type?.trim() || "Not added yet";
  const website = organization?.website?.trim();
  const address = organization?.address?.trim() || "Not added yet";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 space-y-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
        <Building2 className="h-4 w-4 text-white" /> Organization Details
      </h3>

      <div className="space-y-3 text-xs text-white/80">
        <p className="leading-relaxed text-white/60">{bio}</p>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black p-3">
            <span className="text-[11px] text-white/50">Industry / Type</span>
            <p className="mt-0.5 font-semibold text-white">{type}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-3">
            <span className="text-[11px] text-white/50">Official Website</span>
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 flex items-center gap-1 font-semibold text-white hover:underline"
              >
                {website} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="mt-0.5 font-semibold text-white/60">Not added yet</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <span className="text-[11px] text-white/50">Official Address</span>
          <p className="mt-0.5 font-semibold text-white">{address}</p>
        </div>
      </div>
    </div>
  );
}