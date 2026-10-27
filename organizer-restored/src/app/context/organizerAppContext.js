import { createContext, useContext } from "react";

export const OrganizerAppContext = createContext(null);

export const useOrganizerApp = () => {
  const context = useContext(OrganizerAppContext);

  if (!context) {
    throw new Error("useOrganizerApp must be used within OrganizerAppProvider");
  }

  return context;
};
