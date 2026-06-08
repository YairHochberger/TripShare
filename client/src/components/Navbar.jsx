import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { logout } = useContext(AuthContext);

  return (
    <nav style={{ padding: 10, display: "flex", gap: 10 }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/create">Create Trip</Link>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}