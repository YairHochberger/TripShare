import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, NavLink, useNavigate } from "react-router-dom";

function TabLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className="relative py-1.5 text-[15px] text-ink hover:text-clay transition-colors"
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-clay" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="max-w-[1180px] mx-auto px-8 h-[68px] flex items-center gap-9">
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B44A26" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M15.5 8.5 10.6 10.6 8.5 15.5 13.4 13.4z" fill="#B44A26" stroke="none" />
          </svg>
          <span className="font-display text-2xl tracking-[-0.01em]">TripShare</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-[26px] flex-1">
          <TabLink to="/dashboard">Trips</TabLink>
          <TabLink to="/people">People</TabLink>
          <TabLink to="/create">Create</TabLink>
        </nav>

        <div className="ml-auto flex items-center gap-3.5">
          <Link
            to="/create"
            className="hidden sm:flex items-center gap-2 bg-ink text-canvas rounded-full px-[18px] py-2.5 text-sm font-medium hover:bg-clay transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New trip
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="w-[34px] h-[34px] rounded-full bg-forest text-canvas grid place-items-center text-sm font-medium">
                {initial}
              </span>
              <span className="hidden sm:block text-sm text-muted max-w-[120px] truncate">
                {user?.name || "Account"}
              </span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-60 bg-surface border border-line rounded-2xl shadow-lg overflow-hidden z-50"
              >
                <div className="px-5 py-4 border-b border-line">
                  <div className="text-[15px] font-medium truncate">{user?.name}</div>
                  <div className="text-xs text-faint mt-0.5">Signed in</div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-ink hover:bg-canvas transition-colors"
                >
                  Edit your profile
                </button>

                {user?.id && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/users/${user.id}`);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-ink hover:bg-canvas transition-colors"
                  >
                    View your public profile
                  </button>
                )}

                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-clay hover:bg-canvas border-t border-line transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="sm:hidden flex items-center gap-5 px-8 pb-3">
        <TabLink to="/dashboard">Trips</TabLink>
        <TabLink to="/people">People</TabLink>
        <TabLink to="/create">Create</TabLink>
        <TabLink to="/profile">Profile</TabLink>
      </nav>
    </header>
  );
}
