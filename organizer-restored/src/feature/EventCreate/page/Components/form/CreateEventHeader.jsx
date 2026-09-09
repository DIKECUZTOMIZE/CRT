import React from "react";
import { ArrowLeft, Calendar, Sparkles, HelpCircle, Eye, Sun, Moon } from "lucide-react";

export default function CreateEventHeader({ onPreview, isEditing = false, isLightMode = false, onToggleMode }) {
  return (
    <div className="space-y-4">
      {/* TOP NAVIGATION & STATUS BAR */}
      <div className="flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-white/5 hover:text-white active:scale-95 sm:px-3.5 sm:py-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white/70 sm:h-4 sm:w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Right Badges & Actions */}
        <div className="flex items-center gap-2">
          {onToggleMode && (
            <button
              type="button"
              onClick={onToggleMode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-white/5 active:scale-95 sm:text-xs"
            >
              {isLightMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <span>{isLightMode ? "Dark mode" : "Light mode"}</span>
            </button>
          )}

          {/* Optional Preview Button */}
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-white/5 active:scale-95"
            >
              <Eye className="h-3.5 w-3.5 text-white/70" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}

          {/* Draft Status Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <Sparkles className="h-3 w-3 text-emerald-400 sm:h-3.5 sm:w-3.5" />
            <span>Draft Mode</span>
          </span>
        </div>
      </div>

      {/* MAIN BANNER CONTAINER */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] sm:p-7">
        {/* Background Decorative Accent */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl sm:h-48 sm:w-48" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:gap-4">
            {/* Header Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white shadow-sm sm:h-13 sm:w-13">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white sm:text-2xl">
                  {isEditing ? "Update Event" : "Create New Event"}
                </h1>
              </div>
              <p className="text-xs text-white/60 sm:text-sm sm:leading-relaxed">
                Set up your competition, hackathon, or workshop details, registration entry options, schedules, and prize pools.
              </p>
            </div>
          </div>

          {/* Quick Guidance Badge */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] font-medium text-white/70 sm:self-center">
            <HelpCircle className="h-3.5 w-3.5 text-white/60 shrink-0" />
            <span>Auto-saves as draft</span>
          </div>
        </div>
      </div>
    </div>
  );
}