import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from './createClient';
import Location from './location'; // Import the Location component
import Navbar from './navbar';
import Navbar2 from './navbar2';
import './registration.css';

const PlantRegistration = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plantsBySite, setPlantsBySite] = useState([]);
  const [growthSites, setGrowthSites] = useState([]);
  const [hydroLocations, setHydroLocations] = useState([]);
  const [soilLocations, setSoilLocations] = useState([]);
  const [formData, setFormData] = useState({
    growth_site: '',
    plant_name: '',
    nitrogen_measurement: '',
    phosphorus_measurement: '',
    potassium_measurement: '',
    ph_level: '',
    temperature: '',
    humidity: '',
    pesticide: '',
    harvest_duration: '',
    expected_harvest_date: '',
    location: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchData();
    fetchPlants();
    fetchLocations();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: registrationData, error } = await supabase.from('registration').select('*');
      if (error) {
        console.error('Error fetching data:', error.message);
      } else {
        setData(registrationData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase.from('plants').select('*');
      if (error) {
        console.error('Error fetching plants:', error.message);
      } else {
        setPlantsBySite(data);
        const uniqueGrowthSites = [...new Set(data.map(plant => plant.growth_site))];
        setGrowthSites(uniqueGrowthSites);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data: hydroData, error: hydroError } = await supabase.from('hydro_locations').select('*');
      if (hydroError) {
        console.error('Error fetching hydro locations:', hydroError.message);
      } else {
        setHydroLocations(hydroData);
      }

      const { data: soilData, error: soilError } = await supabase.from('soil_locations').select('*');
      if (soilError) {
        console.error('Error fetching soil locations:', soilError.message);
      } else {
        setSoilLocations(soilData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const { data, error } = await supabase.from('history').select('*');
      if (error) {
        console.error('Error fetching history data:', error.message);
      } else {
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchPlantDetails = async (plantName) => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('plant_name', plantName)
        .single();

      if (error) {
        console.error('Error fetching plant details:', error.message);
      } else {
        setFormData((prevFormData) => ({
          ...prevFormData,
          plant_name: data.plant_name,
          nitrogen_measurement: data.nitrogen_measurement,
          phosphorus_measurement: data.phosphorus_measurement,
          potassium_measurement: data.potassium_measurement,
          ph_level: data.ph_level,
          temperature: data.temperature,
          humidity: data.humidity,
          pesticide: data.pesticide,
          harvest_duration: data.harvest_duration,
          expected_harvest_date: calculateExpectedHarvestDate(data.harvest_duration),
        }));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const calculateExpectedHarvestDate = (harvestDuration) => {
    if (!harvestDuration) return '';
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + parseInt(harvestDuration));
    return currentDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if required fields are filled
    if (!formData.plant_name) {
      setNotification('Please select a plant name.');
      return;
    }
    if (!formData.location) {
      setNotification('Please select a location.');
      return;
    }
  
    try {
      const dataToSubmit = { ...formData };
  
      // Insert data into registration table and return the inserted data
      const { data, error } = await supabase
        .from('registration')
        .insert([dataToSubmit])
        .select();
  
      if (error) {
        console.error('Error adding record:', error.message);
        return;
      }
  
      if (data && data.length > 0) {
        const newRegistration = data[0];
  
        // Insert the same data into the history table
        const { error: historyError } = await supabase.from('history').insert([
          {
            growth_site: newRegistration.growth_site,
            plant_name: newRegistration.plant_name,
            harvest_duration: newRegistration.harvest_duration,
            expected_harvest_date: newRegistration.expected_harvest_date,
            registration_id: newRegistration.id,
            location: newRegistration.location,
          },
        ]);
  
        if (historyError) {
          console.error('Error adding record to history:', historyError.message);
        } else {
          console.log('Record added to history table successfully');
        }
      }
  
      // Close the modal
      setIsModalOpen(false);
      setNotification('');
  
      // Fetch updated data
      fetchData();
      fetchHistoryData();
  
      // Reset form fields
      resetForm();
  
      // Notify user
      setNotification('Record added successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      growth_site: '',
      plant_name: '',
      nitrogen_measurement: '',
      phosphorus_measurement: '',
      potassium_measurement: '',
      ph_level: '',
      temperature: '',
      humidity: '',
      pesticide: '',
      harvest_duration: '',
      expected_harvest_date: '',
      location: '',
    });
  };

  const openAddNewPlantModal = (location = '') => {
    resetForm();
    // If a location is provided, set it in the form data
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: location
      }));
    }
    setNotification('');
    setIsModalOpen(true);
  };

  const handleGrowthSiteChange = (e) => {
    const selectedGrowthSite = e.target.value;
    // Keep the location that was selected from the Location component
    const currentLocation = formData.location;
    setFormData((prevFormData) => ({
      ...prevFormData,
      growth_site: selectedGrowthSite,
      plant_name: '',
      nitrogen_measurement: '',
      phosphorus_measurement: '',
      potassium_measurement: '',
      ph_level: '',
      temperature: '',
      humidity: '',
      pesticide: '',
      harvest_duration: '',
      expected_harvest_date: '',
      location: currentLocation, // Preserve the location
    }));
  };

  const handlePlantChange = (e) => {
    const selectedPlantName = e.target.value;
    setFormData((prevFormData) => ({ ...prevFormData, plant_name: selectedPlantName }));

    if (selectedPlantName) {
      fetchPlantDetails(selectedPlantName);
    }
  };

  const handleHarvestDurationChange = (e) => {
    const harvestDuration = e.target.value;
    setFormData((prevFormData) => ({
      ...prevFormData,
      harvest_duration: harvestDuration,
      expected_harvest_date: calculateExpectedHarvestDate(harvestDuration),
    }));
  };

  // Function to handle location click from the Location component
  const handleLocationClick = (locationName, locationType) => {
    // Find the appropriate growth site based on location type
    let appropriateGrowthSite = '';
    if (locationType === 'soil') {
      appropriateGrowthSite = growthSites.find(site => site.includes('Soil Based')) || '';
    } else if (locationType === 'hydro') {
      appropriateGrowthSite = growthSites.find(site => site.includes('Hydroponic')) || '';
    }

    // Open the modal and set the location and growth site
    setFormData(prev => ({
      ...prev,
      location: locationName,
      growth_site: appropriateGrowthSite
    }));
    setIsModalOpen(true);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <Navbar2 />
    

      <button  className='regbutton' onClick={() => navigate('/history')}>View History</button>

      {/* Notification outside modal */}
      {notification && !isModalOpen && <div className="notification">{notification}</div>}

      {/* Location Component */}
      <div className="location-section">
        <Location onLocationClick={handleLocationClick} />
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content2">
            <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>
            <h2>Add New Plant</h2>
            {notification && <div className="notification">{notification}</div>}
            <form onSubmit={handleSubmit}>
              <select value={formData.growth_site} 
              onChange={handleGrowthSiteChange}
              disabled={true}> 
                <option value="">Select Planting Area</option>
                {growthSites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                    
                  </option>
                
                ))}
              </select>

              <select
                value={formData.plant_name}
                onChange={handlePlantChange}
                disabled={!formData.growth_site}
                
              >
                <option value="">Select Plant Name</option>
                {plantsBySite
                  .filter((plant) => plant.growth_site === formData.growth_site)
                  .map((plant) => (
                    <option key={plant.id} value={plant.plant_name}>
                      {plant.plant_name}
                    </option>
                  ))}
              </select>

              {/* Show the pre-selected location */}
              <input
                type="text"
                placeholder="Selected Location"
                value={formData.location}
                readOnly
              />

              <input
                type="text"
                placeholder="Nitrogen Measurement"
                value={formData.nitrogen_measurement}
                disabled
              />
              <input
                type="text"
                placeholder="Phosphorus Measurement"
                value={formData.phosphorus_measurement}
                disabled
              />
              <input
                type="text"
                placeholder="Potassium Measurement"
                value={formData.potassium_measurement}
                disabled
              />
              <input type="text" placeholder="pH Level" value={formData.ph_level} disabled />
              <input type="text" placeholder="Temperature" value={formData.temperature} disabled />
              <input type="text" placeholder="Humidity" value={formData.humidity} disabled />
              <input type="text" placeholder="Pesticide" value={formData.pesticide} disabled />
              <input
                type="number"
                placeholder="Harvest Duration (Days)"
                value={formData.harvest_duration}
                onChange={handleHarvestDurationChange}
              />
              <input
                type="date"
                value={formData.expected_harvest_date}
                onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })}
              />
              <button type="submit">Add Record</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantRegistration;