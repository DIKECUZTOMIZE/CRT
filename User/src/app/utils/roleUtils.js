export const normalizeRole = (role) => String(role ?? "").trim().toUpperCase();

export const isUserRole = (role) => normalizeRole(role) === "USER";
export const isOrganizerRole = (role) => normalizeRole(role) === "ORGANIZER";
export const isAdminRole = (role) => normalizeRole(role) === "ADMIN";

export const isExternalUrl = (value) => {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value.trim());
};

export const resolveRedirectTarget = (target) => {
  if (typeof target !== "string") return target;
  return target.trim();
};

export const getRoleHomePath = (role) => {
  const normalized = normalizeRole(role);

  if (isUserRole(normalized)) return "/profile";
  if (isOrganizerRole(normalized)) return "http://localhost:5175/organizer/dashboard";
  if (isAdminRole(normalized)) return "http://localhost:5174/admin/dashboard";

  return "/login";
};
