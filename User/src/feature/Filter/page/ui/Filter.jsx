import React from "react";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import { useFilterPage } from "../../hook/useFilterPage.js";

export const FilterPage = () => {
  const {
    sectionHeading,
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
    <div className="min-h-screen w-full bg-[#FAFCFA] p-2.5 text-slate-900 sm:p-6 overflow-x-clip">
      <div className="flex w-full min-w-0 gap-4 items-start">
        <aside className="hidden sm:block sm:w-64 lg:w-72 shrink-0 self-stretch">
          <div className="sticky top-16 sm:top-[4.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto">
            <LeftPanel
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              categories={categoryOptions}
              stateOptions={stateOptions}
              cityOptions={cityOptions}
              ageGroupOptions={ageGroupOptions}
            />
          </div>
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
          {sectionHeading && (
            <h1 className="sticky top-[4.05rem] z-30 mb-3 bg-[#FAFCFA] py-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {sectionHeading}
            </h1>
          )}
          <RightPanel
            competitions={events}
            savedIds={savedIds}
            isLoading={isLoading}
            onToggleSave={handleToggleSave}
            onResetFilters={handleResetFilters}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            activeFilterCount={activeFilterCount}
            hideTitle={Boolean(sectionHeading)}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPage;
