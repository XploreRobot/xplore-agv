import { NavLink, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {

        const confirmLogout = window.confirm(
            "Apakah Anda yakin ingin logout?"
        );

        if (!confirmLogout) return;

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");

    };

    return (

        <div className="sidebar">

            <div className="logo">

                <img
                    src="/logopolman.svg"
                    alt="Logo POLMAN"
                />

                <span>AGV</span>

            </div>

            <div className="menu">

                <NavLink to="/dashboard">
                    Dashboard
                </NavLink>

                <NavLink to="/monitoring">
                    Monitoring
                </NavLink>

                <NavLink to="/control">
                    Control
                </NavLink>

                {/* OTA hanya untuk Developer */}

                {user?.role === "developer" && (

                    <NavLink to="/ota">
                        OTA
                    </NavLink>

                )}

            </div>

            <div className="sidebar-footer">

                <div className="user-info">

                    <h4>
                        {user?.fullname}
                    </h4>

                    <p>
                        {user?.role}
                    </p>

                </div>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </div>

    );

}

export default Sidebar;