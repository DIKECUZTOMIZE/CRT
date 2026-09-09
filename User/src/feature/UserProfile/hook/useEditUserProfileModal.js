import { useEffect, useRef, useState } from "react";

import { uploadUserAvatar } from "../api/userProfile.api.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useEditUserProfileModal = ({ isOpen, profile, onSave }) => {
  const [formData, setFormData] = useState(profile || { personal: {} });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData(profile || { personal: {} });
    setUploadError("");
  }, [profile, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personal: {
        ...(prev?.personal || {}),
        [field]: value,
      },
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const imageUrl = await uploadUserAvatar(file);
      if (!imageUrl) {
        throw new Error("Image upload failed.");
      }

      setFormData((prev) => ({
        ...prev,
        personal: {
          ...(prev?.personal || {}),
          avatar: imageUrl,
        },
      }));
    } catch (error) {
      setUploadError(error?.message || "Image upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploadError("");

    const fullName = String(formData?.personal?.fullName || "").trim();
    const email = String(formData?.personal?.email || "").trim();

    if (!fullName) {
      setUploadError("Full name is required.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setUploadError("Enter a valid email address.");
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      setUploadError(error?.message || "Profile update failed. Please try again.");
    }
  };

  return {
    formData,
    isUploading,
    uploadError,
    fileInputRef,
    setUploadError,
    handleChange,
    handleImageUpload,
    handleSubmit,
  };
};

export default useEditUserProfileModal;
