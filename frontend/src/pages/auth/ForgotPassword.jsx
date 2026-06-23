import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import {
  EnvelopeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => document.getElementById("email")?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }
      setSuccess("Password reset instructions have been sent to your email.");
      setEmail("");
    } catch (err) {
      setError(err.message);
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
            <ShieldCheckIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Reset your password
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Enter your email and we'll send you reset instructions.
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
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
              Email address
            </label>
            <div className="relative">
              <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@lab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="auth-btn !mt-6">
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                Send reset instructions
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-7 text-center">
          <Link to="/login" className="inline-flex items-center text-sm font-medium" style={{ color: "var(--primary)" }}>
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
