import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";

function formatTime(d) {
  return new Date(d).toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(d) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

// Used for both conversations in the app: the trip group chat and the
// private applicant/organiser thread. The caller supplies the loaders.
export default function ChatThread({
  loadMessages,
  sendMessage,
  emptyLabel = "No messages yet. Say hello!",
  height = 380,
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
    <div>
      <div
        ref={scrollRef}
        className="overflow-y-auto flex flex-col gap-5 mb-[26px] pr-1"
        style={{ height }}
      >
        {!loaded ? (
          <div className="flex flex-col gap-4">
            <div className="animate-pulse bg-surface h-12 w-2/5 rounded-2xl" />
            <div className="animate-pulse bg-surface-sunk h-12 w-1/2 rounded-2xl ml-auto" />
            <div className="animate-pulse bg-surface h-12 w-1/3 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center">
            <p className="text-[15px] text-faint">{emptyLabel}</p>
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

            return (
              <div key={m._id}>
                {newDay && (
                  <div className="flex justify-center mb-5">
                    <span className="text-[11px] tracking-[0.12em] uppercase text-faint">
                      {formatDay(m.createdAt)}
                    </span>
                  </div>
                )}

                {mine ? (
                  <div className="flex justify-end">
                    <div className="max-w-[74%] bg-ink text-canvas rounded-[16px_16px_4px_16px] px-[18px] py-3.5">
                      <p className="m-0 text-[15px] leading-[1.55] whitespace-pre-wrap break-words">
                        {m.text}
                      </p>
                      <div className="text-[11px] text-night-faint mt-2 text-right">
                        {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <span className="w-[34px] h-[34px] shrink-0 rounded-full bg-line text-muted grid place-items-center text-[13px]">
                      {m.sender?.name?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div className="max-w-[74%] bg-surface border border-line rounded-[16px_16px_16px_4px] px-[18px] py-3.5">
                      <div className="text-xs text-clay mb-1.5">{m.sender?.name}</div>
                      <p className="m-0 text-[15px] leading-[1.55] text-ink-soft whitespace-pre-wrap break-words">
                        {m.text}
                      </p>
                      <div className="text-[11px] text-fainter mt-2">
                        {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {error && <p className="text-clay-deep text-xs mb-2">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2.5 items-center bg-surface border border-line rounded-full p-2 pl-[22px]"
      >
        <input
          className="flex-1 border-none bg-transparent outline-none text-[15px] text-ink py-2.5"
          placeholder="Write to the group…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send message"
          className="w-[42px] h-[42px] shrink-0 rounded-full bg-ink text-canvas grid place-items-center hover:bg-clay disabled:opacity-40 disabled:hover:bg-ink transition-colors"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12h15M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
