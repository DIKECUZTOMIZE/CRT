import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganizerApp } from "../../../app/context/OrganizerAppContext.jsx";
import { getOrganizerProfile, updateOrganizerProfile } from "../api/index.js";
import { initialProfileData } from "../utils/initialProfileData.jsx";

const cloneProfile = (value) =>
  JSON.parse(JSON.stringify(value ?? initialProfileData));

const normalizeProfile = (incoming, user = null) => {
  const safeIncoming = incoming && typeof incoming === "object" ? incoming : {};
  const base = cloneProfile(initialProfileData);
  const merged = {
    ...base,
    ...safeIncoming,
    personal: {
      ...base.personal,
      ...(safeIncoming.personal || {}),
      avatar: safeIncoming.personal?.avatar || safeIncoming.avatar || base.personal.avatar,
    },
    organization: { ...base.organization, ...(safeIncoming.organization || {}) },
    stats: { ...base.stats, ...(safeIncoming.stats || {}) },
    kyc: { ...base.kyc, ...(safeIncoming.kyc || {}) },
    socials: { ...base.socials, ...(safeIncoming.socials || {}) },
    settings: { ...base.settings, ...(safeIncoming.settings || {}) },
  };

  if (user) {
    const fullName = user.fullName || user.name || user.username || merged.personal.fullName;
    const email = user.email || merged.personal.email;
    const phone = user.phone || merged.personal.phone;
    const orgName = user.organizationName || user.businessName || merged.organization.name;
    const website = user.website || merged.organization.website;
    const avatar = user.avatar || user.profileImage || merged.personal.avatar;
    const role = user.role || merged.personal.role || "ORGANIZER";
    const roleTitle = user.roleTitle || merged.personal.roleTitle || "Organizer";

    merged.personal.fullName = fullName || merged.personal.fullName;
    merged.personal.email = merged.personal.email || email || "";
    merged.personal.phone = merged.personal.phone || phone || "";
    merged.personal.avatar = merged.personal.avatar || avatar || "";
    merged.personal.role = role;
    merged.personal.roleTitle = roleTitle;
    merged.organization.name = merged.organization.name || orgName || "";
    merged.organization.website = merged.organization.website || website || "";
  }

  return merged;
};

const validateProfile = (profile) => {
  const personal = profile?.personal || {};
  const organization = profile?.organization || {};

  if (!String(personal.fullName || "").trim()) {
    throw new Error("Full name is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(personal.email || "").trim())) {
    throw new Error("A valid email is required.");
  }

  if (!String(organization.name || "").trim()) {
    throw new Error("Organization name is required.");
  }
};

export const useOrganizerProfile = () => {
  const { user } = useSelector((state) => state.auth || {});
  const queryClient = useQueryClient();
  const { profile: contextProfile, loading: contextLoading, updateProfileData } = useOrganizerApp();

  const query = useQuery({
    queryKey: ["organizer-profile", user?.id || "anon"],
    queryFn: () => getOrganizerProfile(user),
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: cloneProfile(initialProfileData),
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateOrganizerProfile,
    onSuccess: (savedProfile) => {
      const normalized = normalizeProfile(savedProfile, user);
      queryClient.setQueryData(["organizer-profile", user?.id || "anon"], normalized);
      queryClient.invalidateQueries({ queryKey: ["organizer-profile", user?.id || "anon"] });
    },
  });

  const profile = normalizeProfile(query.data || contextProfile || initialProfileData, user);

  const updateProfile = async (nextProfile) => {
    const merged = normalizeProfile(nextProfile, user);
    validateProfile(merged);

    const saved = await updateProfileData(merged);
    const normalizedSaved = normalizeProfile(saved, user);

    queryClient.setQueryData(["organizer-profile", user?.id || "anon"], normalizedSaved);

    return normalizedSaved;
  };

  return {
    profile,
    loading: contextLoading || query.isLoading,
    error: query.error?.message || updateProfileMutation.error?.message || "",
    isSaving: updateProfileMutation.isPending,
    refetch: query.refetch,
    updateProfile,
  };
};

export default useOrganizerProfile;
