import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Trophy,
  Users,
  Flame,
  X,
  ChevronDown,
} from "lucide-react";

export const CompetitionHeader = ({
  onSearchChange,
  onFilterChange,
  onSortChange,
  onHostClick,
  totalCompetitions = 42,
  totalPrizePool = "$150,000+",
}) => {
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState("all"); // all, online, in-person
  const [sortBy, setSortBy] = useState("trending"); // trending, prize-high, ending-soon, newest
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearchChange && onSearchChange(value);
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    onFilterChange && onFilterChange({ mode });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    onSortChange && onSortChange(value);
  };

  return (
    <div className="w-full bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-2xl p-4 sm:p-6 backdrop-blur-xl mb-6 shadow-2xl">
      {/* Top Banner: Title + Stats + Host CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Flame className="w-3 h-3 text-emerald-400" /> Live
          </span>
        </div>

        {/* Stats & Host Button */}
        <div className="flex items-center gap-3 self-start lg:self-center flex-wrap sm:flex-nowrap">
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 leading-none">
                  Total Prize
                </p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {totalPrizePool}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 leading-none">
                  Active
                </p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {totalCompetitions} Events
                </p>
              </div>
            </div>
          </div>

          {/* Host Competition CTA Button */}
          <button
            onClick={onHostClick}
            className="h-10 px-4 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Host Competition</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Search + Filter Badges + Sort Dropdown */}
      <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, tags, or organizers..."
            className="w-full h-10 pl-10 pr-9 bg-slate-900/90 text-xs text-white placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                onSearchChange && onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Sorting Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Location Mode Pills */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            {[
              { id: "all", label: "All Modes" },
              { id: "online", label: "Online" },
              { id: "in-person", label: "In-Person" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedMode === mode.id
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="relative min-w-[130px]">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full h-10 px-3 pr-8 bg-slate-900/90 text-xs text-slate-300 font-semibold rounded-xl border border-slate-800 appearance-none focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="trending">🔥 Trending</option>
              <option value="prize-high">💰 Highest Prize</option>
              <option value="ending-soon">⏰ Ending Soon</option>
              <option value="newest">✨ Recently Added</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile Extra Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden h-10 px-3 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-xl flex items-center gap-1.5 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompetitionHeader;
