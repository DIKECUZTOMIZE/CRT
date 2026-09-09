import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { registerOrganizerAccount } from "../feature/Auth/state/auth.slice.js";

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) {
      setError("");
    }
    toast.dismiss();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    toast.dismiss();
    setLoading(true);

    try {
      const user = await dispatch(registerOrganizerAccount(form)).unwrap();

      if (!user) {
        throw new Error("Organizer registration failed");
      }

      toast.success("Organizer account created successfully");
      navigate("/organizer/dashboard", { replace: true });
    } catch (err) {
      const message = err?.message || "Organizer registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,#020817_0%,#0f172a_30%,#111827_100%)] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-800/80 bg-slate-900/75 shadow-[0_30px_80px_rgba(2,6,23,0.8)] backdrop-blur-md">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
                Join as Organizer
              </div>
              <h2 className="mt-8 text-4xl font-black leading-tight text-white">Launch your events with a polished brand presence.</h2>
              <p className="mt-4 max-w-md text-base text-slate-300">Build a trusted organizer identity, manage experiences, and reach the right audience with a seamless event workflow.</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200">
                <div className="font-semibold text-emerald-300">Brand ready</div>
                <div className="mt-2 text-slate-400">Showcase your event identity with a professional profile.</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200">
                <div className="font-semibold text-emerald-300">Growth tools</div>
                <div className="mt-2 text-slate-400">Use analytics and community engagement features to scale faster.</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <div className="mb-6">
              <h1 className="text-3xl font-black tracking-tight text-white">Create Organizer Account</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-medium text-slate-300">
                Username
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Password
                <div className="relative mt-2">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={12}
                    title="Use at least 12 characters including uppercase, lowercase, number, and a special character"
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 pr-11 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-emerald-400"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <p className="text-xs text-slate-400">Use 12+ characters with uppercase, lowercase, numbers, and a special symbol.</p>

              {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account? {' '}
              <Link to="/organizer/login" className="font-semibold text-emerald-400 transition hover:text-emerald-300">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrganizerRegister;
