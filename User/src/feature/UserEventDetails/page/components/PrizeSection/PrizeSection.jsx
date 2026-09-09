/* eslint-disable react-hooks/rules-of-hooks */
 
import {
  Trophy,
  Award,
  Star,
  Users,
  User,
  Baby,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "../../../utils/eventDetailsUtils";
import { useEffect, useState } from "react";

const getCategoryRank = (categoryName = "") => {
  const name = String(categoryName).toLowerCase();

  if (name.includes("solo") || name.includes("individual") || name.includes("single")) {
    return 0;
  }

  if (name.includes("team") || name.includes("group") || name.includes("duo")) {
    return 1;
  }

  if (name.includes("kid") || name.includes("junior") || name.includes("child")) {
    return 2;
  }

  return 3;
};

const getCategoryGroupOrder = (categoryName = "") => {
  const name = String(categoryName).toLowerCase();

  if (name.includes("solo") || name.includes("individual") || name.includes("single")) {
    return 0;
  }

  if (name.includes("team") || name.includes("group") || name.includes("duo")) {
    return 1;
  }

  return 2;
};

const getCategoryGroup = (categoryName = "") => {
  const name = String(categoryName).toLowerCase();

  if (name.includes("solo") || name.includes("individual") || name.includes("single")) {
    return "solo";
  }

  if (name.includes("team") || name.includes("group") || name.includes("duo")) {
    return "team";
  }

  return "other";
};

const formatOrdinalLabel = (value) => {
  const n = Number(value) || 1;
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${n}${suffix}`;
};

const getPrizeTitle = (prize = {}, fallback = "Prize") => {
  const candidate = [
    prize?.customTitle,
    prize?.title,
    prize?.name,
    prize?.label,
    prize?.category,
    fallback,
  ].find((value) => String(value || "").trim().length > 0);

  if (!candidate) return fallback;

  const text = String(candidate).trim();
  return text === "Prize" ? fallback : text;
};

const getPrizeRankLabel = (prize = {}, index = 0) => {
  const rawValue = [prize?.rank, prize?.position, prize?.level].find(
    (value) => String(value || "").trim().length > 0,
  );

  if (!rawValue) {
    return formatOrdinalLabel(index + 1);
  }

  const text = String(rawValue).trim();
  const normalized = text
    .replace(/(st|nd|rd|th)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/^\d+$/.test(normalized)) {
    const number = Number(normalized);
    const suffixes = ["th", "st", "nd", "rd"];
    const v = number % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    return `${number}${suffix}`;
  }

  return text;
};

const getDynamicCategoryTitle = (category = {}) => {
  const prizes = Array.isArray(category.prizes) ? category.prizes : [];
  const directTitle = String(category.category || "").trim();
  const customFromPrize = prizes.find((prize) => {
    const value = [prize?.customTitle, prize?.title, prize?.name, prize?.label].find(
      (item) => String(item || "").trim().length > 0,
    );
    return Boolean(value);
  });

  const customName = customFromPrize
    ? [customFromPrize.customTitle, customFromPrize.title, customFromPrize.name, customFromPrize.label].find(
        (item) => String(item || "").trim().length > 0,
      )
    : "";

  if (directTitle.toLowerCase().includes("solo") || directTitle.toLowerCase().includes("individual") || directTitle.toLowerCase().includes("single")) {
    return "Solo Prize";
  }

  if (directTitle.toLowerCase().includes("team") || directTitle.toLowerCase().includes("group") || directTitle.toLowerCase().includes("duo")) {
    return "Team Prize";
  }

  if (customName) {
    return customName;
  }

  if (directTitle) {
    return directTitle;
  }

  return "Custom Prize";
};

const mergePrizeCategories = (categories = []) => {
  const normalized = categories.map((category, index) => {
    const dynamicTitle = getDynamicCategoryTitle(category);
    const groupName = getCategoryGroup(category.category);

    return {
      ...category,
      id: category.id || `category-${index}`,
      category: dynamicTitle,
      description:
        category.description ||
        (groupName === "solo"
          ? "Solo category prizes"
          : groupName === "team"
            ? "Team category prizes"
            : dynamicTitle),
      isSoloOnly: groupName === "solo",
    };
  });

  return normalized.sort((a, b) => {
    const groupDifference = getCategoryGroupOrder(a.category) - getCategoryGroupOrder(b.category);
    if (groupDifference !== 0) return groupDifference;
    return getCategoryRank(a.category) - getCategoryRank(b.category);
  });
};

export const PrizeSection = ({ prizes = [] }) => {
  if (!Array.isArray(prizes) || prizes.length === 0) {
    return null;
  }

  const validCategories = prizes.filter(
    (category) =>
      category && Array.isArray(category.prizes) && category.prizes.length > 0,
  );

  if (validCategories.length === 0) {
    return null;
  }

  const mergedCategories = mergePrizeCategories(validCategories);

  const sortedCategories = [...mergedCategories].sort((a, b) => {
    const groupDifference =
      getCategoryGroupOrder(a.category) - getCategoryGroupOrder(b.category);

    if (groupDifference !== 0) {
      return groupDifference;
    }

    return getCategoryRank(a.category) - getCategoryRank(b.category);
  });

  const getPreferredTab = () => {
    const soloIndex = sortedCategories.findIndex((category) => {
      const name = String(category.category || "").toLowerCase();
      return (
        name.includes("solo") ||
        name.includes("individual") ||
        name.includes("single")
      );
    });

    return soloIndex >= 0 ? soloIndex : 0;
  };

  const [activeTab, setActiveTab] = useState(getPreferredTab);

  useEffect(() => {
    if (activeTab >= sortedCategories.length) {
      setActiveTab(0);
    }
  }, [activeTab, sortedCategories.length]);

  // Dynamic ranking theme styles
  const getPrizeCardStyle = (rank, index) => {
    const rankLower = String(rank || "").toLowerCase();

    if (
      rankLower.includes("1st") ||
      rankLower.includes("first") ||
      rankLower.includes("winner") ||
      index === 0
    ) {
      return {
        cardStyle:
          "border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-amber-950/15 to-slate-950 shadow-sm shadow-amber-500/5 hover:border-amber-400/80",
        badgeStyle: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        iconColor: "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]",
        amountColor: "text-amber-200",
      };
    }

    if (
      rankLower.includes("2nd") ||
      rankLower.includes("second") ||
      rankLower.includes("runner") ||
      index === 1
    ) {
      return {
        cardStyle:
          "border-slate-400/35 bg-gradient-to-b from-slate-400/10 via-slate-900/20 to-slate-950 hover:border-slate-300/80",
        badgeStyle: "bg-slate-400/20 text-slate-200 border-slate-400/30",
        iconColor: "text-slate-300",
        amountColor: "text-slate-100",
      };
    }

    if (
      rankLower.includes("3rd") ||
      rankLower.includes("third") ||
      index === 2
    ) {
      return {
        cardStyle:
          "border-amber-700/35 bg-gradient-to-b from-amber-800/10 via-slate-900/20 to-slate-950 hover:border-amber-600/60",
        badgeStyle: "bg-amber-800/20 text-amber-200 border-amber-700/30",
        iconColor: "text-amber-600",
        amountColor: "text-amber-100/90",
      };
    }

    return {
      cardStyle:
        "border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950",
      badgeStyle: "bg-slate-800/80 text-slate-300 border-slate-700/50",
      iconColor: "text-emerald-400",
      amountColor: "text-slate-200",
    };
  };

  // Dynamic Icon Mapping
  const getCategoryIcon = (categoryName, isSoloOnly) => {
    if (isSoloOnly) return User;
    const name = String(categoryName || "").toLowerCase();

    if (
      name.includes("kid") ||
      name.includes("child") ||
      name.includes("junior")
    )
      return Baby;
    if (
      name.includes("solo") ||
      name.includes("individual") ||
      name.includes("single")
    )
      return User;
    if (
      name.includes("team") ||
      name.includes("group") ||
      name.includes("squad") ||
      name.includes("duo")
    )
      return Users;
    return Trophy;
  };

  // Calculate overall pool amount across custom organizer categories
  const totalPrizeAmount = validCategories.reduce((sum, cat) => {
    const catTotal = cat.prizes.reduce((acc, p) => {
      const val =
        typeof p.amount === "number" ? p.amount : parseFloat(p.amount) || 0;
      return acc + val;
    }, 0);
    return sum + catTotal;
  }, 0);

  return (
    <section className="relative overflow-hidden space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/90 p-3 shadow-xl backdrop-blur-xl sm:p-4">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 sm:text-xs">
            Prizes & Rewards
          </h3>
        </div>

        {totalPrizeAmount > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5">
            <Sparkles className="h-2.5 w-2.5 text-amber-400" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-amber-300 sm:text-[10px]">
              Pool:{" "}
              {formatCurrency(
                totalPrizeAmount,
                validCategories[0]?.prizes[0]?.currency || "INR",
              )}
            </span>
          </div>
        )}
      </div>

      {/* DYNAMIC CATEGORY SLIDER / TABS */}
      {sortedCategories.length > 1 && (
        <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {sortedCategories.map((category, idx) => {
            const CategoryIcon = getCategoryIcon(
              category.category,
              category.isSoloOnly,
            );
            const isActive = idx === activeTab;
            const categoryType = getCategoryGroupOrder(category.category);

            const label =
              categoryType === 0
                ? "Solo"
                : categoryType === 1
                  ? "Team"
                  : category.category || `Category ${idx + 1}`;

            return (
              <button
                key={category.id || idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex shrink-0 snap-start items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all duration-150 ${
                  isActive
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-sm"
                    : "border-slate-800/80 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <CategoryIcon className="h-3 w-3" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="space-y-4">
        {sortedCategories.map((category, categoryIndex) => {
          if (sortedCategories.length > 1 && categoryIndex !== activeTab) {
            return null;
          }

          const CategoryIcon = getCategoryIcon(
            category.category,
            category.isSoloOnly,
          );

          return (
            <div key={category.id || categoryIndex} className="space-y-2">
              {/* CATEGORY INFO HEADER */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <CategoryIcon className="h-3 w-3" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-200 sm:text-xs truncate">
                      {getDynamicCategoryTitle(category)}
                    </h4>
                    {category.description && (
                      <p className="truncate text-[9px] font-medium text-slate-400">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* SOLO OR CUSTOM TYPE BADGE */}
                {category.isSoloOnly && (
                  <span className="shrink-0 rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-sky-300">
                    Solo Only
                  </span>
                )}
              </div>

              {/* COMPACT PRIZE CARDS GRID */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {category.prizes.map((prize, prizeIndex) => {
                  const style = getPrizeCardStyle(prize.rank, prizeIndex);

                  const amountFormatted =
                    typeof prize.amount === "number"
                      ? formatCurrency(prize.amount, prize.currency || "INR")
                      : prize.amount || "N/A";

                  const rankText = getPrizeRankLabel(prize, prizeIndex);
                  const rankLower = String(rankText || "").toLowerCase();
                  const isTopThree =
                    rankLower.includes("1st") ||
                    rankLower.includes("2nd") ||
                    rankLower.includes("3rd") ||
                    prizeIndex < 3;

                  const prizeTitle = getPrizeTitle(prize, `Prize ${prizeIndex + 1}`);

                  // Detect 18+ restriction dynamically from prize data
                  const is18Plus =
                    prize.is18Plus === true ||
                    prize.ageLimit === "18+" ||
                    prize.minAge >= 18 ||
                    String(prize.note || "").includes("18+") ||
                    String(prize.perks || "").includes("18+");

                  const perksList = Array.isArray(prize.perks)
                    ? prize.perks
                    : typeof prize.perks === "string"
                      ? prize.perks.split(/,|\n/).filter(Boolean)
                      : [];

                  return (
                    <div
                      key={prize.id || prizeIndex}
                      className={`relative flex flex-col justify-between overflow-hidden rounded-lg border p-2.5 transition-all duration-200 ${style.cardStyle}`}
                    >
                      {/* CARD TOP ROW */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${style.badgeStyle}`}
                          >
                            {rankText}
                          </span>

                          {/* DYNAMIC 18+ BADGE */}
                          {is18Plus && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase text-rose-300">
                              <ShieldAlert className="h-2.5 w-2.5 text-rose-400" />
                              18+
                            </span>
                          )}
                        </div>

                        {isTopThree ? (
                          <Trophy
                            className={`h-3.5 w-3.5 shrink-0 ${style.iconColor}`}
                          />
                        ) : (
                          <Award
                            className={`h-3.5 w-3.5 shrink-0 ${style.iconColor}`}
                          />
                        )}
                      </div>

                      {/* AMOUNT DISPLAY */}
                      <div className="my-1.5 space-y-0.5">
                        <p
                          className={`text-base font-black tracking-tight ${style.amountColor} sm:text-lg`}
                        >
                          {amountFormatted}
                        </p>

                        {prizeTitle && prizeTitle !== "Prize" && (
                          <p className="text-[9px] font-medium leading-tight text-slate-300">
                            {prizeTitle}
                          </p>
                        )}

                        {prize.note && (
                          <p className="text-[9px] font-medium leading-tight text-slate-400">
                            {prize.note}
                          </p>
                        )}
                      </div>

                      {/* PERKS / INCENTIVES */}
                      {perksList.length > 0 && (
                        <div className="mt-1 space-y-1 border-t border-slate-800/80 pt-1.5">
                          <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500">
                            Perks
                          </p>
                          <ul className="space-y-0.5">
                            {perksList.map((perk, pIdx) => (
                              <li
                                key={pIdx}
                                className="flex items-start gap-1 text-[9px] leading-tight text-slate-300"
                              >
                                <Star className="mt-0.5 h-2 w-2 shrink-0 text-emerald-400" />
                                <span className="line-clamp-1">
                                  {perk.trim()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PrizeSection;
