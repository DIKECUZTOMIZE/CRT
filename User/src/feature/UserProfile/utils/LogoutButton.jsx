import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import { logoutUser } from "../../Auth/state/auth.slice.js";
import LogoutModal from "./LogoutModal";

export default function LogoutButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      setIsLoggingOut(false);
      setIsModalOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500 hover:text-white active:scale-95"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}