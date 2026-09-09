import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  required = true,
  minLength = 8,
  autoComplete,
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block text-sm text-slate-300">
      {label}
      <div className="relative mt-2">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder="Enter your password"
          className={`h-11 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 pr-11 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 ${className}`}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-emerald-400"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
};

export default PasswordField;
