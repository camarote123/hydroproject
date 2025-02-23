import { createClient } from '@supabase/supabase-js';
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
import Navbar from './navbar';
import './registration.css';

// Initialize Supabase client
const supabaseUrl = 'https://gwpdficziacsggfhtsff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGRmaWN6aWFjc2dnZmh0c2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDcxNzMsImV4cCI6MjA1MTQ4MzE3M30.k251ml-KLw4M7TTtcpZyHh659qoO0HI9wCNUihwzxqM';
const supabase = createClient(supabaseUrl, supabaseKey);

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PlantRegistration = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plantsBySite, setPlantsBySite] = useState([]);
  const [growthSites, setGrowthSites] = useState([]);
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
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [startDate, setStartDate] = useState(null); // State for start date
  const [endDate, setEndDate] = useState(null); // State for end date

  useEffect(() => {
    fetchData();
    fetchPlants();
    fetchHistoryData();
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
        setFormData({
          ...formData,
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
        });
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
      let result;

      if (editingRecord) {
        const { error } = await supabase
          .from('registration')
          .update(formData)
          .eq('id', editingRecord.id);

        if (error) {
          console.error('Error updating record:', error.message);
        } else {
          result = await supabase
            .from('history')
            .insert([{
              growth_site: formData.growth_site,
              plant_name: formData.plant_name,
              expected_harvest_date: formData.expected_harvest_date,
              registration_id: editingRecord.id,
            }]);

          if (result.error) {
            console.error('Error inserting into history:', result.error.message);
          }
        }
      } else {
        const { error } = await supabase.from('registration').insert([formData]);

        if (error) {
          console.error('Error adding record:', error.message);
        } else {
          const { data: newRegistrationData } = await supabase
            .from('registration')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

          const { error: historyError } = await supabase.from('history').insert([{
            growth_site: formData.growth_site,
            plant_name: formData.plant_name,
            harvest_duration: formData.harvest_duration,
            expected_harvest_date: formData.expected_harvest_date,
            registration_id: newRegistrationData[0].id,
          }]);

          if (historyError) {
            console.error('Error adding record to history:', historyError.message);
          } else {
            fetchData();
            resetForm();
          }
        }
      }
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
    });
    setEditingRecord(null);
    setIsModalOpen(false);
  };

  const openAddNewPlantModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleGrowthSiteChange = (e) => {
    const selectedGrowthSite = e.target.value;
    setFormData({
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
    });
  };

  const handlePlantChange = (e) => {
    const selectedPlantName = e.target.value;
    setFormData({ ...formData, plant_name: selectedPlantName });

    if (selectedPlantName) {
      fetchPlantDetails(selectedPlantName);
    }
  };

  const handleHarvestDurationChange = (e) => {
    const harvestDuration = e.target.value;
    setFormData({
      ...formData,
      harvest_duration: harvestDuration,
      expected_harvest_date: calculateExpectedHarvestDate(harvestDuration),
    });
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
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
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

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <h1>Plant Registration</h1>

      <button onClick={openAddNewPlantModal}>Register Plant</button>
      <button onClick={() => navigate('/history')}>View History</button>

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
          <div className="modal-content">
            <h2>{editingRecord ? 'Edit Plant' : 'Add New Plant'}</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.growth_site}
                onChange={handleGrowthSiteChange}
                disabled={editingRecord}
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
                disabled={!formData.growth_site || editingRecord}
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
              <button type="submit">
                {editingRecord ? 'Update Record' : 'Add Record'}
              </button>
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