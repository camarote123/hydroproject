// src/Sensors.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Navbar from './navbar';
import './sensor.css';


const Sensors = () => {
  const navigate = useNavigate(); // Initialize the navigate function

  const handleNavigation = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
  
    <div className ="container">
    <div>
   <Navbar/>
      <div className="sensors-container">
        <h1 className="humidity-title">Sensors Page</h1>
   

        {/* Card Grid */}
        <div className="card-grid">
          {/* Card 1 */}
          <div className="sensor-card">
            <div className="sensor-card-content">
              <div className="sensor-card-title">AQUACULTURE SENSORS</div>
              
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/aquaculture')}
              >
                View Data
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="sensor-card">
            <div className="sensor-card-content">
              <div className="sensor-card-title">SOIL BASESD</div>
             
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/soilbased')}
              >
                View Data
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="sensor-card">
            <div className="sensor-card-content">
              <div className="sensor-card-title">Humidity and Temperature</div>
            
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/humidity')}
              >
                View Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Sensors;
