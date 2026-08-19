import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import type { Role } from "../api/types";

export function ProtectedRoute({ roles, redirectTo }: { roles: Role[]; redirectTo: string }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  if (!roles.includes(session.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
