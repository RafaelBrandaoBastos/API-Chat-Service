import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./contexts/UserContext";

const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useContext(UserContext);

  if (loading) return null; // ou um spinner

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoutes;
