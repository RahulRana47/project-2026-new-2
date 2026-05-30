import { useState } from "react";
import { useParams } from "react-router-dom";
import "./Login.css";

export default function ResetPassword() {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async () => {
    const res = await fetch(
      `http://localhost:5000/api/users/password/reset/${token}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword })
      }
    );

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      window.location.href = "/login";
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Reset Password</h2>

        <input
          type="password"
          placeholder="New Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button onClick={submit}>Reset Password</button>
      </div>
    </div>
  );
}
