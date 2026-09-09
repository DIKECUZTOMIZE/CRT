import { Navigate, Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";

import { normalizeRole } from "../utils/roleUtils";

const redirectToCorrectPortal = (role) => {
    const normalized = normalizeRole(role);

    if (normalized === "ADMIN") return "http://localhost:5174/admin/dashboard";
    if (normalized === "ORGANIZER") return "http://localhost:5175/organizer/dashboard";

    return "/login";
};

const ProtectedRoute = ({ allowedRoles, redirectTo = "/login", children }) => {
    const location = useLocation();
    const { status, user } = useSelector((state) => state.auth);

    if (status !== "authenticated" || !user) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    const normalizedRole = normalizeRole(user.role);
    const normalizedAllowedRoles = (allowedRoles ?? []).map(normalizeRole);

    if (allowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("crt_auth_user");
            window.location.replace(redirectToCorrectPortal(normalizedRole));
        }

        return null;
    }

    if (normalizedRole !== "USER") {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("crt_auth_user");
            window.location.replace(redirectToCorrectPortal(normalizedRole));
        }
        return null;
    }

    return children || <Outlet />;
};

export default ProtectedRoute;