import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAdminDashboardData } from "../api/dashboardApi.js";

const emptyDashboardData = {
  summary: [],
  recentActivity: [],
  quickActions: [],
  users: [],
  organizers: [],
  events: [],
};

export const useAdminDashboard = () => {
  const [search, setSearch] = useState("");

  const {
    data: dashboardData = emptyDashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboardData,
    staleTime: 60_000,
  });

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return dashboardData.users;

    return dashboardData.users.filter((row) =>
      [row.name, row.email, row.role, row.status].some((value) =>
        String(value).toLowerCase().includes(keyword)
      )
    );
  }, [dashboardData.users, search]);

  const filteredOrganizers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return dashboardData.organizers;

    return dashboardData.organizers.filter((row) =>
      [row.name, row.email, row.status].some((value) =>
        String(value).toLowerCase().includes(keyword)
      )
    );
  }, [dashboardData.organizers, search]);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return dashboardData.events;

    return dashboardData.events.filter((row) => {
      const searchableValues = [
        row.title,
        row.organizer,
        row.organizerName,
        row.category,
        row.status,
        row.eventMode,
        row.location,
        row.venueAddress,
        row.eventDate,
        row.eventStartTime,
        row.eventEndTime,
        row.id,
        row._id,
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [dashboardData.events, search]);

  return {
    dashboardData,
    search,
    setSearch,
    filteredUsers,
    filteredOrganizers,
    filteredEvents,
    isLoading,
    isError,
    error,
    refetch,
  };
};
