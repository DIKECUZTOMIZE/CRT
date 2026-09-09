import React from "react";
import { X, Save, Upload, UserCircle2 } from "lucide-react";

import useEditProfileModal from "../hook/useEditProfileModal.js";

export default function EditProfileModal({ isOpen, onClose, profile, onSave, isSaving = false }) {
  const {
    formData,
    submitError,
    fileInputRef,
    handleChange,
    handleAvatarChange,
    handleSubmit,
  } = useEditProfileModal({ isOpen, profile, onSave, isSaving });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 sm:text-lg">Edit Organizer Profile</h2>
            <p className="text-xs text-slate-400">Update your account details and organization info</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close profile editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
            {formData?.personal?.avatar ? (
              <img
                src={formData.personal.avatar}
                alt="Avatar"
                className="h-14 w-14 rounded-full border border-emerald-500/30 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-slate-800">
                <UserCircle2 className="h-8 w-8 text-slate-300" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
              >
                <Upload className="h-3.5 w-3.5" /> Change Avatar
              </button>
              <p className="mt-1 text-[11px] text-slate-500">JPG, PNG or WEBP (Max 2MB)</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Personal Info</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={formData?.personal?.fullName || ""}
                  onChange={(e) => handleChange("personal", "fullName", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={formData?.personal?.email || ""}
                  onChange={(e) => handleChange("personal", "email", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Phone</label>
                <input
                  type="text"
                  value={formData?.personal?.phone || ""}
                  onChange={(e) => handleChange("personal", "phone", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Organization Info</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Organization Name</label>
                <input
                  type="text"
                  value={formData?.organization?.name || ""}
                  onChange={(e) => handleChange("organization", "name", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Website</label>
                <input
                  type="text"
                  value={formData?.organization?.website || ""}
                  onChange={(e) => handleChange("organization", "website", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Organization Type</label>
                <input
                  type="text"
                  value={formData?.organization?.type || ""}
                  onChange={(e) => handleChange("organization", "type", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Address</label>
                <input
                  type="text"
                  value={formData?.organization?.address || ""}
                  onChange={(e) => handleChange("organization", "address", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400">About / Bio</label>
              <textarea
                rows={3}
                value={formData?.organization?.bio || ""}
                onChange={(e) => handleChange("organization", "bio", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Social Links</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Instagram</label>
                <input
                  type="text"
                  value={formData?.socials?.instagram || ""}
                  onChange={(e) => handleChange("socials", "instagram", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Twitter</label>
                <input
                  type="text"
                  value={formData?.socials?.twitter || ""}
                  onChange={(e) => handleChange("socials", "twitter", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">LinkedIn</label>
                <input
                  type="text"
                  value={formData?.socials?.linkedin || ""}
                  onChange={(e) => handleChange("socials", "linkedin", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {submitError}
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}