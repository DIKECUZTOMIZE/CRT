import React from "react";
import { CheckCircle2, Building2, Mail, Edit3, User, UserCircle2 } from "lucide-react";

import { hasRoleAccess, normalizeRole } from "../../../../app/utils/roleUtils.js";

export default function ProfileHeader({ personal, organization, onEditClick }) {
  const name = personal?.fullName?.trim() || "";
  const roleSource = { role: personal?.role, roles: personal?.roles };
  const roleForDisplay = hasRoleAccess(roleSource, "ORGANIZER")
    ? "ORGANIZER"
    : hasRoleAccess(roleSource, "USER")
      ? "USER"
      : normalizeRole(roleSource.role || roleSource.roles?.[0] || "USER");
  const displayRole = roleForDisplay;
  const orgName = organization?.name?.trim() || "";
  const email = personal?.email?.trim() || "";
  const avatarSrc = personal?.avatar?.trim() || "";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onEditClick}
            className="relative rounded-2xl p-0 ring-0 outline-none transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
            aria-label="Edit profile image"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={name || "Organizer profile"}
                className="h-16 w-16 rounded-xl border border-slate-700 object-cover shadow-sm sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-100 shadow-sm sm:h-20 sm:w-20">
                <UserCircle2 className="h-8 w-8 text-slate-300 sm:h-10 sm:w-10" />
              </div>
            )}
            {personal?.isVerified && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-[#020617] p-1 text-[#34D399] shadow-md ring-2 ring-slate-800">
                <CheckCircle2 className="h-5 w-5 fill-emerald-500/20 text-[#34D399]" />
              </div>
            )}
          </button>

          <div className="space-y-1">
            {/* <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white sm:text-xl">{name}</h2>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-white/80 sm:inline-block">
                PRO ORGANIZER
              </span>
            </div> */}
            <div className="flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
              <User className="h-3.5 w-3.5 text-[#94A3B8]" />
              <span>{displayRole}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#94A3B8]">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-[#94A3B8]" /> {orgName}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#94A3B8]" /> {email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <button
            type="button"
            onClick={() => onEditClick?.()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#10B981] px-3.5 py-2 text-xs font-bold text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.18)] transition-all hover:bg-[#34D399] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
            aria-label="Edit organizer profile"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}