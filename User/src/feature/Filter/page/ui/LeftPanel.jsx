import React, { useState, useRef, useEffect } from "react";
import {
  X,
  RotateCcw,
  Search,
  UserRound,
  ChevronDown,
  Check,
  Filter,
} from "lucide-react";

import { DateFilter } from "../components/DateFilter/DateFilter";
import { EntryFeeFilter } from "../components/EntryFeeFilter/EntryFeeFilter";

const AGE_GROUPS = [
  { id: "kids", label: "Kids" },
  { id: "teens", label: "Teens" },
  { id: "adult", label: "Adults 18+" },
  { id: "all_ages", label: "All Ages" },
];

const PARTICIPATION_TYPES = [
  { id: "solo", label: "Solo (Individual)" },
  { id: "group", label: "Group / Team" },
];

const Dropdown = ({ name, label, value, isOpen, onToggle, children }) => {
  return (
    <div className="relative w-full">
      <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </label>

      <button
        type="button"
        onClick={() => onToggle(name)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-slate-950/80 px-3 text-left text-[12px] sm:text-xs text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 touch-manipulation active:scale-[0.99] ${
          isOpen
            ? "border-emerald-500/60 shadow-lg shadow-emerald-950/20"
            : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-950"
        }`}
      >
        <span className="truncate font-medium">{value}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      )}
    </div>
  );
};

export const LeftPanel = ({
  filters = {},
  onFilterChange,
  onReset,
  categories = [],
  stateOptions = [],
  cityOptions = [],
  ageGroupOptions = [],
  isOpen = false,
  onClose,
  className = "",
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const panelRef = useRef(null);
  const locationSearchDebounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (locationSearchDebounceRef.current) {
        clearTimeout(locationSearchDebounceRef.current);
      }
    };
  }, []);

  const displayCategories = categories || [];
  const derivedStateOptions = stateOptions?.length ? stateOptions : [];
  const derivedCityOptions = cityOptions?.length ? cityOptions : [];

  const safeFilters = {
    search: "",
    organizer: "",
    country: "India",
    state: "",
    city: "",
    location: "",
    participationType: "",
    isFreeOnly: false,
    minPrize: 0,
    dateRange: "all",
    ...filters,
    categories: Array.isArray(filters.categories) ? filters.categories : [],
    ageGroups: Array.isArray(filters.ageGroups) ? filters.ageGroups : [],
  };

  const normalizeLocationKey = (value = "") =>
    String(value ?? "")
      .replace(/[()]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const filteredStateOptions = derivedStateOptions.filter((state) => {
    if (!locationSearch.trim()) return true;
    return normalizeLocationKey(state).includes(normalizeLocationKey(locationSearch));
  });
  const filteredCityOptions = derivedCityOptions.filter((city) => {
    if (!locationSearch.trim()) return true;
    return normalizeLocationKey(city).includes(normalizeLocationKey(locationSearch));
  });
  const normalizeOptionKey = (value = "") =>
    String(value ?? "")
      .replace(/[()]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const hasSameOptionValue = (left, right) =>
    normalizeOptionKey(left) === normalizeOptionKey(right);

  const shouldShowLocationSearch =
    derivedStateOptions.length > 0 ||
    derivedCityOptions.length > 0 ||
    !!locationSearch.trim() ||
    !!safeFilters.location;
  const ageChoices = ageGroupOptions?.length
    ? ageGroupOptions.map((value) => ({
        id: String(value),
        label: String(value),
      }))
    : AGE_GROUPS;

  const activeFilterCount =
    (safeFilters.search ? 1 : 0) +
    (safeFilters.organizer ? 1 : 0) +
    (safeFilters.state ? 1 : 0) +
    (safeFilters.city ? 1 : 0) +
    (safeFilters.location ? 1 : 0) +
    (safeFilters.participationType ? 1 : 0) +
    safeFilters.categories.length +
    safeFilters.ageGroups.length +
    (safeFilters.isFreeOnly ? 1 : 0) +
    (safeFilters.minPrize > 0 ? 1 : 0) +
    (safeFilters.dateRange !== "all" ? 1 : 0);

  const update = (changes) => {
    onFilterChange?.({
      ...safeFilters,
      ...changes,
    });
  };

  const toggleDropdown = (name) => {
    setOpenDropdown((current) => (current === name ? null : name));
  };

  const handleLocationSearchChange = (value) => {
    setLocationSearch(value);

    if (locationSearchDebounceRef.current) {
      clearTimeout(locationSearchDebounceRef.current);
    }

    locationSearchDebounceRef.current = setTimeout(() => {
      const trimmed = value.trim();

      if (!trimmed) {
        update({ state: "", city: "", location: "" });
        return;
      }

      const exactState = derivedStateOptions.find(
        (state) => normalizeLocationKey(state) === normalizeLocationKey(trimmed),
      );
      const exactCity = derivedCityOptions.find(
        (city) => normalizeLocationKey(city) === normalizeLocationKey(trimmed),
      );

      if (exactState) {
        update({ state: exactState, city: "", location: trimmed });
        return;
      }

      if (exactCity) {
        update({ city: exactCity, state: "", location: trimmed });
        return;
      }

      update({ state: "", city: "", location: trimmed });
    }, 250);
  };

  const toggleMultiSelect = (key, value) => {
    const current = Array.isArray(safeFilters[key]) ? safeFilters[key] : [];
    const existingIndex = current.findIndex((item) => hasSameOptionValue(item, value));

    if (existingIndex >= 0) {
      update({
        [key]: current.filter((_, index) => index !== existingIndex),
      });
      return;
    }

    update({
      [key]: [...current, value],
    });
  };

  const getCategoryLabel = () => {
    if (!safeFilters.categories.length) return "All Categories";
    if (safeFilters.categories.length === 1) {
      const selectedId = safeFilters.categories[0];
      const selected = displayCategories.find((item) => {
        const candidateId = typeof item === "object" ? (item.id ?? item.value) : item;
        return hasSameOptionValue(candidateId, selectedId);
      });
      if (!selected) return "1 selected";
      return typeof selected === "object"
        ? selected.label || selected.name || selected.title || "1 selected"
        : selected;
    }
    return `${safeFilters.categories.length} selected`;
  };

  const getAgeGroupLabel = () => {
    if (!safeFilters.ageGroups.length) return "All Age Groups";
    if (safeFilters.ageGroups.length === 1) {
      return (
        ageChoices.find((item) => hasSameOptionValue(item.id, safeFilters.ageGroups[0]))
          ?.label || "1 selected"
      );
    }
    return `${safeFilters.ageGroups.length} selected`;
  };

  const getParticipationLabel = () => {
    if (!safeFilters.participationType) return "All (Solo & Group)";
    return (
      PARTICIPATION_TYPES.find(
        (item) => item.id === safeFilters.participationType,
      )?.label || "All Types"
    );
  };

  const content = (
    <div
      ref={panelRef}
      className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 sm:p-4"
    >
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide text-white uppercase">
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeFilterCount} active
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="group flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-[10px] font-semibold text-slate-400 transition-all hover:border-slate-700 hover:text-emerald-400"
            >
              <RotateCcw className="h-3 w-3 transition-transform duration-300 group-hover:-rotate-90" />
              Reset
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white sm:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3.5">
        {/* SEARCH & ORGANIZER */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Search
          </label>

          <div className="group relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
            <input
              type="text"
              value={safeFilters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search competitions..."
              className="h-11 w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 pl-9 text-[12px] sm:text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/60 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="group relative">
            <UserRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
            <input
              type="text"
              value={safeFilters.organizer}
              onChange={(e) => update({ organizer: e.target.value })}
              placeholder="Search organizer..."
              className="h-11 w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 pl-9 text-[12px] sm:text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/60 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="h-px bg-slate-800/60" />

        {/* PARTICIPATION TYPE */}
        <Dropdown
          name="participationType"
          label="Participation Type"
          value={getParticipationLabel()}
          isOpen={openDropdown === "participationType"}
          onToggle={toggleDropdown}
        >
          <button
            type="button"
            onClick={() => {
              update({ participationType: "" });
              setOpenDropdown(null);
            }}
            className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
          >
            All (Solo & Group)
          </button>

          {PARTICIPATION_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                update({ participationType: type.id });
                setOpenDropdown(null);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                safeFilters.participationType === type.id
                  ? "bg-emerald-500/10 font-semibold text-emerald-400"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span>{type.label}</span>
              {safeFilters.participationType === type.id && (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </button>
          ))}
        </Dropdown>

        <div className="h-px bg-slate-800/60" />

        {/* LOCATION */}
        <div className="space-y-3">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Location
          </label>

          <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2">
            <span className="text-[11px] font-medium text-slate-400">
              Country
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="text-sm">🇮🇳</span> India
            </span>
          </div>

          {shouldShowLocationSearch && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Search location
                </span>
                {(safeFilters.state || safeFilters.city || safeFilters.location) && (
                  <button
                    type="button"
                    onClick={() => {
                      update({ state: "", city: "", location: "" });
                      setLocationSearch("");
                    }}
                    className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-2">
                <div className="group relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(event) => handleLocationSearchChange(event.target.value)}
                    placeholder="Search state or city..."
                    className="h-11 w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 pl-9 text-[12px] sm:text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/60 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          <Dropdown
            name="state"
            label="State"
            value={safeFilters.state || "All States"}
            isOpen={openDropdown === "state"}
            onToggle={toggleDropdown}
          >
            <button
              type="button"
              onClick={() => {
                update({ state: "", city: "", location: "" });
                setOpenDropdown(null);
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white touch-manipulation active:bg-slate-800"
            >
              All States
            </button>

            {filteredStateOptions.length > 0 ? (
              filteredStateOptions.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => {
                    update({ state });
                    setOpenDropdown(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium transition-colors touch-manipulation active:bg-slate-800 ${
                    normalizeLocationKey(safeFilters.state) === normalizeLocationKey(state)
                      ? "bg-emerald-500/10 font-semibold text-emerald-400"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span>{state}</span>
                  {safeFilters.state === state && (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-2.5 py-2 text-[11px] text-slate-400">
                No matching states found
              </div>
            )}
          </Dropdown>

          <Dropdown
            name="city"
            label="City"
            value={safeFilters.city || "All Cities"}
            isOpen={openDropdown === "city"}
            onToggle={toggleDropdown}
          >
            <button
              type="button"
              onClick={() => {
                update({ city: "", state: "", location: "" });
                setOpenDropdown(null);
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white touch-manipulation active:bg-slate-800"
            >
              All Cities
            </button>

            {filteredCityOptions.length > 0 ? (
              filteredCityOptions.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    update({ city });
                    setOpenDropdown(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium transition-colors touch-manipulation active:bg-slate-800 ${
                    normalizeLocationKey(safeFilters.city) === normalizeLocationKey(city)
                      ? "bg-emerald-500/10 font-semibold text-emerald-400"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span>{city}</span>
                  {safeFilters.city === city && (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-2.5 py-2 text-[11px] text-slate-400">
                No matching cities found
              </div>
            )}
          </Dropdown>
        </div>

        <div className="h-px bg-slate-800/60" />

        {/* CATEGORY MULTI SELECT */}
        <Dropdown
          name="category"
          label="Category"
          value={getCategoryLabel()}
          isOpen={openDropdown === "category"}
          onToggle={toggleDropdown}
        >
          <button
            type="button"
            onClick={() => update({ categories: [] })}
            className="mb-1 w-full rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white touch-manipulation active:bg-slate-800"
          >
            Clear Categories
          </button>

          {displayCategories.map((category) => {
            const id =
              typeof category === "object"
                ? (category.id ?? category.value)
                : category;
            const label =
              typeof category === "object"
                ? (category.label ?? category.name ?? category.title ?? id)
                : category;
            const selected = safeFilters.categories.some((item) => hasSameOptionValue(item, id));

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleMultiSelect("categories", id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium transition-colors touch-manipulation active:bg-slate-800 ${
                  selected
                    ? "bg-emerald-500/10 font-semibold text-emerald-400"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span>{label}</span>
                {selected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </Dropdown>

        <div className="h-px bg-slate-800/60" />

        {/* AGE GROUP MULTI SELECT */}
        <Dropdown
          name="ageGroup"
          label="Age Group"
          value={getAgeGroupLabel()}
          isOpen={openDropdown === "ageGroup"}
          onToggle={toggleDropdown}
        >
          <button
            type="button"
            onClick={() => update({ ageGroups: [] })}
            className="mb-1 w-full rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white touch-manipulation active:bg-slate-800"
          >
            Clear Age Groups
          </button>

          {ageChoices.map((age) => {
            const id = age.id ?? age.value ?? age.label;
            const label = age.label ?? age.name ?? age.title ?? id;
            const selected = safeFilters.ageGroups.some((item) => hasSameOptionValue(item, id));

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleMultiSelect("ageGroups", id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[12px] sm:text-xs font-medium transition-colors touch-manipulation active:bg-slate-800 ${
                  selected
                    ? "bg-emerald-500/10 font-semibold text-emerald-400"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span>{label}</span>
                {selected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </Dropdown>

        <div className="h-px bg-slate-800/60" />

        {/* ENTRY FEE FILTER */}
        <EntryFeeFilter
          isFreeOnly={safeFilters.isFreeOnly}
          minPrize={safeFilters.minPrize}
          onFreeOnlyChange={(isFreeOnly) => update({ isFreeOnly })}
          onMinPrizeChange={(minPrize) => update({ minPrize })}
        />

        <div className="h-px bg-slate-800/60" />

        {/* DATE / TIMELINE FILTER */}
        <DateFilter
          selectedRange={safeFilters.dateRange}
          onChange={(dateRange) => update({ dateRange })}
        />
      </div>
    </div>
  );

  // MOBILE DRAWER WRAPPER (FIXED SCREEN OVERLAY)
  if (isOpen) {
    return (
      <div className="fixed inset-0 z-[9999] sm:hidden">
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full items-center justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <div className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-slate-800/80 bg-slate-950 shadow-[0_-10px_40px_rgba(0,0,0,0.45)]">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                  <Filter className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[9px] font-semibold text-emerald-400">{activeFilterCount} active</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 pb-4 touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {content}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/90 px-3 py-3">
              <button
                type="button"
                onClick={() => {
                  onReset?.();
                  onClose?.();
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-sm font-bold text-slate-950 shadow-[0_10px_22px_rgba(16,185,129,0.25)] transition hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP PANEL (NON-MOBILE)
  return <div className={`w-full ${className}`}>{content}</div>;
};

export default LeftPanel;
