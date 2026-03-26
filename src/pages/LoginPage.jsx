import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { extractError } from "../api";
import { useAuth } from "../App";
import { persistUserSession } from "../utils/authStorage";

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", form);
      const responseBody = response.data;
      const token = responseBody?.token || responseBody?.jwt || "";
      const user = persistUserSession(responseBody, token);
      setUser(user);

      if (user.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === "STAFF") {
        navigate("/staff-dashboard", { replace: true });
      } else {
        navigate("/user-dashboard", { replace: true });
      }
    } catch (err) {
      setError(extractError(err, "Login failed"));
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit">Login</button>
        <p>
          New user? <Link to="/register">Create account</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
