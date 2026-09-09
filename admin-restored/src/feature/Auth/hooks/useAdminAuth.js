import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getCurrentAdmin, loginAdmin, logoutAdmin } from "../api/authApi.js";
import { isAdminUser } from "../../../utils/adminAuth.js";

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentAdmin();

      if (!currentUser || !isAdminUser(currentUser)) {
        sessionStorage.removeItem("crt-admin-auth");
        sessionStorage.removeItem("crt-admin-user");
        navigate("/admin/login", { replace: true });
        return null;
      }

      sessionStorage.setItem("crt-admin-user", JSON.stringify(currentUser));
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      sessionStorage.removeItem("crt-admin-auth");
      sessionStorage.removeItem("crt-admin-user");
      navigate("/admin/login", { replace: true });
      return null;
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      setLoading(true);
      const result = await refreshUser();
      if (active && result) {
        setUser(result);
      }
      if (active) {
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (form) => {
    setError("");
    try {
      await loginAdmin(form);
      const currentUser = await refreshUser();
      return currentUser;
    } catch (err) {
      setError(err.message || "Invalid admin credentials");
      throw err;
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setUser(null);
    window.location.href = "/admin/login";
  }, []);

  return {
    user,
    loading,
    error,
    setError,
    login,
    logout,
    refreshUser,
  };
};
