import { Navigate } from "react-router-dom";

export default function DeveloperRoute({ children }) {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {

        return <Navigate to="/" replace />;

    }

    if (user.role !== "developer") {

        return <Navigate to="/dashboard" replace />;

    }

    return children;

}