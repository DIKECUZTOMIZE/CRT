import React from "react";
import { Save, CheckCircle2, Loader2, X } from "lucide-react";

export default function EventFormActions({ isSubmitting = false }) {
  return (
    <div className="event-form-actions sticky bottom-2 z-30 mx-auto w-full max-w-5xl px-2.5 pb-[env(safe-area-inset-bottom,0px)] sm:bottom-4 sm:px-0">
      <div className="event-form-actions-panel rounded-2xl border border-white/10 bg-[#090909] p-2 shadow-[0_22px_50px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all sm:p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Helper Text (Desktop Only) */}
          <p className="event-form-help hidden text-xs font-medium sm:block">
            All changes are validated before publishing.
          </p>

          {/* Action Buttons Container */}
          <div className="event-form-actions-row flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            {/* Secondary Actions */}
            <div className="event-form-actions-secondary flex items-center gap-1.5 sm:gap-2">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
                className="event-form-secondary-btn flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-zinc-950 px-3 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-950/40 active:scale-95 disabled:opacity-50 sm:h-9 sm:px-4"
              >
                <X className="h-4 w-4 text-emerald-300" />
                <span className="text-[11px] font-semibold sm:text-xs">
                  Cancel
                </span>
              </button>

              {/* Save Draft Button */}
              <button
                type="button"
                disabled={isSubmitting}
                className="event-form-secondary-btn flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-zinc-950 px-3 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-950/40 active:scale-95 disabled:opacity-50 sm:h-9 sm:px-4"
              >
                <Save className="h-4 w-4 text-emerald-300" />
                <span className="text-[11px] font-semibold sm:text-xs">
                  <span className="inline sm:hidden">Draft</span>
                  <span className="hidden sm:inline">Save Draft</span>
                </span>
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="event-form-primary-btn flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 px-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(16,185,129,0.45)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:h-9 sm:w-auto sm:flex-none sm:px-5 sm:font-semibold sm:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-[11px] font-bold sm:text-xs">
                    Publishing...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span className="text-[11px] font-bold sm:text-xs">
                    <span className="inline sm:hidden">Publish</span>
                    <span className="hidden sm:inline">Publish Event</span>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}