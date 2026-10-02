import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notification.api.js";
import { matchesSelectedState } from "../utils/notificationStateMatcher.js";

export { matchesSelectedState };

export const useNotifications = (selectedState = "") => {
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["user-notifications", user?._id || user?.id || "guest"],
    queryFn: () => getNotifications({ page: 1, limit: 20 }),
    enabled: !!(user?._id || user?.id),
    staleTime: 15 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  const allNotifications = useMemo(
    () => (Array.isArray(notificationsQuery.data?.notifications)
      ? notificationsQuery.data.notifications
      : []),
    [notificationsQuery.data]
  );

  const notifications = useMemo(
    () => allNotifications.filter((notification) => matchesSelectedState(notification, selectedState)),
    [allNotifications, selectedState]
  );

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });

  return {
    notifications,
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
    markNotificationRead: markReadMutation.mutateAsync,
    markAllNotificationsRead: markAllReadMutation.mutateAsync,
    refetch: notificationsQuery.refetch,
  };
};
