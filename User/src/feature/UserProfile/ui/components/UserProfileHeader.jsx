import React from "react";
import { Mail, ShieldCheck, Pencil } from "lucide-react";

export default function UserProfileHeader({ user, onEdit }) {
  const displayName = user?.raw?.fullName || user?.name || user?.username || "User";
  const avatarUrl = user?.avatar || user?.raw?.avatar || user?.raw?.picture || user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName);

  return (
    <div className="relative max-w-full overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 shadow-xl sm:p-6">
      <div className="pointer-events-none absolute right-0 top-0 z-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative z-10 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 shrink-0 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-md sm:h-24 sm:w-24"
          />

          <div className="min-w-0 space-y-1">
            <h2 className="break-words text-base font-bold text-white sm:text-xl">
              {displayName}
            </h2>
            <div className="flex min-w-0 flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex min-w-0 items-center gap-1 break-all">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="min-w-0 break-all">{user?.email || "No email"}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="break-words">{user?.role || "USER"}</span>
              </span>
            </div>
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="relative z-20 inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950 pointer-events-auto"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}