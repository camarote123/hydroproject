import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import Navbar from './navbar';
import './registration.css';

// Initialize Supabase client
const supabaseUrl = 'https://gwpdficziacsggfhtsff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGRmaWN6aWFjc2dnZmh0c2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDcxNzMsImV4cCI6MjA1MTQ4MzE3M30.k251ml-KLw4M7TTtcpZyHh659qoO0HI9wCNUihwzxqM';
const supabase = createClient(supabaseUrl, supabaseKey);

const Plants = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    growth_site: '',
    plant_name: '',
    nitrogen_measurement: '',
    phosphorus_measurement: '',
    potassium_measurement: '',
    ph_level: '',
    water_quality: '',
    temperature: '',
    humidity: '',
    pesticide: '',
    harvest_duration: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPlants();
  }, []);

  // Fetch plants data
  const fetchPlants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('plants').select('*');
      if (error) {
        console.error('Error fetching plants:', error.message);
      } else {
        setPlants(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for adding a plant
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add new record
      const { error } = await supabase.from('plants').insert([formData]);
      if (error) {
        console.error('Error adding record:', error.message);
      } else {
        fetchPlants();
        resetForm();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      growth_site: '',
      plant_name: '',
      nitrogen_measurement: '',
      phosphorus_measurement: '',
      potassium_measurement: '',
      ph_level: '',
      water_quality: '',
      temperature: '',
      humidity: '',
      pesticide: '',
      harvest_duration: '',
    });
    setIsModalOpen(false); // Close the modal
  };

  // Open the modal to add a new plant
  const openAddNewPlantModal = () => {
    resetForm(); // Ensure the form is reset before opening the modal
    setIsModalOpen(true); // Open the modal
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <h1>Plants Data</h1>

      {/* Button to open the Add New Plant modal */}
      <button onClick={openAddNewPlantModal}>Add New Plant</button>

      {/* Modal for adding a plant */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Plant</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.growth_site}
                onChange={(e) => setFormData({ ...formData, growth_site: e.target.value })}
              >
                <option value="">Select Growth Site</option>
                <option value="Hydroponics">Hydroponics</option>
                <option value="Soil Based">Soil Based</option>
              </select>
              <input
                type="text"
                placeholder="Plant Name"
                value={formData.plant_name}
                onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Nitrogen Measurement"
                value={formData.nitrogen_measurement}
                onChange={(e) => setFormData({ ...formData, nitrogen_measurement: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phosphorus Measurement"
                value={formData.phosphorus_measurement}
                onChange={(e) => setFormData({ ...formData, phosphorus_measurement: e.target.value })}
              />
              <input
                type="text"
                placeholder="Potassium Measurement"
                value={formData.potassium_measurement}
                onChange={(e) => setFormData({ ...formData, potassium_measurement: e.target.value })}
              />
              <input
                type="text"
                placeholder="pH Level"
                value={formData.ph_level}
                onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
              />
              <input
                type="text"
                placeholder="Water Quality"
                value={formData.water_quality}
                onChange={(e) => setFormData({ ...formData, water_quality: e.target.value })}
              />
              <input
                type="text"
                placeholder="Temperature"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              />
              <input
                type="text"
                placeholder="Humidity"
                value={formData.humidity}
                onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
              />
              <input
                type="text"
                placeholder="Pesticide"
                value={formData.pesticide}
                onChange={(e) => setFormData({ ...formData, pesticide: e.target.value })}
              />
              <input
                type="number"
                placeholder="Harvest Duration (Days)"
                value={formData.harvest_duration}
                onChange={(e) => setFormData({ ...formData, harvest_duration: e.target.value })}
              />
              <button type="submit">Add Record</button>
              <button type="button" onClick={() => setIsModalOpen(false)}>Close</button>
            </form>
          </div>
        </div>
      )}
    </div>

    
  );
};

export default Plants;
