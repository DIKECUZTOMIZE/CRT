import React, { forwardRef } from "react";

const FormInput = forwardRef(
  (
    {
      type = "text",
      icon: Icon,
      rightIcon: RightIcon,
      onRightIconClick,
      error,
      className = "",
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        {/* LEFT ICON (Optional) */}
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4 shrink-0" />
          </div>
        )}

        {/* INPUT FIELD */}
        <input
          ref={ref}
          type={type}
          className={`form-input h-10 w-full rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 sm:text-sm ${
            Icon ? "pl-10" : "pl-3.5"
          } ${RightIcon ? "pr-10" : "pr-3.5"} ${
            hasError
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20"
          } disabled:cursor-not-allowed disabled:text-slate-500 ${className}`}
          {...props}
        />

        {/* RIGHT ICON OR INTERACTIVE BUTTON (Optional) */}
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {onRightIconClick ? (
              <button
                type="button"
                onClick={onRightIconClick}
                className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
              >
                <RightIcon className="h-4 w-4 shrink-0" />
              </button>
            ) : (
              <RightIcon className="pointer-events-none h-4 w-4 shrink-0 text-slate-400" />
            )}
          </div>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;