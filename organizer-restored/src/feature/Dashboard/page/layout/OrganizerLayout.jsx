import React, { useState } from "react";
import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import OrganizerSidebar from "../Components/OrganizerSidebar.jsx";

const OrganizerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-xl p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          aria-label="Open organizer menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <h1 className="ml-3 text-lg font-bold text-emerald-400">CRT Organizer</h1>
      </header>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close organizer menu"
          onClick={closeSidebar}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-60 w-72 transform transition-transform duration-300 lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <OrganizerSidebar mobile onClose={closeSidebar} />
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-screen">
        <OrganizerSidebar />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrganizerLayout;
