import { Trophy, Medal, Sparkles } from "lucide-react";
import DetailAccordion from "../../../../shared/components/ui/DetailAccordion";

const normalizeWinnerCategory = (value = "") => {
  const raw = String(value ?? "").trim();

  if (!raw) return "Solo";

  const normalized = raw.toLowerCase();

  if (["solo", "individual", "single", "player"].includes(normalized)) {
    return "Solo";
  }

  if (["group", "team", "squad", "duo", "pair", "crew"].includes(normalized)) {
    return "Group";
  }

  if (["column", "columns", "division", "category"].includes(normalized)) {
    return "Column";
  }

  return raw;
};

export const ResultsSection = ({ results = [] }) => {
  const safeResults = Array.isArray(results) ? results : [];

  const groupedResults = safeResults.reduce((acc, item, index) => {
    const participationType = item?.participationType || item?.participation || item?.type || "Solo";
    const category = normalizeWinnerCategory(participationType);
    const position = item?.position || `#${index + 1}`;
    const winnerName = item?.winnerName || item?.name || "Winner";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push({
      position,
      winnerName,
      label: category,
    });

    return acc;
  }, {});

  const categoryOrder = ["Solo", "Group", "Column"];
  const visibleSections = categoryOrder
    .filter((category) => groupedResults[category]?.length)
    .map((category) => ({
      label: category,
      items: groupedResults[category],
    }));

  const otherCategories = Object.keys(groupedResults)
    .filter((category) => !categoryOrder.includes(category))
    .map((category) => ({
      label: category,
      items: groupedResults[category],
    }));

  const sections = [...visibleSections, ...otherCategories];
  const hasResults = sections.length > 0;

  return (
    <DetailAccordion
      title="Winner"
      icon={Trophy}
      initialOpen={false}
      viewLabel="View details"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_12px_28px_rgba(15,118,110,0.06)] sm:p-4">
        {hasResults ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Winner</p>
                  <h3 className="text-lg font-semibold text-slate-900">Winner Announcement</h3>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  {sections.reduce((sum, section) => sum + section.items.length, 0)} Winners
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.label} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      {section.label}
                    </span>
                  </div>

                  <div
                    className={
                      section.label === "Column"
                        ? "grid gap-2 sm:grid-cols-2"
                        : "space-y-2"
                    }
                  >
                    {section.items.map((item, index) => (
                      <div
                        key={`${section.label}-${item.position}-${item.winnerName}-${index}`}
                        className="rounded-xl border border-emerald-100 bg-[#F8FBF9] p-3 shadow-[0_6px_18px_rgba(15,118,110,0.03)] transition-all duration-200 hover:border-emerald-200 hover:bg-[#ECFDF5]"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                            <Medal className="h-3.5 w-3.5" />
                            {item.position}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            {section.label}
                          </span>
                        </div>

                        <p className="text-base font-bold text-slate-900 sm:text-lg">
                          {item.winnerName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Winner</p>
                <h3 className="text-lg font-semibold text-slate-900">Not Announced Yet</h3>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-emerald-200 bg-[#F8FBF9] p-4 text-center">
              <p className="text-sm font-medium text-slate-700">
                Winner results will be published here after announcement.
              </p>
            </div>
          </>
        )}
      </div>
    </DetailAccordion>
  );
};

export default ResultsSection;
