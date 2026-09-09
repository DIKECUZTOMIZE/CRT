import { useState } from "react";

import { useCreateEventForm } from "./useCreateEventForm.jsx";

export const useCreateEventPage = (eventId = null) => {
  const formState = useCreateEventForm(eventId);
  const [isLightMode, setIsLightMode] = useState(false);

  const toggleLightMode = () => {
    setIsLightMode((currentValue) => !currentValue);
  };

  return {
    ...formState,
    isLightMode,
    toggleLightMode,
  };
};
