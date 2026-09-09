import { useState } from "react";
import { Link } from "react-router";

import { useAuthForm } from "../../hook/useAuthForm.jsx";
import AuthCloseButton from "../components/AuthCloseButton.jsx";
import PasswordField from "../components/PasswordField.jsx";

const UserRegister = ({ onClose }) => {
    const { error, isSubmitting, submit } = useAuthForm("user-register", "/profile");
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    const updateField = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(135deg,#020817_0%,#0f172a_35%,#111827_100%)] px-4 py-10">
            <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-800/80 bg-slate-900/70 shadow-[0_30px_80px_rgba(2,6,23,0.8)] backdrop-blur-md">
                <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="hidden bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                                Join CRT
                            </div>
                            <h2 className="mt-8 text-4xl font-black leading-tight text-white">Your next great experience starts here.</h2>
                            <p className="mt-4 max-w-md text-base text-slate-300">Create your profile, discover new events, and become part of an active community built around participation and creativity.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200">
                                <div className="font-semibold text-emerald-300">Fast setup</div>
                                <div className="mt-2 text-slate-400">Set up your account in under a minute.</div>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200">
                                <div className="font-semibold text-emerald-300">Live access</div>
                                <div className="mt-2 text-slate-400">Get instant access to events, updates, and opportunities.</div>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submit(formData);
                        }}
                        className="relative space-y-5 bg-slate-900/80 p-6 sm:p-8 lg:p-10"
                    >
                        <AuthCloseButton onClose={onClose} />
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Create account</p>
                            <h1 className="mt-3 text-3xl font-black text-white">Join the community</h1>
                            <p className="mt-2 text-sm text-slate-400">Sign up to start exploring events and competitions.</p>
                        </div>

                        <label className="block text-sm font-medium text-slate-300">
                            Username
                            <input
                                name="username"
                                required
                                minLength={3}
                                maxLength={30}
                                value={formData.username}
                                onChange={updateField}
                                autoComplete="username"
                                placeholder="Enter your username"
                                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </label>

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
                            autoComplete="new-password"
                            className="bg-slate-950/70"
                        />

                        {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-60"
                        >
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </button>
                        <p className="text-center text-sm text-slate-400">Already registered? <Link to="/login" className="font-semibold text-emerald-400 transition hover:text-emerald-300">Sign in</Link></p>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default UserRegister;
