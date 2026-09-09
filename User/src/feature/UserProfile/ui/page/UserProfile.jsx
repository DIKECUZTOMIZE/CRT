import React from "react";

import SavedEventsCard from "../components/SavedEventsCard";
import UserSettingsCard from "../components/UserSettingsCard";
import UserProfileHeader from "../components/UserProfileHeader";
import EditUserProfileModal from "../../utils/EditUserProfileModal.jsx";

import { useUserProfilePage } from "../../hook/useUserProfilePage.js";

export default function UserProfile() {
  const {
    user,
    savedEvents,
    refetchSavedEvents,
    profileFormData,
    isEditOpen,
    setIsEditOpen,
    handleRemoveSavedEvent,
    handleProfileSave,
  } = useUserProfilePage();

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 p-3 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl min-w-0 space-y-5">
        <div className="border-b border-slate-800/80 pb-3">
          <h1 className="text-lg font-bold text-white sm:text-2xl">User Profile</h1>
          <p className="text-xs text-slate-400">
            Manage your personal details, bookmarks, and preferences
          </p>
        </div>

        <UserProfileHeader user={user} onEdit={() => setIsEditOpen(true)} />

        <div className="grid min-w-0 gap-5 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            <SavedEventsCard
              savedList={savedEvents}
              onRefresh={refetchSavedEvents}
              onRemove={handleRemoveSavedEvent}
            />
          </div>

          <div className="space-y-5">
            <UserSettingsCard />
          </div>
        </div>
      </div>

      <EditUserProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profile={profileFormData}
        onSave={async (nextData) => {
          await handleProfileSave(nextData);
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}