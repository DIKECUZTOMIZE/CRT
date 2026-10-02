export const PUBLIC_PATHS = new Set(["/", "/filter", "/about"]);
export const AUTH_PATHS = new Set(["/login", "/register"]);

export const normalizePath = (path) => {
  if (!path || typeof path !== "string") return "/";
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "") || "/";
};

export const shouldBootstrapAuthForPath = (path, status = "idle") => {
  const normalizedPath = normalizePath(path);
  const isPublicRoute = PUBLIC_PATHS.has(normalizedPath);
  const isAuthRoute = AUTH_PATHS.has(normalizedPath);

  if (status !== "idle") return false;
  if (isAuthRoute) return false;

  return true;
};
