import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  ShieldAlert,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Tag,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function EventRules() {
  const { register, watch, control, setValue } = useFormContext();

  const {
    fields: ruleFields,
    append: appendRule,
    remove: removeRule,
  } = useFieldArray({
    control,
    name: "eventRules",
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const watchedRules = watch("eventRules");

  // Default fallback rules
  const defaultRules = [
    {
      type: "General",
      text: "Participants must present valid ID proof at the venue.",
    },
    {
      type: "Disqualification",
      text: "Plagiarism or unauthorized pre-built projects may result in disqualification.",
    },
    {
      type: "Refund",
      text: "Registration fees are non-refundable unless otherwise stated.",
    },
    {
      type: "Conduct",
      text: "Participants must follow the organizer's event rules.",
    },
  ];

  const displayRules = ruleFields.length > 0 ? ruleFields : defaultRules;
  const activeRulesCount = displayRules.length;

  const standardCategories = [
    "General",
    "Eligibility",
    "Disqualification",
    "Refund",
    "Conduct",
  ];

  return (
    <FormSection
      icon={ShieldAlert}
      title="Rules & Regulations"
      description="Specify strict policies, code of conduct, and eligibility guidelines."
    >
      <div className="space-y-4">
        {/* Accordion Toggle Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-lg py-1 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus:outline-none"
          >
            <span className="truncate pr-2">
              {`${activeRulesCount} Rule${activeRulesCount > 1 ? "s" : ""} configured for this event`}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4 transition-all">
            {/* Action Bar Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-slate-700">
                  Event Rules List
                </span>
                <p className="text-[10px] text-slate-400">
                  Add clear terms that attendees must follow during registration.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  appendRule({
                    type: "General",
                    text: "",
                  })
                }
                className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            {/* Empty State Fallback */}
            {ruleFields.length === 0 && (
              <div className="mb-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-4 text-center">
                <AlertCircle className="mx-auto mb-1.5 h-5 w-5 text-slate-400" />
                <p className="text-xs font-medium text-slate-600">
                  Showing default rules preset
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Click "Add Rule" to start customizing your own regulations.
                </p>
              </div>
            )}

            {/* Horizontal Card Slider Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-emerald-200 md:grid md:grid-cols-2 md:overflow-visible">
              {displayRules.map((rule, index) => {
                const ruleText = typeof rule === "string" ? rule : rule.text;
                const ruleType =
                  watchedRules?.[index]?.type ?? rule.type ?? "General";

                const isCustomCategory =
                  ruleType === "Custom" ||
                  (!standardCategories.includes(ruleType) &&
                    ruleType !== undefined);

                return (
                  <div
                    key={rule.id || index}
                    className="w-[85vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md md:w-auto md:max-w-none"
                  >
                    {/* Card Header */}
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[10px] font-bold text-slate-700">
                          Rule #{index + 1}
                        </span>
                      </div>

                      {ruleFields.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Remove rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Card Body Inputs */}
                    <div className="space-y-3">
                      {/* Category Tag Dropdown */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Category Tag
                        </label>
                        <select
                          value={isCustomCategory ? "Custom" : ruleType}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Custom") {
                              setValue(`eventRules.${index}.type`, "", {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            } else {
                              setValue(`eventRules.${index}.type`, val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }
                          }}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="General">General Rule</option>
                          <option value="Eligibility">Eligibility / ID</option>
                          <option value="Disqualification">
                            Disqualification
                          </option>
                          <option value="Refund">Refund & Fee</option>
                          <option value="Conduct">Code of Conduct</option>
                          <option
                            value="Custom"
                            className="font-semibold text-emerald-700"
                          >
                            🏷️ + Custom Tag...
                          </option>
                        </select>

                        {/* Custom Tag Input */}
                        {isCustomCategory && (
                          <div className="relative mt-2">
                            <Tag className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-600" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type custom tag name..."
                              {...register(`eventRules.${index}.type`, {
                                required: "Category tag is required",
                              })}
                              className="h-8 w-full rounded-xl border border-emerald-300 bg-emerald-50/30 pl-8 pr-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Rule Description Field */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Rule Description
                        </label>
                        <textarea
                          rows={2}
                          defaultValue={ruleText}
                          placeholder="e.g. Participants must carry a college ID card."
                          {...register(`eventRules.${index}.text`, {
                            required: "Rule description is required",
                          })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}