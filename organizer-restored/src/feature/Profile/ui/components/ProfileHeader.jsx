import React from "react";
import { CheckCircle2, Building2, Mail, Edit3, UserCircle2 } from "lucide-react";

export default function ProfileHeader({ personal, organization, onEditClick }) {
  const name = personal?.fullName?.trim() || "";
  const role = personal?.role?.trim() || "";
  const orgName = organization?.name?.trim() || "";
  const email = personal?.email?.trim() || "";
  const avatarSrc = personal?.avatar?.trim() || "";
  const initials = (name || orgName || role || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] sm:p-6">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onEditClick}
            className="relative rounded-2xl p-0 ring-0 outline-none transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Edit profile image"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={name || "Organizer profile"}
                className="h-20 w-20 rounded-2xl border-2 border-white/20 object-cover shadow-md sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/20 bg-slate-800 text-white shadow-md sm:h-24 sm:w-24">
                <UserCircle2 className="h-11 w-11 text-slate-300 sm:h-12 sm:w-12" />
              </div>
            )}
            {personal?.isVerified && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-black p-1 text-emerald-400 shadow-md ring-2 ring-white/10">
                <CheckCircle2 className="h-5 w-5 fill-emerald-500/20 text-emerald-400" />
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
            <p className="text-xs font-medium text-white/60">{role}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-white/60">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-white/80" /> {orgName}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-white/60" /> {email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <button
            type="button"
            onClick={() => onEditClick?.()}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all hover:bg-zinc-200 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/80"
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