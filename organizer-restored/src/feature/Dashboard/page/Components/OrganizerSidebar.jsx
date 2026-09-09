import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Headphones,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";
import LogoutConfirmModal from "../../../../shared/components/LogoutConfirmModal.jsx";
import { logoutUser } from "../../../Auth/state/auth.slice.js";

const mainLinks = [
  {
    label: "Dashboard",
    path: "/organizer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Events List",
    path: "/organizer/events",
    icon: CalendarDays,
  },
  {
    label: "Create Event",
    path: "/organizer/events/create",
    icon: PlusCircle,
  },
];

const OrganizerSidebar = ({ mobile = false, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleNavigate = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);

    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/organizer/login", { replace: true });
    }
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_3px_0_0_#10b981]"
        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
    }`;

  return (
    <aside
      className={`min-h-screen shrink-0 border-r border-slate-800/80 bg-slate-950 ${
        mobile ? "block w-72" : "hidden w-64 lg:block"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="h-4 w-4 text-slate-950" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">CRT Organizer</h2>
            <p className="text-[10px] font-medium text-slate-500">Control Panel</p>
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] flex-col p-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Navigation
          </p>

          <nav className="space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  end
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigate}
                  className={linkClass}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Account
            </p>

            <nav className="space-y-1">
              <NavLink
                to="/organizer/support"
                onClick={handleNavigate}
                className={linkClass}
              >
                <Headphones className="h-5 w-5 shrink-0" />
                <span>Platform Support</span>
              </NavLink>

              <NavLink
                to="/organizer/profile"
                onClick={handleNavigate}
                className={linkClass}
              >
                <UserCircle className="h-5 w-5 shrink-0" />
                <span>Organizer Profile</span>
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  setShowLogoutModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </aside>
  );
};

export default OrganizerSidebar;