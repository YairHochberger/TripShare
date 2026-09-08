import { useState, useContext } from "react";
import { login } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const field =
  "w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      loginUser(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-[1180px] mx-auto px-8 min-h-screen grid lg:grid-cols-2 gap-16 items-center">
      <div className="max-w-[520px]">
        <div className="flex items-center gap-2.5 mb-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B44A26" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M15.5 8.5 10.6 10.6 8.5 15.5 13.4 13.4z" fill="#B44A26" stroke="none" />
          </svg>
          <span className="font-display text-2xl">TripShare</span>
        </div>

        <h1 className="font-display text-[52px] leading-[1.02] tracking-[-0.02em] m-0 mb-4 text-pretty">
          One weekend, six people,
          <br />
          <em>one plan</em> everyone agreed on.
        </h1>
        <p className="m-0 text-base leading-[1.55] text-muted max-w-[46ch]">
          Destinations, lodging, costs and who's actually coming — settled in one place
          before anyone packs a bag.
        </p>
      </div>

      <div className="w-full max-w-[420px] lg:justify-self-end">
        <div className="bg-surface border border-line rounded-[20px] p-8">
          <h2 className="font-display text-[30px] m-0 mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span className="block text-[13px] text-muted mb-2">Email</span>
              <input
                className={field}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="block text-[13px] text-muted mb-2">Password</span>
              <input
                className={field}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="text-sm text-clay-deep m-0">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-canvas rounded-full px-5 py-3.5 text-[15px] font-medium hover:bg-clay disabled:opacity-60 transition-colors mt-1"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="text-sm text-center text-faint mt-6 mb-0">
            Don't have an account?{" "}
            <Link to="/register" className="text-clay hover:text-clay-deep">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
