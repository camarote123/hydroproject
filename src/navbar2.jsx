import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./createClient";
import "./navbar2.css";

const Navbar2 = ({ sidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  useEffect(() => {
    const fetchNotificationCount = () => {
      const count = localStorage.getItem("newNotificationsCount");
      setNewNotificationCount(count ? parseInt(count, 10) : 0);
    };

    fetchNotificationCount();

    // Listen for changes in localStorage (sync across tabs)
    const handleStorageChange = () => fetchNotificationCount();
    window.addEventListener("storage", handleStorageChange);

    // **Real-time subscription for new notifications**
    const notificationTables = [
      "do_notification", "feeder_notification", "humidity_notification",
      "hydro_notification", "npk_notification", "pesticide_notification",
      "phlevel_notification", "temp_notification"
    ];

    const subscriptions = notificationTables.map((table) =>
      supabase
        .channel(table)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: table }, fetchNotificationCount)
        .subscribe()
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      subscriptions.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userSession");
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <nav className={`navbar2 ${sidebarOpen ? "expanded" : ""}`}>
      <ul className="nav-links">
        <li>
          <Link to="/notification" className={isActive("/notification")}>
            <FaBell className="icon" />
            {newNotificationCount > 0 && (
              <span className="notification-badge">{newNotificationCount}</span>
            )}
            <span>Notifications</span>
          </Link>
        </li>

        <li>
          <Link to="/login" onClick={handleLogout}>
            <span>Log out</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar2;