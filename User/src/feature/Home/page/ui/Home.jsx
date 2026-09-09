import React from "react";

import UserLogin from "../../../Auth/page/ui/UserLogin";
import UserRegister from "../../../Auth/page/ui/UserRegister";

import Hero from "../../page/components/Hero/Hero";
import RecentEvents from "../../page/components/CompetitionSection/RecentEvents";
import NearbyEvents from "../../page/components/CompetitionSection/NearbyEvents";
import BudgetFriendly from "../../page/components/CompetitionSection/BudgetFriendly";
import PopularEvents from "../../page/components/CompetitionSection/PopularEvents";
import HighBudget from "../../page/components/CompetitionSection/HighBudget";

import { useHomePage } from "../../hook/useHomePage.js";

const sectionMap = {
  popularCompetitions: PopularEvents,
  recentCompetitions: RecentEvents,
  nearbyCompetitions: NearbyEvents,
  budgetFriendlyCompetitions: BudgetFriendly,
  highBudgetCompetitions: HighBudget,
};

export const Home = ({ initialLoginOpen = false, initialRegisterOpen = false }) => {
  const {
    authUser,
    isAuthModalOpen,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activeQuickFilter,
    setActiveQuickFilter,
    homeSlides,
    homeSections,
    visibleHomeSections,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    savedIds,
    handleToggleSave,
    closeAuthModal,
  } = useHomePage({ initialLoginOpen, initialRegisterOpen });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!authUser && isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm">
          <div className="h-full w-full overflow-y-auto">
            {initialRegisterOpen ? (
              <UserRegister onClose={closeAuthModal} />
            ) : (
              <UserLogin onClose={closeAuthModal} />
            )}
          </div>
        </div>
      )}

      <Hero
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeQuickFilter}
        onFilterChange={setActiveQuickFilter}
        slides={homeSlides}
      />

      <main className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {visibleHomeSections.map(({ key }) => {
              const SectionComponent = sectionMap[key];

              if (!SectionComponent || !homeSections[key]?.length) {
                return null;
              }

              return (
                <section key={key}>
                  <SectionComponent
                    competitions={homeSections[key]}
                    category={selectedCategory}
                    search={searchQuery}
                    filter={activeQuickFilter}
                    savedIds={savedIds}
                    onToggleSave={handleToggleSave}
                  />
                </section>
              );
            })}

            {!visibleHomeSections.length && !isLoading && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-10 text-center text-sm text-slate-400">
                No events match your search or filter. Try a different keyword or reset the filter.
              </div>
            )}

            {hasNextPage && (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                {isFetchingNextPage ? "Loading more events..." : "Scroll for more events"}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;