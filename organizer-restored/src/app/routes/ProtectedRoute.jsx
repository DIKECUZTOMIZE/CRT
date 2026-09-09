import { Navigate, Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";

import { getRoleHomePath, normalizeRole } from "../utils/roleUtils.js";

const ProtectedRoute = ({
  children,
  allowedRoles = ["ORGANIZER"],
  redirectTo = "/organizer/login",
}) => {
  const location = useLocation();
  const { status, user } = useSelector((state) => state.auth);

  if (status !== "authenticated" || !user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  const normalizedRole = normalizeRole(user.role);
  const normalizedAllowedRoles = (allowedRoles ?? []).map(normalizeRole);

  if (!normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to={getRoleHomePath(user.role)} replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
