import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, NavLink, useNavigate } from "react-router-dom";

function navLinkClass({ isActive }) {
  return `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account menu on an outside click or Escape.
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
    <header className="bg-white/90 backdrop-blur rounded-2xl shadow-sm ring-1 ring-black/5 mb-6">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Link to="/dashboard" className="flex items-center gap-2 mr-2">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
            🌍
          </span>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TripShare
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/create" className={navLinkClass}>
            Create Trip
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/create"
            className="hidden sm:inline-flex items-center gap-1 bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <span className="text-base leading-none">+</span> New Trip
          </Link>

          {/* Account menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                {initial}
              </span>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name || "Account"}
              </span>
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-400">Signed in</div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  ⚙️ Edit your profile
                </button>

                {user?.id && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/users/${user.id}`);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    👤 View your public profile
                  </button>
                )}

                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t flex items-center gap-2"
                >
                  ↩︎ Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Small screens: the nav links move onto their own row */}
      <nav className="sm:hidden flex items-center gap-1 px-4 pb-2">
        <NavLink to="/dashboard" className={navLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/create" className={navLinkClass}>
          Create Trip
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          Profile
        </NavLink>
      </nav>
    </header>
  );
}
