import React from "react";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

export default function CreateEventHeader({ onPreview, isEditing = false }) {
  return (
    <div className="space-y-4">
      {/* TOP NAVIGATION & STATUS BAR */}
      <div className="flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm transition-all hover:bg-slate-800/80 hover:text-white active:scale-95 sm:px-3.5 sm:py-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-300 sm:h-4 sm:w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Right Badges & Actions */}
        <div className="flex items-center gap-2">
          {/* Optional Preview Button */}
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm hover:bg-slate-800/80 active:scale-95"
            >
              <Eye className="h-3.5 w-3.5 text-slate-300" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN BANNER CONTAINER */}
      <div className="relative overflow-hidden p-0">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:gap-4">
            {/* Header Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-100 shadow-sm sm:h-13 sm:w-13">
              <Calendar className="h-5 w-5 text-emerald-400 sm:h-6 sm:w-6" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#E2E8F0] sm:text-2xl" aria-label="Create New Event">
                  {isEditing ? "Update Event" : "Create New Event"}
                </h1>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}