import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker'; // Import DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Import DatePicker CSS
import { useNavigate } from 'react-router-dom';
import { supabase } from './createClient';
import Navbar from './navbar';
import './registration.css';



ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const [startDate, setStartDate] = useState(null); // State for start date
  const [endDate, setEndDate] = useState(null); // State for end date
  const [notification, setNotification] = useState(''); // State for notification

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
    fetchHistoryData(); // Call the function to fetch data initially

    const intervalId = setInterval(fetchHistoryData, 2000);

    return () => clearInterval(intervalId);
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
  
    try {
      const dataToSubmit = { ...formData };
  
      // Insert data into registration table and return the inserted data
      const { data, error } = await supabase
        .from('registration')
        .insert([dataToSubmit])
        .select(); // Ensure it returns the inserted data
  
      if (error) {
        console.error('Error adding record:', error.message);
        return;
      }
  
      if (data && data.length > 0) {
        const newRegistration = data[0]; // Get the inserted row
  
        // Insert the same data into the history table
        const { error: historyError } = await supabase.from('history').insert([
          {
            growth_site: newRegistration.growth_site,
            plant_name: newRegistration.plant_name,
            harvest_duration: newRegistration.harvest_duration,
            expected_harvest_date: newRegistration.expected_harvest_date,
            registration_id: newRegistration.id, // Link to registration table
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
  
      // Fetch updated data
      fetchData();
      fetchHistoryData(); // Ensure history is updated as well
  
      // Reset form fields
      resetForm();
  
      // Notify user
      alert('Record added successfully!');
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

  const openAddNewPlantModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleGrowthSiteChange = (e) => {
    const selectedGrowthSite = e.target.value;
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
      location: '',
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

  // Utility function to format date
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Count plants by growth system (Hydroponic vs. Soil-based)
  const countPlantsByDateAndSystem = (filteredData) => {
    const hydroponicCounts = {};
    const soilCounts = {};

    filteredData.forEach((record) => {
      const date = formatDate(record.date_created);
      const growthSystem = record.growth_site.toLowerCase().includes('hydroponic') ? 'Hydroponic' : 'Soil-based';

      if (growthSystem === 'Hydroponic') {
        if (!hydroponicCounts[date]) {
          hydroponicCounts[date] = 0;
        }
        hydroponicCounts[date]++;
      } else {
        if (!soilCounts[date]) {
          soilCounts[date] = 0;
        }
        soilCounts[date]++;
      }
    });

    return { hydroponicCounts, soilCounts };
  };

  // Filter history data by selected date range
  const filteredHistoryData = historyData.filter((record) => {
    const recordDate = new Date(record.date_created);
    if (startDate && endDate) {
      return recordDate >= startDate && recordDate <= endDate;
    }
    return true;
  });

  // Prepare data for the charts
  const { hydroponicCounts, soilCounts } = countPlantsByDateAndSystem(filteredHistoryData);

  const hydroponicChartData = {
    labels: Object.keys(hydroponicCounts),
    datasets: [
      {
        label: 'Hydroponic Plants',
        data: Object.values(hydroponicCounts),
        backgroundColor: 'rgba(75, 192, 192, 12)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const soilChartData = {
    labels: Object.keys(soilCounts),
    datasets: [
      {
        label: 'Soil-based Plants',
        data: Object.values(soilCounts),
        backgroundColor: 'rgba(19, 104, 19, 0.94)',
        borderColor: 'rgb(255, 255, 255)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Plants Planted by Date',
      },
    },
  };

  // Filter out used locations
  const availableHydroLocations = hydroLocations.filter(
    (location) => !data.some((record) => record.location === location.name)
  );

  const availableSoilLocations = soilLocations.filter(
    (location) => !data.some((record) => record.location === location.name)
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <h1>Add Plant</h1>

      <button onClick={openAddNewPlantModal}>Add Plant</button>
      <button onClick={() => navigate('/history')}>View History</button>
      

      {notification && <div className="notification">{notification}</div>} {/* Notification */}

      <div>
        <br />
        <br />
        <br />

        <div style={{ display: 'flex', gap: '10px' }}>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Select start date"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Select end date"
          />
        </div>

        <Bar
          data={hydroponicChartData}
          options={chartOptions}
          style={{ width: '100%', height: '300px' }}
        />
        <Bar data={soilChartData} options={chartOptions} />
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content2">
            <h2>Add New Plant</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.growth_site}
                onChange={handleGrowthSiteChange}
              >
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

              {formData.growth_site.includes('Hydroponic') && (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="">Select Hydroponic Location</option>
                  {availableHydroLocations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              )}

              {formData.growth_site.includes('Soil Based') && (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="">Select Soil Location</option>
                  {availableSoilLocations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              )}

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
              <input
                type="text"
                placeholder="pH Level"
                value={formData.ph_level}
                disabled
              />
              <input
                type="text"
                placeholder="Temperature"
                value={formData.temperature}
                disabled
              />
              <input
                type="text"
                placeholder="Humidity"
                value={formData.humidity}
                disabled
              />
              <input
                type="text"
                placeholder="Pesticide"
                value={formData.pesticide}
                disabled
              />
              <input
                type="number"
                placeholder="Harvest Duration (Days)"
                value={formData.harvest_duration}
                onChange={handleHarvestDurationChange}
              />
              <input
                type="date"
                value={formData.expected_harvest_date}
                onChange={(e) =>
                  setFormData({ ...formData, expected_harvest_date: e.target.value })
                }
              />
              <button type="submit">Add Record</button>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantRegistration;