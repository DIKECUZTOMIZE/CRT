import apiClient, { normalizeError } from "../../../app/config/axios.js";
import { initialProfileData } from "../utils/initialProfileData.jsx";

const PROFILE_STORAGE_KEY = "organizer_profile_v1";
const FALLBACK_AVATAR = "";

const safeReadStorage = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const safeWriteStorage = (payload) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures silently in restricted environments
  }
};

const combineAddressParts = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();
  }

  if (typeof value === "object") {
    const parts = [value.address, value.city, value.state]
      .filter((part) => part !== undefined && part !== null && String(part).trim())
      .map((part) => String(part).trim())
      .filter(Boolean);

    return parts.join(", ");
  }

  return String(value).trim();
};

const buildFallbackProfile = (user = null) => {
  const fallback = JSON.parse(JSON.stringify(initialProfileData));

  if (user) {
    const fullName = user.fullName || user.name || user.username || fallback.personal.fullName;
    const email = user.email || fallback.personal.email;
    const phone = user.phone || fallback.personal.phone;
    const orgName = user.organizationName || user.businessName || fallback.organization.name;
    const website = user.website || fallback.organization.website;
    const avatar = user.avatar || user.profileImage || FALLBACK_AVATAR;

    fallback.personal.fullName = fullName;
    fallback.personal.email = email;
    fallback.personal.phone = phone;
    fallback.personal.avatar = avatar;
    fallback.organization.name = orgName;
    fallback.organization.website = website;
  }

  fallback.personal.avatar = fallback.personal.avatar || FALLBACK_AVATAR;
  return fallback;
};

const mergeCurrentUserIntoProfile = (profile, user) => {
  if (!profile || typeof profile !== "object") {
    return buildFallbackProfile(user);
  }

  const merged = JSON.parse(JSON.stringify(profile));
  const safeUser = user || {};

  merged.personal = {
    ...merged.personal,
    fullName: merged.personal?.fullName || safeUser.fullName || safeUser.name || safeUser.username || "",
    email: merged.personal?.email || safeUser.email || "",
    phone: merged.personal?.phone || safeUser.phone || "",
    avatar: merged.personal?.avatar || safeUser.avatar || safeUser.profileImage || FALLBACK_AVATAR,
    role: merged.personal?.role || safeUser.role || "ORGANIZER",
    isVerified: Boolean(merged.personal?.isVerified ?? safeUser.isVerified ?? false),
  };

  merged.organization = {
    ...merged.organization,
    name: merged.organization?.name || safeUser.organizationName || safeUser.businessName || "",
    type: merged.organization?.type || safeUser.organizationType || "",
    website: merged.organization?.website || safeUser.website || "",
    address: combineAddressParts(
      merged.organization?.address || safeUser.address || { address: merged.organization?.address, city: safeUser.city, state: safeUser.state }
    ),
    bio: merged.organization?.bio || safeUser.bio || "",
  };

  merged.kyc = {
    ...merged.kyc,
    status: safeUser.kycStatus || merged.kyc?.status,
    documentType: safeUser.kycDocumentType || merged.kyc?.documentType,
    verifiedAt: safeUser.kycVerifiedAt || merged.kyc?.verifiedAt,
  };

  merged.socials = {
    ...merged.socials,
    ...(safeUser.socials || {}),
  };

  merged.settings = {
    ...merged.settings,
    ...(safeUser.settings || {}),
  };

  merged.stats = {
    ...merged.stats,
    ...(safeUser.stats || {}),
  };

  return merged;
};

const mergeProfileResponse = (profile) => {
  if (!profile || typeof profile !== "object") {
    return buildFallbackProfile();
  }

  const safeProfile = JSON.parse(JSON.stringify(profile));

  return {
    personal: {
      fullName: safeProfile?.personal?.fullName || "",
      email: safeProfile?.personal?.email || "",
      phone: safeProfile?.personal?.phone || "",
      role: safeProfile?.personal?.role || "ORGANIZER",
      avatar: safeProfile?.personal?.avatar || FALLBACK_AVATAR,
      isVerified: Boolean(safeProfile?.personal?.isVerified),
    },
    organization: {
      name: safeProfile?.organization?.name || "",
      type: safeProfile?.organization?.type || "",
      website: safeProfile?.organization?.website || "",
      address: combineAddressParts(
        safeProfile?.organization?.address || { address: safeProfile?.organization?.address, city: safeProfile?.organization?.city, state: safeProfile?.organization?.state }
      ),
      bio: safeProfile?.organization?.bio || "",
    },
    stats: {
      totalEvents: Number(safeProfile?.stats?.totalEvents || 0),
      activeEvents: Number(safeProfile?.stats?.activeEvents || 0),
      totalAttendees: String(safeProfile?.stats?.totalAttendees || ""),
      rating: Number(safeProfile?.stats?.rating || 0),
    },
    kyc: {
      status: safeProfile?.kyc?.status || "",
      documentType: safeProfile?.kyc?.documentType || "",
      verifiedAt: safeProfile?.kyc?.verifiedAt || "",
    },
    socials: {
      instagram: safeProfile?.socials?.instagram || "",
      twitter: safeProfile?.socials?.twitter || "",
      linkedin: safeProfile?.socials?.linkedin || "",
    },
    settings: {
      emailNotifications: Boolean(safeProfile?.settings?.emailNotifications),
      publicProfile: Boolean(safeProfile?.settings?.publicProfile),
    },
  };
};

export const getOrganizerProfile = async (user = null) => {
  const currentUserFallback = buildFallbackProfile(user);

  try {
    const profileResponse = await apiClient.get("/api/profile");
    const payload = profileResponse?.data?.data?.profile || profileResponse?.data?.profile || null;

    if (payload) {
      const hydrated = mergeProfileResponse(payload);
      safeWriteStorage(hydrated);
      return hydrated;
    }
  } catch {
    try {
      const currentUserResponse = await apiClient.get("/api/auth/current-user");
      const payload = currentUserResponse?.data?.data?.user || currentUserResponse?.data?.user || null;

      if (payload) {
        const hydrated = mergeCurrentUserIntoProfile(currentUserFallback, payload);
        safeWriteStorage(hydrated);
        return hydrated;
      }
    } catch {
      const stored = safeReadStorage();
      if (stored) {
        return mergeCurrentUserIntoProfile(stored, user);
      }

      safeWriteStorage(currentUserFallback);
      return currentUserFallback;
    }
  }

  const stored = safeReadStorage();
  if (stored) {
    return mergeCurrentUserIntoProfile(stored, user);
  }

  safeWriteStorage(currentUserFallback);
  return currentUserFallback;
};

export const uploadOrganizerAvatar = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiClient.post("/api/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response?.data?.data?.url || "";
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateOrganizerProfile = async (profileData) => {
  const payload = profileData && typeof profileData === "object" ? profileData : buildFallbackProfile();
  const finalPayload = {
    ...payload,
    personal: {
      ...(payload.personal || {}),
      avatar: payload?.personal?.avatar || FALLBACK_AVATAR,
    },
    organization: {
      ...(payload.organization || {}),
      address: combineAddressParts(
        payload?.organization?.address || { address: payload?.organization?.address, city: payload?.organization?.city, state: payload?.organization?.state }
      ),
    },
  };

  safeWriteStorage(finalPayload);

  try {
    const response = await apiClient.put("/api/profile", finalPayload);
    const serverProfile = response?.data?.data?.profile || finalPayload;
    safeWriteStorage(mergeProfileResponse(serverProfile));
    return mergeProfileResponse(serverProfile);
  } catch (error) {
    if (error?.status === 404 || error?.status === 405 || error?.status === 501) {
      return finalPayload;
    }

    throw normalizeError(error);
  }
};
