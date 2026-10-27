import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Users, User, UserCheck } from "lucide-react";
import FormSection from "../common/FormSection";

export default function EventParticipation() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // State for Accordion Toggle
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <FormSection
      icon={Users}
      title="Participation Format"
      description="Specify if participants compete individually, in teams, or both."
      onToggle={() => setIsExpanded(!isExpanded)}
      isExpanded={isExpanded}
      toggleLabel={isExpanded ? "Collapse participation format" : "Expand participation format"}
    >
      {isExpanded && (
        <div className="space-y-4 sm:space-y-5 transition-all">
          <div>
            <label className="mb-2.5 block text-xs font-semibold text-slate-700">
              Allowed Format <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        </div>
      )}
    </FormSection>
  );
}