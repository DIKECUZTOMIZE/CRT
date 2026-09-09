import { useState } from "react";

import useOrganizerProfile from "./useProfile.js";

export const useOrganizerProfilePage = () => {
  const { profile, loading, error, isSaving, updateProfile } = useOrganizerProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openProfileModal = () => setIsModalOpen(true);
  const closeProfileModal = () => setIsModalOpen(false);

  const handleSaveProfile = async (updatedData) => {
    const savedProfile = await updateProfile(updatedData);

    if (savedProfile) {
      closeProfileModal();
    }

    return savedProfile;
  };

  return {
    profile,
    loading,
    error,
    isSaving,
    isModalOpen,
    openProfileModal,
    closeProfileModal,
    handleSaveProfile,
  };
};

export default useOrganizerProfilePage;
