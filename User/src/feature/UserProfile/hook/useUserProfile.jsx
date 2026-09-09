import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getSavedEvents } from "../api/userProfile.api.js";

const normalizeUserProfile = (user) => {
  if (!user || typeof user !== "object") {
    return {
      id: null,
      name: "User",
      username: "User",
      email: "",
      role: "USER",
      avatar: "",
      savedEvents: 0,
      interestedEvents: 0,
      rewardPoints: 0,
    };
  }

  const username = user.username || user.name || user.fullName || "User";

  const avatar = user.avatar || user.profileImage || user.picture || user.image || "";

  return {
    id: user._id || user.id || null,
    name: user.name || user.fullName || username,
    username,
    email: user.email || "",
    role: user.role || "USER",
    avatar,
    savedEvents: Number(user.savedEvents ?? 0),
    interestedEvents: Number(user.interestedEvents ?? 0),
    rewardPoints: Number(user.rewardPoints ?? 0),
    raw: user,
  };
};

export const useUserProfile = () => {
  const authUser = useSelector((state) => state.auth.user);
  const authStatus = useSelector((state) => state.auth.status);

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    enabled: !!authUser && authStatus === "authenticated",
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const savedEventsQuery = useQuery({
    queryKey: ["user-saved-events"],
    queryFn: getSavedEvents,
    enabled: !!authUser && authStatus === "authenticated",
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const user = useMemo(
    () => normalizeUserProfile(profileQuery.data || authUser || null),
    [authUser, profileQuery.data]
  );

  return {
    user,
    savedEvents: Array.isArray(savedEventsQuery.data) ? savedEventsQuery.data : [],
    savedEventIds: Array.isArray(savedEventsQuery.data)
      ? savedEventsQuery.data.map((event) => String(event?.id || event?._id))
      : [],
    isLoading: (profileQuery.isLoading || savedEventsQuery.isLoading) && !!authUser,
    isError: profileQuery.isError || savedEventsQuery.isError,
    error: profileQuery.error || savedEventsQuery.error,
    refetchSavedEvents: savedEventsQuery.refetch,
  };
};
