import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./contexts/UserContext";

const ProtectedRoutes = () => {
  const { username } = useContext(UserContext);
  return username ? <Outlet /> : <Navigate to="/" />; // Essa é a certa 
  // return username ? <Outlet /> : <Outlet />; // desativarr proteção
};
export default ProtectedRoutes;
