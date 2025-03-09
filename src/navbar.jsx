import React, { useEffect, useState } from "react";
import { FaBars, FaCogs, FaHome, FaLeaf, FaSignOutAlt, FaTimes, FaUsers, FaWarehouse, FaWater } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [plantsDropdown, setPlantsDropdown] = useState(false);
  const [registrationDropdown, setRegistrationDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const togglePlantsDropdown = () => setPlantsDropdown(!plantsDropdown);
  const toggleRegistrationDropdown = () => setRegistrationDropdown(!registrationDropdown);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.sidebar-toggle');
      
      if (sidebarOpen && 
          sidebar && 
          !sidebar.contains(event.target) && 
          toggleButton && 
          !toggleButton.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Handle active states based on current route
  useEffect(() => {
    const openPlantPages = ["/plants", "/hydro", "/soil"];
    setPlantsDropdown(openPlantPages.includes(location.pathname));

    const openRegistrationPages = ["/plantregistration", "/rhydro", "/rsoil"];
    setRegistrationDropdown(openRegistrationPages.includes(location.pathname));
    
    // Close sidebar on route change for mobile
    setSidebarOpen(false);
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <>
      {/* Sidebar Toggle Button (Mobile) */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logo">
          <img src="/logo.png" alt="Logo" className="logo-img" />
        </div>

        <ul>
          <li>
            <Link to="/dashboard" className={isActive("/dashboard")} onClick={toggleSidebar}>
              <FaHome className="icon" /> <span>Dashboard</span>
            </Link>
          </li>
          
          <li>
            <Link to="/users" className={isActive("/users")} onClick={toggleSidebar}>
              <FaUsers className="icon" /> <span>Users</span>
            </Link>
          </li>
          
          <li>
            <Link to="/sensors" className={isActive("/sensors")} onClick={toggleSidebar}>
              <FaCogs className="icon" /> <span>Sensors</span>
            </Link>
          </li>

          {/* Plants Dropdown */}
          <li>
            <button className="dropdown-btn" onClick={togglePlantsDropdown}>
              <div>
                <FaLeaf className="icon" /> <span>Plants</span>
              </div>
              <span>{plantsDropdown ? "▲" : "▼"}</span>
            </button>
            {plantsDropdown && (
              <ul className={`dropdown ${plantsDropdown ? "show" : ""}`}>
                <li>
                  <Link to="/hydro" className={isActive("/hydro")} onClick={toggleSidebar}>
                    <span>Hydroponics</span>
                  </Link>
                </li>
                <li>
                  <Link to="/soil" className={isActive("/soil")} onClick={toggleSidebar}>
                    <span>Soil Based</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Plants Registration Dropdown */}
          <li>
            <button className="dropdown-btn" onClick={toggleRegistrationDropdown}>
              <div>
                <FaWater className="icon" /> <span>Plants Registration</span>
              </div>
              <span>{registrationDropdown ? "▲" : "▼"}</span>
            </button>
            {registrationDropdown && (
              <ul className={`dropdown ${registrationDropdown ? "show" : ""}`}>
                <li>
                  <Link to="/plantregistration" className={isActive("/plantregistration")} onClick={toggleSidebar}>
                    <span>Registration</span>
                  </Link>
                </li>
                <li>
                  <Link to="/rhydro" className={isActive("/rhydro")} onClick={toggleSidebar}>
                    <span>Hydroponics</span>
                  </Link>
                </li>
                <li>
                  <Link to="/rsoil" className={isActive("/rsoil")} onClick={toggleSidebar}>
                    <span>Soil Based</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link to="/harvest" className={isActive("/harvest")} onClick={toggleSidebar}>
              <FaLeaf className="icon" /> <span>Harvested Plants</span>
            </Link>
          </li>
          
          <li>
            <Link to="/location" className={isActive("/location")} onClick={toggleSidebar}>
              <FaWarehouse className="icon" /> <span>Location</span>
            </Link>
          </li>

         <div className="logout">
          <li>
            <Link to="/login" className={isActive("/login")} onClick={toggleSidebar}>
              <FaSignOutAlt className="icon" /> <span>Log out </span>
            </Link>
          </li>
          </div>

        </ul>
      </div>
    </>
  );
};

export default Navbar;