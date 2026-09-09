import React, { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  ShieldCheck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Tags,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function EventSecurityRequirements() {
  const { register, watch, control, setValue } = useFormContext();

  const {
    fields: securityFields,
    append: appendRequirement,
    remove: removeRequirement,
  } = useFieldArray({
    control,
    name: "securityRequirements",
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const watchedRequirements = watch("securityRequirements");
  const isEditing = watch("isEditing");
  const hasSavedSecurityRequirements = Array.isArray(watchedRequirements) && watchedRequirements.length > 0;

  useEffect(() => {
    if (!securityFields || securityFields.length > 0 || isEditing) return;

    const defaultRequirements = [
      {
        type: "Noise Control",
        text: "Music and sound levels must remain within the legal venue limits.",
      },
      {
        type: "Police / Authority",
        text: "Required permits and coordination with local authority must be maintained.",
      },
      {
        type: "Safety Compliance",
        text: "Emergency exits, first aid access, and basic safety protocols must be available.",
      },
      {
        type: "Crowd Management",
        text: "Entry, exit, and queue management must be controlled to maintain safe crowd flow.",
      },
    ];

    defaultRequirements.forEach((requirement) => {
      appendRequirement(requirement);
    });
  }, [appendRequirement, securityFields, isEditing]);

  const defaultRequirements = [
    {
      type: "Noise Control",
      text: "Music and sound levels must remain within the legal venue limits.",
    },
    {
      type: "Police / Authority",
      text: "Required permits and coordination with local authority must be maintained.",
    },
    {
      type: "Safety Compliance",
      text: "Emergency exits, first aid access, and basic safety protocols must be available.",
    },
    {
      type: "Crowd Management",
      text: "Entry, exit, and queue management must be controlled to maintain safe crowd flow.",
    },
  ];

  const displayRequirements = securityFields.length > 0 ? securityFields : defaultRequirements;
  const activeRequirementsCount = displayRequirements.length;

  const securityCategories = [
    "Noise Control",
    "Police / Authority",
    "Safety Compliance",
    "Crowd Management",
    "Emergency Response",
    "Parking / Traffic",
    "Other",
  ];

  return (
    <FormSection
      icon={ShieldCheck}
      title="Security & Compliance"
      description="Add event safety, authority, and venue compliance requirements."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-lg py-1 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus:outline-none"
          >
            <span className="truncate pr-2">
              {`${activeRequirementsCount} security requirement${activeRequirementsCount > 1 ? "s" : ""} configured`}
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
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-slate-700">
                  Security Checklist
                </span>
                <p className="text-[10px] text-slate-400">
                  Capture venue, legal, and crowd safety requirements before the event.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  appendRequirement({
                    type: "Other",
                    text: "",
                  })
                }
                className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Requirement</span>
              </button>
            </div>

            {!isEditing && securityFields.length === 0 && (
              <div className="mb-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-4 text-center">
                <AlertTriangle className="mx-auto mb-1.5 h-5 w-5 text-amber-500" />
                <p className="text-xs font-medium text-slate-600">
                  Showing default security requirements
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Click “Add Requirement” to customize safety guidelines for your event.
                </p>
              </div>
            )}

            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-emerald-200 md:grid md:grid-cols-2 md:overflow-visible">
              {displayRequirements.map((item, index) => {
                const itemType = watchedRequirements?.[index]?.type ?? item.type ?? "Other";
                const isCustomCategory =
                  itemType === "Custom" ||
                  (!securityCategories.includes(itemType) && itemType !== undefined);

                return (
                  <div
                    key={item.id || index}
                    className="w-[85vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md md:w-auto md:max-w-none"
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 items-center justify-center rounded-full bg-amber-100 px-2 text-[10px] font-bold text-amber-800">
                          #{index + 1}
                        </span>
                      </div>

                      {securityFields.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Remove requirement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Requirement Type
                        </label>
                        <select
                          value={isCustomCategory ? "Custom" : itemType}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Custom") {
                              setValue(`securityRequirements.${index}.type`, "", {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            } else {
                              setValue(`securityRequirements.${index}.type`, val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }
                          }}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {securityCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          <option value="Custom">+ Custom Type...</option>
                        </select>

                        {isCustomCategory && (
                          <div className="relative mt-2">
                            <Tags className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-600" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type custom requirement"
                              {...register(`securityRequirements.${index}.type`)}
                              className="h-8 w-full rounded-xl border border-emerald-300 bg-emerald-50/30 pl-8 pr-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Details / Requirement
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Describe the safety, permit, or compliance requirement."
                          {...register(`securityRequirements.${index}.text`)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
