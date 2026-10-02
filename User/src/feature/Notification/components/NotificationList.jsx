import React, { useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Link } from "react-router";

import { useNotifications } from "../hook/useNotifications.js";
import { resolveNotificationTargetPath } from "../utils/notificationNavigation.js";

const formatRelativeTime = (value) => {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const extractEventTitle = (notification) => {
  const raw = notification?.raw || {};
  const message = String(notification?.message || raw.message || "");

  if (!message) return "Event";
  const liveMatch = message.match(/^(.*?)\s+is now live/i);
  if (liveMatch?.[1]) return liveMatch[1].trim();

  return message.split(".")[0].trim() || "Event";
};

const extractOrganizerName = (notification) => {
  const raw = notification?.raw || {};
  const metadata = notification?.metadata || raw?.metadata || {};
  const organizer = metadata.organizerName || metadata.organizer || raw.organizerName || raw.organizer;
  return organizer ? String(organizer) : "Organizer";
};

const extractNotificationHeading = (notification) => {
  const rawTitle = String(notification?.title || "");
  const title = rawTitle.toLowerCase();

  if (title.includes("updated") || title.includes("status")) {
    if (title.includes("status")) return "Event Status Updated";
    return "Event Updated";
  }

  return "New Event Published";
};

const extractNotificationDetail = (notification) => {
  const raw = notification?.raw || {};
  const metadata = notification?.metadata || raw?.metadata || {};

  if (metadata.location) {
    return `Event is now live in ${metadata.location}.`;
  }

  const message = String(notification?.message || raw.message || "");
  if (message.includes(" is now live in ")) {
    return `Event is now live in ${message.split(" is now live in ")[1].trim()}`;
  }

  return message;
};

const NotificationList = ({ selectedState = "", isOpen = false, onClose, onToggle }) => {
  const {
    notifications,
    isLoading,
    markNotificationRead,
    markAllNotificationsRead,
    refetch,
  } = useNotifications(selectedState);

  const hasUnreadNotifications = notifications.some((notification) => !notification.read);

  const handleNotificationClick = (notification) => {
    const targetPath = resolveNotificationTargetPath(notification);
    const isValidEventPath = /^\/events\/[a-fA-F0-9]{12,24}$/.test(targetPath || "");

    if (!targetPath || !isValidEventPath) {
      onClose?.();
      return;
    }

    onClose?.();

    if (notification?.id) {
      void markNotificationRead(notification.id).catch((error) => {
        console.error("Failed to mark notification as read:", error);
      });
    }
  };

  const renderNotificationItem = (notification, content) => {
    const targetPath = resolveNotificationTargetPath(notification);
    const isValidEventPath = /^\/events\/[a-fA-F0-9]{12,24}$/.test(targetPath || "");

    if (isValidEventPath && targetPath) {
      return (
        <Link
          key={notification.id}
          to={targetPath}
          onClick={(event) => {
            event.stopPropagation();
            handleNotificationClick(notification);
          }}
          className={`block w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-900/80 ${
            !notification.read ? "bg-slate-900/50" : "bg-slate-950"
          }`}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={notification.id}
        type="button"
        onClick={() => handleNotificationClick(notification)}
        className={`block w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-900/80 ${
          !notification.read ? "bg-slate-900/50" : "bg-slate-950"
        }`}
      >
        {content}
      </button>
    );
  };

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#A7F3D0] bg-[rgba(255,255,255,0.82)] text-[#047857] shadow-[0_1px_4px_rgba(6,78,59,0.08)] transition hover:border-[#8AE0B4] hover:bg-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {hasUnreadNotifications && (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-white bg-[#047857] shadow-[0_0_0_2px_rgba(255,255,255,0.78)]" aria-label="Unread notifications" />
        )}
      </button>
    );
  }

  return (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/60">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <p className="text-sm font-bold text-white">Notifications</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 disabled:cursor-not-allowed disabled:text-slate-500"
            disabled={isLoading || notifications.length === 0}
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-emerald-500/40 hover:text-white"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications yet for {selectedState || "your location"}.</div>
        ) : (
          notifications.map((notification) => {
            const eventTitle = extractEventTitle(notification);
            const organizerName = extractOrganizerName(notification);
            const detailText = extractNotificationDetail(notification);
            const relativeTime = formatRelativeTime(notification.raw?.createdAt || notification.raw?.updatedAt || notification.time);
            const heading = extractNotificationHeading(notification);

            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-emerald-300">{heading}</p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      )}
                    </div>

                    <p className="mt-2 text-sm font-semibold text-white">{eventTitle}</p>

                    <p className="mt-1 text-[11px] text-slate-300">Organizer: {organizerName}</p>

                    <p className="mt-2 text-xs leading-5 text-slate-300">{detailText}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    {relativeTime}
                  </span>
                </div>
              </>
            );

            return renderNotificationItem(notification, content);
          })
        )}
      </div>
    </div>
  );
};

export default NotificationList;
