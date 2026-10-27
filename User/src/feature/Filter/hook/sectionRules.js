import { byNearbyPriority, byNewestFirst, byPopularity } from "../../Home/hook/useHomePage.js";
import { getHomeBudgetSections, matchesHomeQuickFilter } from "../../Home/utils/homeSectionUtils.js";

// Applies Home's section rules to raw events. Unknown keys return the input unchanged.
export const applySectionRule = (events, sectionKey, { city = "", state = "", quickFilters = [] } = {}) => {
  const source = Array.isArray(events) ? events : [];
  const list = quickFilters.length
    ? source.filter((event) => matchesHomeQuickFilter(event, quickFilters))
    : source;

  switch (sectionKey) {
    case "popularCompetitions":
      return [...list].sort(byPopularity);
    case "recentCompetitions":
      return [...list].sort(byNewestFirst);
    case "nearbyCompetitions":
      return [...list].sort((a, b) => byNearbyPriority(a, b, city, state));
    case "budgetFriendlyCompetitions":
      return getHomeBudgetSections(list).budgetFriendlyCompetitions;
    case "highBudgetCompetitions":
      return getHomeBudgetSections(list).highBudgetCompetitions;
    default:
      return list;
  }
};
