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

export const getRoleHomePath = (role) => {
  const normalized = normalizeRole(role);

  if (isUserRole(normalized)) return "/";
  if (isOrganizerRole(normalized)) return "/organizer/dashboard";
  if (isAdminRole(normalized)) return "/admin/dashboard";

  return "/organizer/login";
};
