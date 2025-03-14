import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './createClient';
import Navbar from './navbar';
import Navbar2 from './navbar2';
import './rhydro.css';


const Rsoil = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [recordsForDate, setRecordsForDate] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightedDates, setHighlightedDates] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const dates = data.map(record => {
        const recordDate = new Date(record.expected_harvest_date);
        recordDate.setHours(recordDate.getHours() + 8); // Convert to PH Time
        return recordDate.toDateString();
      });
      setHighlightedDates([...new Set(dates)]); // Remove duplicates
    }
  }, [data]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .eq('growth_site', 'Soil Based');
      
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

  const handleCheckboxChange = (id) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(id)
        ? prevSelectedRows.filter((rowId) => rowId !== id)
        : [...prevSelectedRows, id]
    );
  };

  const handleTransfer = async () => {
    setLoading(true);
    
    try {
      const rowsToTransfer = data
        .filter((record) => selectedRows.includes(record.id))
        .map((record) => ({
          growth_site: record.growth_site,
          plant_name: record.plant_name,
          registration_id: record.id,
          harvest_duration: record.harvest_duration,
          date_created: record.date_created,
        }));

      const { error: insertError } = await supabase.from('harvest').insert(rowsToTransfer);
      
      if (insertError) {
        console.error('Error transferring data:', insertError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from('registration')
        .delete()
        .in('id', selectedRows);

      if (deleteError) {
        console.error('Error deleting data:', deleteError.message);
        return;
      }

      setData((prevData) => prevData.filter((record) => !selectedRows.includes(record.id)));
      setRecordsForDate((prevRecords) => prevRecords.filter((record) => !selectedRows.includes(record.id)));
      setSelectedRows([]);
      
      const successMessage = document.createElement('div');
      successMessage.className = 'success-toast';
      successMessage.textContent = 'Plants successfully harvested!';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
      
    } catch (err) {
      console.error('Unexpected error during data transfer and deletion:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (date) => {
    const phDate = new Date(date);
    phDate.setHours(phDate.getHours() + 8); // Adjust to UTC+8
  
    setSelectedDate(phDate);
    setLoading(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .eq('growth_site', 'Soil Based')
        .eq('expected_harvest_date', phDate.toISOString().split('T')[0]); // Ensure correct date format
  
      if (error) {
        console.error('Error fetching records for date:', error.message);
      } else {
        setRecordsForDate(registrationData);
        setSelectedRows([]); // Reset selections when changing date
      }
    } catch (err) {
      console.error('Unexpected error fetching records for date:', err);
    } finally {
      setLoading(false);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      return highlightedDates.includes(date.toDateString()) ? 'highlight' : null;
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(date);
  };

  if (loading && !isModalOpen) {
    return (
      <div className="loading-indicator">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="full-screen-container">
      <Navbar />
      <Navbar2 />
      <h1>Soil-Based Plant Record</h1>
      
      <div className="calendar-container">
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
          prevLabel={<span>←</span>}
          nextLabel={<span>→</span>}
          prev2Label={<span>«</span>}
          next2Label={<span>»</span>}
        />
      </div>

      {isModalOpen && (
        <div className="modal1">
          <div className="modal1-container">
            <div className="modal1-content">
              <span className="close-button" onClick={closeModal}>&times;</span>
              <h2>{`Records for ${selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`}</h2>
              
              {recordsForDate.length === 0 ? (
                <div className="no-records">
                  <p>No plants scheduled for harvest on this date.</p>
                </div>
              ) : (
                <>
                  <div className="table1-container">
                    <table className="day1-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}>Select</th>
                          <th>Plant Name</th>
                          <th>Plant ID</th>
                          <th>Location</th>
                          <th>Nitrogen</th>
                          <th>Phosphorus</th>
                          <th>Potassium</th>
                          <th>pH Level</th>
                          <th>Temp</th>
                          <th>Humidity</th>
                          <th>Pesticide</th>
                          <th>Duration</th>
                          <th>Created</th>
                          <th>Harvest Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recordsForDate.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(record.id)}
                                onChange={() => handleCheckboxChange(record.id)}
                              />
                            </td>
                            <td>{record.plant_name}</td>
                            <td>{record.id}</td>
                            <td>{record.location}</td>
                            <td>{record.nitrogen_measurement}</td>
                            <td>{record.phosphorus_measurement}</td>
                            <td>{record.potassium_measurement}</td>
                            <td>{record.ph_level}</td>
                            <td>{record.temperature}°</td>
                            <td>{record.humidity}%</td>
                            <td>{record.pesticide}</td>
                            <td>{record.harvest_duration} days</td>
                            <td>{formatDate(record.date_created)}</td>
                            <td>{formatDate(record.expected_harvest_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {selectedRows.length > 0 && (
                        <span className="selected-count">
                          {selectedRows.length} plant{selectedRows.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                    <div>
                    
                      <button 
                        className="transfer-button" 
                        onClick={handleTransfer} 
                        disabled={selectedRows.length === 0}
                      >
                        Harvest Selected Plants
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add styles for success toast
const style = document.createElement('style');
style.textContent = `
  .success-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background-color: #10b981;
    color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

export default Rsoil;