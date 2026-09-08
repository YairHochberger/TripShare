import { useState } from "react";
import { register } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";

const field =
  "w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isPrivate: false,
    emergencyContact: { name: "", phone: "" },
  });

  const setContact = (key, value) =>
    setForm({ ...form, emergencyContact: { ...form.emergencyContact, [key]: value } });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
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
          Organize one trip,
          <br />
          <em>join</em> the next.
        </h1>
        <p className="m-0 text-base leading-[1.55] text-muted max-w-[46ch]">
          No fixed roles — lead a trek this month, tag along on someone else's next month.
        </p>
      </div>

      <div className="w-full max-w-[420px] lg:justify-self-end">
        <div className="bg-surface border border-line rounded-[20px] p-8">
          <h2 className="font-display text-[30px] m-0 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span className="block text-[13px] text-muted mb-2">Name</span>
              <input
                className={field}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="block text-[13px] text-muted mb-2">Email</span>
              <input
                className={field}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="block text-[13px] text-muted mb-2">Password</span>
              <input
                className={field}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <div className="border-t border-line pt-4">
              <div className="text-[13px] font-medium mb-1">Emergency contact</div>
              <p className="m-0 mb-3 text-[13px] text-faint leading-[1.5]">
                Someone we can reach if something happens on a trip. Only the organizer
                of a trip you join can see this.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  className={field}
                  placeholder="Contact name"
                  value={form.emergencyContact.name}
                  onChange={(e) => setContact("name", e.target.value)}
                  required
                />
                <input
                  className={field}
                  type="tel"
                  placeholder="Contact phone"
                  value={form.emergencyContact.phone}
                  onChange={(e) => setContact("phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-3 bg-canvas border border-line rounded-[10px] p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-[#2F5646]"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">Keep my profile private</span>
                <span className="block text-[13px] text-faint leading-[1.5] mt-0.5">
                  You won't show up in search, and only people on the same trip as you can
                  see your profile. You can change this later.
                </span>
              </span>
            </label>

            {error && <p className="text-sm text-clay-deep m-0">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-canvas rounded-full px-5 py-3.5 text-[15px] font-medium hover:bg-clay disabled:opacity-60 transition-colors mt-1"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="text-sm text-center text-faint mt-6 mb-0">
            Already have an account?{" "}
            <Link to="/login" className="text-clay hover:text-clay-deep">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
