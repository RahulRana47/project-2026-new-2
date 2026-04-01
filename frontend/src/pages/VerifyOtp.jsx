import { useState } from "react";
import { verifyOtp, resendOtp } from "../services/api";
import "./VerifyOtp.css";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const email = localStorage.getItem("email");

  const handleVerify = async () => {
    if (!otp) {
      setIsError(true);
      setMessage("OTP is required");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await verifyOtp({
        email,
        otp,
      });

      if (res.success) {
        setIsError(false);
        setMessage("OTP verified successfully 🎉");

        // save token
        localStorage.setItem("token", res.token);

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setIsError(true);
        setMessage(res.message || "Invalid OTP");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await resendOtp({ email });

      if (res.success) {
        setIsError(false);
        setMessage("New OTP sent to your email");
      } else {
        setIsError(true);
        setMessage(res.message);
      }
    } catch (err) {
      setIsError(true);
      setMessage("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <h2>Verify OTP</h2>

        {/* MESSAGE */}
        {message && (
          <div className={`msg ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <p className="resend">
          Didn’t receive OTP?{" "}
          <span onClick={handleResend}>Resend</span>
        </p>
      </div>
    </div>
  );
}
