export const normalizePortalRole = (role) => String(role ?? "").trim().toUpperCase();

export const isValidPortalUserForRole = (user, portalRole) => {
  if (!user || typeof user !== "object") {
    return false;
  }

  const expectedRole = normalizePortalRole(portalRole);
  if (!expectedRole) {
    return false;
  }

  return normalizePortalRole(user.role) === expectedRole;
};

export const hasPortalAuthCookie = (portalRole) => {
  if (typeof document === "undefined") {
    return false;
  }

  const expectedRole = normalizePortalRole(portalRole);
  if (!expectedRole) {
    return false;
  }

  const cookieNames = {
    USER: "userAccessToken",
    ORGANIZER: "organizerAccessToken",
    ADMIN: "adminAccessToken",
  };

  const targetCookieName = cookieNames[expectedRole];
  if (!targetCookieName) {
    return false;
  }

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${targetCookieName}=`));
};

export const getPortalStoredUser = (rawValue, portalRole) => {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return isValidPortalUserForRole(parsed, portalRole) ? parsed : null;
  } catch {
    return null;
  }
};
