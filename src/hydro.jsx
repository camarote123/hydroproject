import { createClient } from '@supabase/supabase-js';

import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importing the Edit and Trash icons
import Navbar from './navbar';
import './registration.css';

// Initialize Supabase client
const supabaseUrl = 'https://gwpdficziacsggfhtsff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGRmaWN6aWFjc2dnZmh0c2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDcxNzMsImV4cCI6MjA1MTQ4MzE3M30.k251ml-KLw4M7TTtcpZyHh659qoO0HI9wCNUihwzxqM';
const supabase = createClient(supabaseUrl, supabaseKey);

const Hydro = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    growth_site: 'Hydroponics', // Set the default value to 'Hydroponics'
    plant_name: '',
    nitrogen_measurement: '',
    phosphorus_measurement: '',
    potassium_measurement: '',
    ph_level: '',
    temperature: '',
    humidity: '',
    pesticide: '',
    harvest_duration: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPlants();
  }, [currentPage, pageSize]);

  // Fetch plants data filtered for Hydroponics with pagination
  const fetchPlants = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('plants')
        .select('*', { count: 'exact' })
        .eq('growth_site', 'Hydroponics')
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        console.error('Error fetching plants:', error.message);
      } else {
        setPlants(data);
        setTotalCount(count); // Set total count for pagination
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for adding or updating a plant
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        // Update the existing record
        const { error } = await supabase
          .from('plants')
          .update(formData)
          .eq('id', editingRecord.id);
        if (error) {
          console.error('Error updating record:', error.message);
        } else {
          fetchPlants();
          resetForm();
        }
      } else {
        // Add a new record
        const { error } = await supabase
          .from('plants')
          .insert([formData]);
        if (error) {
          console.error('Error adding new plant:', error.message);
        } else {
          fetchPlants();
          resetForm();
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Reset form and close modal
  const resetForm = () => {
    setFormData({
      growth_site: 'Hydroponics', // Ensure default value remains 'Hydroponics'
      plant_name: '',
      nitrogen_measurement: '',
      phosphorus_measurement: '',
      potassium_measurement: '',
      ph_level: '',

      temperature: '',
      humidity: '',
      pesticide: '',
      harvest_duration: '',
    });
    setEditingRecord(null);
    setIsModalOpen(false);
  };

  // Confirm deletion modal actions
  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('plants').delete().eq('id', recordToDelete.id);
      if (error) {
        console.error('Error deleting plant:', error.message);
      } else {
        fetchPlants();
        closeDeleteModal();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (plant) => {
    setRecordToDelete(plant);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setRecordToDelete(null);
    setIsDeleteModalOpen(false);
  };

  // Edit plant record
  const editPlant = (plant) => {
    setFormData(plant);
    setEditingRecord(plant);
    setIsModalOpen(true);
  };

  // Open the modal to add a new plant
  const openAddNewPlantModal = () => {
    setFormData({
      growth_site: 'Hydroponics', // Ensure default value remains 'Hydroponics'
      plant_name: '',
      nitrogen_measurement: '',
      phosphorus_measurement: '',
      potassium_measurement: '',
      ph_level: '',

      temperature: '',
      humidity: '',
      pesticide: '',
      harvest_duration: '',
    });
    setEditingRecord(null); // Clear any editing record
    setIsModalOpen(true);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <h1>Hydroponics Plant Data</h1>

      {/* Button to open the Register Plant modal */}
      <button onClick={openAddNewPlantModal}>Register Plant</button>

      {/* Modal for adding or updating a plant */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content2">
            <h2>{editingRecord ? 'Edit Plant' : 'Register Plant'}</h2>
            <form onSubmit={handleSubmit}>
              <label>Growth Site</label>
              <input
                type="text"
                placeholder="growth site"
                value={formData.growth_site || ''}
                onChange={(e) => setFormData({ ...formData, growth_site: e.target.value })}
                disabled={true}
                required

              />
              <label>Plant Name</label>
              <input
                type="text"
                placeholder="Plant Name"
                value={formData.plant_name || ''}
                onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
                required
                title="Plant Name is required"

              />
              <label>pH Level</label>
              <input
                type="text"
                placeholder="pH Level"
                value={formData.ph_level || ''}
                onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                required
                title="Format. 00.00 - 00.00"
                pattern="^\d{2}\.\d{2} - \d{2}\.\d{2}$"
              />

              <label>Temperature</label>
              <input
                type="text"
                placeholder="Temperature"
                value={formData.temperature || ''}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                required
                title="Format. 00.00 - 00.00"
                pattern="^\d{2}\.\d{2} - \d{2}\.\d{2}$"
              />
              <label>Humidity</label>
              <input
                type="text"
                placeholder="Humidity"
                value={formData.humidity || ''}
                onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                required
                title="Format. 00.00 - 00.00"
                pattern="^\d{2}\.\d{2} - \d{2}\.\d{2}$"
              />

              <label>Harvest Duration</label>
              <input
                type="number"
                value={formData.harvest_duration || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 1 && /^\d*$/.test(value))) {
                    setFormData({ ...formData, harvest_duration: value });
                  }
                }}
                min="0"
                required
                title="Input harvest_duration Details"
              />
              <button type="submit">{editingRecord ? 'Update' : 'Add Record'}</button>
              <button type="button1" onClick={resetForm}>Close</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for confirming deletion */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content1">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the plant record for{' '}
              <strong>{recordToDelete?.plant_name}</strong>?
            </p>
            <button onClick={confirmDelete}>Yes, Delete</button>
            <button onClick={closeDeleteModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table displaying plants data */}
      <div className='container3' >
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Plant Name</th>
              <th>pH Level</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>Harvest Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.id}>
                <td>{plant.plant_name}</td>
                <td>{plant.ph_level}</td>
                <td>{plant.temperature}</td>
                <td>{plant.humidity}</td>
                <td>{plant.harvest_duration}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => editPlant(plant)}><FaEdit /></button>
                    <button onClick={() => openDeleteModal(plant)}><FaTrashAlt /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Hydro;