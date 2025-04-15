import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./contexts/UserContext";

const ProtectedRoutes = () => {
  const { username } = useContext(UserContext);
  return username ? <Outlet /> : <Navigate to="/" />; // Redirect to login if not authenticated
};
export default ProtectedRoutes;
