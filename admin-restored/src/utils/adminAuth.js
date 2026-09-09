export const adminRoleAliases = ['ADMIN', 'admin'];

export const normalizeAdminRole = (role) => String(role ?? '').trim().toUpperCase();

export const isAdminUser = (user = {}) => {
  const role = normalizeAdminRole(user?.role);
  return adminRoleAliases.includes(role) || adminRoleAliases.includes(role.toLowerCase());
};

export const getStoredAdminUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const rawAdminSession = sessionStorage.getItem('crt-admin-user');
    if (rawAdminSession) {
      const parsedSessionUser = JSON.parse(rawAdminSession);
      if (isAdminUser(parsedSessionUser)) {
        return parsedSessionUser;
      }
    }

    const rawSharedUser = window.localStorage.getItem('crt_auth_user');
    if (!rawSharedUser) return null;

    const parsedSharedUser = JSON.parse(rawSharedUser);
    return isAdminUser(parsedSharedUser) ? parsedSharedUser : null;
  } catch {
    return null;
  }
};

export const getAdminRedirectPath = () => '/admin/dashboard';
