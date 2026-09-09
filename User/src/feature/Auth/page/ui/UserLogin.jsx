import { Link } from "react-router";

import { API_BASE_URL } from "../../../../app/config/axios.js";
import { useLoginPage } from "../../hook/useLoginPage.js";
import AuthCloseButton from "../components/AuthCloseButton.jsx";
import PasswordField from "../components/PasswordField.jsx";

const UserLogin = ({ onClose }) => {
    const {
        error,
        isSubmitting,
        formData,
        updateField,
        handleSubmit,
        showForgotPassword,
        setShowForgotPassword,
        resetEmail,
        setResetEmail,
        registeredEmails,
        isLoadingRegisteredEmails,
        resetOtp,
        setResetOtp,
        resetPassword,
        setResetPassword,
        resetConfirmPassword,
        setResetConfirmPassword,
        resetMessage,
        resetStatus,
        isResetSubmitting,
        otpCountdown,
        forgotPasswordRef,
        resetRequestButtonLabel,
        handleForgotPasswordToggle,
        handleRequestOtp,
        handlePasswordReset,
    } = useLoginPage({
        redirectPath: "/profile",
        allowedRoles: ["USER"],
        requireResetPasswordConfirmation: true,
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_35%),linear-gradient(135deg,#020817_0%,#0f172a_35%,#111827_100%)] px-4 py-10">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[32px] border border-slate-800/80 bg-slate-900/70 shadow-[0_30px_80px_rgba(2,6,23,0.8)] backdrop-blur-md">
                <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="hidden bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                                CRT
                            </div>
                            <h2 className="mt-8 text-4xl font-black leading-tight text-white">Find your next event, create your next memory.</h2>
                            <p className="mt-4 max-w-md text-base text-slate-300">Explore curated experiences, connect with like-minded people, and participate in competitions designed to inspire and engage.</p>
                        </div>

                        <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                                <div className="text-2xl font-bold text-emerald-400">120+</div>
                                <div className="mt-1 text-slate-300">Events</div>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                                <div className="text-2xl font-bold text-emerald-400">24K</div>
                                <div className="mt-1 text-slate-300">Users</div>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                                <div className="text-2xl font-bold text-emerald-400">4.9</div>
                                <div className="mt-1 text-slate-300">Rating</div>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="relative max-h-[90vh] overflow-y-auto overscroll-contain scroll-smooth space-y-5 bg-slate-900/80 p-6 pr-2 sm:p-8 sm:pr-3 lg:p-10 lg:pr-4"
                    >
                        <AuthCloseButton onClose={onClose} />
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Account access</p>
                            <h1 className="mt-3 text-3xl font-black text-white">Welcome back</h1>
                            <p className="mt-2 text-sm text-slate-400">Login to join events and competitions.</p>
                        </div>

                        <label className="block text-sm font-medium text-slate-300">
                            Email
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={updateField}
                                autoComplete="email"
                                placeholder="name@example.com"
                                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </label>

                        <PasswordField
                            label="Password"
                            name="password"
                            value={formData.password}
                            onChange={updateField}
                            minLength={8}
                            autoComplete="current-password"
                            className="bg-slate-950/70"
                        />

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
                            <div ref={forgotPasswordRef} className="space-y-4 rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-emerald-300">Reset password</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        className="text-xs font-medium text-slate-400 hover:text-white"
                                    >
                                        Close
                                    </button>
                                </div>

                                {registeredEmails.length > 0 ? (
                                    <label className="block text-sm font-medium text-slate-300">
                                        Select email
                                        <select
                                            value={resetEmail || formData.email || ""}
                                            onChange={(event) => setResetEmail(event.target.value)}
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-slate-100 outline-none transition focus:border-emerald-500"
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
                                            value={resetEmail || formData.email}
                                            onChange={(event) => setResetEmail(event.target.value)}
                                            placeholder="name@example.com"
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-500"
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
                                                placeholder="123456"
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-500"
                                            />
                                        </label>

                                        <PasswordField
                                            label="New password"
                                            name="newPassword"
                                            value={resetPassword}
                                            onChange={(event) => setResetPassword(event.target.value)}
                                            minLength={8}
                                            autoComplete="new-password"
                                            className="bg-slate-950/70"
                                        />

                                        <PasswordField
                                            label="Confirm password"
                                            name="confirmPassword"
                                            value={resetConfirmPassword}
                                            onChange={(event) => setResetConfirmPassword(event.target.value)}
                                            minLength={8}
                                            autoComplete="new-password"
                                            className="bg-slate-950/70"
                                        />
                                    </>
                                )}

                                {resetStatus === "otp-sent" && !otpCountdown.isExpired && (
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
                                        {isResetSubmitting ? "Please wait..." : resetRequestButtonLabel}
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
                            disabled={isSubmitting}
                            className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-60"
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </button>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-slate-900/80 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = `${API_BASE_URL}/api/auth/google/login`;
                            }}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.3 14.7 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.5-.2-2.2H12z" />
                                <path fill="#34A853" d="M3.7 7.2l3.4 2.5c.9-1.7 2.8-2.9 4.9-2.9 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.3 14.7 2.4 12 2.4 8.1 2.4 4.7 4.9 3.7 7.2z" />
                                <path fill="#FBBC05" d="M3.7 16.1c1 2.3 3.2 4.1 8.3 4.1 2.5 0 4.6-.9 6.1-2.5l-2.9-2.3c-.9.6-2.1 1.1-3.2 1.1-2.4 0-4.5-1.6-5.1-3.8l-3.2 2.4z" />
                                <path fill="#4285F4" d="M12 20.8c2.7 0 4.9-.9 6.6-2.4l-3.1-2.4c-.8.5-1.9.9-3.5.9-2.8 0-5.2-1.9-5.9-4.4l-3.2 2.5c1.5 3.4 4.9 5.8 9.1 5.8z" />
                            </svg>
                            Continue with Google
                        </button>

                        <p className="text-center text-sm text-slate-400">
                            New user? <Link to="/register" className="font-semibold text-emerald-400 transition hover:text-emerald-300">Create account</Link>
                        </p>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default UserLogin;
