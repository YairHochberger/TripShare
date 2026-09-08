import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// Reads the claims the server already put in the token (id + name) so the
// UI can tell "my" messages from everyone else's. The signature is still
// verified server-side - this is only for display.
function readToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const payload = JSON.parse(json);
    return { id: payload.id, name: payload.name };
  } catch {
    return {};
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Until the stored token has been read, we don't yet know whether
  // someone is signed in - without this, a page refresh redirects to
  // /login before the check has run.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setUser({ token, ...readToken(token) });
    setLoading(false);
  }, []);

  const loginUser = (token) => {
    localStorage.setItem("token", token);
    setUser({ token, ...readToken(token) });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
