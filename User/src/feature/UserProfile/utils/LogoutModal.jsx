import React from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm, isLoggingOut = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-600 hover:bg-emerald-50 hover:text-slate-900 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Content */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
            Log out from your account?
          </h3>
          <p className="mt-1.5 text-xs text-slate-600">
            Are you sure you want to log out? You will need to enter your credentials again to sign back in.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex w-full items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-emerald-100 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}