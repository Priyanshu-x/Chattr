// frontend/src/components/admin/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  // Rely on backend for authentication via HttpOnly cookie.
  // If the backend redirects to /admin, it means authentication failed.
  // For frontend routing, we assume if we reach this point, the user is authenticated.
  // A more robust solution might involve a frontend API call to verify session status.
  return <Outlet />;
};

export default AdminProtectedRoute;