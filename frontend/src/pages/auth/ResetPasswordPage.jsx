import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LockClosedIcon,
  ArrowLeftIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid reset link");
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => document.getElementById("password-input")?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or expired reset link");
      return;
    }
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Both fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      setSuccess("Your password has been reset successfully. Redirecting to sign in...");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid-overlay" />

      <div className="auth-card">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="auth-logo mb-4">
            <KeyIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Create new password
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Choose a strong password you don't use elsewhere.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-5">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-5">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password-input" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
              New password
            </label>
            <div className="relative">
              <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-faint)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-input" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
              Confirm password
            </label>
            <div className="relative">
              <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              <input
                id="confirm-input"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="auth-btn !mt-6">
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className="mt-7 text-center">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center text-sm font-medium bg-transparent border-none cursor-pointer"
            style={{ color: "var(--primary)" }}
          >
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
