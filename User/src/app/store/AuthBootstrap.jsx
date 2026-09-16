import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { bootstrapAuth } from "../../feature/Auth/state/auth.slice.js";
import { hasPortalAuthCookie } from "../../feature/Auth/state/sessionGuard.js";
import { getRoleHomePath, normalizeRole } from "../utils/roleUtils";

const PUBLIC_PATHS = new Set([
  "/",
  "/filter",
  "/about",
]);

const AUTH_PATHS = new Set([
  "/login",
  "/register",
]);

const USER_PROFILE_PATHS = new Set(["/profile", "/user-profile"]);

const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();
  const { status, user } = useSelector((state) => state.auth);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const normalizedCurrentPath = currentPath === "/" ? "/" : currentPath.replace(/\/+$/, "") || "/";
  const isPublicRoute = PUBLIC_PATHS.has(normalizedCurrentPath);
  const hasBootstrappedRef = useRef(false);
  const hasSavedSession = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedUser = window.localStorage.getItem("crt_auth_user");
    const hasStoredUser = Boolean(storedUser && storedUser !== "null");
    return hasStoredUser || hasPortalAuthCookie("USER");
  };
  const shouldBootstrapAuth = hasSavedSession() || !isPublicRoute || AUTH_PATHS.has(normalizedCurrentPath);

  useEffect(() => {
    if (status === "idle" && shouldBootstrapAuth && !hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      dispatch(bootstrapAuth());
    }

    if (status !== "idle" && status !== "loading") {
      hasBootstrappedRef.current = true;
    }
  }, [dispatch, shouldBootstrapAuth, status, normalizedCurrentPath]);

  useEffect(() => {
    if (status === "idle" || status === "loading") {
      return;
    }

    if (!user) {
      return;
    }

    const normalizedRole = normalizeRole(user.role);

    if (normalizedRole !== "USER") {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("crt_auth_user");
      }

      if (normalizedRole === "ADMIN") {
        if (typeof window !== "undefined" && !window.location.href.startsWith("https://admin.crtcompete.com/")) {
          window.location.assign("https://admin.crtcompete.com/admin/dashboard");
        }
        return;
      }

      if (normalizedRole === "ORGANIZER") {
        if (typeof window !== "undefined" && !window.location.href.startsWith("https://organizer.crtcompete.com/")) {
          window.location.assign("https://organizer.crtcompete.com/organizer/dashboard");
        }
        return;
      }

      window.location.replace("/login");
      return;
    }

    const redirectPath = getRoleHomePath(normalizedRole);

    if (AUTH_PATHS.has(normalizedCurrentPath)) {
      if (normalizedRole === "USER") {
        window.location.replace("/profile");
      } else {
        window.location.replace(redirectPath);
      }
      return;
    }

    if (USER_PROFILE_PATHS.has(normalizedCurrentPath) && normalizedRole !== "USER") {
      window.location.replace(redirectPath);
      return;
    }

    if (normalizedCurrentPath === "/profile" && normalizedRole !== "USER") {
      window.location.replace(redirectPath);
    }
  }, [normalizedCurrentPath, status, user]);

  const isAuthRoute = AUTH_PATHS.has(normalizedCurrentPath);
  const shouldShowRestoreLoader = (status === "idle" || status === "loading") && hasSavedSession() && !isPublicRoute && !isAuthRoute && !user;

  if (shouldShowRestoreLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Restoring session...
      </div>
    );
  }

  return children;
};

export default AuthBootstrap;
