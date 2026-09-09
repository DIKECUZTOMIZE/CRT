import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { Toaster } from "sonner";

import AdminLogin from "../../pages/AdminLogin.jsx";
import AdminDashboard from "../../pages/AdminDashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const AppRoutes = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Navigate to="/admin/login" replace />,
    },
    {
      path: "/admin/login",
      element: <AdminLogin />,
    },
    {
      path: "/admin/dashboard",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="dashboard" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/events",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="events" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/events/:eventId",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="events" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/home-slider",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="home-slider" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/users",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="users" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/organizers",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="organizers" />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/profile",
      element: (
        <ProtectedRoute>
          <AdminDashboard initialSection="profile" />
        </ProtectedRoute>
      ),
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
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

export default AppRoutes;
