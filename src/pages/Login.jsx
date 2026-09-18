import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import "../styles/login.css";

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async () => {
        try {
            const res = await loginUser(form);

            // Simpan token
            localStorage.setItem("token", res.data.token);

            // Simpan data user
            localStorage.setItem("user", JSON.stringify(res.data.user));

            // Redirect ke dashboard
            navigate("/dashboard");
        } catch (err) {
            alert(err.response?.data?.message || "Login gagal!");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Fleet Management</h1>
                <p>AGV Control & Monitoring System</p>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                />

                <button onClick={handleLogin}>
                    Login
                </button>

                <p className="register-link">
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;