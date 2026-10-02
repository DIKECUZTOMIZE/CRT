import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";

import { getPortalBaseUrl, hasRoleAccess, normalizeRole } from "../utils/roleUtils";

const redirectToCorrectPortal = (role) => {
    const normalized = normalizeRole(role);

    if (normalized === "ADMIN") return getPortalBaseUrl("ADMIN");
    if (normalized === "ORGANIZER") return getPortalBaseUrl("ORGANIZER");

    return "/login";
};

const ProtectedRoute = ({ allowedRoles, redirectTo = "/login", children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { status, user } = useSelector((state) => state.auth);

    if (status !== "authenticated" || !user) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    const normalizedAllowedRoles = (allowedRoles ?? []).map(normalizeRole);
    const hasAllowedAccess = normalizedAllowedRoles.length === 0
      || normalizedAllowedRoles.some((role) => hasRoleAccess(user, role));

    if (!hasAllowedAccess) {
        if (typeof window !== "undefined") {
            const redirectUrl = redirectToCorrectPortal(user.role);
            if (redirectUrl.startsWith("http")) {
                window.location.assign(redirectUrl);
            } else {
                navigate(redirectUrl, { replace: true });
            }
        }

        return null;
    }

    if (!hasRoleAccess(user, "USER")) {
        if (typeof window !== "undefined") {
            const redirectUrl = redirectToCorrectPortal(user.role);
            if (redirectUrl.startsWith("http")) {
                window.location.assign(redirectUrl);
            } else {
                navigate(redirectUrl, { replace: true });
            }
        }
        return null;
    }

    return children || <Outlet />;
};

export default ProtectedRoute;