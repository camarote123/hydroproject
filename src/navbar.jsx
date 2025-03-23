import React, { useEffect, useState } from "react";
import { FaBars, FaCalendar, FaClipboardList, FaHome, FaLeaf, FaSeedling, FaTimes, FaUsers, FaWater, FaWifi } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { supabase } from './createClient'; // Ensure Supabase is correctly configured
import logo from "/src/assets/logo.png";

const Navbar = () => {
  const [plantsDropdown, setPlantsDropdown] = useState(false);
  const [sensorDropdown, setSensorDropdown] = useState(false);
  const [registrationDropdown, setRegistrationDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const togglePlantsDropdown = () => setPlantsDropdown(!plantsDropdown);
  const toggleSensorDropdown = () => setSensorDropdown(!sensorDropdown);
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

    const openSensorPages = ["/watertemp", "/soilbased"];
    setSensorDropdown(openSensorPages.includes(location.pathname));

    const openRegistrationPages = ["/plantregistration", "/rhydro", "/rsoil"];
    setRegistrationDropdown(openRegistrationPages.includes(location.pathname));
    
    // Close sidebar on route change for mobile
    setSidebarOpen(false);
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Clears session
    localStorage.removeItem("userSession"); // Remove any stored user data (optional)
    navigate("/login"); // Redirect to login
  };

  const handleLinkClick = (path) => {
    setSidebarOpen(false); // Close the sidebar before navigating
    navigate(path); // Navigate to the new path
  };

  return (
    <>
      {/* Sidebar Toggle Button (Mobile) */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-img" />
        </div>

        <ul>
          <li>
            <Link to="/dashboard" className={isActive("/dashboard")} onClick={() => handleLinkClick("/dashboard")}>
              <FaHome className="icon" /> <span>Dashboard</span>
            </Link>
          </li>
          
          <li>
            <Link to="/users" className={isActive("/users")} onClick={() => handleLinkClick("/users")}>
              <FaUsers className="icon" /> <span>Users</span>
            </Link>
          </li>
          
           {/* Sensors Dropdown */}
           <li>
            <button className="dropdown-btn" onClick={toggleSensorDropdown}>
              <div>
                <FaWifi className="icon" /> <span>Sensors</span>
              </div>
              <span>{sensorDropdown ? "▲" : "▼"}</span>
            </button>
            {sensorDropdown && (
              <ul className={`dropdown ${sensorDropdown ? "show" : ""}`}>
                <li>
                  <Link to="/watertemp" className={isActive("/watertemp")} onClick={() => handleLinkClick("/watertemp")}>
                    <FaWater className="dropdown-icon" /> <span>Aquaculture</span>
                  </Link>
                </li>
                <li>
                  <Link to="/soilmonitoring" className={isActive("/soilmonitoring")} onClick={() => handleLinkClick("/soilmonitoring")}>
                    <FaSeedling className="dropdown-icon" /> <span>Soil Based</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Plants Dropdown */}
          <li>
            <button className="dropdown-btn" onClick={togglePlantsDropdown}>
              <div>
                <FaClipboardList className="icon" /> <span>Registration</span>
              </div>
              <span>{plantsDropdown ? "▲" : "▼"}</span>
            </button>
            {plantsDropdown && (
              <ul className={`dropdown ${plantsDropdown ? "show" : ""}`}>
                <li>
                  <Link to="/hydro" className={isActive("/hydro")} onClick={() => handleLinkClick("/hydro")}>
                    <FaWater className="dropdown-icon" /> <span>Hydroponics</span>
                  </Link>
                </li>
                <li>
                  <Link to="/soil" className={isActive("/soil")} onClick={() => handleLinkClick("/soil")}>
                    <FaSeedling className="dropdown-icon" /> <span>Soil Based</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Plants Registration Dropdown */}
          <li>
            <button className="dropdown-btn" onClick={toggleRegistrationDropdown}>
              <div>
                <FaLeaf className="icon" /> <span>Plant Now</span>
              </div>
              <span>{registrationDropdown ? "▲" : "▼"}</span>
            </button>
            {registrationDropdown && (
              <ul className={`dropdown ${registrationDropdown ? "show" : ""}`}>
                <li>
                  <Link to="/plantregistration" className={isActive("/plantregistration")} onClick={() => handleLinkClick("/plantregistration")}>
                    <FaLeaf className="dropdown-icon" /> <span>Add Plant</span>
                  </Link>
                </li>
                <li>
                  <Link to="/rhydro" className={isActive("/rhydro")} onClick={() => handleLinkClick("/rhydro")}>
                    <FaCalendar className="dropdown-icon" /> <span>Plant Calendar</span>
                  </Link>
                </li>
               
              </ul>
            )}
          </li>

          <li>
            <Link to="/harvest" className={isActive("/harvest")} onClick={() => handleLinkClick("/harvest")}>
              <FaSeedling className="icon" /> <span>Harvested Plants</span>
            </Link>
          </li>
          
     
       

          
        </ul>
      </div>
    </>
  );
};

export default Navbar;