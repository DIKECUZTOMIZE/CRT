export const normalizeRole = (role) => String(role ?? "").trim().toUpperCase();

const normalizeRoleList = (value) => {
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? [value.roles, value.role]
      : [value];

  return [...new Set(
    entries
      .flat()
      .filter(Boolean)
      .map((entry) => normalizeRole(entry))
      .filter(Boolean)
  )];
};

export const hasRoleAccess = (userLike, targetRole) => {
  const target = normalizeRole(targetRole);
  if (!target) return false;

  const roles = normalizeRoleList(userLike);
  return roles.includes(target);
};

export const isUserRole = (roleOrUser) => hasRoleAccess(roleOrUser, "USER");
export const isOrganizerRole = (roleOrUser) => hasRoleAccess(roleOrUser, "ORGANIZER");
export const isAdminRole = (roleOrUser) => hasRoleAccess(roleOrUser, "ADMIN");

export const isExternalUrl = (value) => {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value.trim());
};

export const getPortalBaseUrl = (portal) => {
  const host = typeof window !== "undefined" ? window.location?.hostname : "";
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

  if (isLocalHost) {
    if (portal === "ADMIN") return "http://localhost:5174/admin/dashboard";
    if (portal === "ORGANIZER") return "http://localhost:5175/organizer/dashboard";
    return "http://localhost:5173/profile";
  }

  if (portal === "ADMIN") return "https://admin.crtcompete.com/admin/dashboard";
  if (portal === "ORGANIZER") return "https://organizer.crtcompete.com/organizer/dashboard";
  return "/profile";
};

export const resolveRedirectTarget = (target) => {
  if (typeof target !== "string") return target;
  return target.trim();
};

export const getEffectiveRole = (roleOrUser) => {
  const roles = normalizeRoleList(roleOrUser);

  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("USER")) return "USER";
  if (roles.includes("ORGANIZER")) return "ORGANIZER";

  const directRole = normalizeRole(
    Array.isArray(roleOrUser)
      ? roleOrUser[0]
      : roleOrUser && typeof roleOrUser === "object"
        ? roleOrUser.role
        : roleOrUser
  );

  return directRole || "USER";
};

export const getRoleHomePath = (roleOrUser) => {
  const effectiveRole = getEffectiveRole(roleOrUser);

  if (effectiveRole === "USER") return "/profile";
  if (effectiveRole === "ORGANIZER") return getPortalBaseUrl("ORGANIZER");
  if (effectiveRole === "ADMIN") return getPortalBaseUrl("ADMIN");

  return "/login";
};
