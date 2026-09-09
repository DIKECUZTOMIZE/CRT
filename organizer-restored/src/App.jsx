import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useSelector } from "react-redux";
import { Toaster } from "sonner";

import OrganizerLogin from "./pages/OrganizerLogin.jsx";
import OrganizerRegister from "./pages/OrganizerRegister.jsx";
import OrganizerDashboard from "./pages/OrganizerDashboard.jsx";
import OrganizerLayout from "./feature/Dashboard/page/layout/OrganizerLayout.jsx";
import OrganizerEvents from "./feature/Event/OrganizerEvents.jsx";
import CreateEvent from "./feature/EventCreate/page/ui/CreateEvent.jsx";
import OrganizerProfile from "./feature/Profile/ui/page/OrganizerProfile.jsx";
import PlatformSupport from "./feature/Support/PlatformSupport.jsx";
import OrganizerEventDetails from "./feature/OrganizerEventDetails/page/ui/OrganizerEventDetails.jsx";
import { isOrganizerRole } from "./app/utils/roleUtils.js";

const ProtectedOrganizerRoute = ({ children }) => {
  const { status, user } = useSelector((state) => state.auth);

  if (status !== "authenticated" || !user) {
    return <Navigate to="/organizer/login" replace />;
  }

  if (!isOrganizerRole(user.role)) {
    if (user.role === "ADMIN") {
      window.location.replace("http://localhost:5174/admin/dashboard");
      return null;
    }

    if (user.role === "USER") {
      window.location.replace("http://localhost:5173/profile");
      return null;
    }

    return <Navigate to="/organizer/login" replace />;
  }

  return children;
};

const PublicOrganizerRoute = ({ children }) => {
  const { status, user } = useSelector((state) => state.auth);

  if (status === "authenticated" && user && isOrganizerRole(user.role)) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  if (status === "authenticated" && user) {
    if (user.role === "ADMIN") {
      window.location.replace("http://localhost:5174/admin/dashboard");
      return null;
    }

    if (user.role === "USER") {
      window.location.replace("http://localhost:5173/profile");
      return null;
    }
  }

  return children;
};

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
    <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">404</p>
      <h1 className="mt-3 text-2xl font-black text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you are looking for does not exist or you do not have access to it.
      </p>
      <button
        type="button"
        onClick={() => window.location.href = "/organizer/login"}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
      >
        Go to Login
      </button>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/organizer/login" replace />} />

        <Route
          path="/organizer/login"
          element={
            <PublicOrganizerRoute>
              <OrganizerLogin />
            </PublicOrganizerRoute>
          }
        />

        <Route
          path="/organizer/register"
          element={
            <PublicOrganizerRoute>
              <OrganizerRegister />
            </PublicOrganizerRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <ProtectedOrganizerRoute>
              <OrganizerLayout />
            </ProtectedOrganizerRoute>
          }
          errorElement={<NotFoundPage />}
        >
          <Route index element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="dashboard" element={<OrganizerDashboard />} />
          <Route path="events" element={<OrganizerEvents />} />
          <Route path="events/create" element={<CreateEvent />} />
          <Route path="events/:id/edit" element={<CreateEvent />} />
          <Route path="events/:id" element={<OrganizerEventDetails />} />
          <Route path="profile" element={<OrganizerProfile />} />
          <Route path="support" element={<PlatformSupport />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster
        richColors
        position="top-right"
        closeButton
        theme="dark"
        offset={20}
        visibleToasts={5}
        toastOptions={{
          duration: 3500,
          style: {
            zIndex: 999999,
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
