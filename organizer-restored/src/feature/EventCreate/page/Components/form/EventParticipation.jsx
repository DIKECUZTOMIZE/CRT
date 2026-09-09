import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Users, User, UserCheck, ChevronDown, ChevronUp } from "lucide-react";
import FormSection from "../common/FormSection";
import FormField from "../common/FormField";

export default function EventParticipation() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  // State for Accordion Toggle
  const [isExpanded, setIsExpanded] = useState(true);

  const hasParticipationType = watch("hasParticipationType");
  const participationMode = watch("participationMode");
  const minTeamSize = watch("minTeamSize");
  const maxTeamSize = watch("maxTeamSize");

  // Select blur handler for smooth UX
  const handleSelectChange = (e) => {
    const currentTarget = e.currentTarget;
    setTimeout(() => {
      currentTarget?.blur();
    }, 0);
  };

  const hasPartRegister = register("hasParticipationType");

  // Helper to get quick summary text when collapsed
  const getSummaryText = () => {
    if (!participationMode) return "Configure participation rules & team limits";
    if (participationMode === "Solo") return "Format Selected: Solo Only";

    const teamRange =
      minTeamSize && maxTeamSize
        ? ` (${minTeamSize} - ${maxTeamSize} members)`
        : "";
    return `Format Selected: ${participationMode}${teamRange}`;
  };

  return (
    <FormSection
      icon={Users}
      title="Participation Format"
      description="Specify if participants compete individually, in teams, or both."
      action={
        <select
          {...hasPartRegister}
          onChange={(e) => {
            hasPartRegister.onChange(e);
            handleSelectChange(e);
            if (e.target.value === "Yes") setIsExpanded(true);
          }}
          className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="No">No (Default / Open)</option>
          <option value="Yes">Yes (Configure Rules)</option>
        </select>
      }
    >
      {hasParticipationType === "Yes" && (
        <div className="space-y-4 sm:space-y-5">
          {/* Clickable Header Bar (Open / Close Toggle) */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-between rounded-lg py-1 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus:outline-none"
            >
              <span className="truncate pr-2">{getSummaryText()}</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              )}
            </button>
          </div>

          {/* Collapsible Content Section */}
          {isExpanded && (
            <div className="space-y-4 sm:space-y-5 transition-all">
              {/* Radio Grid */}
              <div>
                <label className="mb-2.5 block text-xs font-semibold text-slate-700">
                  Allowed Format <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Solo */}
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-all hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-700">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Solo Only
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Individual entries
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      value="Solo"
                      {...register("participationMode", {
                        required: "Please select a format",
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  {/* Team */}
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-all hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-700">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Team / Group
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Group entries
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      value="Team"
                      {...register("participationMode", {
                        required: "Please select a format",
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  {/* Both */}
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-all hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-700">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Both Allowed
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Solo or Team
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      value="Both"
                      {...register("participationMode", {
                        required: "Please select a format",
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                {errors.participationMode && (
                  <p className="mt-1 text-xs text-rose-500">
                    {errors.participationMode.message}
                  </p>
                )}
              </div>

              {/* Conditional Team Limits */}
              {/* {(participationMode === "Team" ||
                participationMode === "Both") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="mb-3 text-xs font-semibold text-slate-800">
                    Team Size Configuration
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      label="Min Members per Team"
                      error={errors.minTeamSize?.message}
                    >
                      <input
                        type="number"
                        min="2"
                        placeholder="e.g. 2"
                        {...register("minTeamSize", {
                          required: "Min size is required",
                          valueAsNumber: true,
                          min: {
                            value: 2,
                            message: "Min size must be at least 2",
                          },
                        })}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                      />
                    </FormField>

                    <FormField
                      label="Max Members per Team"
                      error={errors.maxTeamSize?.message}
                    >
                      <input
                        type="number"
                        min="2"
                        placeholder="e.g. 5"
                        {...register("maxTeamSize", {
                          required: "Max size is required",
                          valueAsNumber: true,
                          validate: (val) =>
                            !minTeamSize ||
                            val >= minTeamSize ||
                            "Max size cannot be less than Min size",
                        })}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                      />
                    </FormField>
                  </div>
                </div>
              )} */}
            </div>
          )}
        </div>
      )}
    </FormSection>
  );
}