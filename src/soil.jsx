import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importing the Edit and Trash icons
import { supabase } from './createClient';
import Navbar from './navbar';
import Navbar2 from './navbar2';
import './registration.css';

// Initialize Supabase client


const Soil = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    growth_site: 'Soil Based', // Default growth site
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPlants();
  }, [currentPage]); // Fetch data whenever the page changes

  // Fetch plants data filtered for Soil-Based with pagination
  const fetchPlants = async () => {
    setLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('plants')
        .select('*', { count: 'exact' }) // Get exact count of records
        .eq('growth_site', 'Soil Based')
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1); // Paginate based on the current page and page size

      if (error) {
        console.error('Error fetching plants:', error.message);
      } else {
        setPlants(data);
        setTotalCount(count); // Set the total count of records
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
        // Update existing record
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
        // Register Plant
        const { error } = await supabase
          .from('plants')
          .insert([formData]);
        if (error) {
          console.error('Error adding new plant:', error.message);
        } else {
          fetchPlants();
          resetForm();
          alert('Plant record updated successfully!');
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Reset form and close modal
  const resetForm = () => {
    setFormData({
      growth_site: 'Soil Based', // Keep default growth site
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

  // Open modal to add a new plant
  const openAddNewPlantModal = () => {
    setFormData({
      growth_site: 'Soil Based', // Keep default growth site
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

  const totalPages = Math.ceil(totalCount / pageSize); // Calculate total number of pages

  // Change page function
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div >
      <Navbar />
      <Navbar2 />
      <h1>Soil-Based Plant Data</h1>

      {/* Button to open Register Plant modal */}
      <button className='button1' onClick={openAddNewPlantModal}>Register Plant</button>

      {/* Modal for adding or updating a plant */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content2">
       
          <button type="button" className="modal-close" onClick={resetForm}>
        &times;
      </button>

      
            <h2>{editingRecord ? 'Edit Plant' : 'Register Plant'}</h2>
            <form onSubmit={handleSubmit}>
              <label>Growth Site</label>
              <input
                type="text"
                value={formData.growth_site || ''}
                onChange={(e) => setFormData({ ...formData, growth_site: e.target.value })}
                disabled={true}
              />
              <label>Plant Name</label>
              <input
                type="text"
                value={formData.plant_name || ''}
                onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
                required
                title="Plant name required"
              />
              <label>Nitrogen Measurement</label>
              <input
                type="text"
                value={formData.nitrogen_measurement || ''}
                onChange={(e) => setFormData({ ...formData, nitrogen_measurement: e.target.value })}
                required
                 title="Format:0.00 - 0.00 00.00 - 00.00 / 000.00 - 000.00"
                pattern="^\d{1}\.\d{2} - \d{1}\.\d{2}$|^\d{2}\.\d{2} - \d{2}\.\d{2}$|^\d{3}\.\d{2} - \d{3}\.\d{2}$
"
              />

              <label>Phosphorus Measurement</label>
              <input
                type="text"
                value={formData.phosphorus_measurement || ''}
                onChange={(e) => setFormData({ ...formData, phosphorus_measurement: e.target.value })}
                required
                 title="Format:0.00 - 0.00 00.00 - 00.00 / 000.00 - 000.00"
                 pattern="^\d{1}\.\d{2} - \d{1}\.\d{2}$|^\d{2}\.\d{2} - \d{2}\.\d{2}$|^\d{3}\.\d{2} - \d{3}\.\d{2}$
"
              />
              <label>Potassium Measurement</label>
              <input
                type="text"
                value={formData.potassium_measurement || ''}
                onChange={(e) => setFormData({ ...formData, potassium_measurement: e.target.value })}
                required
                title="Format:0.00 - 0.00 00.00 - 00.00 / 000.00 - 000.00"
                 pattern="^\d{1}\.\d{2} - \d{1}\.\d{2}$|^\d{2}\.\d{2} - \d{2}\.\d{2}$|^\d{3}\.\d{2} - \d{3}\.\d{2}$
"
              />
              <label>pH Level</label>
              <input
                type="text"
                value={formData.ph_level || ''}
                onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                required
                 title="Format:0.00 - 0.00 00.00 - 00.00 / 000.00 - 000.00"
                 pattern="^\d{1}\.\d{2} - \d{1}\.\d{2}$|^\d{2}\.\d{2} - \d{2}\.\d{2}$|^\d{3}\.\d{2} - \d{3}\.\d{2}$
"
              />
              <label>Temperature</label>
              <input
                type="text"
                value={formData.temperature || ''}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                required
                 title="Format:0.00 - 0.00 00.00 - 00.00 / 000.00 - 000.00"
                 pattern="^\d{1}\.\d{2} - \d{1}\.\d{2}$|^\d{2}\.\d{2} - \d{2}\.\d{2}$|^\d{3}\.\d{2} - \d{3}\.\d{2}$
"
              />
              <label>Humidity</label>
              <input
                type="text"
                value={formData.humidity || ''}
                onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                required
                 title="Format:0.00 - 0.00 00.00 - 00.00 / 000.00 - 000.00"
                pattern="^\d{1}\.\d{2} - \d{1}\.\d{2}$|^\d{2}\.\d{2} - \d{2}\.\d{2}$|^\d{3}\.\d{2} - \d{3}\.\d{2}$
"
              />
              <label>Pesticide</label>
              <input
                type="text"
                value={formData.pesticide || ''}
                onChange={(e) => setFormData({ ...formData, pesticide: e.target.value })}
                required
                title="Input Pesticide Details"
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
              <button type="submit">{editingRecord ? 'Update Record' : 'Add Plant'}</button>
     
            </form>
          </div>
        </div>


      )}



      {/* Modal for confirming deletion */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the plant record for <strong>{recordToDelete?.plant_name}</strong>?
            </p>
            <button onClick={confirmDelete}>Yes, Delete</button>
            <button onClick={closeDeleteModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* Display list of plants */}
      <div className='container3'>
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Plant Name</th>
              <th>Nitrogen Measurement</th>
              <th>Phosphorus Measurement</th>
              <th>Potassium Measurement</th>
              <th>pH Level</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>Pesticide</th>
              <th>Harvest Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.id}>
                <td>{plant.plant_name}</td>
                <td>{plant.nitrogen_measurement}</td>
                <td>{plant.phosphorus_measurement}</td>
                <td>{plant.potassium_measurement}</td>
                <td>{plant.ph_level}</td>
                <td>{plant.temperature}</td>
                <td>{plant.humidity}</td>
                <td>{plant.pesticide}</td>
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
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
          Prev
        </button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Soil;
