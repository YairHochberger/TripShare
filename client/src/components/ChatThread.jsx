import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";

function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(d) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString();
}

// Colour the name tag per person so a group thread is easy to follow.
const NAME_COLORS = [
  "text-rose-600",
  "text-emerald-600",
  "text-violet-600",
  "text-amber-600",
  "text-cyan-600",
];
function nameColor(id = "") {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return NAME_COLORS[sum % NAME_COLORS.length];
}

// Used for both conversations in the app: the trip group chat and the
// private applicant/organiser thread. The caller supplies the loaders.
export default function ChatThread({
  loadMessages,
  sendMessage,
  emptyLabel = "No messages yet. Say hello!",
  height = 320,
  pollMs = 8000,
}) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  // Without this the thread flashes "no messages yet" before the first load.
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  const refresh = async () => {
    try {
      const res = await loadMessages();
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load messages.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    if (!pollMs) return;

    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setError("");
    setSending(true);
    try {
      await sendMessage(trimmed);
      setText("");
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-2xl bg-slate-100 border border-slate-200 p-3 space-y-1"
        style={{ height }}
      >
        {!loaded ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-white/70 h-10 w-2/5 rounded-2xl" />
            <div className="animate-pulse bg-blue-200 h-10 w-1/2 rounded-2xl ml-auto" />
            <div className="animate-pulse bg-white/70 h-10 w-1/3 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-400">{emptyLabel}</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const senderId = String(m.sender?._id || "");
            const mine = senderId === String(user?.id || "");

            const newDay =
              !prev ||
              new Date(prev.createdAt).toDateString() !==
                new Date(m.createdAt).toDateString();

            // Group runs from the same person so only the first shows a name.
            const startsRun =
              newDay || !prev || String(prev.sender?._id) !== senderId;

            return (
              <div key={m._id}>
                {newDay && (
                  <div className="flex justify-center my-3">
                    <span className="bg-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full">
                      {formatDay(m.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${mine ? "justify-end" : "justify-start"} ${
                    startsRun ? "mt-2" : "mt-0.5"
                  }`}
                >
                  <div
                    className={`max-w-[78%] px-3 py-2 shadow-sm ${
                      mine
                        ? `bg-blue-600 text-white rounded-2xl ${
                            startsRun ? "rounded-tr-md" : ""
                          }`
                        : `bg-white text-gray-800 rounded-2xl ${
                            startsRun ? "rounded-tl-md" : ""
                          }`
                    }`}
                  >
                    {!mine && startsRun && (
                      <div
                        className={`text-xs font-semibold mb-0.5 ${nameColor(senderId)}`}
                      >
                        {m.sender?.name}
                      </div>
                    )}

                    <div className="text-sm whitespace-pre-wrap break-words">
                      {m.text}
                    </div>

                    <div
                      className={`text-[10px] mt-1 text-right ${
                        mine ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send message"
          className="w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center
                     hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
