import { useState } from "react";
import { loginUser } from "../services/api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    const res = await loginUser({ email, password });
    if (res.token) {
      localStorage.setItem("token", res.token);
      window.location.href = "/dashboard";
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password with eye icon */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button onClick={submit}>Login</button>

        <p className="extra-text forgot">
          Forgot password?{" "}
          <span onClick={() => (window.location.href = "/forgot")}>
            Reset
          </span>
        </p>

        <p className="extra-text">
          Don’t have an account?{" "}
          <span onClick={() => (window.location.href = "/")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
