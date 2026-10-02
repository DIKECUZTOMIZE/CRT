import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router";
import Navbar from "../layout/Navbar.jsx";
import MobileTabBar from "../layout/MobileTabBar.jsx";
import { syncUserLocation } from "../store/location.slice.js";
import { socket, listenToLocationUpdates } from "../config/socket.js";

const GlobalLocationBadge = () => {
  const currentLocation = useSelector((state) => state.location);
  const locationText =
    currentLocation?.city && currentLocation.city !== "All India"
      ? `${currentLocation.city}, ${currentLocation.state}`
      : currentLocation?.state || "India";

  return (
    <div className="border-b border-[#E2E8F0] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(16,185,129,0.06)_0%,rgba(255,255,255,0)_100%),#FFFFFF] px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 text-[10px] sm:text-xs">
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#059669] shadow-[0_0_12px_rgba(16,185,129,0.12)]" />
          <span className="truncate font-medium text-slate-700">Current location</span>
        </div>
        <div className="ml-auto flex max-w-[58%] items-center justify-end rounded-full border border-[#E2E8F0] bg-[#F4F9F6] px-2.5 py-1 text-right shadow-[0_1px_3px_rgba(6,78,59,0.04)] sm:max-w-[65%]">
          <span className="truncate font-semibold tracking-[0.02em] text-[#059669]">{locationText}</span>
        </div>
      </div>
    </div>
  );
};

const PublicLayout = ({ children }) => {
  const dispatch = useDispatch();
  const content = children ?? <Outlet />;

  useEffect(() => {
    if (!socket) return undefined;

    const handleLocationUpdate = (payload) => {
      if (!payload || typeof payload !== "object") return;
      dispatch(syncUserLocation(payload));
    };

    const unsubscribe = listenToLocationUpdates(handleLocationUpdate);
    return unsubscribe;
  }, [dispatch]);

  return (
    <div className="flex min-h-screen flex-col justify-between overflow-x-hidden bg-[#FAFCFA] text-slate-900">
      <Navbar />
      <GlobalLocationBadge />

      <main className="flex-1 bg-[#FAFCFA] pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-4 lg:pb-0">
        {content}
      </main>

      <MobileTabBar />
    </div>
  );
};

export default PublicLayout;