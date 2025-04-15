import { Outlet, Navigate } from 'react-router-dom';
import { useContext} from "react";
import { UserContext } from "./pages/UserContext";
const ProtectedRoutes = () => {
    const  user  = useContext(UserContext);
    return user ? <Outlet /> : <Navigate to="/"/> // Redirect to login if not authenticated
}
export default ProtectedRoutes;