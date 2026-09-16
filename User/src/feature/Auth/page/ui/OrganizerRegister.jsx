import { useState } from "react";

import { useAuthForm } from "../../hook/useAuthForm.jsx";
import AuthCloseButton from "../components/AuthCloseButton.jsx";
import PasswordField from "../components/PasswordField.jsx";

const OrganizerRegister = () => {
    const { error, isSubmitting, submit } = useAuthForm("organizer-register", "https://organizer.crtcompete.com/organizer/dashboard");
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    const updateField = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit(formData);
                }}
                className="relative w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            >
                <AuthCloseButton />
                <div>
                    <p className="text-sm font-semibold text-emerald-400">Organizer portal</p>
                    <h1 className="mt-2 text-2xl font-bold text-white">Create your account</h1>
                    <p className="mt-1 text-sm text-slate-400">Start publishing events in minutes.</p>
                </div>

                <label className="block text-sm text-slate-300">
                    Username
                    <input
                        name="username"
                        required
                        minLength={3}
                        maxLength={30}
                        value={formData.username}
                        onChange={updateField}
                        autoComplete="username"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none transition focus:border-emerald-500"
                    />
                </label>

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
                    minLength={12}
                    autoComplete="new-password"
                    title="Use at least 12 characters including uppercase, lowercase, number, and a special character"
                />

                {error && <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
                <button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60">
                    {isSubmitting ? "Creating account..." : "Create account"}
                </button>
                <p className="text-center text-sm text-slate-400">Already registered? <button type="button" onClick={() => window.open("https://organizer.crtcompete.com/organizer/login", "_blank", "noopener,noreferrer")} className="font-semibold text-emerald-400">Sign in</button></p>
            </form>
        </main>
    );
};

export default OrganizerRegister;
