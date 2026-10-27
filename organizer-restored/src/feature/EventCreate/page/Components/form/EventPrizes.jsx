import React, { useEffect, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Trophy,
  Plus,
  Trash2,
  IndianRupee,
  Gift,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function EventPrizes() {
  const {
    register,
    watch,
    control,
    formState: { errors, submitCount },
  } = useFormContext();

  const {
    fields: prizeFields,
    append: appendPrize,
    remove: removePrize,
  } = useFieldArray({
    control,
    name: "prizes",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (errors.prizes?.some((prize) => prize?.category || prize?.customTitle)) {
      setIsExpanded(true);
    }
  }, [errors.prizes, submitCount]);

  const formatOrdinal = (value) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = value % 100;
    return `${value}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
  };

  return (
    <FormSection
      icon={Trophy}
      title="Prizes & Rewards"
      description="List prize pools, cash rewards, certificates, or goodies."
      onToggle={() => setIsExpanded(!isExpanded)}
      isExpanded={isExpanded}
      toggleLabel={isExpanded ? "Collapse prizes and rewards" : "Expand prizes and rewards"}
    >
      <div className={isExpanded ? "space-y-5 transition-all" : "hidden"}>
          {/* Prize list section */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Prize Positions
              </span>
              <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {prizeFields.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                appendPrize({
                  category: "General / Open Event",
                  amount: "",
                  reward: "",
                })
              }
              className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Prize</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            Add each reward row manually with its own category and position.
          </p>

            {/* Empty State */}
            {prizeFields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-7 text-center">
                <Gift className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  No positions created yet
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Select a category above or click "Add Position" to create prize slots.
                </p>
              </div>
            ) : (
              /* Horizontal Card Slider Container */
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-emerald-200 md:grid md:grid-cols-2 md:overflow-visible">
                {prizeFields.map((prize, index) => {
                  const prizeCategory = watch(`prizes.${index}.category`) || "General / Open Event";
                  const ordinalLabel = formatOrdinal(index + 1);

                  return (
                    <div
                      key={prize.id}
                      className="w-[85vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-amber-300 hover:shadow-md md:w-auto md:max-w-none"
                    >
                      {/* Card Header */}
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 items-center justify-center rounded-full bg-amber-100 px-2 text-[10px] font-bold text-amber-800">
                            {ordinalLabel}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-700">
                            {prizeCategory}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removePrize(index)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete position"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Card Input Controls */}
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500">
                            Prize Category
                          </label>
                          <select
                            {...register(`prizes.${index}.category`, {
                              required: "Category is required",
                            })}
                            defaultValue={prize.category || "General / Open Event"}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="General / Open Event">General / Open Event</option>
                            <option value="Solo Category">Solo Category</option>
                            <option value="Team Category">Team Category</option>
                            <option value="Beginner / Fresher Track">Beginner / Fresher Track</option>
                            <option value="All-Female Team Track">All-Female Team Track</option>
                            <option value="Special Award Category">Special Award Category</option>
                            <option value="Custom Track">Custom Track</option>
                          </select>
                          {errors.prizes?.[index]?.category?.message && (
                            <p className="mt-1 text-[10px] text-rose-500">
                              {errors.prizes[index].category.message}
                            </p>
                          )}
                        </div>

                        {prizeCategory === "Custom Track" && (
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-slate-500">
                              Custom Prize Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Best Product Design"
                              {...register(`prizes.${index}.customTitle`, {
                                required: "Custom prize title is required",
                              })}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                            {errors.prizes?.[index]?.customTitle?.message && (
                              <p className="mt-1 text-[10px] text-rose-500">
                                {errors.prizes[index].customTitle.message}
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500">
                            Prize Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Winner / Runner Up / Best Team"
                            {...register(`prizes.${index}.position`, {
                              required: false,
                            })}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        {/* Cash Amount */}
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500">
                            Cash Prize
                          </label>
                          <div className="relative">
                            <IndianRupee className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              placeholder="Amount (₹)"
                              {...register(`prizes.${index}.amount`, {
                                valueAsNumber: true,
                              })}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-7 pr-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>

                        {/* Additional Rewards / Perks */}
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500">
                            Perks / Goodies
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Trophy + Swag Kits"
                            {...register(`prizes.${index}.reward`)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
    </FormSection>
  );
}