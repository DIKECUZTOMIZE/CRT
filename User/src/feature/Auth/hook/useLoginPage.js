import { useEffect, useMemo, useRef, useState } from "react";

import { getRegisteredEmails, requestPasswordReset, resetPasswordWithOtp } from "../api/auth.api.js";
import { getOtpCountdown } from "../../../shared/utils/passwordResetTimer.js";
import { useAuthForm } from "./useAuthForm.jsx";

export const useLoginPage = ({
  redirectPath,
  allowedRoles,
  requireResetPasswordConfirmation = false,
}) => {
  const { error, isSubmitting, submit, setError } = useAuthForm("login", redirectPath, allowedRoles);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [registeredEmails, setRegisteredEmails] = useState([]);
  const [isLoadingRegisteredEmails, setIsLoadingRegisteredEmails] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetStatus, setResetStatus] = useState("idle");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);

  const forgotPasswordRef = useRef(null);

  const otpCountdown = useMemo(() => {
    if (!otpExpiresAt) {
      return { isExpired: false, text: "05:00" };
    }

    return getOtpCountdown(otpExpiresAt);
  }, [otpExpiresAt]);

  useEffect(() => {
    if (!otpExpiresAt || resetStatus !== "otp-sent") {
      return undefined;
    }

    const timer = setInterval(() => {
      const next = getOtpCountdown(otpExpiresAt);
      if (next.isExpired) {
        setResetStatus("expired");
        setResetMessage("OTP expired. Please resend OTP to continue.");
        setResetOtp("");
        setResetPassword("");
        setResetConfirmPassword("");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiresAt, resetStatus]);

  useEffect(() => {
    if (!showForgotPassword) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      forgotPasswordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [showForgotPassword, resetStatus]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const loadRegisteredEmails = async () => {
    if (registeredEmails.length > 0) {
      return;
    }

    try {
      setIsLoadingRegisteredEmails(true);
      const response = await getRegisteredEmails();
      const emails = Array.isArray(response?.emails) ? response.emails : [];
      setRegisteredEmails(emails);

      if (emails.length > 0 && !resetEmail) {
        setResetEmail(formData.email || emails[0]);
      }
    } catch {
      setRegisteredEmails([]);
    } finally {
      setIsLoadingRegisteredEmails(false);
    }
  };

  const handleForgotPasswordToggle = async () => {
    const next = !showForgotPassword;
    setShowForgotPassword(next);
    setResetMessage("");
    setResetOtp("");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetStatus("idle");
    setOtpExpiresAt(null);
    setResetEmail(formData.email || "");

    if (next) {
      await loadRegisteredEmails();
    }
  };

  const resetRequestButtonLabel = useMemo(() => {
    if (resetStatus === "otp-sent" || resetStatus === "expired") return "Resend OTP";
    return "Send OTP";
  }, [resetStatus]);

  const handleRequestOtp = async () => {
    const email = (resetEmail || formData.email || "").trim().toLowerCase();

    if (!email) {
      setResetMessage("Please select your registered email first.");
      return;
    }

    try {
      setIsResetSubmitting(true);
      setResetMessage("Sending OTP to your selected email...");

      const response = await requestPasswordReset({ email });
      setResetStatus("otp-sent");
      setOtpExpiresAt(Number(response?.expiresAt ?? Date.now() + 5 * 60 * 1000));
      setResetMessage("OTP sent to your email. Check your inbox and spam folder, then enter the code below.");

      window.requestAnimationFrame(() => {
        forgotPasswordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (requestError) {
      setResetStatus("idle");
      setResetMessage(requestError?.message || "Unable to send reset OTP.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = (resetEmail || formData.email || "").trim().toLowerCase();
    const otp = String(resetOtp || "").trim();
    const password = String(resetPassword || "").trim();
    const confirmPassword = String(resetConfirmPassword || "").trim();

    if (!email || !otp || !password || (requireResetPasswordConfirmation && !confirmPassword)) {
      setResetMessage(
        requireResetPasswordConfirmation
          ? "Enter your email, OTP, new password, and confirm password to continue."
          : "Enter your email, OTP, and new password to continue.",
      );
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setResetMessage("OTP must be a 6-digit number.");
      return;
    }

    if (password.length < 8) {
      setResetMessage("New password must be at least 8 characters long.");
      return;
    }

    if (requireResetPasswordConfirmation && password !== confirmPassword) {
      setResetMessage("New password and confirm password do not match.");
      return;
    }

    if (otpExpiresAt && getOtpCountdown(otpExpiresAt).isExpired) {
      setResetStatus("expired");
      setResetMessage("OTP expired. Please resend OTP and try again.");
      return;
    }

    try {
      setIsResetSubmitting(true);
      setResetMessage("");

      const response = await resetPasswordWithOtp({
        email,
        otp,
        newPassword: password,
      });

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("crt_auth_user");
      }

      setResetStatus("done");
      setResetMessage(response?.message || "Password reset successfully. Please log in again.");
      setResetOtp("");
      setResetPassword("");
      setResetConfirmPassword("");
      setOtpExpiresAt(null);

      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStatus("idle");
        setResetMessage("");
        window.location.replace(redirectPath || "/login");
      }, 1500);
    } catch (requestError) {
      setResetStatus("otp-sent");
      setResetMessage(requestError?.message || "Password reset failed. Please try again.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void submit(formData);
  };

  return {
    error,
    isSubmitting,
    submit,
    setError,
    formData,
    updateField,
    handleSubmit,
    showForgotPassword,
    setShowForgotPassword,
    resetEmail,
    setResetEmail,
    registeredEmails,
    isLoadingRegisteredEmails,
    resetOtp,
    setResetOtp,
    resetPassword,
    setResetPassword,
    resetConfirmPassword,
    setResetConfirmPassword,
    resetMessage,
    setResetMessage,
    resetStatus,
    setResetStatus,
    isResetSubmitting,
    otpCountdown,
    otpExpiresAt,
    setOtpExpiresAt,
    forgotPasswordRef,
    resetRequestButtonLabel,
    handleForgotPasswordToggle,
    handleRequestOtp,
    handlePasswordReset,
  };
};
