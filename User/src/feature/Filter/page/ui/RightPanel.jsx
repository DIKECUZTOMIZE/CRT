import React, {
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router";
import {
  SearchX,
  Sparkles,
  RotateCcw,
  Filter,
} from "lucide-react";
import CompetitionCard from "../../../../shared/components/competition/CompetitionCard/CompetitionCard";

export const RightPanel = ({
  competitions = [],
  savedIds = [],
  isLoading = false,
  onToggleSave,
  onCompetitionClick,
  onResetFilters,
  onOpenMobileFilter,
  activeFilterCount = 0,
  className = "",
}) => {
  const navigate = useNavigate();

  const displayCompetitions = competitions || [];

  const safeSavedIdsSet = useMemo(() => new Set(savedIds), [savedIds]);

  const handleCompetitionClick = useCallback(
    (item) => {
      if (onCompetitionClick) {
        onCompetitionClick(item);
        return;
      }

      const id = item?.id ?? item?._id;
      if (id) {
        navigate(`/events/${id}`);
      }
    },
    [navigate, onCompetitionClick],
  );

  return (
    <section
      className={`relative z-10 w-full min-w-0 overflow-visible space-y-4 ${className}`}
    >
      {/* HEADER CARD */}
      <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-xl ring-1 ring-white/5">
        {/* ROW 1: TITLE & BADGE */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm sm:text-base font-bold tracking-wide text-white">
            Competitions
          </h2>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-400">
            <Sparkles className="h-3 w-3" />
            {displayCompetitions.length}{" "}
            {displayCompetitions.length === 1 ? "Result" : "Results"}
          </span>
        </div>

        {/* SUBTITLE */}
        <p className="mt-1 text-[11px] sm:text-xs text-slate-400 leading-normal">
          Discover active challenges, hackathons, and global opportunities
        </p>

        {/* ROW 2: ACTION BUTTONS (MOBILE STACK / FLEX) */}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-800/80">
          {onOpenMobileFilter && (
            <button
              type="button"
              onClick={onOpenMobileFilter}
              className="flex sm:hidden w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2.5 text-xs font-semibold text-emerald-400 active:scale-95 transition-all"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* CARDS GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4"
            >
              <div className="h-28 rounded-xl bg-slate-800/60" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-800/80" />
                <div className="h-3 w-1/2 rounded bg-slate-800/50" />
              </div>
            </div>
          ))}
        </div>
      ) : displayCompetitions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayCompetitions.map((item, index) => {
            const itemId = item?.id ?? item?._id;
            const normalizedItemId = String(itemId ?? "");
            return (
              <CompetitionCard
                key={itemId ?? index}
                item={item}
                isSaved={normalizedItemId ? [...safeSavedIdsSet].some((savedId) => String(savedId) === normalizedItemId) : false}
                onToggleSave={onToggleSave}
                onClick={handleCompetitionClick}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 p-6 text-center">
          <SearchX className="h-6 w-6 text-slate-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-200">
            No competitions found
          </h3>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default RightPanel;
