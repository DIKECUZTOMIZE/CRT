import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import {
  loginUser,
  logoutUser,
  registerOrganizerAccount,
  registerUserAccount,
} from "../state/auth.slice.js";
import { normalizeRole } from "../../../app/utils/roleUtils.js";

export const useAuthForm = (mode, redirectPath, allowedRoles) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (formData) => {
    setError("");
    setIsSubmitting(true);

    try {
      const action =
        mode === "user-register"
          ? registerUserAccount(formData)
          : mode === "organizer-register"
            ? registerOrganizerAccount(formData)
            : loginUser(formData);
      const user = await dispatch(action).unwrap();

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("crt-admin-auth");
        sessionStorage.removeItem("crt-admin-user");
        window.localStorage.removeItem("crt_auth_user");
        window.localStorage.setItem("crt_auth_user", JSON.stringify(user));
      }

      if (allowedRoles && Array.isArray(allowedRoles)) {
        const normalizedUserRole = normalizeRole(user?.role);
        const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role));

        if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("crt_auth_user");
          }
          await dispatch(logoutUser()).unwrap();
          throw new Error("Your account type is not authorized to log in here.");
        }
      }

      if (redirectPath) {
        if (typeof window !== "undefined") {
          window.location.replace(redirectPath);
          return;
        }

        navigate(redirectPath, { replace: true });
      }
    } catch (requestError) {
      // Safely extract error message regardless of object or string payload
      const errorMessage =
        typeof requestError === "string"
          ? requestError
          : requestError?.message || requestError?.error || "Authentication failed. Please try again.";

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { error, setError, isSubmitting, submit };
};