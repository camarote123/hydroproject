// src/aquaculture.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './aqua.css';
import Navbar from './navbar';


const Aquaculture = () => {
  const navigate = useNavigate(); // Initialize the navigate function

  const handleNavigation = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
  
    <div class ="aqua-container">
    <div>
   <Navbar/>
      <div className="aqua-container">
        <h1 className="humidity-title">AQUA CULTURE</h1>
        <p className="aqua-description"></p>
        <br></br>

        {/* Card Grid */}
        <div className="aqua-card-grid">
          {/* Card 1 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">WATER TEMPERATURE</div>
              <div className="aqua-card-description"></div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/watertemp')}
              >
                View Data
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">DISSOLVED OXYGEN</div>
              <div className="aqua-card-description">
        
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/do')}
              >
                View Data
              </button>
            </div>
          </div>
          
           {/* Card 3 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">POND WATER LEVEL</div>
              <div className="aqua-card-description">
            
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/hydrowaterlevel')}
              >
                View Data
              </button>
            </div>
          </div>

           {/* Card 4 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">RESERVOIR</div>
              <div className="aqua-card-description">
             
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/reservior')}
              >
                View Data
              </button>
            </div>
          </div>
            

             {/* Card 5 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">pH_LEVEL</div>
              <div className="aqua-card-description">
         
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/phlevel')}
              >
                View Data
              </button>
            </div>
          </div>

          {/* Card 6 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">FISH FOOD LEVEL</div>
              <div className="aqua-card-description">
             
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/food')}
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

export default Aquaculture;
