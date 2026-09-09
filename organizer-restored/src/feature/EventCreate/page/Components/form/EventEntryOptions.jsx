import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  IndianRupee,
  Plus,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
  Sliders,
} from "lucide-react";
import FormSection from "../common/FormSection";
import FormField from "../common/FormField";

export default function EventEntryOptions() {
  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext();

  const {
    fields: entryFields,
    append: appendEntry,
    remove: removeEntry,
  } = useFieldArray({
    control,
    name: "entries",
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const CATEGORY_OPTIONS = [
    "General / All",
    "Adult (18+)",
    "Child (Below 12)",
    "Student",
    "Senior Citizen",
    "VIP / Premium Pass",
    "Custom",
  ];

  const PARTICIPATION_TYPES = [
    { label: "Solo (Individual)", value: "Solo" },
    { label: "Team / Group", value: "Team" },
    { label: "Both (Solo & Team)", value: "Both" },
  ];

  const QUICK_PRICES = [100, 250, 500, 1000, 2000];

  const handleSelectChange = (e) => {
    const currentTarget = e.currentTarget;
    setTimeout(() => {
      currentTarget?.blur();
    }, 0);
  };

  const handleAddTier = () => {
    appendEntry({
      category: "General / All",
      customName: "",
      participationType: "Solo",
      isPaid: "No",
      price: 0,
    });
    setIsExpanded(true);
  };

  return (
    <FormSection
      icon={IndianRupee}
      title="Entry Options & Pricing"
      description="Configure entry categories, fee structures, and pricing sliders."
    >
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg text-xs font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-emerald-600" />
              {entryFields.length > 0
                ? `Configured Tiers (${entryFields.length})`
                : "Add entry tiers"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleAddTier}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Tier</span>
          </button>
        </div>

        {/* Expandable Section */}
        {isExpanded && (
          <>
            {entryFields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center">
                <Tag className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  No entry categories configured
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Click "Add Tier" to create pricing options.
                </p>
              </div>
            ) : (
              /* Horizontal Card Slider Container */
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-emerald-200 md:grid md:grid-cols-2 md:overflow-visible">
                {entryFields.map((entry, index) => {
                  const selectedCategory = watch(`entries.${index}.category`);
                  const isPaidSelected = watch(`entries.${index}.isPaid`);
                  const currentPrice = watch(`entries.${index}.price`) || 0;

                  const categoryRegister = register(`entries.${index}.category`);
                  const participationRegister = register(
                    `entries.${index}.participationType`,
                    { required: "Select participation format" }
                  );
                  const isPaidRegister = register(`entries.${index}.isPaid`);

                  return (
                    <div
                      key={entry.id}
                      className="w-[85vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md md:w-auto md:max-w-none"
                    >
                      {/* Card Header */}
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 items-center justify-center rounded-full bg-emerald-100 px-2 text-[10px] font-bold text-emerald-800">
                            #{index + 1}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-700">
                            {selectedCategory === "Custom"
                              ? watch(`entries.${index}.customName`) || "Custom Tier"
                              : selectedCategory}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete tier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Controls */}
                      <div className="space-y-3">
                        <FormField
                          label="Audience Category"
                          error={errors.entries?.[index]?.category?.message}
                        >
                          <select
                            {...categoryRegister}
                            onChange={(e) => {
                              categoryRegister.onChange(e);
                              handleSelectChange(e);
                            }}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        {selectedCategory === "Custom" && (
                          <FormField
                            label="Custom Title"
                            error={errors.entries?.[index]?.customName?.message}
                          >
                            <input
                              type="text"
                              placeholder="e.g. VIP Pass"
                              {...register(`entries.${index}.customName`, {
                                required: "Title is required",
                              })}
                              className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </FormField>
                        )}

                        <FormField
                          label="Participation Format"
                          error={errors.entries?.[index]?.participationType?.message}
                        >
                          <select
                            {...participationRegister}
                            onChange={(e) => {
                              participationRegister.onChange(e);
                              handleSelectChange(e);
                            }}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {PARTICIPATION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <FormField label="Entry Type">
                          <select
                            {...isPaidRegister}
                            onChange={(e) => {
                              isPaidRegister.onChange(e);
                              handleSelectChange(e);
                            }}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="No">Free Pass (₹0)</option>
                            <option value="Yes">Paid Pass</option>
                          </select>
                        </FormField>

                        {/* Interactive Range Slider + Price Input */}
                        {isPaidSelected === "Yes" && (
                          <div className="mt-2 space-y-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-emerald-900">
                                Fee Amount
                              </label>
                              <span className="text-xs font-bold text-emerald-700">
                                ₹{currentPrice.toLocaleString()}
                              </span>
                            </div>

                            {/* Range Slider Controls */}
                            <div className="space-y-1">
                              <input
                                type="range"
                                min="50"
                                max="5000"
                                step="50"
                                value={currentPrice}
                                onChange={(e) =>
                                  setValue(
                                    `entries.${index}.price`,
                                    Number(e.target.value)
                                  )
                                }
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-emerald-200 accent-emerald-600 focus:outline-none"
                              />
                              <div className="flex justify-between text-[9px] font-medium text-slate-400">
                                <span>₹50</span>
                                <span>₹5,000</span>
                              </div>
                            </div>

                            {/* Direct Input & Quick Presets */}
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <IndianRupee className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Amount"
                                  {...register(`entries.${index}.price`, {
                                    required: "Price required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Min ₹1" },
                                  })}
                                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            {/* Quick Amount Chips */}
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {QUICK_PRICES.map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() =>
                                    setValue(`entries.${index}.price`, amt)
                                  }
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
                                    currentPrice === amt
                                      ? "bg-emerald-600 text-white"
                                      : "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
                                  }`}
                                >
                                  +₹{amt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </FormSection>
  );
}