export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }

    if (host.includes("crtcompete.com")) {
      return "https://api.crtcompete.com";
    }
  }

  return "https://api.crtcompete.com";
};

export const API_BASE_URL = getApiBaseUrl();
