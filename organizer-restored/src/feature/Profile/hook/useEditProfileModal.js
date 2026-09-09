import { useEffect, useRef, useState } from "react";

import { uploadOrganizerAvatar } from "../api/profile.api.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useEditProfileModal = ({ isOpen, profile, onSave, isSaving = false }) => {
  const [formData, setFormData] = useState(profile || {});
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setSubmitError("");
    }
  }, [profile, isOpen]);

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSubmitError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    try {
      setSubmitError("");
      const uploadedUrl = await uploadOrganizerAvatar(file);

      if (!uploadedUrl) {
        throw new Error("Image upload failed.");
      }

      setFormData((prev) => ({
        ...prev,
        personal: {
          ...(prev?.personal || {}),
          avatar: uploadedUrl,
        },
      }));
    } catch (error) {
      setSubmitError(error?.message || "Image upload failed. Please try again.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const fullName = String(formData?.personal?.fullName || "").trim();
    const email = String(formData?.personal?.email || "").trim();
    const orgName = String(formData?.organization?.name || "").trim();

    if (!fullName) {
      setSubmitError("Full name is required.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setSubmitError("Enter a valid email address.");
      return;
    }

    if (!orgName) {
      setSubmitError("Organization name is required.");
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      setSubmitError(error?.message || "Profile update failed. Please try again.");
    }
  };

  return {
    formData,
    submitError,
    fileInputRef,
    isSaving,
    handleChange,
    handleAvatarChange,
    handleSubmit,
  };
};

export default useEditProfileModal;
