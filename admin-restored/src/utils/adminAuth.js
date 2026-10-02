export const adminRoleAliases = ['ADMIN', 'admin'];

export const normalizeAdminRole = (role) => String(role ?? '').trim().toUpperCase();

export const isAdminUser = (user = {}) => {
  const role = normalizeAdminRole(user?.role);
  return adminRoleAliases.includes(role) || adminRoleAliases.includes(role.toLowerCase());
};

export const getStoredAdminUser = () => null;

export const getAdminRedirectPath = () => '/admin/dashboard';
