import { Navigate } from "react-router";

import { useAdminAuth } from "../../feature/Auth/hooks/useAdminAuth.js";
import { isAdminUser } from "../../utils/adminAuth.js";

const ProtectedRoute = ({ children, redirectTo = "/admin/login" }) => {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return null;
  }

  if (!user || !isAdminUser(user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
