import React from "react";
import { useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
  Home as HomeIcon,
  SlidersHorizontal,
  Plus,
  Info,
  User,
} from "lucide-react";

const MOBILE_TABS = [
  {
    id: "home",
    label: "Home",
    path: "/",
    icon: HomeIcon,
  },
  {
    id: "filter",
    label: "Filter",
    path: "/filter",
    icon: SlidersHorizontal,
  },
  {
    id: "about",
    label: "About",
    path: "/about",
    icon: Info,
  },
  {
    id: "account",
    label: "Account",
    path: "/profile",
    icon: User,
  },
];

const MobileTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const accountPath = "/profile";

  const handleAccountClick = () => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(accountPath, { replace: true });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-[calc(4.25rem+env(safe-area-inset-bottom))] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path) ||
                (item.id === "account" && (location.pathname === "/login" || location.pathname === "/register"));

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.id === "account" ? handleAccountClick : () => navigate(item.path)}
              className={`flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-all duration-200 ${
                isActive ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isActive ? "bg-emerald-500/10" : ""
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;