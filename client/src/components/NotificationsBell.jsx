import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getNotifications, markNotificationsRead } from "../api/users";

function timeAgo(date) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unread = items.filter((n) => !n.readAt).length;

  const load = async () => {
    try {
      const res = await getNotifications();
      setItems(res.data);
    } catch {
      // A failed poll shouldn't disturb the page; it retries shortly.
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);

    if (next && unread > 0) {
      await markNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date() })));
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `${unread} new notifications` : "Notifications"}
        className="relative w-9 h-9 rounded-full grid place-items-center hover:bg-surface-sunk transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>

        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-clay text-canvas text-[10px] font-bold grid place-items-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[320px] bg-surface border border-line rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[11px] tracking-[0.14em] uppercase text-faint">
              Notifications
            </div>
          </div>

          {items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-faint m-0">
              Nothing yet. Follow an organizer and you'll hear when they post a trip.
            </p>
          ) : (
            <ul className="list-none m-0 p-0 max-h-[340px] overflow-y-auto">
              {items.map((n) => (
                <li key={n._id}>
                  <Link
                    to={`/trip/${n.trip._id}`}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-4 border-b border-line-soft hover:bg-canvas transition-colors"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{n.actor?.name}</span> posted a new
                      trip
                    </div>
                    <div className="text-[15px] font-display mt-0.5">{n.trip.title}</div>
                    <div className="text-xs text-faint mt-1">{timeAgo(n.createdAt)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
