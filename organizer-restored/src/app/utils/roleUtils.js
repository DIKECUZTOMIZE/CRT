export const normalizeRole = (role) => String(role ?? "").trim().toUpperCase();

export const isUserRole = (role) => normalizeRole(role) === "USER";
export const isOrganizerRole = (role) => normalizeRole(role) === "ORGANIZER";
export const isAdminRole = (role) => normalizeRole(role) === "ADMIN";

export const getRoleHomePath = (role) => {
  const normalized = normalizeRole(role);

  if (isUserRole(normalized)) return "/";
  if (isOrganizerRole(normalized)) return "/organizer/dashboard";
  if (isAdminRole(normalized)) return "/admin/dashboard";

  return "/organizer/login";
};
