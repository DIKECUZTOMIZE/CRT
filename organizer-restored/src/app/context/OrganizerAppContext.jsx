import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { getOrganizerProfile, updateOrganizerProfile } from "../../feature/Profile/api/profile.api.js";
import { initialProfileData } from "../../feature/Profile/utils/initialProfileData.jsx";

const OrganizerAppContext = createContext(null);

export const OrganizerAppProvider = ({ children }) => {
  const { user, status } = useSelector((state) => state.auth || {});
  const [authUser, setAuthUser] = useState(user || null);
  const [profile, setProfile] = useState(initialProfileData);
  const [loading, setLoading] = useState(status === "loading");

  useEffect(() => {
    setAuthUser(user || null);
  }, [user]);

  useEffect(() => {
    if (!user || status !== "authenticated") {
      setProfile(initialProfileData);
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [status, user?.id, user?.email]);

  const updateProfileData = async (nextProfile) => {
    const savedProfile = await updateOrganizerProfile(nextProfile);

    setProfile(savedProfile || initialProfileData);

    if (savedProfile?.personal) {
      setAuthUser((prev) => ({
        ...(prev || {}),
        fullName: savedProfile.personal.fullName || prev?.fullName || "",
        email: savedProfile.personal.email || prev?.email || "",
        phone: savedProfile.personal.phone || prev?.phone || "",
        avatar: savedProfile.personal.avatar || prev?.avatar || "",
        organizationName: savedProfile.organization?.name || prev?.organizationName || "",
        organizationType: savedProfile.organization?.type || prev?.organizationType || "",
        website: savedProfile.organization?.website || prev?.website || "",
        address: savedProfile.organization?.address || prev?.address || "",
        bio: savedProfile.organization?.bio || prev?.bio || "",
        isVerified: Boolean(savedProfile.personal.isVerified ?? prev?.isVerified),
        socials: savedProfile.socials || prev?.socials || {},
        settings: savedProfile.settings || prev?.settings || {},
        stats: savedProfile.stats || prev?.stats || {},
      }));
    }

    return savedProfile || initialProfileData;
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(initialProfileData);
      return initialProfileData;
    }

    const nextProfile = await getOrganizerProfile(user);
    setProfile(nextProfile || initialProfileData);
    return nextProfile || initialProfileData;
  };

  const value = useMemo(
    () => ({
      authUser,
      profile,
      loading,
      setProfile,
      refreshProfile,
      updateProfileData,
      status,
    }),
    [authUser, loading, profile, status]
  );

  return <OrganizerAppContext.Provider value={value}>{children}</OrganizerAppContext.Provider>;
};

export const useOrganizerApp = () => {
  const context = useContext(OrganizerAppContext);

  if (!context) {
    throw new Error("useOrganizerApp must be used within OrganizerAppProvider");
  }

  return context;
};
