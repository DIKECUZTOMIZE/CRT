import React from "react";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import { useFilterPage } from "../../hook/useFilterPage.js";

export const FilterPage = () => {
  const {
    filters,
    setFilters,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    events,
    isLoading,
    savedIds,
    categoryOptions,
    stateOptions,
    cityOptions,
    ageGroupOptions,
    activeFilterCount,
    handleToggleSave,
    handleResetFilters,
  } = useFilterPage();

  return (
    <div className="min-h-screen w-full bg-slate-950 p-2.5 sm:p-6 text-slate-100 overflow-x-hidden">
      <div className="flex w-full min-w-0 gap-4 items-start">
        <aside className="hidden sm:block sm:w-64 lg:w-72 shrink-0 sticky top-4">
          <LeftPanel
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            categories={categoryOptions}
            stateOptions={stateOptions}
            cityOptions={cityOptions}
            ageGroupOptions={ageGroupOptions}
          />
        </aside>

        {isMobileFilterOpen && (
          <LeftPanel
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            categories={categoryOptions}
            stateOptions={stateOptions}
            cityOptions={cityOptions}
            ageGroupOptions={ageGroupOptions}
          />
        )}

        <div className="w-full min-w-0 flex-1">
          <RightPanel
            competitions={events}
            savedIds={savedIds}
            isLoading={isLoading}
            onToggleSave={handleToggleSave}
            onResetFilters={handleResetFilters}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPage;
