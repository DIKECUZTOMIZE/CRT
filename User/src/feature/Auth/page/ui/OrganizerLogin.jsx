import { useLoginPage } from "../../hook/useLoginPage.js";
import AuthCloseButton from "../components/AuthCloseButton.jsx";
import PasswordField from "../components/PasswordField.jsx";

const OrganizerLogin = () => {
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
        resetMessage,
        resetStatus,
        isResetSubmitting,
        handleForgotPasswordToggle,
        handleRequestOtp,
        handlePasswordReset,
    } = useLoginPage({
        redirectPath: "https://organizer.crtcompete.com/organizer/dashboard",
        allowedRoles: ["ORGANIZER"],
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            >
                <AuthCloseButton />
                <div>
                    <p className="text-sm font-semibold text-emerald-400">Organizer portal</p>
                    <h1 className="mt-2 text-2xl font-bold text-white">Welcome back</h1>
                    <p className="mt-1 text-sm text-slate-400">Sign in to manage your events.</p>
                </div>

                <label className="block text-sm text-slate-300">
                    Email
                    <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={updateField}
                        autoComplete="email"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none transition focus:border-emerald-500"
                    />
                </label>

                <PasswordField
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={updateField}
                    minLength={8}
                    autoComplete="current-password"
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
                    <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
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
                            <label className="block text-sm text-slate-300">
                                Select or type your registered email
                                <input
                                    type="email"
                                    list="registered-email-options-organizer-user"
                                    value={resetEmail || formData.email || ""}
                                    onChange={(event) => setResetEmail(event.target.value)}
                                    placeholder="Select or type your registered email"
                                    className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none transition focus:border-emerald-500"
                                />
                                <datalist id="registered-email-options-organizer-user">
                                    {registeredEmails.map((email) => (
                                        <option key={email} value={email} />
                                    ))}
                                </datalist>
                            </label>
                        ) : (
                            <label className="block text-sm text-slate-300">
                                Email
                                <input
                                    type="email"
                                    value={resetEmail || formData.email}
                                    onChange={(event) => setResetEmail(event.target.value)}
                                    className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none transition focus:border-emerald-500"
                                />
                            </label>
                        )}

                        {isLoadingRegisteredEmails && (
                            <p className="text-xs text-slate-400">Loading saved emails...</p>
                        )}

                        {resetStatus !== "done" && (
                            <>
                                <label className="block text-sm text-slate-300">
                                    Enter OTP sent to your email
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={resetOtp}
                                        onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                        placeholder="123456"
                                        className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none transition focus:border-emerald-500"
                                    />
                                </label>

                                <PasswordField
                                    label="New password"
                                    name="newPassword"
                                    value={resetPassword}
                                    onChange={(event) => setResetPassword(event.target.value)}
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                            </>
                        )}

                        {resetMessage && (
                            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                                {resetMessage}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleRequestOtp}
                                disabled={isResetSubmitting}
                                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-60"
                            >
                                {isResetSubmitting ? "Please wait..." : resetStatus === "otp-sent" ? "Resend OTP" : "Send OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                disabled={isResetSubmitting || resetStatus === "idle"}
                                className="flex-1 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                            >
                                {isResetSubmitting ? "Updating..." : "Set new password"}
                            </button>
                        </div>
                    </div>
                )}

                {error && <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60">
                    {isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-center text-sm text-slate-400">
                    New organizer? <button type="button" onClick={() => window.open("https://organizer.crtcompete.com/organizer/register", "_blank", "noopener,noreferrer")} className="font-semibold text-emerald-400">Create an account</button>
                </p>
            </form>
        </main>
    );
};

export default OrganizerLogin;
