import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { loginUser } from "../feature/Auth/state/auth.slice.js";
import { isOrganizerRole } from "../app/utils/roleUtils.js";
import { getRegisteredEmails, requestPasswordReset, resetPasswordWithOtp } from "../feature/Auth/api/auth.api.js";
import { getOtpCountdown } from "../shared/utils/passwordResetTimer.js";

const OrganizerLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [registeredEmails, setRegisteredEmails] = useState([]);
  const [isLoadingRegisteredEmails, setIsLoadingRegisteredEmails] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetStatus, setResetStatus] = useState("idle");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const lastRequestedResetEmailRef = useRef("");

  const otpCountdown = useMemo(() => {
    if (!otpExpiresAt) return { isExpired: false, text: "05:00" };
    return getOtpCountdown(otpExpiresAt);
  }, [otpExpiresAt]);

  useEffect(() => {
    if (!otpExpiresAt || resetStatus !== "otp-sent") return undefined;

    const timer = setInterval(() => {
      const next = getOtpCountdown(otpExpiresAt);
      if (next.isExpired) {
        setResetStatus("expired");
        setResetMessage("OTP expired. Please resend OTP to continue.");
        setResetOtp("");
        setResetPassword("");
        setResetConfirmPassword("");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiresAt, resetStatus]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) {
      setError("");
    }
    toast.dismiss();
  };

  const handleMobileFieldFocus = (event) => {
    if (typeof window === "undefined" || window.innerWidth >= 768) {
      return;
    }

    const element = event?.target;
    if (!element) {
      return;
    }

    setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 150);
  };

  const loadRegisteredEmails = async () => {
    if (registeredEmails.length > 0) {
      return;
    }

    try {
      setIsLoadingRegisteredEmails(true);
      const response = await getRegisteredEmails();
      const emails = Array.isArray(response?.emails) ? response.emails : [];
      setRegisteredEmails(emails);

      if (emails.length > 0 && !resetEmail) {
        setResetEmail(form.email || emails[0]);
      }
    } catch {
      setRegisteredEmails([]);
    } finally {
      setIsLoadingRegisteredEmails(false);
    }
  };

  const handleForgotPasswordToggle = async () => {
    const next = !showForgotPassword;
    setShowForgotPassword(next);
    setResetMessage("");
    setResetOtp("");
    setResetPassword("");
    setResetConfirmPassword("");
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setResetStatus("idle");
    setOtpExpiresAt(null);
    setResetEmail(form.email || "");
    lastRequestedResetEmailRef.current = "";

    if (next) {
      await loadRegisteredEmails();
    }
  };

  const handleRequestOtp = async () => {
    const email = (resetEmail || form.email || "").trim().toLowerCase();

    if (!email) {
      setResetMessage("Please select your registered email first.");
      return;
    }

    try {
      setIsResetSubmitting(true);
      setResetMessage("Sending OTP to your selected email...");

      const response = await requestPasswordReset({ email });
      lastRequestedResetEmailRef.current = email;
      setResetStatus("otp-sent");
      setOtpExpiresAt(Number(response?.expiresAt ?? Date.now() + 5 * 60 * 1000));

      setResetMessage("OTP sent to your email. Check your inbox and spam folder, then enter the code below.");
    } catch (requestError) {
      setResetStatus("idle");
      setResetMessage(requestError?.message || "Unable to send reset OTP.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = (resetEmail || form.email || "").trim().toLowerCase();
    const otp = String(resetOtp || "").trim();
    const password = String(resetPassword || "").trim();
    const confirmPassword = String(resetConfirmPassword || "").trim();

    if (!email || !otp || !password || !confirmPassword) {
      setResetMessage("Enter your email, OTP, new password, and confirm password to continue.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setResetMessage("OTP must be a 6-digit number.");
      return;
    }

    if (password.length < 8) {
      setResetMessage("New password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setResetMessage("New password and confirm password do not match.");
      return;
    }

    if (otpExpiresAt && getOtpCountdown(otpExpiresAt).isExpired) {
      setResetStatus("expired");
      setResetMessage("OTP expired. Please resend OTP and try again.");
      return;
    }

    try {
      setIsResetSubmitting(true);
      setResetMessage("");

      const response = await resetPasswordWithOtp({
        email,
        otp,
        newPassword: password,
      });

      setResetStatus("done");
      setResetMessage(response?.message || "Password reset successfully. Please log in again.");
      setResetOtp("");
      setResetPassword("");
      setResetConfirmPassword("");
      setOtpExpiresAt(null);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStatus("idle");
        setResetMessage("");
        window.location.href = "/organizer/login";
      }, 1500);
    } catch (requestError) {
      setResetStatus("otp-sent");
      setResetMessage(requestError?.message || "Password reset failed. Please try again.");
    } finally {
      setIsResetSubmitting(false);
    }
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
      const user = await dispatch(loginUser(form)).unwrap();

      if (!user || !isOrganizerRole(user.role)) {
        throw new Error("This account does not have organizer access");
      }

      toast.success("Organizer login successful");
      navigate("/organizer/dashboard", { replace: true });
    } catch (err) {
      const message = err?.message || "Invalid organizer credentials";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,#020817_0%,#0f172a_30%,#111827_100%)] px-4 py-6 sm:py-10">
      <div className="w-full max-w-5xl rounded-[32px] border border-slate-800/80 bg-slate-900/75 shadow-[0_30px_80px_rgba(2,6,23,0.8)] backdrop-blur-md">
        <div className="grid min-h-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
                CRT Organizer
              </div>
              <h2 className="mt-8 text-4xl font-black leading-tight text-white">Manage events with clarity and confidence.</h2>
              <p className="mt-4 max-w-md text-base text-slate-300">Track registrations, schedule sessions, and keep your community engaged with a professional organizer dashboard experience.</p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="text-2xl font-bold text-emerald-400">1K+</div>
                <div className="mt-1 text-slate-300">Attendees</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="text-2xl font-bold text-emerald-400">40+</div>
                <div className="mt-1 text-slate-300">Programs</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="text-2xl font-bold text-emerald-400">99%</div>
                <div className="mt-1 text-slate-300">Satisfaction</div>
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
              <h1 className="text-3xl font-black tracking-tight text-white">Organizer Login</h1>
              <p className="mt-2 text-sm text-slate-400">Manage your events and community</p>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-5 pr-2 lg:max-h-[75vh] lg:overflow-y-auto lg:overscroll-contain lg:scroll-smooth scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-emerald-500/40">
              <label className="block text-sm font-medium text-slate-300">
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={handleMobileFieldFocus}
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
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
                    onFocus={handleMobileFieldFocus}
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 pr-11 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="••••••••"
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

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleForgotPasswordToggle}
                  className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                >
                  Forgot password?
                </button>
              </div>

              {showForgotPassword && (
                <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-300">Reset password</p>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-xs font-medium text-slate-300 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  {registeredEmails.length > 0 ? (
                    <label className="block text-sm font-medium text-slate-300">
                      Select email
                      <select
                        value={resetEmail || form.email || ""}
                        onChange={(event) => setResetEmail(event.target.value)}
                        onFocus={handleMobileFieldFocus}
                        className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-white outline-none transition focus:border-emerald-500"
                      >
                        <option value="">Choose a registered email</option>
                        {registeredEmails.map((email) => (
                          <option key={email} value={email}>{email}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="block text-sm font-medium text-slate-300">
                      Email
                      <input
                        type="email"
                        value={resetEmail || form.email}
                        onChange={(event) => setResetEmail(event.target.value)}
                        onFocus={handleMobileFieldFocus}
                        placeholder="you@example.com"
                        className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-white outline-none transition focus:border-emerald-500"
                      />
                    </label>
                  )}

                  {isLoadingRegisteredEmails && (
                    <p className="text-xs text-slate-400">Loading emails...</p>
                  )}

                  {resetStatus !== "done" && (
                    <>
                      <label className="block text-sm font-medium text-slate-300">
                        OTP
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={resetOtp}
                          onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                          onFocus={handleMobileFieldFocus}
                          placeholder="123456"
                          className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-white outline-none transition focus:border-emerald-500"
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-300">
                        New password
                        <div className="relative mt-2">
                          <input
                            type={showResetPassword ? "text" : "password"}
                            value={resetPassword}
                            onChange={(event) => setResetPassword(event.target.value)}
                            onFocus={handleMobileFieldFocus}
                            minLength={8}
                            autoComplete="new-password"
                            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 pr-11 text-white outline-none transition focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-emerald-400"
                            aria-label={showResetPassword ? "Hide new password" : "Show new password"}
                          >
                            {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </label>

                      <label className="block text-sm font-medium text-slate-300">
                        Confirm password
                        <div className="relative mt-2">
                          <input
                            type={showResetConfirmPassword ? "text" : "password"}
                            value={resetConfirmPassword}
                            onChange={(event) => setResetConfirmPassword(event.target.value)}
                            onFocus={handleMobileFieldFocus}
                            minLength={8}
                            autoComplete="new-password"
                            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 pr-11 text-white outline-none transition focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-emerald-400"
                            aria-label={showResetConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          >
                            {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </label>
                    </>
                  )}

                  {resetStatus === "otp-sent" && otpExpiresAt && !getOtpCountdown(otpExpiresAt).isExpired && (
                    <p className="text-xs font-medium text-emerald-300">OTP expires in {otpCountdown.text}</p>
                  )}

                  {resetMessage && (
                    <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                      {resetMessage}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isResetSubmitting}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-60"
                    >
                      {isResetSubmitting ? "Please wait..." : resetStatus === "otp-sent" || resetStatus === "expired" ? "Resend OTP" : "Send OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isResetSubmitting || resetStatus === "idle"}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-60"
                    >
                      {isResetSubmitting ? "Updating..." : "Set new password"}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              New organizer? {' '}
              <Link to="/organizer/register" className="font-semibold text-emerald-400 transition hover:text-emerald-300">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrganizerLogin;
