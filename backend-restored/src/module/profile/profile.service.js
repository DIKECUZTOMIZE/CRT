import { AppError } from "../../shared/error/appError.js";
import { NotFoundError } from "../../shared/error/notFound.error.js";
import UserModel from "../../model/user.model.js";

export const normalizeAddressForStorage = (value = "") => {
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

const normalizeProfilePayload = (profileData = {}) => {
  const personal = profileData.personal || {};
  const organization = profileData.organization || {};
  const hasAddressParts = Boolean(
    organization.address || organization.city || organization.state || profileData.address || profileData.city || profileData.state
  );
  const addressValue = normalizeAddressForStorage(
    hasAddressParts
      ? {
          address: organization.address || profileData.address || "",
          city: organization.city || profileData.city || "",
          state: organization.state || profileData.state || "",
        }
      : ""
  );

  return {
    fullName: String(personal.fullName || "").trim(),
    email: String(personal.email || "").trim(),
    roleTitle: String(personal.roleTitle || "").trim(),
    phone: String(personal.phone || "").trim(),
    role: String(personal.role || "").trim(),
    avatar: String(personal.avatar || "").trim(),
    isVerified: Boolean(personal.isVerified),
    organizationName: String(organization.name || "").trim(),
    organizationType: String(organization.type || "").trim(),
    website: String(organization.website || "").trim(),
    address: addressValue,
    bio: String(organization.bio || "").trim(),
    kycStatus: String(profileData?.kyc?.status || "").trim(),
    kycDocumentType: String(profileData?.kyc?.documentType || "").trim(),
    kycVerifiedAt: String(profileData?.kyc?.verifiedAt || "").trim(),
    socials: {
      instagram: String(profileData?.socials?.instagram || "").trim(),
      twitter: String(profileData?.socials?.twitter || "").trim(),
      linkedin: String(profileData?.socials?.linkedin || "").trim(),
    },
    settings: {
      emailNotifications: Boolean(profileData?.settings?.emailNotifications),
      publicProfile: Boolean(profileData?.settings?.publicProfile),
    },
    stats: {
      totalEvents: Number(profileData?.stats?.totalEvents || 0),
      activeEvents: Number(profileData?.stats?.activeEvents || 0),
      totalAttendees: String(profileData?.stats?.totalAttendees || ""),
      rating: Number(profileData?.stats?.rating || 0),
    },
  };
};

export const getOrganizerProfileService = async (userId) => {
  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new NotFoundError("Organizer not found");
  }

  return {
    personal: {
      fullName: user.fullName || "",
      email: user.email || "",
      roleTitle: user.roleTitle || "",
      phone: user.phone || "",
      role: user.role || "ORGANIZER",
      avatar: user.avatar || "",
      isVerified: Boolean(user.isVerified),
    },
    organization: {
      name: user.organizationName || "",
      type: user.organizationType || "",
      website: user.website || "",
      address: user.address || "",
      bio: user.bio || "",
    },
    stats: {
      totalEvents: Number(user?.stats?.totalEvents || 0),
      activeEvents: Number(user?.stats?.activeEvents || 0),
      totalAttendees: String(user?.stats?.totalAttendees || ""),
      rating: Number(user?.stats?.rating || 0),
    },
    kyc: {
      status: user.kycStatus || "",
      documentType: user.kycDocumentType || "",
      verifiedAt: user.kycVerifiedAt || "",
    },
    socials: {
      instagram: user?.socials?.instagram || "",
      twitter: user?.socials?.twitter || "",
      linkedin: user?.socials?.linkedin || "",
    },
    settings: {
      emailNotifications: Boolean(user?.settings?.emailNotifications),
      publicProfile: Boolean(user?.settings?.publicProfile),
    },
  };
};

export const updateOrganizerProfileService = async (userId, profileData) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundError("Organizer not found");
  }

  const normalized = normalizeProfilePayload(profileData);

  if (!normalized.fullName) {
    throw new AppError("Full name is required", 400);
  }

  if (!normalized.email) {
    throw new AppError("Email is required", 400);
  }

  if (!normalized.organizationName) {
    throw new AppError("Organization name is required", 400);
  }

  user.fullName = normalized.fullName;
  user.email = normalized.email;
  user.roleTitle = normalized.roleTitle;
  user.phone = normalized.phone;
  user.role = normalized.role || user.role;
  user.avatar = normalized.avatar || user.avatar;
  user.isVerified = normalized.isVerified;
  user.organizationName = normalized.organizationName;
  user.organizationType = normalized.organizationType;
  user.website = normalized.website;
  user.address = normalized.address;
  user.bio = normalized.bio;
  user.kycStatus = normalized.kycStatus;
  user.kycDocumentType = normalized.kycDocumentType;
  user.kycVerifiedAt = normalized.kycVerifiedAt;
  user.socials = normalized.socials;
  user.settings = normalized.settings;
  user.stats = normalized.stats;

  await user.save();

  return getOrganizerProfileService(user._id);
};
