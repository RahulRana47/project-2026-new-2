import { useState } from "react";
import { registerUser } from "../services/api";
import { Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "tourist",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setIsError(true);
      setMessage("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setIsError(true);
      setMessage("Password and Confirm Password do not match");
      return;
    }

    setLoading(true);
    setIsError(false);
    setMessage("");

    const { confirmPassword, ...payload } = form;

    try {
      const res = await registerUser(payload);

      if (res.success) {
        setIsError(false);
        setMessage("OTP sent to your email");
        localStorage.setItem("email", form.email);

        setTimeout(() => {
          window.location.href = "/verify";
        }, 1500);
      } else {
        setIsError(true);
        setMessage(res.message || "Registration failed");
      }
    } catch (error) {
      setIsError(true);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <form className="register-card" onSubmit={submit}>
        <h2>Create Account</h2>

        {/* MESSAGE */}
        {message && (
          <div className={`msg ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone Number"
          maxLength="10"
          value={form.phone}
          onChange={handleChange}
        />

        {/* PASSWORD */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* ROLE */}
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="tourist">Tourist</option>
          <option value="guide">Guide / Helper</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {/* 👇 ALREADY HAVE ACCOUNT */}
        <p className="login-link">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
