// src/aquaculture.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './aqua.css';
import Navbar from './navbar';


const Soilbased = () => {
  const navigate = useNavigate(); // Initialize the navigate function

  const handleNavigation = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
  
    <div class ="aqua-container">
    <div>
   <Navbar/>
      <div className="aqua-container">
        <h1 className="humidity-title">SOIL BASED</h1>
        <p className="aqua-description"></p>
        <br></br>

        {/* Card Grid */}
        <div className="aqua-card-grid">
        <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">SOIL MONITORING 1, 2</div>
              <div className="aqua-card-description">
        
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/soilmonitoring')}
              >
                View Data
              </button>
            </div>
          </div>


            {/* Card 2 */}
            <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">SOIL MONITORING 3, 4</div>
              <div className="aqua-card-description">
        
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/soilmonitoring2')}
              >
                View Data
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">PESTICIDE</div>
              <div className="aqua-card-description">
        
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/pesticide')}
              >
                View Data
              </button>
            </div>
          </div>


          
           {/* Card 3 */}
          <div className="aqua-card">
            <div className="aqua-card-content">
              <div className="aqua-card-title">NUTRIENTS</div>
              <div className="aqua-card-description">
            
              </div>
              <button
                className="sensor-card-button"
                onClick={() => handleNavigation('/npk')}
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

export default Soilbased;
