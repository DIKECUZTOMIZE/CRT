import React from "react";
import { X, Save, Upload, UserCircle2 } from "lucide-react";

import { useEditUserProfileModal } from "../hook/useEditUserProfileModal.js";

export default function EditUserProfileModal({ isOpen, onClose, profile, onSave }) {
  const {
    formData,
    isUploading,
    uploadError,
    fileInputRef,
    handleChange,
    handleImageUpload,
    handleSubmit,
  } = useEditUserProfileModal({ isOpen, profile, onSave });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Edit Personal Details</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-emerald-50 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="edit-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            {formData?.personal?.avatar ? (
              <img
                src={formData.personal.avatar}
                alt="Avatar"
                className="h-14 w-14 rounded-full border border-emerald-500/30 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-50">
                <UserCircle2 className="h-8 w-8 text-slate-700" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUploading}
              >
                <Upload className="h-3.5 w-3.5" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </button>
              <p className="mt-1 text-[11px] text-slate-500">JPG, PNG or WEBP</p>
            </div>
          </div>

          {uploadError && (
            <p className="text-[11px] text-red-600">{uploadError}</p>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600">Full Name</label>
              <input
                type="text"
                value={formData.personal.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">Email Address</label>
              <input
                type="email"
                value={formData.personal.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">City / Location</label>
              <input
                type="text"
                value={formData.personal.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-emerald-100 px-5 py-3.5">
          <button onClick={onClose} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-slate-700">
            Cancel
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={isUploading}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {isUploading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}