import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  UserCheck,
  Plus,
  Trash2,
  HelpCircle,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function EventHowToParticipate() {
  const { register, control } = useFormContext();

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: "participationSteps",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const displaySteps = stepFields;

  const getSummaryText = () => {
    const totalSteps = displaySteps.length;
    return `${totalSteps} Step${totalSteps > 1 ? "s" : ""} required for participation`;
  };

  return (
    <FormSection
      icon={UserCheck}
      title="How To Participate"
      description="Define the participation and registration workflow for attendees."
      onToggle={() => setIsExpanded(!isExpanded)}
      isExpanded={isExpanded}
      toggleLabel={isExpanded ? "Collapse how to participate" : "Expand how to participate"}
    >
      {isExpanded && (
        <div className="space-y-4 transition-all">
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-slate-700">
                Participation Steps Workflow
              </span>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                <span>{getSummaryText()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => appendStep({ title: "", text: "" })}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            Customize the steps participants need to follow.
          </p>

            {/* Empty State */}
            {displaySteps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-7 text-center">
                <HelpCircle className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  No participation steps added
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Click "Add Step" to outline instructions for attendees.
                </p>
              </div>
            ) : (
              /* Horizontal Card Slider Container */
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-emerald-200 md:grid md:grid-cols-2 md:overflow-visible">
                {displaySteps.map((step, index) => {
                  const stepText = typeof step === "string" ? step : step.text;

                  return (
                    <div
                      key={step.id || index}
                      className="w-[85vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md md:w-auto md:max-w-none"
                    >
                      {/* Card Header */}
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 items-center justify-center rounded-full bg-emerald-100 px-2 text-[10px] font-bold text-emerald-800">
                            Step #{index + 1}
                          </span>
                        </div>

                        {stepFields.length > 0 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete step"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Step Title
                        </label>
                        <input
                          type="text"
                          defaultValue={step.title || ""}
                          placeholder={`Enter step ${index + 1} title...`}
                          {...register(`participationSteps.${index}.title`)}
                          className="mb-3 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Step Instructions
                        </label>
                        <textarea
                          rows={3}
                          defaultValue={stepText}
                          placeholder={`Enter step ${index + 1} details...`}
                          {...register(`participationSteps.${index}.text`)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
    </FormSection>
  );
}