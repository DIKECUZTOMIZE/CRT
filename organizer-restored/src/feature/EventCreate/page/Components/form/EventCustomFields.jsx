import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { ListPlus, Plus, Trash2, FormInput } from "lucide-react";
import FormSection from "../common/FormSection";
 
export default function EventCustomFields() {
  const { register, control, watch } = useFormContext();

  const {
    fields: customFields,
    append: appendCustomField,
    remove: removeCustomField,
  } = useFieldArray({
    control,
    name: "customFields",
  });

  const hasCustomFields = watch("hasCustomFields");

  return (
    <FormSection
      icon={ListPlus}
      title="Custom Registration Fields"
      description="Collect additional details from participants during registration (e.g. T-Shirt size, GitHub link)."
      action={
        <select
          {...register("hasCustomFields")}
          className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="No">No Custom Fields</option>
          <option value="Yes">Yes (Add Fields)</option>
        </select>
      }
    >
      {hasCustomFields === "Yes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {customFields.length > 0 &&
                `Total Fields: ${customFields.length}`}
            </span>

            <button
              type="button"
              onClick={() =>
                appendCustomField({
                  fieldName: "",
                  fieldType: "text",
                  isRequired: false,
                })
              }
              className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Field</span>
            </button>
          </div>

          {customFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-7 text-center">
              <FormInput className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">
                No custom registration questions added
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Click "Add Field" to ask for T-shirt sizes, Discord usernames,
                or portfolio links.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Field Name */}
                    <input
                      type="text"
                      placeholder="Label (e.g. GitHub Profile)"
                      {...register(`customFields.${index}.fieldName`, {
                        required: "Field name is required",
                      })}
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />

                    {/* Field Type */}
                    <select
                      {...register(`customFields.${index}.fieldType`)}
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="text">Text Input</option>
                      <option value="number">Number</option>
                      <option value="url">URL / Link</option>
                      <option value="dropdown">Dropdown Options</option>
                    </select>

                    {/* Required Checkbox */}
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        {...register(`customFields.${index}.isRequired`)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mandatory Field</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="self-end rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:self-center"
                    title="Delete field"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </FormSection>
  );
}
