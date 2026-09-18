import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import "../styles/register.css";

export default function Register() {
    const navigate = useNavigate();

    // =====================================================
    // STATE
    // =====================================================
    const [form, setForm] = useState({
        fullname: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    // =====================================================
    // HANDLERS
    // =====================================================
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validasi form kosong
        if (!form.fullname || !form.email || !form.username || !form.password || !form.confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        // Validasi password match
        if (form.password !== form.confirmPassword) {
            alert("Password does not match.");
            return;
        }

        try {
            await registerUser({
                fullname: form.fullname,
                email: form.email,
                username: form.username,
                password: form.password,
            });

            alert("Account created successfully!");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Register failed.");
        }
    };

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <div className="register-container">
            
            {/* =================================================
                LEFT SIDE
            ================================================= */}
            <div className="register-left">
                <h1>Fleet Management System</h1>
                <p>
                    Realtime Monitoring and Control
                    <br />
                    Autonomous Guided Vehicle (AGV)
                </p>
                <ul>
                    <li>✔ Live Monitoring</li>
                    <li>✔ MQTT Communication</li>
                    <li>✔ AGV Control</li>
                    <li>✔ Production Dashboard</li>
                </ul>
            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}
            <div className="register-right">
                <form className="register-card" onSubmit={handleRegister}>
                    <h2>Create Account</h2>

                    <input
                        type="text"
                        name="fullname"
                        placeholder="Full Name"
                        value={form.fullname}
                        onChange={handleChange}
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                    />

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

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />

                    <button type="submit">
                        Register
                    </button>

                    <p className="login-link">
                        Already have an account?{" "}
                        <Link to="/">Login</Link>
                    </p>
                </form>
            </div>
            
        </div>
    );
}