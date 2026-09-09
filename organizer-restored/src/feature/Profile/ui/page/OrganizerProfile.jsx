import React from "react";

import useOrganizerProfilePage from "../../hook/useOrganizerProfilePage.js";
import ProfileHeader from "../components/ProfileHeader";
import ProfileStats from "../components/ProfileStats";
import SocialLinksCard from "../components/SocialLinksCard";
import EditProfileModal from "../../utils/EditProfileModal.jsx";
import OrganizationProfileDetails from "../components/OrganizationProfileDetails";

export default function OrganizerProfile() {
  const {
    profile,
    loading,
    error,
    isSaving,
    isModalOpen,
    openProfileModal,
    closeProfileModal,
    handleSaveProfile,
  } = useOrganizerProfilePage();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="h-14 animate-pulse rounded-2xl bg-slate-900" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-900" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-900" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="border-b border-slate-800/80 pb-3">
          <h1 className="text-lg font-bold text-white sm:text-2xl">Organizer Profile</h1>
          <p className="text-xs text-slate-400">
            Manage your credentials, organization details, and public presence
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        )}

        <ProfileHeader
          personal={profile.personal}
          organization={profile.organization}
          kyc={profile.kyc}
          onEditClick={openProfileModal}
        />

        <ProfileStats stats={profile.stats} />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <OrganizationProfileDetails organization={profile.organization} />
          </div>

          <div className="space-y-5">
            <SocialLinksCard socials={profile.socials} />
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={closeProfileModal}
        profile={profile}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />
    </div>
  );
}
