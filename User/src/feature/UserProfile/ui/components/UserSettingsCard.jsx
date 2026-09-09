import React, { useState } from "react";
import { LogOut, ArrowUpRight } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { logoutUser } from "../../../Auth/state/auth.slice.js";
import LogoutModal from "../../utils/LogoutModal";
 
export default function UserSettingsCard() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleConfirmLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      setIsLogoutOpen(false);
      navigate("/login", { replace: true });
    }
  };

  const handleOpenOrganizerPortal = () => {
    window.open("http://localhost:5175/organizer/dashboard", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
        Account Actions
      </h3>

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleOpenOrganizerPortal}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-slate-950"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Open Organizer Portal</span>
        </button>

        <button
          onClick={() => setIsLogoutOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-400 transition-all hover:bg-rose-600 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out of Account</span>
        </button>
      </div>

      {/* Modal */}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}