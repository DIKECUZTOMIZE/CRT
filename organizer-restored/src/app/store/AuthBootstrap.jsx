import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { bootstrapAuth } from "../../feature/Auth/state/auth.slice.js";
import { isOrganizerRole } from "../utils/roleUtils.js";

const AUTH_PATHS = new Set([
  "/organizer/login",
  "/organizer/register",
]);

const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();
  const { status, user } = useSelector((state) => state.auth);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPublicAuthPath = currentPath === "/" || AUTH_PATHS.has(currentPath);

  useEffect(() => {
    if (status === "idle" && !isPublicAuthPath) {
      dispatch(bootstrapAuth());
    }
  }, [dispatch, status, isPublicAuthPath]);

  useEffect(() => {
    if (status === "authenticated" && user && AUTH_PATHS.has(currentPath)) {
      if (isOrganizerRole(user.role)) {
        window.location.replace("/organizer/dashboard");
      } else {
        window.location.replace("/organizer/login");
      }
    }
  }, [currentPath, status, user]);

  if ((status === "idle" || status === "loading") && !isPublicAuthPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Verifying organizer session...
      </div>
    );
  }

  return children;
};

export default AuthBootstrap;
