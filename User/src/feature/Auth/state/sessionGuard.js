export const normalizePortalRole = (role) => String(role ?? "").trim().toUpperCase();

const normalizePortalRoleList = (value) => {
  if (!value) return [];

  const entries = Array.isArray(value)
    ? value
    : typeof value === "object"
      ? [value.roles, value.role]
      : [value];

  return [...new Set(
    entries
      .flat()
      .filter(Boolean)
      .map((entry) => normalizePortalRole(entry))
      .filter(Boolean)
  )];
};

export const hasPortalAccess = (user, portalRole) => {
  if (!user || typeof user !== "object") {
    return false;
  }

  const expectedRole = normalizePortalRole(portalRole);
  if (!expectedRole) {
    return false;
  }

  const roles = normalizePortalRoleList(user);
  return roles.includes(expectedRole);
};

export const isValidPortalUserForRole = (user, portalRole) => hasPortalAccess(user, portalRole);

export const hasPortalAuthCookie = (portalRole) => {
  const expectedRole = normalizePortalRole(portalRole);
  if (!expectedRole) {
    return false;
  }

  if (typeof document === "undefined" || !document.cookie) {
    return false;
  }

  const cookieMap = Object.fromEntries(
    document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf("=");
        if (separatorIndex === -1) {
          return [entry, ""];
        }

        const key = entry.slice(0, separatorIndex).trim();
        const value = entry.slice(separatorIndex + 1).trim();
        return [key, value];
      })
  );

  const portalCookieMap = {
    USER: "userAccessToken",
    ORGANIZER: "organizerAccessToken",
    ADMIN: "adminAccessToken",
  };

  return Boolean(cookieMap[portalCookieMap[expectedRole]]);
};

export const getPortalStoredUser = (serializedUser, portalRole) => {
  if (typeof serializedUser !== "string" || !serializedUser.trim()) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(serializedUser);
    return isValidPortalUserForRole(parsedUser, portalRole) ? parsedUser : null;
  } catch {
    return null;
  }
};
