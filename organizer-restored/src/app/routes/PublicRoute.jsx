import { Navigate, Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";

import { getRoleHomePath } from "../utils/roleUtils.js";

const PublicRoute = ({ redirectTo = "/organizer/dashboard" }) => {
  const location = useLocation();
  const { status, user } = useSelector((state) => state.auth);

  if (status === "authenticated" && user) {
    const targetPath = getRoleHomePath(user.role) || redirectTo;
    return <Navigate to={targetPath} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default PublicRoute;
