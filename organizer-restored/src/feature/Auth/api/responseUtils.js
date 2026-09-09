export const normalizeAuthResponse = (response) => {
  if (!response) {
    return null;
  }

  if (response && typeof response === "object" && "success" in response) {
    return response.data ?? response;
  }

  if (response?.data && typeof response.data === "object" && "success" in response.data) {
    return response.data.data ?? response.data;
  }

  return response?.data ?? response;
};
