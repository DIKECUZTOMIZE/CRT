import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { toggleSavedEvent, updateUserProfile } from "../api/userProfile.api.js";
import { useUserProfile } from "./useUserProfile.jsx";

export const useUserProfilePage = () => {
  const { user, savedEvents, refetchSavedEvents } = useUserProfile();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const profileFormData = useMemo(
    () => ({
      personal: {
        fullName: user?.raw?.fullName || user?.name || user?.username || "",
        email: user?.raw?.email || user?.email || "",
        city: user?.raw?.address || user?.raw?.city || "",
        avatar: user?.raw?.avatar || user?.avatar || user?.raw?.picture || user?.picture || "",
        phone: user?.raw?.phone || "",
      },
    }),
    [user]
  );

  const handleRemoveSavedEvent = async (eventId) => {
    if (!eventId) return;

    try {
      await toggleSavedEvent(eventId);
      await refetchSavedEvents();
    } catch (error) {
      console.error("Failed to remove saved event:", error);
    }
  };

  const handleProfileSave = async (formData) => {
    try {
      const payload = {
        fullName: formData?.personal?.fullName || "",
        email: formData?.personal?.email || "",
        phone: formData?.personal?.phone || "",
        avatar: formData?.personal?.avatar || "",
        address: formData?.personal?.city || "",
      };

      const updatedUser = await updateUserProfile(payload);
      queryClient.setQueryData(["user-profile"], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["user-saved-events"] });
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      throw error;
    }
  };

  return {
    user,
    savedEvents,
    refetchSavedEvents,
    profileFormData,
    isEditOpen,
    setIsEditOpen,
    handleRemoveSavedEvent,
    handleProfileSave,
  };
};

export default useUserProfilePage;
