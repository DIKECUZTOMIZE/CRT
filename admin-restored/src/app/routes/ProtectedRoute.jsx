import { Navigate } from "react-router";

import { getStoredAdminUser, isAdminUser } from "../../utils/adminAuth.js";

const clearAdminState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("crt-admin-auth");
  sessionStorage.removeItem("crt-admin-user");
  window.localStorage.removeItem("crt_auth_user");
};

const ProtectedRoute = ({ children, redirectTo = "/admin/login" }) => {
  const isAuthenticated = typeof window !== "undefined" && sessionStorage.getItem("crt-admin-auth") === "true";
  const storedUser = getStoredAdminUser();
  const isAdminRole = storedUser ? isAdminUser(storedUser) : false;

  if (!isAuthenticated || !storedUser || !isAdminRole) {
    clearAdminState();
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
