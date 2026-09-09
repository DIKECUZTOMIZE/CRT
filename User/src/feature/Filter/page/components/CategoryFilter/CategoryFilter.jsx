import React, { useMemo, useCallback } from "react";

export const CategoryFilter = ({
  categories = [],
  selectedCategories = [],
  onChange,
  className = "",
}) => {
  // Convert array to Set for O(1) lookups during render
  const selectedSet = useMemo(
    () => new Set(selectedCategories),
    [selectedCategories]
  );

  const toggleCategory = useCallback(
    (id) => {
      if (!onChange) return;
      if (selectedSet.has(id)) {
        onChange(selectedCategories.filter((item) => item !== id));
      } else {
        onChange([...selectedCategories, id]);
      }
    },
    [selectedCategories, selectedSet, onChange]
  );

  const handleClear = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header Label and Clear Action */}
      <div className="flex items-center justify-between">
        <span
          id="category-filter-label"
          className="text-xs font-semibold text-slate-300"
        >
          Category
        </span>

        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded text-[10px] font-medium text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
          >
            Clear ({selectedCategories.length})
          </button>
        )}
      </div>

      {/* Filter Chip Group */}
      <div
        role="group"
        aria-labelledby="category-filter-label"
        className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1 no-scrollbar"
      >
        {categories.map((cat) => {
          const categoryId = cat?.id ?? cat?._id;
          if (categoryId == null) return null;

          const isSelected = selectedSet.has(categoryId);
          const label = cat.label ?? cat.name ?? "Unnamed";

          return (
            <button
              key={categoryId}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleCategory(categoryId)}
              className={`
                rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
                ${
                  isSelected
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/10"
                    : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }
              `}
            >
              {label}
              {cat.count !== undefined && (
                <span
                  className={`ml-1 text-[10px] ${
                    isSelected ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  ({cat.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;