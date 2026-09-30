import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "🏠",
    },
    {
      label: "Profile",
      path: "/profile",
      icon: "👤",
    },
    {
      label: "Skills",
      path: "/skills",
      icon: "🎯",
    },
    {
      label: "Practice",
      path: "/practice",
      icon: "⏱️",
    },
    {
      label: "Goals",
      path: "/goals",
      icon: "🏆",
    },
    {
      label: "Community",
      path: "/community",
      icon: "🌐",
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="mb-8 rounded-2xl bg-white p-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Project Name */}
        <button
          onClick={() => navigate("/dashboard")}
          className="text-left"
        >
          <h1 className="text-xl font-bold text-blue-600">
            Hobby & Skills Tracker
          </h1>

          <p className="text-xs text-gray-500">
            Cloud Community Platform
          </p>
        </button>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(item.path)
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;