import React from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { Toaster } from "sonner";

import { SeoManager } from "../seo/SeoManager";
import { getRoleHomePath, normalizeRole } from "../utils/roleUtils";

// Public Pages
import Home from "../../feature/Home/page/ui/Home";
import Filter from "../../feature/Filter/page/ui/Filter";
import About from "../../feature/About/page/ui/About";

const NotFoundPage = () => (
  <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-slate-100">
    <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">404</p>
      <h1 className="mt-3 text-2xl font-black text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you are trying to open does not exist.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
      >
        Go Home
      </a>
    </div>
  </div>
);

// Auth
import UserLogin from "../../feature/Auth/page/ui/UserLogin";
import UserRegister from "../../feature/Auth/page/ui/UserRegister";

// User
import EventDetails from "../../feature/UserEventDetails/page/ui/UserEventDetails";
import UserProfile from "../../feature/UserProfile/ui/page/UserProfile";

// Guards
import ProtectedRoute from "./ProtectedRoute";
import PublicLayout from "./PublicRoute";

const RouteSeoShell = () => {
  const location = useLocation();

  return (
    <>
      <SeoManager pathname={location.pathname} />
      <Outlet />
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
    </>
  );
};

const AuthRedirectRoute = ({ children }) => {
  const { status, user } = useSelector((state) => state.auth);

  if (status === "authenticated" && user) {
    const role = normalizeRole(user.role);

    if (role === "ADMIN") {
      if (typeof window !== "undefined" && !window.location.href.startsWith("https://admin.crtcompete.com/")) {
        window.location.assign("https://admin.crtcompete.com/admin/dashboard");
      }
      return null;
    }

    if (role === "ORGANIZER") {
      if (typeof window !== "undefined" && !window.location.href.startsWith("https://organizer.crtcompete.com/")) {
        window.location.assign("https://organizer.crtcompete.com/organizer/dashboard");
      }
      return null;
    }

    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const router = createBrowserRouter([
    /*
    |--------------------------------------------------------------------------
    | PUBLIC ROUTES
    |--------------------------------------------------------------------------
    */

    {
      element: <RouteSeoShell />,
      children: [
        {
          element: <PublicLayout />,
          errorElement: <NotFoundPage />,
          children: [
        {
          path: "/",
          element: <Home />,
        },

        {
          path: "/filter",
          element: <Filter />,
        },

        {
          path: "/about",
          element: <About />,
        },

        /*
        |--------------------------------------------------------------------------
        | AUTH
        |--------------------------------------------------------------------------
        */

        {
          path: "/login",
          element: (
            <AuthRedirectRoute>
              <UserLogin />
            </AuthRedirectRoute>
          ),
        },

        {
          path: "/register",
          element: (
            <AuthRedirectRoute>
              <UserRegister />
            </AuthRedirectRoute>
          ),
        },

        /*
        |--------------------------------------------------------------------------
        | PROTECTED USER ROUTES
        |--------------------------------------------------------------------------
        */

        {
          path: "/events/:id",
          element: (
            <ProtectedRoute
              allowedRoles={["USER"]}
              redirectTo="/login"
            >
              <EventDetails />
            </ProtectedRoute>
          ),
        },

        {
          path: "/profile",
          element: (
            <ProtectedRoute
              allowedRoles={["USER"]}
              redirectTo="/login"
            >
              <UserProfile />
            </ProtectedRoute>
          ),
        },

        {
          path: "/user-profile",
          element: (
            <ProtectedRoute
              allowedRoles={["USER"]}
              redirectTo="/login"
            >
              <UserProfile />
            </ProtectedRoute>
          ),
        },

        {
          path: "*",
          element: <NotFoundPage />,
        },
          ],
        },

        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default AppRoutes;