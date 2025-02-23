import React, { useEffect, useState } from "react";
import { FaBars, FaCogs, FaHome, FaLeaf, FaTimes, FaUsers, FaWater } from "react-icons/fa";
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

  useEffect(() => {
    const openPlantPages = ["/plants", "/hydro", "/soil"];
    setPlantsDropdown(openPlantPages.includes(location.pathname));

    const openRegistrationPages = ["/plantregistration", "/rhydro", "/rsoil"];
    setRegistrationDropdown(openRegistrationPages.includes(location.pathname));
  }, [location]);

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
          <li><Link to="/" onClick={toggleSidebar}><FaHome className="icon" /> Dashboard</Link></li>
          <li><Link to="/users" onClick={toggleSidebar}><FaUsers className="icon" /> Users</Link></li>
          <li><Link to="/sensors" onClick={toggleSidebar}><FaCogs className="icon" /> Sensors</Link></li>

          {/* Plants Dropdown */}
          <li>
            <button className="dropdown-btn" onClick={togglePlantsDropdown}>
              <FaLeaf className="icon" /> Plants {plantsDropdown ? "▲" : "▼"}
            </button>
            {plantsDropdown && (
              <ul className="dropdown">
                <li><Link to="/hydro" onClick={toggleSidebar}>Hydroponics</Link></li>
                <li><Link to="/soil" onClick={toggleSidebar}>Soil Based</Link></li>
              </ul>
            )}
          </li>

          {/* Plants Registration Dropdown */}
          <li>
            <button className="dropdown-btn" onClick={toggleRegistrationDropdown}>
              <FaWater className="icon" /> Plants Registration {registrationDropdown ? "▲" : "▼"}
            </button>
            {registrationDropdown && (
              <ul className="dropdown">
                <li><Link to="/plantregistration" onClick={toggleSidebar}>Registration</Link></li>
                <li><Link to="/rhydro" onClick={toggleSidebar}>Hydroponics</Link></li>
                <li><Link to="/rsoil" onClick={toggleSidebar}>Soil Based</Link></li>
              </ul>
            )}
          </li>

          <li><Link to="/harvest" onClick={toggleSidebar}><FaLeaf className="icon" /> Harvested Plants</Link></li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
