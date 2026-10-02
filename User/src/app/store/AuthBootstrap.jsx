import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { bootstrapAuth } from "../../feature/Auth/state/auth.slice.js";
import { syncUserLocation } from "./location.slice.js";
import { getEffectiveRole, getPortalBaseUrl, getRoleHomePath, normalizeRole } from "../utils/roleUtils";
import { shouldBootstrapAuthForPath } from "./authBootstrapLogic.js";

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
  const navigate = useNavigate();
  const { status, user } = useSelector((state) => state.auth);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const normalizedCurrentPath = currentPath === "/" ? "/" : currentPath.replace(/\/+$/, "") || "/";
  const isPublicRoute = PUBLIC_PATHS.has(normalizedCurrentPath);
  const hasBootstrappedRef = useRef(false);
  const shouldBootstrapAuth = shouldBootstrapAuthForPath(normalizedCurrentPath, status);

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
    if (!user || !user.location) {
      return;
    }

    dispatch(syncUserLocation(user.location));
  }, [dispatch, user]);

  useEffect(() => {
    if (status === "idle" || status === "loading") {
      return;
    }

    if (!user) {
      return;
    }

    const effectiveRole = getEffectiveRole(user);
    const hasUserAccess = Array.isArray(user.roles)
      ? user.roles.some((role) => normalizeRole(role) === "USER")
      : effectiveRole === "USER";

    if (!hasUserAccess) {
      if (effectiveRole === "ADMIN") {
        const adminUrl = getPortalBaseUrl("ADMIN");
        if (typeof window !== "undefined" && !window.location.href.startsWith(new URL(adminUrl).origin)) {
          window.location.assign(adminUrl);
        }
        return;
      }

      if (effectiveRole === "ORGANIZER") {
        const organizerUrl = getPortalBaseUrl("ORGANIZER");
        if (typeof window !== "undefined" && !window.location.href.startsWith(new URL(organizerUrl).origin)) {
          window.location.assign(organizerUrl);
        }
        return;
      }

      if (normalizedCurrentPath !== "/login") {
        navigate("/login", { replace: true });
      }
      return;
    }

    const redirectPath = getRoleHomePath(user);

    if (AUTH_PATHS.has(normalizedCurrentPath)) {
      if (effectiveRole === "USER") {
        navigate("/profile", { replace: true });
      } else if (redirectPath && redirectPath.startsWith("http")) {
        window.location.assign(redirectPath);
      } else {
        navigate(redirectPath, { replace: true });
      }
      return;
    }

    if (USER_PROFILE_PATHS.has(normalizedCurrentPath) && effectiveRole !== "USER") {
      if (redirectPath && redirectPath.startsWith("http")) {
        window.location.assign(redirectPath);
      } else {
        navigate(redirectPath, { replace: true });
      }
      return;
    }

    if (normalizedCurrentPath === "/profile" && effectiveRole !== "USER") {
      if (redirectPath && redirectPath.startsWith("http")) {
        window.location.assign(redirectPath);
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [normalizedCurrentPath, status, user]);

  const isAuthRoute = AUTH_PATHS.has(normalizedCurrentPath);
  const shouldShowRestoreLoader = (status === "idle" || status === "loading") && !isPublicRoute && !isAuthRoute && !user;

  if (shouldShowRestoreLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Restoring session...
      </div>
    );
  }

  return children;
};

export { shouldBootstrapAuthForPath };
export default AuthBootstrap;
